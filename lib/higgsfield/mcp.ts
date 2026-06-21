import fs from "node:fs";
import path from "node:path";
import { nanoid } from "nanoid";
import type { AspectRatio } from "../types";
import { MCP_URL, getValidAccessToken, isConnected } from "./oauth";

export { isConnected as isHiggsfieldMcpConnected } from "./oauth";

const OSS_DIR =
  process.env.OSS_DIR ||
  (process.env.VERCEL ? "/tmp/zinema-data/oss" : path.join(process.cwd(), "data", "oss"));

/**
 * Minimal MCP client over the streamable-HTTP transport. One short-lived
 * session per generation request: initialize → notifications/initialized →
 * tools/call. Responses may be JSON or SSE; we parse both.
 */
class McpSession {
  private token: string;
  private sessionId: string | null = null;
  private proto = "2025-06-18";
  private rpcId = 0;

  constructor(token: string) {
    this.token = token;
  }

  private async rpc(method: string, params: unknown, notification = false): Promise<any> {
    const id = notification ? undefined : ++this.rpcId;
    const headers: Record<string, string> = {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      authorization: `Bearer ${this.token}`,
      "mcp-protocol-version": this.proto
    };
    if (this.sessionId) headers["mcp-session-id"] = this.sessionId;

    const res = await fetch(MCP_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(notification ? { jsonrpc: "2.0", method, params } : { jsonrpc: "2.0", id, method, params })
    });
    const sid = res.headers.get("mcp-session-id");
    if (sid) this.sessionId = sid;
    if (notification) return null;
    if (!res.ok) {
      throw new Error(`MCP ${method} failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
    }
    const ct = res.headers.get("content-type") || "";
    const text = await res.text();
    const msg = ct.includes("text/event-stream") ? parseSse(text) : JSON.parse(text);
    if (msg?.error) throw new Error(`MCP ${method} error: ${JSON.stringify(msg.error).slice(0, 300)}`);
    return msg?.result;
  }

  async connect(): Promise<void> {
    const result = await this.rpc("initialize", {
      protocolVersion: this.proto,
      capabilities: {},
      clientInfo: { name: "direkta", version: "0.1.0" }
    });
    if (result?.protocolVersion) this.proto = result.protocolVersion;
    await this.rpc("notifications/initialized", {}, true);
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<any> {
    const result = await this.rpc("tools/call", { name, arguments: args });
    // Tool-execution failures (out of credits, NSFW, bad params) come back as a
    // normal result with isError:true — NOT a JSON-RPC error — so they'd
    // otherwise slip past and leave us polling a non-existent job. Surface them.
    if (result?.isError) {
      const errText = (result?.content ?? []).find((c: any) => c?.type === "text")?.text;
      throw new Error(`Higgsfield ${name}: ${(errText || "tool error").toString().slice(0, 240)}`);
    }
    // The real data is in structuredContent; the text block is human prose.
    if (result?.structuredContent) return result.structuredContent;
    const block = (result?.content ?? []).find((c: any) => c?.type === "text");
    if (block?.text) {
      try {
        return JSON.parse(block.text);
      } catch {
        // Last resort: a resource_link block often carries the asset URL.
        const link = (result?.content ?? []).find((c: any) => c?.type === "resource_link" && c?.uri);
        return link ? { results: [{ status: "completed", results: { rawUrl: link.uri } }] } : { _text: block.text };
      }
    }
    return result;
  }
}

function parseSse(text: string): any {
  let last: any = null;
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t.startsWith("data:")) continue;
    const payload = t.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;
    try {
      const obj = JSON.parse(payload);
      if (obj && (obj.result || obj.error || obj.id !== undefined)) last = obj;
    } catch {
      /* ignore keepalives */
    }
  }
  if (!last) throw new Error("No JSON-RPC message in SSE stream");
  return last;
}

function writeRemoteToOss(
  url: string,
  kind: "image" | "video" = "image"
): Promise<{ url: string; relPath: string }> {
  return fetch(url).then(async (r) => {
    if (!r.ok) throw new Error(`Download failed: ${r.status}`);
    const buf = Buffer.from(await r.arrayBuffer());
    fs.mkdirSync(OSS_DIR, { recursive: true });
    const ext = kind === "video" || /\.mp4(\?|$)/i.test(url) ? "mp4" : "png";
    const filename = `${Date.now()}-${nanoid(8)}.${ext}`;
    fs.writeFileSync(path.join(OSS_DIR, filename), buf);
    return { url: `/oss/${filename}`, relPath: `data/oss/${filename}` };
  });
}

function firstUrl(node: any): string | undefined {
  if (!node) return undefined;
  const r = node.results ?? node;
  return r?.rawUrl ?? r?.url ?? r?.images?.[0]?.url ?? r?.[0]?.url ?? r?.minUrl;
}

/** Pull a video URL out of a Higgsfield job result (several shapes seen in the wild). */
function firstVideoUrl(node: any): string | undefined {
  if (!node) return undefined;
  const r = node.results ?? node;
  return (
    r?.rawUrl ??
    r?.url ??
    r?.video?.url ??
    r?.videos?.[0]?.url ??
    r?.[0]?.url ??
    r?.minUrl ??
    r?.min_url
  );
}

/** Extract a confirmed media_id from a media_import_url result (tolerant of shapes). */
function extractMediaId(node: any): string | undefined {
  if (!node) return undefined;
  const r = node.results?.[0] ?? node.result ?? node.results ?? node;
  return (
    r?.media_id ?? r?.mediaId ?? r?.id ?? r?.media?.id ?? node?.media_id ?? node?.id
  );
}

/**
 * Generate one image on the user's Higgsfield plan via MCP, poll to completion,
 * and persist it into OSS. Returns the same shape as lib/agents/image.ts.
 */
export async function generateImageViaMcp(input: {
  prompt: string;
  aspectRatio: AspectRatio;
  model?: string;
  resolution?: string;
}): Promise<{ url: string; relPath: string }> {
  const token = await getValidAccessToken();
  const s = new McpSession(token);
  await s.connect();

  const submitted = await s.callTool("generate_image", {
    params: {
      model: input.model || "cinematic_studio_2_5",
      prompt: input.prompt,
      aspect_ratio: input.aspectRatio,
      resolution: input.resolution || "1k",
      count: 1
    }
  });

  let job = submitted?.results?.[0] ?? submitted?.result ?? submitted;
  let url = firstUrl(job);
  const jobId = job?.id ?? submitted?.id;
  if (!url && !jobId) {
    throw new Error(
      "Higgsfield accepted no image job — usually out of credits, or the prompt was rejected."
    );
  }

  for (let i = 0; i < 80 && !url; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const disp = await s.callTool("job_display", { id: jobId });
    job = disp?.results?.[0] ?? disp?.result ?? disp;
    const status = String(job?.status ?? "").toLowerCase();
    if (status === "completed" || status === "success" || status === "complete") {
      url = firstUrl(job);
      break;
    }
    if (status === "failed" || status === "nsfw" || status === "error") {
      throw new Error(`Higgsfield generation ${status}`);
    }
  }
  if (!url) throw new Error("Higgsfield generation timed out");
  return writeRemoteToOss(String(url), "image");
}

/**
 * Animate a still frame into a short clip on the user's Higgsfield plan via MCP.
 * The MCP video tool wants a media_id (not a URL), so we first import the public
 * frame URL into Higgsfield storage, then submit an image-to-video job and poll
 * it to completion. Returns the same shape as lib/agents/video.ts.
 */
export async function generateVideoViaMcp(input: {
  prompt: string;
  aspectRatio: AspectRatio;
  referenceImageUrl: string;
  model?: string;
  duration?: number;
}): Promise<{ url: string; relPath: string }> {
  const token = await getValidAccessToken();
  const s = new McpSession(token);
  await s.connect();

  // 1. Import the start frame → media_id (the video tool rejects raw URLs).
  const imported = await s.callTool("media_import_url", {
    url: input.referenceImageUrl,
    type: "image"
  });
  const mediaId = extractMediaId(imported);
  if (!mediaId) {
    throw new Error("Higgsfield could not import the start frame for animation");
  }

  // 2. Submit image-to-video. Default model is Seedance 2.0 (Fast): strong
  //    identity consistency from the start frame — better for multi-shot film
  //    than a generic turbo model. Seedance supports a narrower aspect set, so
  //    coerce anything outside it (e.g. 4:5) to "auto".
  const SEEDANCE_RATIOS = ["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"];
  const model = input.model || "seedance_2_0";
  const isSeedance = model.startsWith("seedance");
  const aspect = isSeedance && !SEEDANCE_RATIOS.includes(input.aspectRatio) ? "auto" : input.aspectRatio;
  const submitted = await s.callTool("generate_video", {
    params: {
      model,
      prompt: input.prompt,
      aspect_ratio: aspect,
      duration: input.duration ?? 5,
      count: 1,
      medias: [{ role: "start_image", value: mediaId }],
      // Seedance-specific knobs (ignored by other models):
      ...(isSeedance
        ? { mode: "fast", resolution: "720p", generate_audio: false, genre: "auto" }
        : {})
    }
  });

  let job = submitted?.results?.[0] ?? submitted?.result ?? submitted;
  let url = firstVideoUrl(job);
  const jobId = job?.id ?? submitted?.id;
  if (!url && !jobId) {
    throw new Error(
      "Higgsfield accepted no video job — usually out of credits, or the start frame was rejected."
    );
  }

  // Video gen is slower than images — poll up to ~8 min.
  for (let i = 0; i < 120 && !url; i++) {
    await new Promise((r) => setTimeout(r, 4000));
    const disp = await s.callTool("job_display", { id: jobId });
    job = disp?.results?.[0] ?? disp?.result ?? disp;
    const status = String(job?.status ?? "").toLowerCase();
    if (status === "completed" || status === "success" || status === "complete") {
      url = firstVideoUrl(job);
      break;
    }
    if (status === "failed" || status === "nsfw" || status === "error") {
      throw new Error(`Higgsfield video ${status}`);
    }
  }
  if (!url) throw new Error("Higgsfield video timed out");
  return writeRemoteToOss(String(url), "video");
}
