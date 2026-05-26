import { NextResponse } from "next/server";
import { characters } from "../../../../../lib/db/repo";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ characters: characters.forProject(id) });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (!body.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const character = characters.create({
    project_id: id,
    name: String(body.name).slice(0, 80),
    role: body.role ?? "Supporting",
    scene_count: Number(body.scene_count ?? 0),
    dialogue: body.dialogue !== false
  });
  return NextResponse.json({ character }, { status: 201 });
}
