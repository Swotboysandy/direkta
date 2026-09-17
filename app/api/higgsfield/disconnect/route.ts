import { NextResponse } from "next/server";
import { disconnect } from "../../../../lib/higgsfield/oauth";
import { requireAdmin } from "../../../../lib/auth/guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const admin = requireAdmin(req);
  if (admin instanceof Response) return admin;
  disconnect();
  return NextResponse.json({ ok: true });
}
