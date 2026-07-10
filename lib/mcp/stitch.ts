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
  opts: { transition?: "cut" | "dissolve"; dissolveSeconds?: number; width?: number; height?: number } = {}
): { url: string; relPath: string } {
  if (!clips?.length) throw new Error("stitch_film needs at least one clip");
  const files = clips.map(resolveOssFile);
  for (const f of files) if (!fs.existsSync(f)) throw new Error(`clip not found: ${f}`);

  const W = opts.width || 1280;
  const H = opts.height || 720;
  const D = opts.dissolveSeconds ?? 0.5;
  const transition = opts.transition || "cut";
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "stitch-"));
  const VF = `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,fps=24,format=yuv420p`;

  // normalize each segment (uniform video + guaranteed aac audio)
  const segs = files.map((f, i) => {
    const seg = path.join(tmp, `seg_${i}.mp4`);
    if (hasAudio(f)) {
      ff(["-y", "-i", f, "-vf", VF, "-c:v", "libx264", "-crf", "20", "-preset", "medium", "-c:a", "aac", "-ar", "44100", "-ac", "2", seg]);
    } else {
      ff(["-y", "-i", f, "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100", "-vf", VF, "-map", "0:v", "-map", "1:a", "-shortest", "-c:v", "libx264", "-crf", "20", "-preset", "medium", "-c:a", "aac", seg]);
    }
    return seg;
  });

  fs.mkdirSync(OSS_DIR, { recursive: true });
  const outName = `stitch_${Date.now()}-${nanoid(6)}.mp4`;
  const out = path.join(OSS_DIR, outName);

  if (transition === "cut" || segs.length === 1) {
    const list = path.join(tmp, "list.txt");
    fs.writeFileSync(list, segs.map((s) => `file '${s}'`).join("\n"));
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

  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* ignore */ }
  return { url: `/oss/${outName}`, relPath: `data/oss/${outName}` };
}
