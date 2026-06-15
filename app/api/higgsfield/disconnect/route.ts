import { NextResponse } from "next/server";
import { disconnect } from "../../../../lib/higgsfield/oauth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  disconnect();
  return NextResponse.json({ ok: true });
}
