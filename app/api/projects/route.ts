import { NextResponse } from "next/server";
import { projects } from "../../../lib/db/repo";
import type { AspectRatio } from "../../../lib/types";

export const dynamic = "force-dynamic";

const VALID_ASPECTS: AspectRatio[] = ["16:9", "9:16", "1:1", "4:5", "21:9"];

export async function GET() {
  return NextResponse.json({ projects: projects.list() });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const title = String(body.title ?? "Untitled").slice(0, 200);
  const premise = String(body.premise ?? "").slice(0, 2000);
  const requested = String(body.aspect_ratio ?? "16:9") as AspectRatio;
  const aspect_ratio: AspectRatio = VALID_ASPECTS.includes(requested) ? requested : "16:9";
  const project = projects.create(title, premise, aspect_ratio);
  return NextResponse.json({ project }, { status: 201 });
}
