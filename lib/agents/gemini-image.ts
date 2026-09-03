import fs from "node:fs";
import path from "node:path";
import { nanoid } from "nanoid";
import type { AspectRatio } from "../types";

/**
 * Nano Banana Pro (Gemini 3 Pro Image) on the user's own key.
 *
 * The catalog already listed nano_banana_pro, but only through Higgsfield,
 * which spends Higgsfield credits per frame. This calls Google directly, so the
 * same model runs on a key the user already pays for.
 *
 * The reason it earns its place next to H3 is subject likeness. Passing a
 * portrait alongside the prompt makes the model reproduce that face, which is
 * the same problem the H3 character sheet solves for video — and this is the
 * cheaper way to produce the sheet in the first place.
 */

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

/** Ratios the image model accepts. */
const RATIO: Record<AspectRatio, string> = {
  "16:9": "16:9",
  "9:16": "9:16",
  "1:1": "1:1",
  "4:5": "4:5",
  "21:9": "21:9"
};

function mimeFor(file: string): string {
  const ext = path.extname(file).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

/** Read a reference into the inline part the API expects.
 *  Accepts an /oss/ path, an absolute path, or an http(s) URL. */
async function inlinePart(ref: string, ossDir: string) {
  let bytes: Buffer;
  let mime: string;
  if (/^https?:\/\//i.test(ref)) {
    const res = await fetch(ref, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`Reference image download failed (${res.status}).`);
    bytes = Buffer.from(await res.arrayBuffer());
    mime = res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
  } else {
    const local = ref.startsWith("/oss/") ? path.join(ossDir, ref.slice(5)) : ref;
    if (!fs.existsSync(local)) throw new Error(`Reference image not found: ${ref}`);
    bytes = fs.readFileSync(local);
    mime = mimeFor(local);
  }
  if (!bytes.length || bytes.length > 20 * 1024 * 1024) {
    throw new Error("Each reference image must be between 1 byte and 20 MB.");
  }
  return { inlineData: { mimeType: mime, data: bytes.toString("base64") } };
}

export async function generateImageViaGemini(input: {
  apiKey: string;
  model: string;
  prompt: string;
  aspectRatio: AspectRatio;
  ossDir: string;
  /** Portraits or plates whose subject the output should match. */
  referenceImages?: string[];
  /** "1k" | "2k" | "4k" — the model's own ladder. */
  resolution?: string;
}): Promise<{ url: string; relPath: string }> {
  const model = input.model || "gemini-3-pro-image-preview";

  const parts: any[] = [];
  // References first: the model reads them as the subject to match, and the
  // instruction that follows then refers to "the person in the image".
  for (const ref of (input.referenceImages ?? []).slice(0, 4)) {
    parts.push(await inlinePart(ref, input.ossDir));
  }
  parts.push({
    text: input.referenceImages?.length
      ? `${input.prompt}\n\nMatch the subject in the supplied image exactly — same face, same identity. Do not reproduce its background, framing or lighting.`
      : input.prompt
  });

  const res = await fetch(`${ENDPOINT}/${model}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": input.apiKey },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: {
        // Without this the model answers with prose about the image instead of
        // producing one.
        responseModalities: ["IMAGE"],
        imageConfig: {
          aspectRatio: RATIO[input.aspectRatio] ?? "16:9",
          ...(input.resolution ? { imageSize: input.resolution.toUpperCase() } : {})
        }
      }
    }),
    signal: AbortSignal.timeout(300_000)
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = body?.error?.message || `${res.status}`;
    throw new Error(`Nano Banana Pro request failed: ${detail}`);
  }

  const returned = body?.candidates?.[0]?.content?.parts ?? [];
  const image = returned.find((p: any) => p?.inlineData?.data);
  if (!image) {
    // A refusal or a safety block comes back as text in the same shape, so the
    // model's own words are more useful here than a generic failure.
    const said = returned.find((p: any) => typeof p?.text === "string")?.text;
    const reason = body?.candidates?.[0]?.finishReason;
    throw new Error(
      said?.trim() || (reason ? `Nano Banana Pro returned no image (${reason}).` : "Nano Banana Pro returned no image.")
    );
  }

  const ext = (image.inlineData.mimeType || "image/png").includes("jpeg") ? "jpg" : "png";
  const relPath = `${Date.now()}-${nanoid(8)}.${ext}`;
  fs.mkdirSync(input.ossDir, { recursive: true });
  fs.writeFileSync(path.join(input.ossDir, relPath), Buffer.from(image.inlineData.data, "base64"));
  return { url: `/oss/${relPath}`, relPath };
}
