import fs from "node:fs";
import path from "node:path";
import { nanoid } from "nanoid";
import { vendors } from "../db/repo";
import type { AspectRatio, VendorConfig } from "../types";

const OSS_DIR = path.join(process.cwd(), "data", "oss");

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
  throw new Error(`Unsupported video provider: ${vendor.provider}`);
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
