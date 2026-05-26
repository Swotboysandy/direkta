import { NextResponse } from "next/server";
import { projects } from "../../../lib/db/repo";
import type { AspectRatio, LengthEstimate, ProjectFormat } from "../../../lib/types";

export const dynamic = "force-dynamic";

const VALID_ASPECTS: AspectRatio[] = ["16:9", "9:16", "1:1", "4:5", "21:9"];
const VALID_FORMATS: ProjectFormat[] = ["Short Film", "Music Video", "Ad", "Series", "Feature", "Other"];
const VALID_LENGTHS: LengthEstimate[] = ["Under 5 min", "5–15 min", "15–30 min", "30+ min"];

export async function GET() {
  return NextResponse.json({ projects: projects.list() });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const title = String(body.title ?? "Untitled").slice(0, 200);
  const premise = String(body.premise ?? "").slice(0, 2000);
  const logline = String(body.logline ?? body.premise ?? "").slice(0, 280);
  const requestedAspect = String(body.aspect_ratio ?? "16:9") as AspectRatio;
  const aspect_ratio: AspectRatio = VALID_ASPECTS.includes(requestedAspect) ? requestedAspect : "16:9";
  const requestedFormat = String(body.format ?? "Short Film") as ProjectFormat;
  const format: ProjectFormat = VALID_FORMATS.includes(requestedFormat) ? requestedFormat : "Short Film";
  const requestedLength = String(body.length_estimate ?? "Under 5 min") as LengthEstimate;
  const length_estimate: LengthEstimate = VALID_LENGTHS.includes(requestedLength)
    ? requestedLength
    : "Under 5 min";

  const project = projects.create({ title, premise, logline, aspect_ratio, format, length_estimate });
  return NextResponse.json({ project }, { status: 201 });
}
