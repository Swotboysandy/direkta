import { NextResponse } from "next/server";
import { getCodexStatus } from "../../../../lib/codex/token";
import { requireAdmin } from "../../../../lib/auth/guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const admin = requireAdmin(req);
  if (admin instanceof Response) return admin;
  return NextResponse.json(getCodexStatus());
}
