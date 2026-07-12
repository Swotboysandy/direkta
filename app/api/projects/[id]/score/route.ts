import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { projects } from "../../../../../lib/db/repo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const OSS_DIR =
  process.env.OSS_DIR ||
  (process.env.VERCEL ? "/tmp/zinema-data/oss" : path.join(process.cwd(), "data", "oss"));

const EXTS = ["mp3", "m4a", "wav", "aac"];
const MAX_BYTES = 25 * 1024 * 1024; // 25MB — a few minutes of compressed audio

function scorePathFor(id: string, ext: string) {
  return path.join(OSS_DIR, `score_${id}.${ext}`);
}

function findExisting(id: string): { ext: string; file: string } | null {
  for (const ext of EXTS) {
    const file = scorePathFor(id, ext);
    if (fs.existsSync(file)) return { ext, file };
  }
  return null;
}

/** Whether this project has a music score attached, and its filename. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = findExisting(id);
  return NextResponse.json({ attached: Boolean(existing), ext: existing?.ext ?? null });
}

/**
 * Upload a music bed for the Export master render to mux under the cut
 * (lib/api/projects/[id]/render reads data/oss/score_<id>.<ext> if present).
 * One track per project — a new upload replaces the previous one.
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
    return NextResponse.json({ error: "That file is over 25MB — trim it or compress to MP3 first." }, { status: 413 });
  }
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!EXTS.includes(ext)) {
    return NextResponse.json({ error: `Use one of: ${EXTS.join(", ")}.` }, { status: 400 });
  }

  fs.mkdirSync(OSS_DIR, { recursive: true });
  // Clear any previous score under a different extension before writing the new one.
  for (const e of EXTS) {
    const f = scorePathFor(id, e);
    if (fs.existsSync(f)) fs.rmSync(f, { force: true });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(scorePathFor(id, ext), buf);

  return NextResponse.json({ ok: true, ext });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = findExisting(id);
  if (existing) fs.rmSync(existing.file, { force: true });
  return NextResponse.json({ ok: true });
}
