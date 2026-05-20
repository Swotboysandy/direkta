import { NextResponse } from "next/server";
import { assets } from "../../../../../lib/db/repo";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ assets: assets.forNode(id) });
}
