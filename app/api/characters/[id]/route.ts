import { NextResponse } from "next/server";
import { characters } from "../../../../lib/db/repo";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  characters.update(id, {
    name: typeof body.name === "string" ? body.name : undefined,
    role: body.role,
    scene_count: typeof body.scene_count === "number" ? body.scene_count : undefined,
    dialogue: typeof body.dialogue === "boolean" ? body.dialogue : undefined,
    brief: body.brief,
    soul_id_state: body.soul_id_state,
    soul_id_progress: typeof body.soul_id_progress === "number" ? body.soul_id_progress : undefined,
    consistency: typeof body.consistency === "number" ? body.consistency : undefined,
    error: body.error === null ? null : typeof body.error === "string" ? body.error : undefined,
    refs: body.refs
  });
  return NextResponse.json({ character: characters.get(id) });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  characters.delete(id);
  return NextResponse.json({ ok: true });
}
