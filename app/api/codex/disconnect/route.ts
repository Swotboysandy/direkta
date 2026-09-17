import { NextResponse } from "next/server";
import { disconnectCodex } from "../../../../lib/codex/token";
import { requireAdmin } from "../../../../lib/auth/guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const admin = requireAdmin(req);
  if (admin instanceof Response) return admin;
  disconnectCodex();
  return NextResponse.json({ ok: true });
}
