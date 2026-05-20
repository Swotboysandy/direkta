import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const OSS_DIR = path.join(process.cwd(), "data", "oss");

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (file.includes("..") || file.includes("/") || file.includes("\\")) {
    return new NextResponse("Bad path", { status: 400 });
  }
  const filepath = path.join(OSS_DIR, file);
  if (!fs.existsSync(filepath)) {
    return new NextResponse("Not found", { status: 404 });
  }
  const buffer = fs.readFileSync(filepath);
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
  return new NextResponse(buffer, {
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=31536000, immutable",
      "accept-ranges": "bytes"
    }
  });
}
