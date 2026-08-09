import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/db/client";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  db.prepare("DELETE FROM transitions WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
