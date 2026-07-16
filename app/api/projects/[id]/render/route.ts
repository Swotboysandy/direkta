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
const FFPROBE = process.env.FFPROBE_PATH || "ffprobe";

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

/** ffmpeg's drawtext parses `:` as its option separator, so a Windows drive
 * letter (`C:/Windows/...`) breaks the filter string unless the value is
 * single-quoted AND the colon is still backslash-escaped inside the quotes
 * (verified against this ffmpeg build — quoting alone is not enough). Linux
 * font paths have no colon, so this is a no-op there. */
function drawtextFontfile(font: string): string {
  return `'${font.replace(/:/g, "\\:")}'`;
}

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

/** ffmpeg drawtext is picky — strip the characters that need escaping. Cuts on
 * a word boundary rather than a hard character slice — a logline/premise
 * fallback used as the title-card subtitle is often longer than a real
 * tagline, and a mid-word cut (verified live: "...pour-ov") reads as broken,
 * not stylistically truncated. */
function safeText(s: string, maxLen = 60): string {
  const cleaned = s
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/['":\\%]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length <= maxLen) return cleaned;
  const cut = cleaned.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > maxLen * 0.4 ? cut.slice(0, lastSpace) : cut).trim() + "…";
}

/** Does this file have an audio stream? Used to decide whether a Seedance
 * clip's native audio (the Stitch "Native audio" toggle) survives the master
 * render, or whether we need to synthesize silence so every segment has a
 * uniform audio stream for the crossfade chain. */
async function hasAudioStream(file: string): Promise<boolean> {
  try {
    const { stdout } = await run(FFPROBE, [
      "-v", "error",
      "-select_streams", "a",
      "-show_entries", "stream=index",
      "-of", "csv=p=0",
      file
    ]);
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
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
  const aenc = ["-c:a", "aac", "-b:a", "192k"];
  const silentAudio = ["-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo"];

  try {
    // ── Build normalised segments ──────────────────────────────────────────
    // seg[0] is the title card (skipped when no font is available); every shot
    // becomes a clean WxH / 24fps clip. Stills get a slow Ken Burns push-in.
    // Every segment carries exactly one audio stream — real audio from a
    // Seedance clip generated with "Native audio" on, or silence otherwise —
    // so the crossfade chain below can treat every input the same way.
    const segFiles: string[] = [];
    const segDurs: number[] = [];
    let hasRealAudio = false;

    if (FONT) {
      const titleSeg = path.join(work, "seg_title.mp4");
      const fontfile = drawtextFontfile(FONT);
      const title = safeText(project.title || "Untitled");
      const sub = safeText(project.tagline || project.logline || "", 70);
      const titleDraw =
        `drawtext=fontfile=${fontfile}:text='${title}':fontcolor=white:fontsize=${Math.round(H * 0.072)}:` +
        `x=(w-tw)/2:y=(h-th)/2-${sub ? Math.round(H * 0.03) : 0}` +
        (sub
          ? `,drawtext=fontfile=${fontfile}:text='${sub}':fontcolor=0xB9B9C6:fontsize=${Math.round(H * 0.03)}:x=(w-tw)/2:y=(h/2)+${Math.round(H * 0.03)}`
          : "");
      const titleVf = `${titleDraw},fade=t=in:st=0:d=0.6,fade=t=out:st=${(TITLE_DUR - 0.6).toFixed(2)}:d=0.6,setsar=1,format=yuv420p`;
      await run(FFMPEG, [
        "-y",
        "-f", "lavfi", "-i", `color=c=0x0B0C10:s=${W}x${H}:d=${TITLE_DUR}:r=24`,
        ...silentAudio,
        "-vf", titleVf,
        "-map", "0:v", "-map", "1:a",
        "-t", String(TITLE_DUR),
        ...enc, ...aenc, "-shortest",
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
        await run(FFMPEG, [
          "-y",
          "-i", s.file,
          ...silentAudio,
          "-vf", vf,
          "-map", "0:v", "-map", "1:a",
          "-t", String(s.duration),
          ...enc, ...aenc, "-shortest",
          seg
        ]);
      } else {
        const vf = `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=24,format=yuv420p`;
        const clipHasAudio = await hasAudioStream(s.file);
        const args = ["-y", "-t", String(s.duration), "-i", s.file];
        if (!clipHasAudio) args.push(...silentAudio);
        else hasRealAudio = true;
        args.push(
          "-vf", vf,
          "-map", "0:v",
          "-map", clipHasAudio ? "0:a" : "1:a",
          "-t", String(s.duration),
          ...enc, ...aenc, "-shortest",
          seg
        );
        await run(FFMPEG, args);
      }
      segFiles.push(seg);
      segDurs.push(s.duration);
    }

    const outName = `master_${id}_${nanoid(6)}.mp4`;
    const outFile = path.join(OSS_DIR, outName);

    // ── Assemble ───────────────────────────────────────────────────────────
    // A single segment needs no crossfade; otherwise chain xfade (video) +
    // acrossfade (audio) together so real Seedance clip audio (when the
    // "Native audio" toggle was on) survives the dissolve, not just silence.
    if (segFiles.length === 1) {
      const total = segDurs[0];
      await run(FFMPEG, [
        "-y",
        "-i", segFiles[0],
        "-vf", `fade=t=in:st=0:d=0.5,fade=t=out:st=${Math.max(0, total - 0.7).toFixed(2)}:d=0.7`,
        "-af", `afade=t=in:st=0:d=0.5,afade=t=out:st=${Math.max(0, total - 0.7).toFixed(2)}:d=0.7`,
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k",
        "-movflags", "+faststart",
        outFile
      ]);
    } else {
      const inputs: string[] = [];
      segFiles.forEach((f) => inputs.push("-i", f));
      // xfade/acrossfade offsets accumulate in lockstep: offset[i] = offset[i-1] + dur[i] - T.
      const vParts: string[] = [];
      const aParts: string[] = [];
      let vPrev = "0:v";
      let aPrev = "0:a";
      let offset = segDurs[0] - TRANSITION;
      let total = segDurs[0];
      for (let i = 1; i < segFiles.length; i++) {
        const vOut = i === segFiles.length - 1 ? "vx" : `v${i}`;
        const aOut = i === segFiles.length - 1 ? "ax" : `a${i}`;
        vParts.push(`[${vPrev}][${i}:v]xfade=transition=fade:duration=${TRANSITION}:offset=${offset.toFixed(3)}[${vOut}]`);
        aParts.push(`[${aPrev}][${i}:a]acrossfade=d=${TRANSITION}:c1=tri:c2=tri[${aOut}]`);
        total += segDurs[i] - TRANSITION;
        offset += segDurs[i] - TRANSITION;
        vPrev = vOut;
        aPrev = aOut;
      }
      const filter =
        vParts.join(";") +
        ";" +
        aParts.join(";") +
        `;[vx]fade=t=in:st=0:d=0.5,fade=t=out:st=${Math.max(0, total - 0.7).toFixed(2)}:d=0.7[vout]` +
        `;[ax]afade=t=in:st=0:d=0.5,afade=t=out:st=${Math.max(0, total - 0.7).toFixed(2)}:d=0.7[aout]`;
      await run(FFMPEG, [
        "-y",
        ...inputs,
        "-filter_complex", filter,
        "-map", "[vout]",
        "-map", "[aout]",
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k",
        "-movflags", "+faststart",
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
      // Duck the score harder when real Seedance dialogue/foley survived the
      // cut (hasRealAudio) — mix rather than replace, so a user who turned on
      // Native audio for their clips doesn't lose it under the score.
      const scoreVol = hasRealAudio ? 0.35 : 0.7;
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
          `[1:a]volume=${scoreVol},afade=t=in:st=0:d=1.2,afade=t=out:st=${Math.max(0, totalDur - 1.5).toFixed(2)}:d=1.5[wet];` +
            `[0:a][wet]amix=inputs=2:duration=first:dropout_transition=2:normalize=0[a]`,
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
        /* keep the unscored master if muxing the score fails */
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
      hasAudio: hasRealAudio || scored,
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
