import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ffmpeg = () => process.env.FFMPEG_PATH || "ffmpeg";

export function videoInfo(file: string) {
  const probe = spawnSync(process.env.FFPROBE_PATH || "ffprobe", [
    "-v", "error", "-select_streams", "v:0", "-show_entries",
    "stream=width,height,avg_frame_rate,nb_frames,duration:format=duration", "-of", "json", file
  ], { encoding: "utf8", timeout: 30_000 });
  if (probe.status !== 0) throw new Error("Could not inspect the video with ffprobe.");
  const data = JSON.parse(probe.stdout);
  const stream = data.streams?.[0];
  if (!stream) throw new Error("The file contains no video stream.");
  const [n, d] = String(stream.avg_frame_rate || "0/1").split("/").map(Number);
  const fps = n / d;
  const duration = Number(stream.duration ?? data.format?.duration);
  const frames = Number(stream.nb_frames);
  if (!(fps > 0) || !Number.isFinite(duration) || duration <= 0) throw new Error("The video has invalid timing metadata.");
  return { width: Number(stream.width), height: Number(stream.height), fps, duration, frames: Number.isSafeInteger(frames) && frames > 0 ? frames : null };
}

/** Decode to EOF, overwriting the PNG for every decoded frame. -frames:v 1
 * after -sseof -1 selects the START of the last second, not the final frame. */
export function extractLastVideoFrame(file: string, output: string) {
  const result = spawnSync(ffmpeg(), [
    "-v", "error", "-y", "-sseof", "-1", "-i", file,
    "-map", "0:v:0", "-an", "-fps_mode", "passthrough", "-update", "1", output
  ], { encoding: "utf8", timeout: 30_000 });
  if (result.status !== 0 || !fs.existsSync(output) || fs.statSync(output).size === 0) {
    throw new Error("Could not extract the actual final video frame; this clip must not be chained.");
  }
}

/** Preserve composition. The rig's 768x1344 is 4:7, not exactly 9:16, so a
 * 1080x1920 export needs padding (default) or an explicitly chosen crop. */
export function exportVideoFrame(file: string, output: string, frame: number, size?: { width: number; height: number; fit?: "contain" | "cover" }) {
  const info = videoInfo(file);
  if (!Number.isSafeInteger(frame) || frame < 0 || (info.frames !== null ? frame >= info.frames : frame / info.fps >= info.duration)) {
    throw new Error("Frame index is outside this clip.");
  }
  const filters = [`select=eq(n\\,${frame})`];
  if (size) {
    if (![size.width, size.height].every((n) => Number.isSafeInteger(n) && n >= 32 && n <= 4096)) throw new Error("Invalid still export dimensions.");
    filters.push(size.fit === "cover"
      ? `scale=${size.width}:${size.height}:force_original_aspect_ratio=increase:flags=lanczos,crop=${size.width}:${size.height}`
      : `scale=${size.width}:${size.height}:force_original_aspect_ratio=decrease:flags=lanczos,pad=${size.width}:${size.height}:(ow-iw)/2:(oh-ih)/2:black`);
  }
  filters.push("setsar=1");
  const result = spawnSync(ffmpeg(), ["-v", "error", "-y", "-i", file, "-vf", filters.join(","), "-frames:v", "1", output], { timeout: 30_000, stdio: "ignore" });
  if (result.status !== 0 || !fs.existsSync(output) || fs.statSync(output).size === 0) throw new Error("Still export failed.");
  return { ...info, frame, timeSeconds: frame / info.fps };
}

/** Public API references stay inside OSS; trusted batch scripts may use local
 * files directly through the adapter, but request bodies cannot read the host. */
export function ossFile(url: string, root: string): string {
  if (!url.startsWith("/oss/")) throw new Error("Expected a local /oss/ media URL.");
  const name = decodeURIComponent(url.slice(5));
  if (!name || name !== path.basename(name) || name.includes("\\") || name.includes("/") || name === "." || name === "..") {
    throw new Error("Invalid media filename.");
  }
  return path.join(root, name);
}
