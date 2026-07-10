import fs from "node:fs";
import path from "node:path";
import { nanoid } from "nanoid";

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

  const res = await fetch(`${BASE}/images/generations`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${input.apiKey}` },
    body: JSON.stringify({
      model: input.model,
      prompt: input.prompt,
      ...(input.imageUrls?.length ? { image_urls: input.imageUrls } : {}),
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
  return { url: `/oss/${filename}`, relPath: `data/oss/${filename}` };
}
