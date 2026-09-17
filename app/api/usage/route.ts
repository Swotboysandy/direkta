import { NextResponse } from "next/server";
import { usageSummary, TOKEN_COSTS } from "../../../lib/usage";
import { requireAdmin } from "../../../lib/auth/guard";

export const dynamic = "force-dynamic";

/** BytePlus token-pack balance + per-action costs for the top-bar chip. */
export async function GET(req: Request) {
  const admin = requireAdmin(req);
  if (admin instanceof Response) return admin;
  return NextResponse.json({ ...usageSummary(), costs: TOKEN_COSTS });
}
