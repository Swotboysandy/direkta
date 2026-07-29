import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { nanoid } from "nanoid";
import { getDb } from "../../../../../../lib/db/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const OSS_DIR =
  process.env.OSS_DIR ||
  (process.env.VERCEL ? "/tmp/zinema-data/oss" : path.join(process.cwd(), "data", "oss"));

const EXTS = ["mp4", "mov", "webm"];
const MAX_BYTES = 100 * 1024 * 1024; // 100MB — a few minutes of compressed 1080p

/**
 * Attach a clip generated OUTSIDE Direkta (e.g. Higgsfield's own web app,
 * where perks like "Unlimited mode" only apply through their UI, not the
 * public API) straight onto a shot — same clip_asset_id/clip_state slot the
 * real animate route writes to, so the rest of the pipeline (render,
 * lip-sync, trim) treats it identically to a generated clip.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const node = db.prepare("SELECT id FROM stitch_nodes WHERE id = ?").get(id) as { id: string } | undefined;
  if (!node) return NextResponse.json({ error: "Shot not found" }, { status: 404 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "That file is over 100MB — trim or compress it first." }, { status: 413 });
  }
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!EXTS.includes(ext)) {
    return NextResponse.json({ error: `Use one of: ${EXTS.join(", ")}.` }, { status: 400 });
  }

  fs.mkdirSync(OSS_DIR, { recursive: true });
  const filename = `${Date.now()}-${nanoid(8)}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(OSS_DIR, filename), buf);
  const url = `/oss/${filename}`;

  const assetId = nanoid(10);
  db.prepare(
    "INSERT INTO assets (id, target_kind, target_id, kind, url, prompt, vendor_id) VALUES (?, 'stitch_clip', ?, 'video', ?, ?, NULL)"
  ).run(assetId, id, url, "Manually uploaded clip");
  db.prepare("UPDATE stitch_nodes SET clip_asset_id = ?, clip_state = 'complete' WHERE id = ?").run(assetId, id);

  return NextResponse.json({ ok: true, url });
}
