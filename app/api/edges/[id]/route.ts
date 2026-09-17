import { NextResponse } from "next/server";
import { edges } from "../../../../lib/db/repo";
import { requireAccess } from "../../../../lib/auth/guard";

export const dynamic = "force-dynamic";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = requireAccess(req, "edge", id);
  if (access instanceof Response) return access;
  edges.delete(id);
  return NextResponse.json({ ok: true });
}
