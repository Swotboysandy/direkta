import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { nanoid } from "nanoid";

/**
 * ffmpeg-based clip assembly for the MCP `stitch_film` tool.
 * Normalizes each clip to a uniform frame + audio track (silent if missing),
 * then either hard-cuts (concat) or crossfades (xfade + acrossfade).
 */

const OSS_DIR =
  process.env.OSS_DIR ||
  (process.env.VERCEL ? "/tmp/zinema-data/oss" : path.join(process.cwd(), "data", "oss"));

function ff(args: string[]) {
  const r = spawnSync("ffmpeg", args, { timeout: 300_000, stdio: "ignore" });
  if (r.status !== 0) throw new Error(`ffmpeg failed (${args.slice(-1)[0]})`);
}
function hasAudio(f: string): boolean {
  const r = spawnSync(
    "ffprobe",
    ["-v", "error", "-select_streams", "a", "-show_entries", "stream=codec_type", "-of", "csv=p=0", f],
    { encoding: "utf8" }
  );
  return (r.stdout || "").includes("audio");
}
function durationOf(f: string): number {
  const r = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "default=nk=1:nw=1", f],
    { encoding: "utf8" }
  );
  return parseFloat((r.stdout || "0").trim()) || 0;
}

/** Map a /oss/x.mp4 URL, bare filename, or absolute path to a local file path. */
export function resolveOssFile(ref: string): string {
  if (ref.startsWith("/oss/")) return path.join(OSS_DIR, ref.slice(5));
  if (path.isAbsolute(ref) && fs.existsSync(ref)) return ref;
  return path.join(OSS_DIR, ref.replace(/^\/+/, "").replace(/^oss\//, ""));
}

export function stitchClips(
  clips: string[],
  opts: { transition?: "cut" | "dissolve"; dissolveSeconds?: number; width?: number; height?: number; trims?: Array<{ startFrames?: number; endFrames?: number }> } = {}
): { url: string; relPath: string } {
  if (!clips?.length) throw new Error("stitch_film needs at least one clip");
  const files = clips.map(resolveOssFile);
  for (const f of files) if (!fs.existsSync(f)) throw new Error(`clip not found: ${f}`);

  const W = opts.width || 1280;
  const H = opts.height || 720;
  const D = opts.dissolveSeconds ?? 0.5;
  const transition = opts.transition || "cut";
  if (![W, H].every((n) => Number.isSafeInteger(n) && n >= 32 && n <= 4096 && n % 2 === 0)) throw new Error("Invalid assembly dimensions.");
  if (!Number.isFinite(D) || D <= 0 || D > 5) throw new Error("Dissolve duration must be between 0 and 5 seconds.");
  if (opts.trims && (!Array.isArray(opts.trims) || opts.trims.length !== files.length)) throw new Error("Supply one trim entry per clip.");
  const ranges = files.map((file, i) => {
    const start = opts.trims?.[i]?.startFrames ?? 0;
    const end = opts.trims?.[i]?.endFrames ?? 0;
    if (![start, end].every((n) => Number.isSafeInteger(n) && n >= 0)) throw new Error("Trim counts must be non-negative integer frames.");
    const frames = Math.round(durationOf(file) * 24);
    if (frames <= start + end) throw new Error(`Trimming would remove all frames from clip ${i + 1}.`);
    const duration = (frames - start - end) / 24;
    if (transition === "dissolve" && files.length > 1 && duration <= D * 2) throw new Error("A trimmed clip is too short for the chosen dissolve.");
    return { start, end, frames, duration };
  });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "stitch-"));
  const VF = `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,fps=24,format=yuv420p`;

  try {
  // normalize each segment (uniform video + guaranteed aac audio)
  const segs = files.map((f, i) => {
    const seg = path.join(tmp, `seg_${i}.mp4`);
    const range = ranges[i];
    // Trims are explicit, in the assembly's 24fps timebase, and disabled by
    // default. Do not guess which frames to drop to conceal a bad match.
    const vf = range.start || range.end ? `${VF},trim=start_frame=${range.start}:end_frame=${range.frames - range.end},setpts=PTS-STARTPTS` : VF;
    const af = range.start || range.end ? ["-af", `atrim=start=${range.start / 24}:end=${(range.frames - range.end) / 24},asetpts=PTS-STARTPTS`] : [];
    if (hasAudio(f)) {
      ff(["-y", "-i", f, "-vf", vf, ...af, "-c:v", "libx264", "-crf", "20", "-preset", "medium", "-c:a", "aac", "-ar", "44100", "-ac", "2", seg]);
    } else {
      ff(["-y", "-i", f, "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100", "-vf", vf, "-map", "0:v", "-map", "1:a", "-t", String(range.duration), "-shortest", "-c:v", "libx264", "-crf", "20", "-preset", "medium", "-c:a", "aac", seg]);
    }
    return seg;
  });

  fs.mkdirSync(OSS_DIR, { recursive: true });
  const outName = `stitch_${Date.now()}-${nanoid(6)}.mp4`;
  const out = path.join(OSS_DIR, outName);

  if (transition === "cut" || segs.length === 1) {
    const list = path.join(tmp, "list.txt");
    fs.writeFileSync(list, segs.map((s) => `file '${s.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`).join("\n"));
    ff(["-y", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", "-movflags", "+faststart", out]);
  } else {
    const durs = segs.map(durationOf);
    const inputs: string[] = [];
    segs.forEach((s) => inputs.push("-i", s));
    let vf = "";
    let prevV = "0:v";
    let cum = durs[0];
    for (let i = 1; i < segs.length; i++) {
      const off = (cum - D).toFixed(3);
      const o = i === segs.length - 1 ? "vx" : `v${i}`;
      vf += `[${prevV}][${i}:v]xfade=transition=fade:duration=${D}:offset=${off}[${o}];`;
      cum = cum + durs[i] - D;
      prevV = o;
    }
    let af = "";
    let prevA = "0:a";
    for (let i = 1; i < segs.length; i++) {
      const o = i === segs.length - 1 ? "ax" : `a${i}`;
      af += `[${prevA}][${i}:a]acrossfade=d=${D}[${o}];`;
      prevA = o;
    }
    const filter = `${vf}${af}[vx]format=yuv420p[v]`;
    ff(["-y", ...inputs, "-filter_complex", filter, "-map", "[v]", "-map", "[ax]", "-c:v", "libx264", "-crf", "20", "-preset", "medium", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out]);
  }

  return { url: `/oss/${outName}`, relPath: `data/oss/${outName}` };
  } finally {
    // Only the mkdtemp-created work directory; never any input/source directory.
    if (path.resolve(tmp).startsWith(path.resolve(os.tmpdir()) + path.sep)) {
      try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* ignore */ }
    }
  }
}
