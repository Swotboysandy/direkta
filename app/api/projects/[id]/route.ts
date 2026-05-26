import { NextResponse } from "next/server";
import { activity, beats, bible, characters, edges, locations, nodes, projects } from "../../../../lib/db/repo";
import type { AspectRatio, LengthEstimate, ProjectFormat } from "../../../../lib/types";

export const dynamic = "force-dynamic";

const VALID_ASPECTS: AspectRatio[] = ["16:9", "9:16", "1:1", "4:5", "21:9"];
const VALID_FORMATS: ProjectFormat[] = ["Short Film", "Music Video", "Ad", "Series", "Feature", "Other"];
const VALID_LENGTHS: LengthEstimate[] = ["Under 5 min", "5–15 min", "15–30 min", "30+ min"];

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = projects.get(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    project,
    bible: bible.ensure(id),
    beats: beats.forProject(id),
    characters: characters.forProject(id),
    locations: locations.forProject(id),
    activity: activity.forProject(id, 20),
    nodes: nodes.forProject(id),
    edges: edges.forProject(id)
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const aspect_ratio =
    typeof body.aspect_ratio === "string" && VALID_ASPECTS.includes(body.aspect_ratio as AspectRatio)
      ? (body.aspect_ratio as AspectRatio)
      : undefined;
  const format =
    typeof body.format === "string" && VALID_FORMATS.includes(body.format as ProjectFormat)
      ? (body.format as ProjectFormat)
      : undefined;
  const length_estimate =
    typeof body.length_estimate === "string" && VALID_LENGTHS.includes(body.length_estimate as LengthEstimate)
      ? (body.length_estimate as LengthEstimate)
      : undefined;
  projects.update(id, {
    title: typeof body.title === "string" ? body.title : undefined,
    premise: typeof body.premise === "string" ? body.premise : undefined,
    logline: typeof body.logline === "string" ? body.logline : undefined,
    script: typeof body.script === "string" ? body.script : undefined,
    script_submitted: typeof body.script_submitted === "boolean" ? body.script_submitted : undefined,
    aspect_ratio,
    format,
    length_estimate
  });
  return NextResponse.json({ project: projects.get(id) });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  projects.delete(id);
  return NextResponse.json({ ok: true });
}
