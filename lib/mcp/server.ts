import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { nanoid } from "nanoid";
import { getDb } from "../db/client";
import { generateImageViaByteplus } from "../agents/byteplus-image";
import { generateVideoViaByteplus } from "../agents/byteplus-video";
import { stitchClips, resolveOssFile } from "./stitch";

/**
 * Direkta MCP server — hand-rolled tool registry exposed over Streamable HTTP
 * (see app/api/mcp/route.ts). Wraps Direkta's own BytePlus pipeline so any MCP
 * client can create projects, generate reference-locked stills, animate them,
 * and stitch a film — all writing into the same SQLite + OSS store as the app.
 */

const OSS_DIR =
  process.env.OSS_DIR ||
  (process.env.VERCEL ? "/tmp/zinema-data/oss" : path.join(process.cwd(), "data", "oss"));
const PUBLIC_BASE = (process.env.DIREKTA_PUBLIC_BASE || "https://direkta.147.93.168.21.nip.io").replace(/\/$/, "");
const SEEDREAM_MODEL = process.env.DIREKTA_SEEDREAM_MODEL || "seedream-4-5-251128";
const SEEDANCE_MODEL = process.env.DIREKTA_SEEDANCE_MODEL || "dreamina-seedance-2-0-260128";

type Json = Record<string, any>;
type Handler = (args: Json) => Promise<string>;
interface Tool {
  name: string;
  description: string;
  inputSchema: Json;
  handler: Handler;
}

function apiKey(): string {
  const row = getDb().prepare("SELECT api_key FROM vendors WHERE id='byteplus-video-default'").get() as { api_key?: string } | undefined;
  const k = row?.api_key || process.env.BYTEPLUS_API_KEY || "";
  if (!k) throw new Error("No BytePlus API key configured (vendors.byteplus-video-default.api_key).");
  return k;
}
function absUrl(u: string): string {
  return u.startsWith("http") ? u : `${PUBLIC_BASE}${u.startsWith("/") ? "" : "/"}${u}`;
}
function registerAsset(targetKind: string, targetId: string | null, kind: string, url: string, prompt: string) {
  try {
    getDb()
      .prepare("INSERT INTO assets (id, target_kind, target_id, kind, url, prompt, vendor_id) VALUES (?,?,?,?,?,?,?)")
      .run(nanoid(10), targetKind, targetId, kind, url, prompt.slice(0, 500), "byteplus-video-default");
  } catch { /* asset registration is best-effort */ }
}

/** Resolve any reference image (/oss path, http URL, or data URI) to a base64 data URI
 *  so BytePlus never has to fetch it (dodges the remote-fetch failures we hit). */
function toDataUri(ref: string): string {
  if (ref.startsWith("data:")) return ref;
  let local: string;
  if (ref.startsWith("http")) {
    const dl = path.join(os.tmpdir(), `ref_${Date.now()}_${nanoid(4)}`);
    const r = spawnSync("curl", ["-sL", "-o", dl, ref], { timeout: 60_000 });
    if (r.status !== 0 || !fs.existsSync(dl)) throw new Error(`could not fetch reference image: ${ref}`);
    local = dl;
  } else {
    local = resolveOssFile(ref);
  }
  if (!fs.existsSync(local)) throw new Error(`reference image not found: ${ref}`);
  const jpg = path.join(os.tmpdir(), `ref_${Date.now()}_${nanoid(4)}.jpg`);
  const r = spawnSync("ffmpeg", ["-y", "-i", local, "-vf", "scale=1920:-1", "-q:v", "3", jpg], { timeout: 60_000, stdio: "ignore" });
  const use = r.status === 0 && fs.existsSync(jpg) ? jpg : local;
  return `data:image/jpeg;base64,${fs.readFileSync(use).toString("base64")}`;
}

const TOOLS: Tool[] = [
  {
    name: "health",
    description: "Check Direkta MCP status: whether a BytePlus key is configured, the image/video models in use, and the public asset base URL.",
    inputSchema: { type: "object", properties: {} },
    handler: async () => {
      let key = false;
      try { apiKey(); key = true; } catch { /* no key */ }
      return JSON.stringify({ ok: true, byteplus_key: key, image_model: SEEDREAM_MODEL, video_model: SEEDANCE_MODEL, public_base: PUBLIC_BASE }, null, 2);
    },
  },
  {
    name: "list_projects",
    description: "List Direkta projects (id, title, format, aspect ratio).",
    inputSchema: { type: "object", properties: {} },
    handler: async () => {
      const rows = getDb().prepare("SELECT id, title, format, aspect_ratio, created_at FROM projects ORDER BY updated_at DESC LIMIT 100").all();
      return JSON.stringify(rows, null, 2);
    },
  },
  {
    name: "create_project",
    description: "Create a new Direkta project. Returns the project id (use it as project_id in other tools to file assets under it).",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Project title" },
        premise: { type: "string", description: "One-line premise / logline" },
        format: { type: "string", enum: ["Short Film", "Music Video", "Ad", "Series", "Feature", "Other"], description: "Format (default Ad)" },
        aspect_ratio: { type: "string", enum: ["16:9", "9:16", "1:1", "4:5", "21:9"], description: "Aspect ratio (default 16:9)" },
      },
      required: ["title"],
    },
    handler: async (a) => {
      const id = nanoid(10);
      const premise = String(a.premise || "").slice(0, 2000);
      getDb()
        .prepare("INSERT INTO projects (id, title, premise, logline, format, aspect_ratio) VALUES (?,?,?,?,?,?)")
        .run(id, String(a.title).slice(0, 200), premise, premise.slice(0, 280), a.format || "Ad", a.aspect_ratio || "16:9");
      return JSON.stringify({ project_id: id, title: a.title, url: `${PUBLIC_BASE}/project/${id}` }, null, 2);
    },
  },
  {
    name: "generate_image",
    description:
      "Generate a still with BytePlus Seedream. Pass reference_image_urls (public /oss URLs or https links) to LOCK a character/style across images (reference-consistency). Returns the image URL. Optionally file it under a project with project_id.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Full scene description. Bake in explicit constraints for consistency." },
        reference_image_urls: { type: "array", items: { type: "string" }, description: "Up to ~5 reference images to lock character/style" },
        size: { type: "string", description: "Explicit WxH, default 2560x1440 (16:9)" },
        project_id: { type: "string", description: "Optional: file the asset under this Direkta project" },
      },
      required: ["prompt"],
    },
    handler: async (a) => {
      const refs = Array.isArray(a.reference_image_urls) ? a.reference_image_urls.map((u: string) => absUrl(u)) : undefined;
      const { url } = await generateImageViaByteplus({ apiKey: apiKey(), model: SEEDREAM_MODEL, prompt: String(a.prompt), size: a.size, imageUrls: refs });
      if (a.project_id) registerAsset("library", String(a.project_id), "image", url, String(a.prompt));
      return JSON.stringify({ url: absUrl(url) }, null, 2);
    },
  },
  {
    name: "generate_video",
    description:
      "Animate a reference image into a clip with BytePlus Seedance (image-to-video). The reference is embedded as base64 automatically. Bake camera moves + spoken dialogue + sound cues into the prompt. Returns the video URL. audio=true uses Seedance native audio.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Motion + camera + dialogue + sound cues" },
        reference_image: { type: "string", description: "The first-frame image: an /oss URL, https link, or data URI" },
        resolution: { type: "string", enum: ["720p", "1080p"], description: "Default 720p" },
        duration: { type: "number", description: "Seconds, 4–15 (default 5)" },
        audio: { type: "boolean", description: "Seedance native audio (default true). Set false if the audio filter trips." },
        project_id: { type: "string", description: "Optional: file the clip under this Direkta project" },
      },
      required: ["prompt", "reference_image"],
    },
    handler: async (a) => {
      const ref = toDataUri(String(a.reference_image));
      const duration = Math.max(4, Math.min(15, Number(a.duration) || 5));
      const { url } = await generateVideoViaByteplus({
        apiKey: apiKey(),
        model: SEEDANCE_MODEL,
        prompt: String(a.prompt),
        referenceImageUrl: ref,
        resolution: a.resolution || "720p",
        duration,
        audio: a.audio !== false,
      });
      if (a.project_id) registerAsset("library", String(a.project_id), "video", url, String(a.prompt));
      return JSON.stringify({ url: absUrl(url) }, null, 2);
    },
  },
  {
    name: "stitch_film",
    description:
      "Stitch clips into one film with ffmpeg. clips = ordered /oss URLs (or bare filenames). transition 'cut' (default) or 'dissolve'. Preserves each clip's audio. Returns the final film URL. project_id files it in the project Library.",
    inputSchema: {
      type: "object",
      properties: {
        clips: { type: "array", items: { type: "string" }, description: "Ordered clip URLs/filenames" },
        transition: { type: "string", enum: ["cut", "dissolve"], description: "Default cut" },
        dissolve_seconds: { type: "number", description: "Dissolve length (default 0.5)" },
        project_id: { type: "string", description: "Optional: register the film in this project's Library" },
      },
      required: ["clips"],
    },
    handler: async (a) => {
      const { url } = stitchClips(a.clips as string[], {
        transition: a.transition === "dissolve" ? "dissolve" : "cut",
        dissolveSeconds: Number(a.dissolve_seconds) || 0.5,
      });
      if (a.project_id) {
        getDb().prepare("DELETE FROM assets WHERE target_kind='sequence' AND target_id=?").run(String(a.project_id));
        registerAsset("sequence", String(a.project_id), "video", url, "Stitched film via MCP");
      }
      return JSON.stringify({ url: absUrl(url) }, null, 2);
    },
  },
  {
    name: "list_library",
    description: "List a project's generated assets (final films + stills). Pass project_id.",
    inputSchema: {
      type: "object",
      properties: { project_id: { type: "string", description: "Project id" } },
      required: ["project_id"],
    },
    handler: async (a) => {
      const db = getDb();
      const films = db.prepare("SELECT kind, url, prompt, created_at FROM assets WHERE target_kind='sequence' AND target_id=? ORDER BY created_at DESC").all(String(a.project_id)) as any[];
      const lib = db.prepare("SELECT kind, url, prompt, created_at FROM assets WHERE target_kind='library' AND target_id=? ORDER BY created_at DESC LIMIT 100").all(String(a.project_id)) as any[];
      const map = (r: any) => ({ ...r, url: absUrl(r.url) });
      return JSON.stringify({ films: films.map(map), assets: lib.map(map) }, null, 2);
    },
  },
];

export async function listTools() {
  return TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema }));
}

export async function callTool(name: string, args: Json): Promise<Array<{ type: "text"; text: string }>> {
  const tool = TOOLS.find((t) => t.name === name);
  if (!tool) throw new Error(`unknown tool: ${name}`);
  const text = await tool.handler(args || {});
  return [{ type: "text", text }];
}
