import { NextResponse } from "next/server";
import { assets } from "../../../../../lib/db/repo";
import { requireAccess } from "../../../../../lib/auth/guard";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = requireAccess(req, "node", id);
  if (access instanceof Response) return access;
  return NextResponse.json({ assets: assets.forNode(id) });
}
