import { NextResponse } from "next/server";
import { assets } from "../../../../lib/db/repo";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  assets.delete(id);
  return NextResponse.json({ ok: true });
}
