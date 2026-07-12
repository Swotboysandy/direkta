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

// Master canvas is 1080-class (the rough-cut used 720). The finishing pass —
// title card, Ken Burns on stills, crossfades, fades, optional score — is the
// same technique used by hand on the reference trailers, baked into the app.
const CANVAS: Record<AspectRatio, [number, number]> = {
  "16:9": [1920, 1080],
  "9:16": [1080, 1920],
  "1:1": [1080, 1080],
  "4:5": [1080, 1350],
  "21:9": [1920, 822]
};

const FONT_CANDIDATES = [
  "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
  "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
  "/Library/Fonts/Arial.ttf",
  "C:/Windows/Fonts/arialbd.ttf"
];
const FONT = FONT_CANDIDATES.find((f) => {
  try {
    return fs.existsSync(f);
  } catch {
    return false;
  }
});

const TRANSITION = 0.4; // crossfade seconds between shots
const TITLE_DUR = 2.6; // title card seconds

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

/** ffmpeg drawtext is picky — strip the characters that need escaping. */
function safeText(s: string): string {
  return s
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/['":\\%]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
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
      const src =
        clip && fs.existsSync(clip)
          ? { kind: "clip" as const, file: clip }
          : frame && fs.existsSync(frame)
            ? { kind: "still" as const, file: frame }
            : null;
      return src ? { ...src, duration: Math.max(1.2, s.duration || 3) } : null;
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

  const enc = ["-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-r", "24"];

  try {
    // ── Build normalised segments ──────────────────────────────────────────
    // seg[0] is the title card (skipped when no font is available); every shot
    // becomes a clean WxH / 24fps clip. Stills get a slow Ken Burns push-in.
    const segFiles: string[] = [];
    const segDurs: number[] = [];

    if (FONT) {
      const titleSeg = path.join(work, "seg_title.mp4");
      const title = safeText(project.title || "Untitled");
      const sub = safeText(project.tagline || project.logline || "");
      const titleDraw =
        `drawtext=fontfile=${FONT}:text='${title}':fontcolor=white:fontsize=${Math.round(H * 0.072)}:` +
        `x=(w-tw)/2:y=(h-th)/2-${sub ? Math.round(H * 0.03) : 0}` +
        (sub
          ? `,drawtext=fontfile=${FONT}:text='${sub}':fontcolor=0xB9B9C6:fontsize=${Math.round(H * 0.03)}:x=(w-tw)/2:y=(h/2)+${Math.round(H * 0.03)}`
          : "");
      const titleVf = `${titleDraw},fade=t=in:st=0:d=0.6,fade=t=out:st=${(TITLE_DUR - 0.6).toFixed(2)}:d=0.6,setsar=1,format=yuv420p`;
      await run(FFMPEG, [
        "-y",
        "-f",
        "lavfi",
        "-i",
        `color=c=0x0B0C10:s=${W}x${H}:d=${TITLE_DUR}:r=24`,
        "-vf",
        titleVf,
        ...enc,
        titleSeg
      ]);
      segFiles.push(titleSeg);
      segDurs.push(TITLE_DUR);
    }

    for (let i = 0; i < sources.length; i++) {
      const s = sources[i];
      const seg = path.join(work, `seg_${String(i).padStart(3, "0")}.mp4`);
      if (s.kind === "still") {
        // Ken Burns — scale slightly over the canvas, then zoompan a gentle
        // push-in across the shot so stills never feel dead on screen.
        const frames = Math.round(s.duration * 24);
        const vf =
          `scale=-2:${Math.round(H * 1.2)}:force_original_aspect_ratio=increase,` +
          `zoompan=z='min(1.001+0.0011*on,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=24,` +
          `setsar=1,format=yuv420p`;
        await run(FFMPEG, ["-y", "-i", s.file, "-vf", vf, ...enc, seg]);
      } else {
        const vf = `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=24,format=yuv420p`;
        await run(FFMPEG, ["-y", "-t", String(s.duration), "-i", s.file, "-vf", vf, "-an", ...enc, seg]);
      }
      segFiles.push(seg);
      segDurs.push(s.duration);
    }

    const outName = `master_${id}_${nanoid(6)}.mp4`;
    const outFile = path.join(OSS_DIR, outName);

    // ── Assemble ───────────────────────────────────────────────────────────
    // A single segment needs no crossfade; otherwise chain xfade dissolves.
    if (segFiles.length === 1) {
      const total = segDurs[0];
      await run(FFMPEG, [
        "-y",
        "-i",
        segFiles[0],
        "-vf",
        `fade=t=in:st=0:d=0.5,fade=t=out:st=${Math.max(0, total - 0.7).toFixed(2)}:d=0.7`,
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "18",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        outFile
      ]);
    } else {
      const inputs: string[] = [];
      segFiles.forEach((f) => inputs.push("-i", f));
      // xfade offsets accumulate: offset[i] = offset[i-1] + dur[i] - T.
      const parts: string[] = [];
      let prevLabel = "0";
      let offset = segDurs[0] - TRANSITION;
      let total = segDurs[0];
      for (let i = 1; i < segFiles.length; i++) {
        const out = i === segFiles.length - 1 ? "vx" : `v${i}`;
        parts.push(
          `[${prevLabel}][${i}]xfade=transition=fade:duration=${TRANSITION}:offset=${offset.toFixed(3)}[${out}]`
        );
        total += segDurs[i] - TRANSITION;
        offset += segDurs[i] - TRANSITION;
        prevLabel = out;
      }
      const filter =
        parts.join(";") + `;[vx]fade=t=in:st=0:d=0.5,fade=t=out:st=${Math.max(0, total - 0.7).toFixed(2)}:d=0.7[vout]`;
      await run(FFMPEG, [
        "-y",
        ...inputs,
        "-filter_complex",
        filter,
        "-map",
        "[vout]",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "18",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        outFile
      ]);
    }

    // ── Optional score — mux a music bed if the project has one on disk.
    //    Drop a file at data/oss/score_<projectId>.(mp3|m4a|wav) and it rides
    //    under the cut with a fade in/out; absent → silent master (unchanged).
    const scoreFile = ["mp3", "m4a", "wav", "aac"]
      .map((ext) => path.join(OSS_DIR, `score_${id}.${ext}`))
      .find((f) => fs.existsSync(f));
    let scored = false;
    if (scoreFile) {
      const totalDur = segDurs.reduce((a, b) => a + b, 0) - (segFiles.length - 1) * TRANSITION;
      const scoredOut = path.join(OSS_DIR, `scored_${outName}`);
      try {
        await run(FFMPEG, [
          "-y",
          "-i",
          outFile,
          "-stream_loop",
          "-1",
          "-i",
          scoreFile,
          "-filter_complex",
          `[1:a]volume=0.7,afade=t=in:st=0:d=1.2,afade=t=out:st=${Math.max(0, totalDur - 1.5).toFixed(2)}:d=1.5[a]`,
          "-map",
          "0:v",
          "-map",
          "[a]",
          "-t",
          totalDur.toFixed(2),
          "-c:v",
          "copy",
          "-c:a",
          "aac",
          "-b:a",
          "192k",
          "-shortest",
          "-movflags",
          "+faststart",
          scoredOut
        ]);
        fs.rmSync(outFile, { force: true });
        fs.renameSync(scoredOut, outFile);
        scored = true;
      } catch {
        /* keep the silent master if muxing the score fails */
      }
    }

    try {
      fs.rmSync(work, { recursive: true, force: true });
    } catch {
      /* ignore */
    }

    const totalDuration = segDurs.reduce((a, b) => a + b, 0) - (segFiles.length - 1) * TRANSITION;
    return NextResponse.json({
      ok: true,
      url: `/oss/${outName}`,
      shots: sources.length,
      titled: Boolean(FONT),
      scored,
      duration: Math.round(totalDuration * 10) / 10
    });
  } catch (error: any) {
    try {
      fs.rmSync(work, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
    return NextResponse.json(
      { error: `Render failed: ${(error?.stderr || error?.message || String(error)).toString().slice(0, 400)}` },
      { status: 500 }
    );
  }
}
