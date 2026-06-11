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
 * Higgsfield Cloud video (api.higgsfield.ai). Image-to-video when a reference
 * frame is given, else text-to-video. Defensive about response shape — validate
 * against a live Cloud key.
 */
async function generateWithHiggsfieldVideo(
  input: { prompt: string; aspectRatio: AspectRatio; referenceImageUrl?: string },
  vendor: VendorConfig
): Promise<{ url: string; relPath: string }> {
  const base = (vendor.base_url || "https://api.higgsfield.ai").replace(/\/$/, "");
  // Higgsfield Cloud uses HTTP Basic auth — base64("<key id>:<secret>").
  const auth = `Basic ${Buffer.from(vendor.api_key).toString("base64")}`;
  const body: Record<string, unknown> = {
    task: input.referenceImageUrl ? "image-to-video" : "text-to-video",
    model: vendor.model || "dop-preview",
    prompt: input.prompt,
    aspect_ratio: input.aspectRatio,
    duration: 5
  };
  if (input.referenceImageUrl) body.input_image = input.referenceImageUrl;

  const submit = await fetch(`${base}/v1/generations`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: auth },
    body: JSON.stringify(body)
  });
  if (!submit.ok) {
    throw new Error(`Higgsfield video submit failed (${submit.status}): ${(await submit.text()).slice(0, 240)}`);
  }
  const created = (await submit.json()) as Record<string, any>;
  const jobId = created.id ?? created.generation_id ?? created.data?.id;
  if (!jobId) throw new Error("Higgsfield returned no generation id");

  for (let i = 0; i < 100; i++) {
    await new Promise((r) => setTimeout(r, 4000));
    const poll = await fetch(`${base}/v1/generations/${jobId}`, {
      headers: { authorization: auth }
    });
    if (!poll.ok) continue;
    const data = (await poll.json()) as Record<string, any>;
    const status = String(data.status ?? data.state ?? "").toLowerCase();
    if (status === "completed" || status === "succeeded" || status === "success") {
      const url =
        data.result?.url ??
        data.results?.[0]?.url ??
        data.video?.url ??
        data.output?.[0]?.url ??
        data.output?.[0] ??
        data.video_url ??
        data.url;
      if (!url) throw new Error("Higgsfield video completed but returned no URL");
      const download = await fetch(String(url));
      if (!download.ok) throw new Error(`Failed to download video: ${download.status}`);
      const buffer = Buffer.from(await download.arrayBuffer());
      const filename = `${Date.now()}-${nanoid(8)}.mp4`;
      const filepath = path.join(OSS_DIR, filename);
      fs.writeFileSync(filepath, buffer);
      return { url: `/oss/${filename}`, relPath: `data/oss/${filename}` };
    }
    if (status === "failed" || status === "error" || status === "canceled") {
      throw new Error(`Higgsfield video ${status}: ${data.error ?? ""}`);
    }
  }
  throw new Error("Higgsfield video timed out");
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
