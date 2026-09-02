import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { nanoid } from "nanoid";
import { characters } from "../../../../../lib/db/repo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const OSS_DIR =
  process.env.OSS_DIR ||
  (process.env.VERCEL ? "/tmp/zinema-data/oss" : path.join(process.cwd(), "data", "oss"));

const EXTS = ["png", "jpg", "jpeg", "webp"];
const MAX_BYTES = 20 * 1024 * 1024;

/**
 * Attach a portrait generated OUTSIDE Fylmer (e.g. Higgsfield's own web app
 * with Unlimited mode) straight onto a character — same refs/soul_id_state
 * slot the real portrait route writes to.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const character = characters.get(id);
  if (!character) return NextResponse.json({ error: "Character not found" }, { status: 404 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "That file is over 20MB." }, { status: 413 });
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

  const refs = [url, ...(character.refs ?? [])];
  characters.update(id, { refs, soul_id_state: "trained", error: null });

  return NextResponse.json({ ok: true, url });
}
