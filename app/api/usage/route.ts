import { NextResponse } from "next/server";
import { usageSummary, TOKEN_COSTS } from "../../../lib/usage";

export const dynamic = "force-dynamic";

/** BytePlus token-pack balance + per-action costs for the top-bar chip. */
export async function GET() {
  return NextResponse.json({ ...usageSummary(), costs: TOKEN_COSTS });
}
