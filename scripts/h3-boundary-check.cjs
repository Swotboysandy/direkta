const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
require("./register-typescript.cjs");
const { videoInfo, exportVideoFrame, extractLastVideoFrame } = require("../lib/media/video-frames.ts");

const [leftArg, rightArg, outArg] = process.argv.slice(2);
if (!leftArg || !rightArg || !outArg) throw new Error("Usage: node scripts/h3-boundary-check.cjs previous.mp4 next.mp4 output-directory");
const left = path.resolve(leftArg), right = path.resolve(rightArg), out = path.resolve(outArg);
fs.mkdirSync(out, { recursive: true });
const a = videoInfo(left), b = videoInfo(right);
if (a.width !== b.width || a.height !== b.height) throw new Error("Boundary canvases differ; inspect/correct framing before comparing pixels.");
const final = path.join(out, "previous-actual-final.png");
const opening = path.join(out, "next-opening.png");
const old = path.join(out, "previous-legacy-extraction.png");
extractLastVideoFrame(left, final);
exportVideoFrame(right, opening, 0);
const oldResult = spawnSync(process.env.FFMPEG_PATH || "ffmpeg", ["-v", "error", "-y", "-sseof", "-1", "-i", left, "-frames:v", "1", old], { timeout: 30_000 });
if (oldResult.status !== 0) throw new Error("Could not reproduce the old extraction.");
const readPixels = (file) => {
  const r = spawnSync(process.env.FFMPEG_PATH || "ffmpeg", ["-v", "error", "-i", file, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1"], { maxBuffer: 64 * 1024 * 1024, timeout: 30_000 });
  if (r.status !== 0) throw new Error("Could not decode comparison pixels.");
  return r.stdout;
};
const metrics = (first, second) => {
  if (first.length !== second.length || !first.length) throw new Error("Pixel buffers differ in size.");
  let sum = 0;
  for (let i = 0; i < first.length; i++) sum += (first[i] - second[i]) ** 2;
  const mse = sum / first.length;
  return { mse, psnrDb: mse === 0 ? "infinite" : 10 * Math.log10(255 ** 2 / mse), exactPixelMatch: mse === 0 };
};
const actualPixels = readPixels(final), nextPixels = readPixels(opening), oldPixels = readPixels(old);
const report = {
  previous: { file: left, ...a }, next: { file: right, ...b },
  metric: "RGB24 PSNR over every pixel/channel, same-size decoded frames; no rescaling or alignment",
  actualJoin: metrics(actualPixels, nextPixels),
  legacyReferenceVsNext: metrics(oldPixels, nextPixels),
  legacyReferenceVsActualEnd: metrics(oldPixels, actualPixels),
  limitations: "Existing output only. A pixel metric does not measure motion, audio, or prove model quality. Fixing extraction does not retrofit these existing clips; a new authorized render is needed to test endpoint conditioning."
};
fs.writeFileSync(path.join(out, "metrics.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
