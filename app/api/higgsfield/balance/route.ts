import { NextResponse } from "next/server";
import { isHiggsfieldMcpConnected, getBalanceViaMcp } from "../../../../lib/higgsfield/mcp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Live credit balance + plan for the connected Higgsfield workspace. */
export async function GET() {
  if (!isHiggsfieldMcpConnected()) {
    return NextResponse.json({ connected: false, credits: null, plan: null });
  }
  try {
    const { credits, plan } = await getBalanceViaMcp();
    return NextResponse.json({ connected: true, credits, plan });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ connected: true, credits: null, plan: null, error: msg.slice(0, 200) });
  }
}
