import { NextResponse } from "next/server";
import { locations } from "../../../../../lib/db/repo";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ locations: locations.forProject(id) });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (!body.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const location = locations.create({
    project_id: id,
    name: String(body.name).slice(0, 120),
    int_ext: body.int_ext === "EXT" ? "EXT" : "INT",
    time_of_day: typeof body.time_of_day === "string" ? body.time_of_day : null,
    scene_count: Number(body.scene_count ?? 0)
  });
  return NextResponse.json({ location }, { status: 201 });
}
