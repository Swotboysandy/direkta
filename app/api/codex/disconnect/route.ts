import { NextResponse } from "next/server";
import { disconnectCodex } from "../../../../lib/codex/token";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  disconnectCodex();
  return NextResponse.json({ ok: true });
}
