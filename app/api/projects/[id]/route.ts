import { NextResponse } from "next/server";
import { edges, nodes, projects } from "../../../../lib/db/repo";
import type { AspectRatio } from "../../../../lib/types";

export const dynamic = "force-dynamic";

const VALID_ASPECTS: AspectRatio[] = ["16:9", "9:16", "1:1", "4:5", "21:9"];

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = projects.get(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    project,
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
  projects.update(id, {
    title: typeof body.title === "string" ? body.title : undefined,
    premise: typeof body.premise === "string" ? body.premise : undefined,
    aspect_ratio
  });
  return NextResponse.json({ project: projects.get(id) });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  projects.delete(id);
  return NextResponse.json({ ok: true });
}
