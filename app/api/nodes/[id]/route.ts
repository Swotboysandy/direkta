import { NextResponse } from "next/server";
import { nodes } from "../../../../lib/db/repo";
import { requireAccess } from "../../../../lib/auth/guard";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = requireAccess(req, "node", id);
  if (access instanceof Response) return access;
  const body = await req.json().catch(() => ({}));
  nodes.update(id, {
    title: typeof body.title === "string" ? body.title : undefined,
    body: typeof body.body === "string" ? body.body : undefined,
    x: typeof body.x === "number" ? body.x : undefined,
    y: typeof body.y === "number" ? body.y : undefined,
    width: typeof body.width === "number" ? body.width : undefined,
    height: typeof body.height === "number" ? body.height : undefined
  });
  return NextResponse.json({ node: nodes.get(id) });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = requireAccess(req, "node", id);
  if (access instanceof Response) return access;
  nodes.delete(id);
  return NextResponse.json({ ok: true });
}
