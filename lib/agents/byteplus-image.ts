import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { nanoid } from "nanoid";
import { logUsage, TOKEN_COSTS } from "../usage";

/**
 * BytePlus ModelArk — Seedream text-to-image (keyframes).
 *
 * Sync contract (ModelArk images API):
 *   POST {BASE}/images/generations  → { data: [{ url }] }
 * Auth: `Bearer <api_key>` (same key as the BytePlus video vendor). Output is a
 * remote URL we download into OSS. The Kaliyug worklist prompts already embed
 * their "no …" constraints, so we send the prompt as-is.
 */

const OSS_DIR =
  process.env.OSS_DIR ||
  (process.env.VERCEL ? "/tmp/zinema-data/oss" : path.join(process.cwd(), "data", "oss"));

const BASE =
  process.env.BYTEPLUS_ARK_BASE || "https://ark.ap-southeast.bytepluses.com/api/v3";

/**
 * Resolve a reference image (an /oss/… URL, bare filename, local path, or
 * remote URL) to a JPEG data URI. BytePlus's fetcher intermittently rejects
 * our public URLs, so embedding the bytes is the only reliable transport.
 * Downscales to ≤1280px via ffmpeg to keep the payload small; falls back to
 * the raw file when ffmpeg is unavailable.
 */
export function referenceToDataUri(ref: string): string | null {
  try {
    if (ref.startsWith("data:")) return ref;
    let local: string | null = null;
    if (ref.startsWith("/oss/")) local = path.join(OSS_DIR, ref.slice(5));
    else if (!ref.startsWith("http") && fs.existsSync(ref)) local = ref;
    else if (!ref.startsWith("http")) local = path.join(OSS_DIR, ref.replace(/^\/+/, ""));
    if (!local || !fs.existsSync(local)) return ref.startsWith("http") ? ref : null;

    const jpg = path.join(os.tmpdir(), `ref_${Date.now()}_${nanoid(4)}.jpg`);
    const r = spawnSync("ffmpeg", ["-y", "-i", local, "-vf", "scale='min(1280,iw)':-2", "-q:v", "4", jpg], {
      timeout: 30_000,
      stdio: "ignore"
    });
    const use = r.status === 0 && fs.existsSync(jpg) ? jpg : local;
    const mime = use.endsWith(".jpg") ? "image/jpeg" : "image/png";
    const uri = `data:${mime};base64,${fs.readFileSync(use).toString("base64")}`;
    if (use === jpg) fs.unlinkSync(jpg);
    return uri;
  } catch {
    return null;
  }
}

export async function generateImageViaByteplus(input: {
  apiKey: string;
  model: string; // Seedream model id, e.g. seedream-4-5-251128
  prompt: string;
  size?: string; // "2K"/"4K" preset, or explicit "2048x1152" (16:9). Default 16:9 ~2K.
  imageUrls?: string[]; // reference frames for character/style consistency (Seedream image_urls)
}): Promise<{ url: string; relPath: string }> {
  // Explicit 16:9. Seedream 4.5 requires >= 3,686,400 px, so 2560x1440 is the
  // smallest valid 16:9 (a preset like "2K" can default to the wrong aspect).
  const size = input.size || "2560x1440";

  // Local /oss references are embedded as data URIs so BytePlus never has to
  // fetch them (its fetcher intermittently rejects our public URLs).
  const refs = (input.imageUrls ?? [])
    .map((u) => referenceToDataUri(u))
    .filter((u): u is string => Boolean(u))
    .slice(0, 6);

  const res = await fetch(`${BASE}/images/generations`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${input.apiKey}` },
    body: JSON.stringify({
      model: input.model,
      prompt: input.prompt,
      ...(refs.length ? { image_urls: refs } : {}),
      sequential_image_generation: "disabled",
      response_format: "url",
      size,
      stream: false,
      watermark: false
    })
  });
  if (!res.ok) {
    throw new Error(`BytePlus image failed (${res.status}): ${(await res.text()).slice(0, 280)}`);
  }
  const data = (await res.json()) as Record<string, any>;
  const item = data.data?.[0] ?? data.images?.[0] ?? data.result?.[0];
  const url: string | undefined = item?.url ?? item?.image_url ?? data.url;
  if (!url) {
    throw new Error(`BytePlus image returned no URL: ${JSON.stringify(data).slice(0, 200)}`);
  }

  const dl = await fetch(url);
  if (!dl.ok) throw new Error(`Failed to download BytePlus image: ${dl.status}`);
  fs.mkdirSync(OSS_DIR, { recursive: true });
  const filename = `${Date.now()}-${nanoid(8)}.png`;
  fs.writeFileSync(path.join(OSS_DIR, filename), Buffer.from(await dl.arrayBuffer()));

  // Spend ledger — exact tokens when the API reports them, estimate otherwise.
  const reported = Number(data.usage?.total_tokens ?? data.usage?.completion_tokens);
  logUsage({
    kind: "image",
    tokens: Number.isFinite(reported) && reported > 0 ? reported : TOKEN_COSTS.image,
    estimated: !(Number.isFinite(reported) && reported > 0),
    note: `seedream ${input.model} ${size}`
  });

  return { url: `/oss/${filename}`, relPath: `data/oss/${filename}` };
}
