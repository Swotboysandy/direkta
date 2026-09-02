import { NextResponse } from "next/server";
import path from "node:path";
import { nanoid } from "nanoid";
import { getDb } from "../../../../../../lib/db/client";
import { videoInfo, exportVideoFrame, ossFile } from "../../../../../../lib/media/video-frames";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ossRoot = () => process.env.OSS_DIR || (process.env.VERCEL ? "/tmp/zinema-data/oss" : path.join(process.cwd(), "data", "oss"));
function sourceFor(id: string) {
  const row = getDb().prepare(`SELECT COALESCE(al.url, ac.url) AS url FROM stitch_nodes sn
    LEFT JOIN assets ac ON ac.id = sn.clip_asset_id LEFT JOIN assets al ON al.id = sn.lipsync_asset_id WHERE sn.id = ?`)
    .get(id) as { url: string | null } | undefined;
  return row?.url ? ossFile(row.url, ossRoot()) : null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const file = sourceFor((await params).id);
    if (!file) return NextResponse.json({ error: "This shot has no local video clip." }, { status: 404 });
    return NextResponse.json(videoInfo(file));
  } catch { return NextResponse.json({ error: "Could not inspect this shot's clip." }, { status: 400 }); }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const file = sourceFor((await params).id);
    if (!file) return NextResponse.json({ error: "This shot has no local video clip." }, { status: 404 });
    const body = await req.json();
    if (!Number.isSafeInteger(body.frame) || body.frame < 0) throw new Error("Choose a non-negative frame index.");
    if (![undefined, "native", "1080p"].includes(body.size)) throw new Error("size must be native or 1080p.");
    if (![undefined, "contain", "cover"].includes(body.fit)) throw new Error("fit must be contain or cover.");
    const info = videoInfo(file);
    const size = body.size === "1080p"
      ? { width: info.width >= info.height ? 1920 : 1080, height: info.width >= info.height ? 1080 : 1920, fit: body.fit ?? "contain" }
      : undefined;
    const name = `still-${nanoid(12)}.png`;
    const result = exportVideoFrame(file, path.join(ossRoot(), name), body.frame, size);
    return NextResponse.json({ ok: true, url: `/oss/${name}`, frame: result.frame, timeSeconds: result.timeSeconds, fit: size?.fit ?? "native" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Still export failed." }, { status: 400 });
  }
}
