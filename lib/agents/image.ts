import fs from "node:fs";
import path from "node:path";
import { nanoid } from "nanoid";
import { vendors } from "../db/repo";
import { generateImageViaByteplus } from "./byteplus-image";
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
  /** Reference images (e.g. cast portraits) for character consistency.
   *  Honored by providers with reference support (BytePlus Seedream). */
  referenceImages?: string[];
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
  if (vendor.provider === "higgsfield") {
    return await generateWithHiggsfield(input.prompt, input.aspectRatio, vendor);
  }
  if (vendor.provider === "byteplus-image") {
    return await generateImageViaByteplus({
      apiKey: vendor.api_key,
      model: vendor.model,
      prompt: input.prompt,
      size: SEEDREAM_SIZES[input.aspectRatio],
      imageUrls: input.referenceImages
    });
  }
  throw new Error(`Unsupported image provider: ${vendor.provider}`);
}

/* Seedream 4.5 needs >= ~3.69MP; these are the smallest valid sizes per ratio. */
const SEEDREAM_SIZES: Record<AspectRatio, string> = {
  "16:9": "2560x1440",
  "9:16": "1440x2560",
  "1:1": "2048x2048",
  "4:5": "1728x2160",
  "21:9": "2944x1264"
};

/**
 * Higgsfield Cloud (platform.higgsfield.ai). Authenticates with
 *   Authorization: Key <key_id>:<key_secret>
 * The api_key field holds the two values joined as "ID:Secret". The model id
 * goes in the URL path (e.g. higgsfield-ai/soul/standard); request body is
 * `{ prompt, aspect_ratio, resolution }`. The response may be sync (returning
 * images[]) or async with a request_id we poll. We handle both.
 */
async function generateWithHiggsfield(
  prompt: string,
  aspectRatio: AspectRatio,
  vendor: VendorConfig
): Promise<{ url: string; relPath: string }> {
  const base = (vendor.base_url || "https://platform.higgsfield.ai").replace(/\/$/, "");
  // The api_key field is "ID:Secret"; the literal header is "Key ID:Secret".
  const auth = `Key ${vendor.api_key}`;
  // Model id lives in the URL path. Accept bare names (e.g. "soul") and expand
  // them to the documented "higgsfield-ai/<name>/standard" form.
  const rawModel = (vendor.model || "soul").trim();
  const model = rawModel.includes("/")
    ? rawModel
    : rawModel === "soul"
      ? "higgsfield-ai/soul/standard"
      : `higgsfield-ai/${rawModel}`;
  const submitUrl = `${base}/${model}`;
  const submit = await fetch(submitUrl, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: auth },
    body: JSON.stringify({ prompt, aspect_ratio: aspectRatio, resolution: "720p" })
  });
  if (!submit.ok) {
    throw new Error(`Higgsfield submit failed (${submit.status}): ${(await submit.text()).slice(0, 240)}`);
  }
  const created = (await submit.json()) as Record<string, any>;

  // Sync success: images[].url is already there.
  const syncUrl = created.images?.[0]?.url ?? created.image?.url ?? created.url;
  if (syncUrl) return await persistRemote(String(syncUrl));

  // Async: poll request_id.
  const reqId = created.request_id ?? created.id;
  if (!reqId) throw new Error("Higgsfield returned no images and no request id");
  const statusBase = created.status_url || `${base}/requests/${reqId}/status`;

  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const poll = await fetch(statusBase, { headers: { authorization: auth } });
    if (!poll.ok) continue;
    const data = (await poll.json()) as Record<string, any>;
    const status = String(data.status ?? "").toLowerCase();
    if (status === "completed" || status === "success") {
      const url = data.images?.[0]?.url ?? data.image?.url ?? data.result?.url ?? data.url;
      if (!url) throw new Error("Higgsfield completed but returned no image URL");
      return await persistRemote(String(url));
    }
    if (status === "failed" || status === "nsfw" || status === "error") {
      throw new Error(`Higgsfield generation ${status}`);
    }
  }
  throw new Error("Higgsfield generation timed out");
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
