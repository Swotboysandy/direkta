import { NextResponse } from "next/server";
import { props } from "../../../../../lib/db/repo";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ props: props.forProject(id) });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (!body.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const prop = props.create({
    project_id: id,
    name: String(body.name).slice(0, 120),
    description: typeof body.description === "string" ? body.description.slice(0, 500) : "",
    scene_count: Number(body.scene_count ?? 0)
  });
  return NextResponse.json({ prop }, { status: 201 });
}
