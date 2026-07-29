import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { projects } from "../../../../../lib/db/repo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const run = promisify(execFile);
const FFPROBE = process.env.FFPROBE_PATH || "ffprobe";

const OSS_DIR =
  process.env.OSS_DIR ||
  (process.env.VERCEL ? "/tmp/zinema-data/oss" : path.join(process.cwd(), "data", "oss"));

const MAX_BYTES = 300 * 1024 * 1024; // 300MB — a few minutes of 1080p h264

function finalVideoPath(id: string) {
  return path.join(OSS_DIR, `final_${id}.mp4`);
}

async function probeDuration(file: string): Promise<number> {
  try {
    const { stdout } = await run(FFPROBE, [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "csv=p=0",
      file
    ]);
    return Math.round(parseFloat(stdout.trim()) * 10) / 10 || 0;
  } catch {
    return 0;
  }
}

/**
 * Whether this project has an externally-produced final video attached (e.g.
 * assembled outside the Stitch pipeline and uploaded directly), and its URL.
 * Mirrors the score route's attached/ext check.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const file = finalVideoPath(id);
  const attached = fs.existsSync(file);
  const duration = attached ? await probeDuration(file) : 0;
  return NextResponse.json({ attached, url: attached ? `/oss/final_${id}.mp4` : null, duration });
}

/**
 * Attach a pre-rendered final video directly to a project, bypassing the
 * Stitch-nodes render pipeline (for videos assembled outside Direkta, e.g.
 * via an external ffmpeg pass). One file per project — a new upload replaces
 * the previous one.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!projects.get(id)) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "That file is over 300MB." }, { status: 413 });
  }

  fs.mkdirSync(OSS_DIR, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(finalVideoPath(id), buf);

  return NextResponse.json({ ok: true, url: `/oss/final_${id}.mp4` });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const file = finalVideoPath(id);
  if (fs.existsSync(file)) fs.rmSync(file, { force: true });
  return NextResponse.json({ ok: true });
}
