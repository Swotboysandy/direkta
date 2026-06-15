import { NextResponse } from "next/server";
import { connectionStatus } from "../../../../lib/higgsfield/oauth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(connectionStatus());
}
