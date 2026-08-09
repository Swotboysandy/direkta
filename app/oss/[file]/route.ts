import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Mirrors lib/agents/image.ts so the serve path matches the write path. */
const OSS_DIR =
  process.env.OSS_DIR ||
  (process.env.VERCEL ? "/tmp/zinema-data/oss" : path.join(process.cwd(), "data", "oss"));

export async function GET(req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (file.includes("..") || file.includes("/") || file.includes("\\")) {
    return new NextResponse("Bad path", { status: 400 });
  }
  const filepath = path.join(OSS_DIR, file);
  if (!fs.existsSync(filepath)) {
    return new NextResponse("Not found", { status: 404 });
  }
  const stat = fs.statSync(filepath);
  const ext = path.extname(file).toLowerCase();
  const contentType =
    ext === ".png"
      ? "image/png"
      : ext === ".jpg" || ext === ".jpeg"
      ? "image/jpeg"
      : ext === ".webp"
      ? "image/webp"
      : ext === ".mp4"
      ? "video/mp4"
      : ext === ".webm"
      ? "video/webm"
      : "application/octet-stream";

  // Video/audio elements need real Range support to seek and to detect
  // duration (moov atom may sit at the end of the file) — without it Chrome
  // can stall forever at readyState 0.
  const range = req.headers.get("range");
  if (range) {
    const match = /^bytes=(\d+)-(\d*)$/.exec(range);
    if (match) {
      const start = parseInt(match[1], 10);
      const end = match[2] ? parseInt(match[2], 10) : stat.size - 1;
      if (start < stat.size && end < stat.size && start <= end) {
        const chunk = fs.readFileSync(filepath).subarray(start, end + 1);
        return new NextResponse(chunk, {
          status: 206,
          headers: {
            "content-type": contentType,
            "cache-control": "public, max-age=31536000, immutable",
            "accept-ranges": "bytes",
            "content-range": `bytes ${start}-${end}/${stat.size}`,
            "content-length": String(chunk.length)
          }
        });
      }
    }
  }

  const buffer = fs.readFileSync(filepath);
  return new NextResponse(buffer, {
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=31536000, immutable",
      "accept-ranges": "bytes",
      "content-length": String(stat.size)
    }
  });
}
