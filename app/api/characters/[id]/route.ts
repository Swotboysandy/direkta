import { NextResponse } from "next/server";
import { characters } from "../../../../lib/db/repo";
import { requireAccess } from "../../../../lib/auth/guard";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = requireAccess(req, "character", id);
  if (access instanceof Response) return access;
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

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = requireAccess(req, "character", id);
  if (access instanceof Response) return access;
  characters.delete(id);
  return NextResponse.json({ ok: true });
}
