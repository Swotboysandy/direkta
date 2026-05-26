import fs from "node:fs";
import path from "node:path";
import { nanoid } from "nanoid";
import { vendors } from "../db/repo";
import type { AspectRatio, VendorConfig } from "../types";

/** On Vercel, /tmp is the only writable path. Files reset on cold start. */
const OSS_DIR =
  process.env.OSS_DIR ||
  (process.env.VERCEL ? "/tmp/zinema-data/oss" : path.join(process.cwd(), "data", "oss"));

const ASPECT_TO_DIMENSIONS: Record<AspectRatio, { width: number; height: number; openai: "1024x1024" | "1536x1024" | "1024x1536" }> = {
  "16:9": { width: 1344, height: 768, openai: "1536x1024" },
  "9:16": { width: 768, height: 1344, openai: "1024x1536" },
  "1:1": { width: 1024, height: 1024, openai: "1024x1024" },
  "4:5": { width: 896, height: 1152, openai: "1024x1536" },
  "21:9": { width: 1536, height: 640, openai: "1536x1024" }
};

export class ImageVendorUnavailableError extends Error {
  constructor() {
    super("No image vendor is enabled with an API key. Open /settings.");
    this.name = "ImageVendorUnavailableError";
  }
}

export async function generateImage(input: {
  prompt: string;
  aspectRatio: AspectRatio;
  vendor?: VendorConfig;
}): Promise<{ url: string; relPath: string }> {
  const vendor = input.vendor ?? vendors.firstEnabledImage();
  if (!vendor) throw new ImageVendorUnavailableError();

  fs.mkdirSync(OSS_DIR, { recursive: true });

  if (vendor.provider === "fal") {
    return await generateWithFal(input.prompt, input.aspectRatio, vendor);
  }
  if (vendor.provider === "openai-image") {
    return await generateWithOpenAI(input.prompt, input.aspectRatio, vendor);
  }
  throw new Error(`Unsupported image provider: ${vendor.provider}`);
}

async function generateWithFal(
  prompt: string,
  aspectRatio: AspectRatio,
  vendor: VendorConfig
): Promise<{ url: string; relPath: string }> {
  const dims = ASPECT_TO_DIMENSIONS[aspectRatio];
  const endpoint = `https://fal.run/${vendor.model}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Key ${vendor.api_key}`
    },
    body: JSON.stringify({
      prompt,
      image_size: { width: dims.width, height: dims.height },
      num_inference_steps: 4,
      num_images: 1,
      enable_safety_checker: false
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Fal AI failed (${response.status}): ${text.slice(0, 240)}`);
  }

  const data = (await response.json()) as { images?: { url: string }[] };
  const remote = data.images?.[0]?.url;
  if (!remote) throw new Error("Fal returned no image");

  return await persistRemote(remote);
}

async function generateWithOpenAI(
  prompt: string,
  aspectRatio: AspectRatio,
  vendor: VendorConfig
): Promise<{ url: string; relPath: string }> {
  const dims = ASPECT_TO_DIMENSIONS[aspectRatio];
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${vendor.api_key}`
    },
    body: JSON.stringify({
      model: vendor.model,
      prompt,
      n: 1,
      size: dims.openai,
      response_format: "b64_json"
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI image failed (${response.status}): ${text.slice(0, 240)}`);
  }

  const data = (await response.json()) as { data?: { b64_json?: string; url?: string }[] };
  const first = data.data?.[0];
  if (first?.b64_json) {
    return await persistBase64(first.b64_json);
  }
  if (first?.url) {
    return await persistRemote(first.url);
  }
  throw new Error("OpenAI returned no image");
}

async function persistRemote(url: string): Promise<{ url: string; relPath: string }> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download image: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  return writeBuffer(buffer);
}

async function persistBase64(b64: string): Promise<{ url: string; relPath: string }> {
  return writeBuffer(Buffer.from(b64, "base64"));
}

function writeBuffer(buffer: Buffer): { url: string; relPath: string } {
  const filename = `${Date.now()}-${nanoid(8)}.png`;
  const filepath = path.join(OSS_DIR, filename);
  fs.writeFileSync(filepath, buffer);
  const relPath = `data/oss/${filename}`;
  return { url: `/oss/${filename}`, relPath };
}
