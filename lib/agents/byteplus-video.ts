import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { nanoid } from "nanoid";

/**
 * BytePlus ModelArk — Seedance image-to-video.
 *
 * Async contract (from the ModelArk console sample):
 *   POST {BASE}/contents/generations/tasks        → { id }
 *   GET  {BASE}/contents/generations/tasks/{id}   → { status, content.video_url }
 * Auth: `Bearer <api_key>`. The reference frame is passed as image_url (the
 * model's first frame), and generation knobs ride in the text tail
 * (--resolution / --duration / --camerafixed / --watermark) per Seedance's API.
 */

const OSS_DIR =
  process.env.OSS_DIR ||
  (process.env.VERCEL ? "/tmp/zinema-data/oss" : path.join(process.cwd(), "data", "oss"));

const BASE =
  process.env.BYTEPLUS_ARK_BASE || "https://ark.ap-southeast.bytepluses.com/api/v3";

export async function generateVideoViaByteplus(input: {
  apiKey: string;
  model: string; // e.g. seedance-1-5-pro-251215
  prompt: string;
  referenceImageUrl: string; // publicly reachable URL, or a data: URI (base64)
  resolution?: string; // "720p" | "1080p"
  duration?: number;
  audio?: boolean; // Seedance native audio (default true); false appends --audio false
}): Promise<{ url: string; relPath: string }> {
  const resolution = input.resolution || "1080p";
  const duration = input.duration ?? 5;

  // Seedance reads parameters from the end of the text prompt.
  const text =
    `${input.prompt} --resolution ${resolution} --duration ${duration} ` +
    `--camerafixed false --watermark false${input.audio === false ? " --audio false" : ""}`;

  const headers = {
    "content-type": "application/json",
    authorization: `Bearer ${input.apiKey}`
  };

  // 1. Create the image-to-video task.
  const create = await fetch(`${BASE}/contents/generations/tasks`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: input.model,
      content: [
        { type: "text", text },
        { type: "image_url", image_url: { url: input.referenceImageUrl } }
      ]
    })
  });
  if (!create.ok) {
    throw new Error(`BytePlus submit failed (${create.status}): ${(await create.text()).slice(0, 280)}`);
  }
  const created = (await create.json()) as Record<string, any>;
  const taskId = created.id ?? created.task_id ?? created.data?.id;
  if (!taskId) {
    throw new Error(`BytePlus returned no task id: ${JSON.stringify(created).slice(0, 200)}`);
  }

  // 2. Poll the task to completion (~up to 8 min).
  let videoUrl: string | undefined;
  for (let i = 0; i < 120 && !videoUrl; i++) {
    await new Promise((r) => setTimeout(r, 4000));
    const q = await fetch(`${BASE}/contents/generations/tasks/${taskId}`, { headers });
    if (!q.ok) continue;
    const data = (await q.json()) as Record<string, any>;
    const status = String(data.status ?? "").toLowerCase();
    if (status === "succeeded" || status === "success" || status === "completed") {
      videoUrl =
        data.content?.video_url ??
        data.content?.url ??
        data.video_url ??
        data.result?.video_url ??
        data.content?.video?.url ??
        data.data?.video_url;
      if (!videoUrl) throw new Error("BytePlus task succeeded but no video URL was returned");
      break;
    }
    if (status === "failed" || status === "error" || status === "cancelled") {
      const m = data.error?.message ?? data.error ?? data.failure_reason ?? "task failed";
      throw new Error(`BytePlus video ${status}: ${typeof m === "string" ? m : JSON.stringify(m).slice(0, 200)}`);
    }
  }
  if (!videoUrl) throw new Error("BytePlus video timed out");

  // 3. Download → OSS → best-effort compress.
  const dl = await fetch(videoUrl);
  if (!dl.ok) throw new Error(`Failed to download BytePlus video: ${dl.status}`);
  fs.mkdirSync(OSS_DIR, { recursive: true });
  const filename = `${Date.now()}-${nanoid(8)}.mp4`;
  const full = path.join(OSS_DIR, filename);
  fs.writeFileSync(full, Buffer.from(await dl.arrayBuffer()));
  compressInPlace(full);
  return { url: `/oss/${filename}`, relPath: `data/oss/${filename}` };
}

function compressInPlace(filePath: string): void {
  try {
    const out = filePath.replace(/\.mp4$/i, ".c.mp4");
    const res = spawnSync(
      "ffmpeg",
      ["-y", "-i", filePath, "-c:v", "libx264", "-preset", "veryfast", "-crf", "24",
       "-pix_fmt", "yuv420p", "-c:a", "aac", "-movflags", "+faststart", out],
      { timeout: 120_000, stdio: "ignore" }
    );
    if (res.status === 0 && fs.existsSync(out) && fs.statSync(out).size > 0) {
      fs.renameSync(out, filePath);
    } else if (fs.existsSync(out)) {
      fs.unlinkSync(out);
    }
  } catch {
    /* keep original if ffmpeg unavailable */
  }
}
