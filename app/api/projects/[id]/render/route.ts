import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { nanoid } from "nanoid";
import { getDb } from "../../../../../lib/db/client";
import { projects } from "../../../../../lib/db/repo";
import type { AspectRatio } from "../../../../../lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const run = promisify(execFile);
const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";

const OSS_DIR =
  process.env.OSS_DIR ||
  (process.env.VERCEL ? "/tmp/zinema-data/oss" : path.join(process.cwd(), "data", "oss"));

const CANVAS: Record<AspectRatio, [number, number]> = {
  "16:9": [1280, 720],
  "9:16": [720, 1280],
  "1:1": [1024, 1024],
  "4:5": [1024, 1280],
  "21:9": [1680, 720]
};

interface ShotRow {
  id: string;
  duration: number;
  x: number;
  frame_url: string | null;
  clip_url: string | null;
}

/** Map an app media URL to a local file path on disk (public/ assets or data/oss/). */
function localPath(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("/oss/")) return path.join(OSS_DIR, url.slice(5));
  if (url.startsWith("/")) return path.join(process.cwd(), "public", url.replace(/^\//, ""));
  return null;
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = projects.get(id);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const [W, H] = CANVAS[project.aspect_ratio] ?? CANVAS["16:9"];

  const shots = getDb()
    .prepare(
      `SELECT sn.id, sn.duration, sn.x,
              COALESCE(a_direct.url, a_selected.url) as frame_url,
              a_clip.url as clip_url
       FROM stitch_nodes sn
       LEFT JOIN storyboard_rows sr ON sr.beat_id = sn.beat_id
       LEFT JOIN assets a_direct ON a_direct.target_id = sn.variant_id AND a_direct.target_kind = 'storyboard_variant'
       LEFT JOIN assets a_selected ON a_selected.target_id = sr.selected_variant_id AND a_selected.target_kind = 'storyboard_variant'
       LEFT JOIN assets a_clip ON a_clip.id = sn.clip_asset_id
       WHERE sn.project_id = ?
       ORDER BY sn.x ASC, sn.y ASC`
    )
    .all(id) as unknown as ShotRow[];

  // Resolve each shot to a local source (prefer a rendered clip, else the still frame).
  const sources = shots
    .map((s) => {
      const clip = localPath(s.clip_url);
      const frame = localPath(s.frame_url);
      const src = clip && fs.existsSync(clip) ? { kind: "clip" as const, file: clip } : frame && fs.existsSync(frame) ? { kind: "still" as const, file: frame } : null;
      return src ? { ...src, duration: Math.max(0.8, s.duration || 3) } : null;
    })
    .filter(Boolean) as Array<{ kind: "clip" | "still"; file: string; duration: number }>;

  if (sources.length === 0) {
    return NextResponse.json(
      { error: "No frames on the Stitch board yet. Push some storyboard frames to Stitch first." },
      { status: 400 }
    );
  }

  fs.mkdirSync(OSS_DIR, { recursive: true });
  const work = path.join(OSS_DIR, `_render_${nanoid(8)}`);
  fs.mkdirSync(work, { recursive: true });

  const vf = `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=24,format=yuv420p`;
  const enc = ["-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-r", "24", "-an"];

  try {
    const segments: string[] = [];
    for (let i = 0; i < sources.length; i++) {
      const s = sources[i];
      const seg = path.join(work, `seg_${String(i).padStart(3, "0")}.mp4`);
      if (s.kind === "still") {
        await run(FFMPEG, ["-y", "-loop", "1", "-t", String(s.duration), "-i", s.file, "-vf", vf, ...enc, seg]);
      } else {
        await run(FFMPEG, ["-y", "-t", String(s.duration), "-i", s.file, "-vf", vf, ...enc, seg]);
      }
      segments.push(seg);
    }

    const listFile = path.join(work, "list.txt");
    fs.writeFileSync(listFile, segments.map((seg) => `file '${seg.replace(/'/g, "'\\''")}'`).join("\n"), "utf8");

    const outName = `cut_${id}_${nanoid(6)}.mp4`;
    const outFile = path.join(OSS_DIR, outName);
    await run(FFMPEG, ["-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", outFile]);

    // Best-effort cleanup of the working segments.
    try {
      fs.rmSync(work, { recursive: true, force: true });
    } catch {
      /* ignore */
    }

    const totalDuration = sources.reduce((sum, s) => sum + s.duration, 0);
    return NextResponse.json({
      ok: true,
      url: `/oss/${outName}`,
      shots: sources.length,
      duration: Math.round(totalDuration * 10) / 10
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: `Render failed: ${(error?.stderr || error?.message || String(error)).toString().slice(0, 400)}` },
      { status: 500 }
    );
  }
}
