import { NextResponse } from "next/server";
import { getCodexStatus } from "../../../../lib/codex/token";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getCodexStatus());
}
