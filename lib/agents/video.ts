import fs from "node:fs";
import path from "node:path";
import { nanoid } from "nanoid";
import { vendors } from "../db/repo";
import type { AspectRatio, VendorConfig } from "../types";

/** On Vercel, /tmp is the only writable path. Files reset on cold start. */
const OSS_DIR =
  process.env.OSS_DIR ||
  (process.env.VERCEL ? "/tmp/zinema-data/oss" : path.join(process.cwd(), "data", "oss"));

export class VideoVendorUnavailableError extends Error {
  constructor() {
    super("No video vendor is enabled with an API key. Open /settings.");
    this.name = "VideoVendorUnavailableError";
  }
}

export async function generateVideo(input: {
  prompt: string;
  aspectRatio: AspectRatio;
  referenceImageUrl?: string;
  vendor?: VendorConfig;
}): Promise<{ url: string; relPath: string }> {
  const vendor = input.vendor ?? vendors.firstEnabledVideo();
  if (!vendor) throw new VideoVendorUnavailableError();

  fs.mkdirSync(OSS_DIR, { recursive: true });

  if (vendor.provider === "fal-video") {
    return await generateWithFalVideo(input, vendor);
  }
  if (vendor.provider === "runway") {
    throw new Error(
      "Runway integration is scaffolded but not yet wired. Configure Fal AI video, or open lib/agents/video.ts to plug in Runway's REST endpoint."
    );
  }
  if (vendor.provider === "minimax") {
    throw new Error(
      "MiniMax integration is scaffolded but not yet wired. Configure Fal AI video, or open lib/agents/video.ts to plug in MiniMax's REST endpoint."
    );
  }
  if (vendor.provider === "higgsfield-video") {
    return await generateWithHiggsfieldVideo(input, vendor);
  }
  throw new Error(`Unsupported video provider: ${vendor.provider}`);
}

/**
 * Higgsfield Cloud video (platform.higgsfield.ai). Image-to-video when a
 * reference frame is given. Auth header: `Key <key_id>:<key_secret>`. Model id
 * lives in the URL path (e.g. higgsfield-ai/dop/preview). Body fields are
 * `image_url`, `prompt`, `duration`.
 */
async function generateWithHiggsfieldVideo(
  input: { prompt: string; aspectRatio: AspectRatio; referenceImageUrl?: string },
  vendor: VendorConfig
): Promise<{ url: string; relPath: string }> {
  const base = (vendor.base_url || "https://platform.higgsfield.ai").replace(/\/$/, "");
  const auth = `Key ${vendor.api_key}`;
  const rawModel = (vendor.model || "dop-preview").trim();
  const model = rawModel.includes("/")
    ? rawModel
    : rawModel === "dop-preview"
      ? "higgsfield-ai/dop/preview"
      : `higgsfield-ai/${rawModel}`;
  const body: Record<string, unknown> = {
    prompt: input.prompt,
    duration: 5
  };
  if (input.referenceImageUrl) body.image_url = input.referenceImageUrl;

  const submit = await fetch(`${base}/${model}`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: auth },
    body: JSON.stringify(body)
  });
  if (!submit.ok) {
    throw new Error(`Higgsfield video submit failed (${submit.status}): ${(await submit.text()).slice(0, 240)}`);
  }
  const created = (await submit.json()) as Record<string, any>;

  // Sync return path (video already in the response).
  let syncUrl = created.video?.url ?? created.url ?? created.videos?.[0]?.url;
  if (!syncUrl) {
    const reqId = created.request_id ?? created.id;
    if (!reqId) throw new Error("Higgsfield returned no video and no request id");
    const statusBase = created.status_url || `${base}/requests/${reqId}/status`;
    for (let i = 0; i < 100; i++) {
      await new Promise((r) => setTimeout(r, 4000));
      const poll = await fetch(statusBase, { headers: { authorization: auth } });
      if (!poll.ok) continue;
      const data = (await poll.json()) as Record<string, any>;
      const status = String(data.status ?? "").toLowerCase();
      if (status === "completed" || status === "success") {
        syncUrl = data.video?.url ?? data.videos?.[0]?.url ?? data.url;
        if (!syncUrl) throw new Error("Higgsfield video completed but returned no URL");
        break;
      }
      if (status === "failed" || status === "nsfw" || status === "error") {
        throw new Error(`Higgsfield video ${status}`);
      }
    }
    if (!syncUrl) throw new Error("Higgsfield video timed out");
  }

  const download = await fetch(String(syncUrl));
  if (!download.ok) throw new Error(`Failed to download video: ${download.status}`);
  const buffer = Buffer.from(await download.arrayBuffer());
  const filename = `${Date.now()}-${nanoid(8)}.mp4`;
  const filepath = path.join(OSS_DIR, filename);
  fs.writeFileSync(filepath, buffer);
  return { url: `/oss/${filename}`, relPath: `data/oss/${filename}` };
}

async function generateWithFalVideo(
  input: { prompt: string; aspectRatio: AspectRatio; referenceImageUrl?: string },
  vendor: VendorConfig
): Promise<{ url: string; relPath: string }> {
  const endpoint = `https://fal.run/${vendor.model}`;
  const body: Record<string, unknown> = {
    prompt: input.prompt,
    aspect_ratio: input.aspectRatio,
    duration: "5"
  };
  if (input.referenceImageUrl) body.image_url = input.referenceImageUrl;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Key ${vendor.api_key}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Fal video failed (${response.status}): ${text.slice(0, 240)}`);
  }

  const data = (await response.json()) as { video?: { url?: string } };
  const remote = data.video?.url;
  if (!remote) throw new Error("Fal returned no video");

  const download = await fetch(remote);
  if (!download.ok) throw new Error(`Failed to download video: ${download.status}`);
  const buffer = Buffer.from(await download.arrayBuffer());
  const filename = `${Date.now()}-${nanoid(8)}.mp4`;
  const filepath = path.join(OSS_DIR, filename);
  fs.writeFileSync(filepath, buffer);
  return { url: `/oss/${filename}`, relPath: `data/oss/${filename}` };
}
