import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn, spawnSync } from "node:child_process";
import { nanoid } from "nanoid";
import { buildH3Workflow, buildH3ReferenceWorkflow, type H3ReferenceInputs } from "./h3-workflow";
import { h3Settings, estimateH3Spend, type H3SettingsInput } from "./h3-settings";
import { extractLastVideoFrame, exportVideoFrame, ossFile } from "../media/video-frames";

/**
 * MiniMax H3 via a RunPod GPU pod running ComfyUI (which has first-party H3
 * support built in — see comfy_extras/nodes_minimax_h3.py upstream). Proven
 * working live: 8-step t2va sample, ~50GB VRAM peak on an 80GB card, ~3.5 min.
 *
 * On-demand only: the pod is started before a generation and stopped right
 * after (success or failure) so it never idles-bill between uses. A cold
 * start costs a few extra minutes (pod boot + ComfyUI + reload ~50GB of
 * weights into VRAM) — acceptable given it's the only way to avoid a
 * continuous $1.39/hr charge.
 */

const RUNPOD_API = "https://rest.runpod.io/v1";
const OSS_DIR =
  process.env.OSS_DIR || (process.env.VERCEL ? "/tmp/zinema-data/oss" : path.join(process.cwd(), "data", "oss"));
const SSH_KEY = process.env.RUNPOD_H3_SSH_KEY || path.join(os.homedir(), ".ssh", "runpod_h3");

function apiKey(): string {
  const k = process.env.RUNPOD_API_KEY;
  if (!k) throw new Error("RUNPOD_API_KEY is not set — add it to run MiniMax H3.");
  return k;
}

function podId(): string {
  const id = process.env.RUNPOD_H3_POD_ID;
  if (!id) throw new Error("RUNPOD_H3_POD_ID is not set — add it to run MiniMax H3.");
  return id;
}

async function rp(pathSuffix: string, init?: RequestInit): Promise<any> {
  const res = await fetch(`${RUNPOD_API}${pathSuffix}`, {
    ...init,
    signal: init?.signal ?? AbortSignal.timeout(20_000),
    headers: { authorization: `Bearer ${apiKey()}`, "content-type": "application/json", ...(init?.headers || {}) }
  });
  if (!res.ok) throw new Error(`RunPod API ${pathSuffix} failed (${res.status}). Check the configured pod ID and API-key permissions; no replacement pod will be created.`);
  return res.status === 204 ? null : res.json();
}

/** ComfyUI addresses progress and preview events to the client_id that
 *  submitted the job, so submission and the live monitor must share one id;
 *  a per-submission random id makes progress unobservable. */
export const H3_CLIENT_ID = "direkta-h3";

export function proxyBase(): string {
  // RunPod will not add a port mapping to a running pod, so a pod that came back
  // without 8188 exposed has no proxy at all. This override lets the server
  // reach ComfyUI another way — an SSH tunnel to localhost, most usefully —
  // without a stop/start and the cold boot that costs.
  const override = process.env.RUNPOD_H3_PROXY_BASE?.trim();
  if (override) return override.replace(/\/$/, "");
  return `https://${podId()}-8188.proxy.runpod.net`;
}

/** Run a command on the pod over SSH, using the key already deployed to this
 *  server's ~/.ssh/runpod_h3 (copied there alongside the RunPod API key). */
function sshExec(publicIp: string, sshPort: number, command: string, timeoutMs = 60_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "ssh",
      [
        "-o", "StrictHostKeyChecking=no",
        "-o", "ConnectTimeout=15",
        "-i", SSH_KEY,
        `root@${publicIp}`,
        "-p", String(sshPort),
        command
      ],
      { timeout: timeoutMs }
    );
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("close", (code) => {
      if (code === 0) resolve(out);
      else reject(new Error(`ssh exec failed (${code}): ${err.slice(0, 400)}`));
    });
    child.on("error", reject);
  });
}

export async function waitFor<T>(
  fn: () => Promise<T | null>,
  timeoutMs: number,
  intervalMs: number,
  // Every caller shared one "pod to come online" message, so a generation that
  // timed out mid-render looked like a pod that never booted — and sent us
  // debugging the wrong end of the pipeline.
  what = "MiniMax H3 pod to come online"
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    // Terminal errors must escape immediately; tolerant callers return null.
    const v = await fn();
    if (v) return v;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`Timed out after ${Math.round(timeoutMs / 60_000)} min waiting for ${what}.`);
}

async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${proxyBase()}/system_stats`, { signal: AbortSignal.timeout(8000) });
    return res.ok;
  } catch {
    return false;
  }
}

export class H3BudgetError extends Error {
  constructor(public readonly preflight: Awaited<ReturnType<typeof getH3Preflight>>) {
    super(`H3 needs an estimated $${preflight.requiredBalanceUsd.toFixed(2)} including reserve; RunPod balance is $${preflight.balanceUsd.toFixed(2)}. The pod was not started.`);
    this.name = "H3BudgetError";
  }
}

/** Read-only, including for a full batch. Never starts or modifies a pod. */
export async function getH3Preflight(shots: H3SettingsInput[] = [{}]) {
  shots.forEach(h3Settings);
  if (!shots.length || shots.length > 100) throw new Error("Estimate between 1 and 100 H3 shots.");
  const [pod, accountResponse, warm] = await Promise.all([
    rp(`/pods/${podId()}`),
    fetch("https://api.runpod.io/graphql", {
      method: "POST", headers: { authorization: `Bearer ${apiKey()}`, "content-type": "application/json" },
      body: JSON.stringify({ query: "query H3Budget { myself { clientBalance } }" }),
      signal: AbortSignal.timeout(20_000)
    }),
    healthCheck()
  ]);
  if (!accountResponse.ok) throw new Error(`Cannot verify RunPod balance (${accountResponse.status}); generation is blocked.`);
  const account = await accountResponse.json();
  const balanceUsd = account.data?.myself?.clientBalance;
  if (account.errors?.length || typeof balanceUsd !== "number" || !Number.isFinite(balanceUsd)) {
    throw new Error("Cannot verify RunPod balance. Enable account read access on the existing API key before generating.");
  }
  const rate = Number(pod.adjustedCostPerHr ?? pod.costPerHr);
  const estimate = estimateH3Spend(shots, rate, !warm);
  return {
    ...estimate, balanceUsd, canStart: balanceUsd >= estimate.requiredBalanceUsd,
    podId: podId(), podStatus: String(pod.desiredStatus || "UNKNOWN"), warm,
    notice: "Estimate includes a 25% time allowance and $0.10 reserve. Other account usage and storage can change the balance; this is not a provider-enforced spend cap."
  };
}

/** Cross-request/process guard for the one GPU. A stale lock requires checking
 * the pod before manual removal; never assume an old lock means an idle GPU. */
export function acquireH3RenderLock() {
  fs.mkdirSync(OSS_DIR, { recursive: true });
  const file = path.join(OSS_DIR, ".h3-render.lock");
  let fd: number;
  try { fd = fs.openSync(file, "wx"); }
  catch (error: any) {
    if (error.code === "EEXIST") throw new Error("An H3 render is already active. This GPU can run only one shot at a time. If the app restarted, inspect the pod before clearing its stale render lock.");
    throw error;
  }
  try { fs.writeFileSync(fd, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() })); }
  catch (error) { fs.closeSync(fd); fs.unlinkSync(file); throw error; }
  return () => { fs.closeSync(fd); fs.unlinkSync(file); };
}

/** Start the pod if needed, bootstrap ComfyUI over SSH (deps + process don't
 *  survive a RunPod restart, only /workspace does), and wait until the public
 *  proxy answers. */
export async function ensureH3PodRunning(options: { turbo?: boolean } = {}): Promise<void> {
  if (await healthCheck()) return; // already warm

  const info = await rp(`/pods/${podId()}`);
  const ports: string[] = Array.isArray(info.ports) ? info.ports : [];
  const required = ["8188/http", "22/tcp"];
  if (required.some((port) => !ports.includes(port))) {
    if (info.desiredStatus === "RUNNING") throw new Error("The running H3 pod is missing HTTP/SSH ports. Stop it before repairing its port configuration.");
    await rp(`/pods/${podId()}`, { method: "PATCH", body: JSON.stringify({ ports: [...new Set([...ports, ...required])] }) });
    const repaired = await rp(`/pods/${podId()}`);
    if (required.some((port) => !repaired.ports?.includes(port))) throw new Error("RunPod did not retain the required ports.");
  }
  if (info.desiredStatus !== "RUNNING") {
    await rp(`/pods/${podId()}/start`, { method: "POST" });
  }

  // Wait for the pod to report a public IP + SSH port mapping.
  const netInfo = await waitFor(
    async () => {
      const p = await rp(`/pods/${podId()}`);
      const sshPort = p.portMappings?.["22"];
      return p.publicIp && sshPort ? { publicIp: p.publicIp as string, sshPort: sshPort as number } : null;
    },
    3 * 60_000,
    5_000,
    "the pod public IP and SSH port mapping"
  );

  // Optional Turbo dependencies are installed only for a Turbo request.
  const turboSetup =
    "test -d /workspace/ComfyUI/custom_nodes/ComfyUI-MiniMax-H3-Turbo || " +
    "git clone -q https://github.com/larryvrh/ComfyUI-MiniMax-H3-Turbo /workspace/ComfyUI/custom_nodes/ComfyUI-MiniMax-H3-Turbo; " +
    "test -f /workspace/ComfyUI/models/loras/minimax_h3_turbo_v4_step600_ema.safetensors || " +
    "curl -sL -o /workspace/ComfyUI/models/loras/minimax_h3_turbo_v4_step600_ema.safetensors " +
    "https://huggingface.co/larryvrh/MiniMax-H3-Turbo-Lora/resolve/main/minimax_h3_turbo_v4_step600_ema.safetensors";
  if (options.turbo) await sshExec(netInfo.publicIp, netInfo.sshPort, turboSetup, 3 * 60_000);

  // Bootstrap: install deps if missing, launch ComfyUI if not already running.
  // Idempotent port probe; never match the command's own process string.
  // Probe the port, NOT the process list: `pgrep -f 'main.py --listen'` matches
  // the very ssh command carrying that string, so it always reported ComfyUI as
  // already running and silently skipped the launch.
  const bootstrap =
    "curl -fsS -m 3 -o /dev/null http://127.0.0.1:8188/system_stats || " +
    "(cd /workspace/ComfyUI && pip3 install -q --break-system-packages -r requirements.txt >/workspace/comfyui_install.log 2>&1; " +
    // --preview-method is what makes the sampler emit latent previews. Without
    // it ComfyUI reports step counts but never sends an image, so the UI can
    // show how far a render has got but not what it is producing. The cost is
    // one small decode per preview interval, against a 15-minute render.
    "nohup python3 main.py --listen 0.0.0.0 --port 8188 --preview-method auto > /workspace/comfyui_server.log 2>&1 </dev/null & disown; sleep 1)";
  await sshExec(netInfo.publicIp, netInfo.sshPort, bootstrap, 5 * 60_000).catch(() => {
    /* best-effort — the health-check wait below is the real gate */
  });

  // A genuine cold start is pod boot + pip reinstall (deps don't survive a
  // restart) + ComfyUI launch, which routinely exceeds 4 minutes and was
  // failing the first shot of every batch that followed a pod stop.
  await waitFor(
    () => healthCheck().then((ok) => (ok ? true : null)),
    12 * 60_000,
    5_000,
    "ComfyUI to answer on the pod"
  );
}

export async function stopH3Pod(): Promise<void> {
  await rp(`/pods/${podId()}/stop`, { method: "POST" });
  await waitFor(async () => {
    const state = await rp(`/pods/${podId()}`);
    return ["EXITED", "STOPPED", "TERMINATED"].includes(state.desiredStatus) ? true : null;
  }, 30_000, 2_000, "RunPod to confirm the pod is stopped");
}

/** Normalize references before GPU startup. Never fall back to stretched art. */
async function prepareReferenceImage(ref: string, width: number, height: number): Promise<string> {
  let bytes: Buffer;
  if (/^https?:\/\//i.test(ref)) {
    const res = await fetch(ref, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`Reference image download failed (${res.status}).`);
    bytes = Buffer.from(await res.arrayBuffer());
  } else {
    bytes = fs.readFileSync(ref.startsWith("/oss/") ? ossFile(ref, OSS_DIR) : ref);
  }
  if (!bytes.length || bytes.length > 64 * 1024 * 1024) throw new Error("Reference image must be between 1 byte and 64 MB.");
  const tag = nanoid(10);
  const source = path.join(os.tmpdir(), `h3-reference-${tag}.source`);
  const output = path.join(os.tmpdir(), `h3-reference-${tag}.png`);
  try {
    fs.writeFileSync(source, bytes);
    const result = spawnSync(process.env.FFMPEG_PATH || "ffmpeg", [
      "-v", "error", "-y", "-i", source, "-vf",
      `scale=${width}:${height}:force_original_aspect_ratio=increase:flags=lanczos,crop=${width}:${height},setsar=1`,
      "-frames:v", "1", output
    ], { timeout: 30_000, stdio: "ignore" });
    if (result.status !== 0 || !fs.existsSync(output) || !fs.statSync(output).size) throw new Error("Reference normalization failed; no unnormalized image was sent to H3.");
    return output;
  } catch (error) {
    fs.rmSync(output, { force: true });
    throw error;
  } finally {
    fs.rmSync(source, { force: true });
  }
}

/** Put a reference clip in ComfyUI's input directory so LoadVideo can read it.
 *  Unlike stills these are not re-encoded: the node decodes frames and audio
 *  from one file, and re-encoding here would risk desyncing them. */
async function uploadReferenceVideo(ref: string): Promise<string> {
  let bytes: Buffer;
  let name: string;
  if (/^https?:\/\//i.test(ref)) {
    const res = await fetch(ref, { signal: AbortSignal.timeout(180_000) });
    if (!res.ok) throw new Error(`Reference clip download failed (${res.status}).`);
    bytes = Buffer.from(await res.arrayBuffer());
    name = path.basename(new URL(ref).pathname) || `ref-${nanoid(8)}.mp4`;
  } else {
    const local = ref.startsWith("/oss/") ? ossFile(ref, OSS_DIR) : ref;
    if (!fs.existsSync(local)) throw new Error(`Reference clip not found: ${ref}`);
    bytes = fs.readFileSync(local);
    name = path.basename(local);
  }
  // The node's own limit is a 2-15s clip; anything larger is a wasted upload
  // and a slow one, so it fails here rather than on the pod.
  if (!bytes.length || bytes.length > 256 * 1024 * 1024) throw new Error("Reference clip must be between 1 byte and 256 MB.");
  const form = new FormData();
  form.append("image", new Blob([new Uint8Array(bytes)]), name);
  form.append("overwrite", "true");
  const res = await fetch(`${proxyBase()}/upload/image`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(180_000)
  });
  if (!res.ok) throw new Error(`Uploading the reference clip failed (${res.status}).`);
  const data = (await res.json()) as { name?: string };
  if (!data.name) throw new Error("ComfyUI did not return an uploaded clip filename.");
  return data.name;
}

async function uploadReferenceImage(file: string): Promise<string> {
  const form = new FormData();
  form.append("image", new Blob([new Uint8Array(fs.readFileSync(file))], { type: "image/png" }), path.basename(file));
  form.append("overwrite", "true");
  const res = await fetch(`${proxyBase()}/upload/image`, { method: "POST", body: form, signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`Reference image upload failed (${res.status}).`);
  const data = await res.json() as { name?: string };
  if (!data.name) throw new Error("ComfyUI did not return an uploaded reference filename.");
  return data.name;
}

type PromptResult = { videoUrl: string; audioUrl: string };

async function submitAndWait(workflow: Record<string, any>): Promise<PromptResult> {
  const submitRes = await fetch(`${proxyBase()}/prompt`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt: workflow, client_id: H3_CLIENT_ID }),
    signal: AbortSignal.timeout(30_000)
  });
  if (!submitRes.ok) throw new Error(`ComfyUI submit failed (${submitRes.status}): ${(await submitRes.text()).slice(0, 300)}`);
  const { prompt_id, node_errors } = (await submitRes.json()) as { prompt_id: string; node_errors?: Record<string, unknown> };
  if (!prompt_id) throw new Error("ComfyUI did not accept the generation (missing prompt ID).");
  if (node_errors && Object.keys(node_errors).length) {
    throw new Error(`ComfyUI workflow invalid: ${JSON.stringify(node_errors).slice(0, 400)}`);
  }

  const history = await waitFor(
    async () => {
      const res = await fetch(`${proxyBase()}/history/${prompt_id}`, { signal: AbortSignal.timeout(20_000) });
      if (!res.ok) throw new Error(`ComfyUI history check failed (${res.status}).`);
      const data = (await res.json()) as Record<string, any>;
      const entry = data[prompt_id];
      if (!entry) return null;
      if (entry.status?.status_str === "error") throw new Error("ComfyUI generation failed: " + JSON.stringify(entry.status).slice(0, 300));
      if (entry.status?.completed) return entry;
      return null;
    },
    // Generous: a 20-step base-model shot runs ~9-10 min on an A100, and the
    // first job of a session adds ~60s of model init on top. This was 8 min,
    // which killed healthy 20-step generations right before they finished.
    30 * 60_000,
    5_000,
    "the ComfyUI generation to finish"
  );

  const videoOut = history.outputs?.["11"]?.images?.[0];
  const audioOut = history.outputs?.["12"]?.audio?.[0];
  if (!videoOut || !audioOut) throw new Error("ComfyUI finished but produced no video/audio output.");
  const q = (o: { filename: string; subfolder: string; type: string }) =>
    `${proxyBase()}/view?filename=${encodeURIComponent(o.filename)}&subfolder=${encodeURIComponent(o.subfolder)}&type=${o.type}`;
  return { videoUrl: q(videoOut), audioUrl: q(audioOut) };
}

/** A thing attached to a prompt in the composer — a character, a location, a
 *  prop, or a previously generated frame or clip. `refKind` decides which
 *  MiniMax H3 channel it is wired to, and comes straight from the assets route
 *  so the UI and the graph cannot disagree about it. */
export interface H3PromptRef {
  /** Shown to the model as the reference's role, e.g. "Kalki" or "Beat 04". */
  title: string;
  /** Local path or URL of the still/clip standing in for this reference. */
  url: string;
  refKind: "image" | "video";
}

export type H3VideoInput = H3SettingsInput & {
  prompt: string;
  referenceImageUrl?: string;
  lastFrameImageUrl?: string;
  /** Composer attachments. When present the shot is generated through the
   *  ref2va checkpoint instead of first/last-frame conditioning, because that
   *  is the only path that can carry identity, motion and sound together. */
  refs?: H3PromptRef[];
  /** Whether the references continue the previous shot or establish a new one. */
  refMode?: "cut" | "continue";
  /** Explicit batch use only. Errors still stop the pod; the batch must stop it on success. */
  keepWarm?: boolean;
};

export async function generateVideoViaMiniMaxH3(input: H3VideoInput) {
  return generateH3WithLock(input, false);
}

async function generateH3WithLock(input: H3VideoInput, batchOwnsLock: boolean) {
  const settings = h3Settings(input);
  if (!input.prompt?.trim()) throw new Error("H3 needs a shot direction.");
  // Check required configuration before locking or preparing files.
  apiKey();
  podId();
  const release = batchOwnsLock ? () => {} : acquireH3RenderLock();
  const temporary: string[] = [];
  const warnings: string[] = [];
  let managesPod = false;
  let succeeded = false;
  let failure: Error | undefined;
  try {
    const startImage = input.referenceImageUrl
      ? await prepareReferenceImage(input.referenceImageUrl, settings.width, settings.height) : undefined;
    if (startImage) temporary.push(startImage);
    const endImage = input.lastFrameImageUrl
      ? await prepareReferenceImage(input.lastFrameImageUrl, settings.width, settings.height) : undefined;
    if (endImage) temporary.push(endImage);
    const budget = await getH3Preflight([input]);
    if (!budget.canStart) throw new H3BudgetError(budget);
    if (budget.warm) {
      const response = await fetch(`${proxyBase()}/queue`, { signal: AbortSignal.timeout(15_000) });
      if (!response.ok) throw new Error("Could not verify the ComfyUI queue. The existing pod was left untouched.");
      const queue = await response.json();
      if (!Array.isArray(queue.queue_running) || !Array.isArray(queue.queue_pending)) throw new Error("Invalid ComfyUI queue response; existing pod left untouched.");
      if (queue.queue_running.length || queue.queue_pending.length) {
        throw new Error("The H3 GPU already has a queued/running job. It was left untouched; try again after that job finishes.");
      }
    }
    // Include startup in cleanup: a cold-start timeout must not leave a billing pod.
    managesPod = true;
    await ensureH3PodRunning({ turbo: input.turbo });
    const firstFrameName = startImage ? await uploadReferenceImage(startImage) : undefined;
    const lastFrameName = endImage ? await uploadReferenceImage(endImage) : undefined;

    // Two graphs, chosen by whether the prompt carries attachments.
    //
    // fl2va conditions on a first and last frame and cannot express "this is
    // the same person" or "continue this sound". Anything attached in the
    // composer therefore has to go through ref2va, which is the checkpoint with
    // the image/video/audio reference channels.
    let built;
    if (input.refs?.length) {
      const images: string[] = [];
      let video: string | undefined;
      for (const ref of input.refs) {
        // Stills are cropped to the target canvas first; an off-ratio reference
        // is otherwise stretched by the node.
        if (ref.refKind === "image") {
          images.push(await uploadReferenceImage(await prepareReferenceImage(ref.url, settings.width, settings.height)));
        } else if (!video) {
          // The node takes one reference video, and its soundtrack rides with it.
          video = await uploadReferenceVideo(ref.url);
        } else {
          warnings.push(`Only one reference clip can be used per shot; "${ref.title}" was left off.`);
        }
      }
      built = buildH3ReferenceWorkflow({
        ...input,
        mode: input.refMode ?? "cut",
        references: {
          images,
          ...(video ? { video, videoAudio: video } : {})
        } satisfies H3ReferenceInputs
      });
    } else {
      built = buildH3Workflow({ ...input, firstFrameName, lastFrameName });
    }
    const { videoUrl, audioUrl } = await submitAndWait(built.workflow);
    const tag = `${Date.now()}-${nanoid(6)}`;
    const webm = path.join(os.tmpdir(), `h3-${tag}.webm`);
    const flac = path.join(os.tmpdir(), `h3-${tag}.flac`);
    temporary.push(webm, flac);
    const outFile = `${tag}.mp4`;
    const outPath = path.join(OSS_DIR, outFile);
    const [video, audio] = await Promise.all([
      fetch(videoUrl, { signal: AbortSignal.timeout(120_000) }),
      fetch(audioUrl, { signal: AbortSignal.timeout(120_000) })
    ]);
    if (!video.ok || !audio.ok) throw new Error("Failed to download MiniMax H3 output from the pod.");
    fs.writeFileSync(webm, Buffer.from(await video.arrayBuffer()));
    fs.writeFileSync(flac, Buffer.from(await audio.arrayBuffer()));
    const mux = spawnSync(process.env.FFMPEG_PATH || "ffmpeg", [
      "-v", "error", "-y", "-i", webm, "-i", flac, "-map", "0:v:0", "-map", "1:a:0",
      "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p",
      "-af", "apad", "-c:a", "aac", "-shortest", "-movflags", "+faststart", outPath
    ], { timeout: 120_000, stdio: "ignore" });
    if (mux.status !== 0 || !fs.existsSync(outPath)) throw new Error("ffmpeg failed to mux MiniMax H3 output.");

    const firstFrameFile = `${tag}-first.png`;
    const lastFrameFile = `${tag}-last.png`;
    const actual = exportVideoFrame(outPath, path.join(OSS_DIR, firstFrameFile), 0);
    extractLastVideoFrame(outPath, path.join(OSS_DIR, lastFrameFile));
    succeeded = true;
    return {
      url: `/oss/${outFile}`, relPath: `data/oss/${outFile}`,
      firstFrameUrl: `/oss/${firstFrameFile}`, lastFrameUrl: `/oss/${lastFrameFile}`,
      prompt: built.prompt, settings: built.settings, warnings,
      actual: { frames: actual.frames, fps: actual.fps, durationSeconds: actual.duration },
      budget
    };
  } catch (error) {
    failure = error instanceof Error ? error : new Error(String(error));
    throw failure;
  } finally {
    for (const file of temporary) {
      try { fs.rmSync(file, { force: true }); } catch { /* unique scratch file only */ }
    }
    if (managesPod && (!input.keepWarm || !succeeded)) {
      try { await stopH3Pod(); }
      catch {
        const warning = "RunPod stop could not be confirmed. The GPU may still be billing; check the RunPod console immediately.";
        warnings.push(warning);
        if (failure) failure.message += " " + warning;
        console.error(warning);
      }
    }
    release();
  }
}

/** Hold one lock through the whole batch and its final stop. Estimates are
 * checked for the full batch before startup and for all remaining shots. */
export async function generateH3Batch(
  inputs: Array<H3VideoInput & { continuityMode?: "cut" | "continue" }>,
  options: { maxEstimatedCostUsd: number; onShot?: (result: Awaited<ReturnType<typeof generateVideoViaMiniMaxH3>>, index: number) => void | Promise<void> }
) {
  if (!inputs.length || inputs.length > 100) throw new Error("A batch must contain 1–100 shots.");
  inputs.forEach(h3Settings);
  if (!Number.isFinite(options.maxEstimatedCostUsd) || options.maxEstimatedCostUsd <= 0) throw new Error("Set a positive maximum estimated batch cost.");
  const release = acquireH3RenderLock();
  const results: Array<Awaited<ReturnType<typeof generateVideoViaMiniMaxH3>>> = [];
  let needsStop = false;
  try {
    const initial = await getH3Preflight(inputs);
    if (!initial.canStart) throw new H3BudgetError(initial);
    if (initial.estimatedCostUsd > options.maxEstimatedCostUsd) throw new Error("The batch estimate exceeds the approved estimate limit. The pod was not started.");
    for (let i = 0; i < inputs.length; i++) {
      const remaining = await getH3Preflight(inputs.slice(i));
      if (!remaining.canStart) throw new H3BudgetError(remaining);
      const spent = Math.max(0, initial.balanceUsd - remaining.balanceUsd);
      if (spent + remaining.estimatedCostUsd > options.maxEstimatedCostUsd) throw new Error("Account spend plus the remaining estimate exceeds the batch limit; no further shot will start.");
      const input = inputs[i];
      const first = input.referenceImageUrl || (input.continuityMode === "continue" ? results[i - 1]?.lastFrameUrl : undefined);
      if (input.continuityMode === "continue" && !first) throw new Error("The first continuation needs an explicit starting reference.");
      const result = await generateH3WithLock({ ...input, referenceImageUrl: first, keepWarm: true }, true);
      needsStop = true;
      results.push(result);
      await options.onShot?.(result, i);
    }
    return results;
  } finally {
    try { if (needsStop) await stopH3Pod(); }
    finally { release(); }
  }
}

/**
 * Generate a still image on the same H3 pod. H3 is a video model, so this runs
 * the shortest legal clip (the frame grid's minimum, 5 frames) and pulls a
 * frame out of it — which is enough to produce anchor/reference art without
 * needing a separate image model or pre-existing stills.
 *
 * Takes a frame from ~the middle of the clip rather than the first: the opening
 * frame is the rawest point of the denoise and tends to be the weakest.
 */
export async function generateImageViaMiniMaxH3(input: {
  prompt: string;
  width?: number;
  height?: number;
  keepWarm?: boolean;
}): Promise<{ url: string; relPath: string }> {
  const video = await generateVideoViaMiniMaxH3({
    prompt: input.prompt,
    durationSeconds: 5 / 24, // exactly five frames; 0.25s rounds to six and snaps up to 22
    width: input.width,
    height: input.height,
    keepWarm: input.keepWarm
  });

  const videoPath = path.join(OSS_DIR, path.basename(video.url));
  const tag = `${Date.now()}-${nanoid(6)}`;
  const outFile = `h3img-${tag}.png`;
  const outPath = path.join(OSS_DIR, outFile);

  const grab = spawnSync("ffmpeg", ["-y", "-i", videoPath, "-vf", "select=eq(n\\,2)", "-vframes", "1", outPath], {
    timeout: 30_000,
    stdio: "ignore"
  });
  if (grab.status !== 0 || !fs.existsSync(outPath)) throw new Error("ffmpeg failed to extract a still from MiniMax H3.");
  fs.unlinkSync(videoPath);
  fs.rmSync(ossFile(video.firstFrameUrl, OSS_DIR), { force: true });
  fs.rmSync(ossFile(video.lastFrameUrl, OSS_DIR), { force: true });

  return { url: `/oss/${outFile}`, relPath: `data/oss/${outFile}` };
}
