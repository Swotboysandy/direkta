import { NextResponse } from "next/server";
import { clarifications } from "../../../../../lib/db/repo";

export const dynamic = "force-dynamic";

// GET /api/projects/:id/clarifications — gaps the Screenplay Agent raised, awaiting the director.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ clarifications: clarifications.pending(id) });
}
