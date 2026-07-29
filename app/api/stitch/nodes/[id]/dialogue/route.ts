import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { getDb } from "../../../../../../lib/db/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const OSS_DIR =
  process.env.OSS_DIR ||
  (process.env.VERCEL ? "/tmp/zinema-data/oss" : path.join(process.cwd(), "data", "oss"));

const EXTS = ["mp3", "m4a", "wav", "aac"];
const MAX_BYTES = 25 * 1024 * 1024;

/**
 * Upload a dialogue/voice track for a single Stitch shot — the audio input
 * the Lip Sync step runs against. One track per node; a new upload replaces
 * the previous one (old file removed so OSS doesn't accumulate orphans).
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const node = db.prepare("SELECT id, dialogue_audio_url FROM stitch_nodes WHERE id = ?").get(id) as
    | { id: string; dialogue_audio_url: string | null }
    | undefined;
  if (!node) return NextResponse.json({ error: "Shot not found" }, { status: 404 });

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
  if (node.dialogue_audio_url?.startsWith("/oss/")) {
    const prior = path.join(OSS_DIR, node.dialogue_audio_url.slice(5));
    if (fs.existsSync(prior)) fs.rmSync(prior, { force: true });
  }
  const filename = `dialogue_${id}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(OSS_DIR, filename), buf);
  const url = `/oss/${filename}`;

  db.prepare("UPDATE stitch_nodes SET dialogue_audio_url = ? WHERE id = ?").run(url, id);
  return NextResponse.json({ ok: true, url });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const node = db.prepare("SELECT dialogue_audio_url FROM stitch_nodes WHERE id = ?").get(id) as
    | { dialogue_audio_url: string | null }
    | undefined;
  if (node?.dialogue_audio_url?.startsWith("/oss/")) {
    const file = path.join(OSS_DIR, node.dialogue_audio_url.slice(5));
    if (fs.existsSync(file)) fs.rmSync(file, { force: true });
  }
  db.prepare("UPDATE stitch_nodes SET dialogue_audio_url = NULL WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
