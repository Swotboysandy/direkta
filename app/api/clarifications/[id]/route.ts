import { NextResponse } from "next/server";
import { clarifications } from "../../../../lib/db/repo";

export const dynamic = "force-dynamic";

// PATCH /api/clarifications/:id — record the director's decision on a gap.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const resolution = typeof body.resolution === "string" ? body.resolution.trim() : "";
  if (!resolution) return NextResponse.json({ error: "resolution required" }, { status: 400 });
  clarifications.resolve(id, resolution);
  return NextResponse.json({ ok: true });
}
