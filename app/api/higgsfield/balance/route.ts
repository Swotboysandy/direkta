import { NextResponse } from "next/server";
import { isHiggsfieldMcpConnected, getBalanceViaMcp } from "../../../../lib/higgsfield/mcp";
import { requireUser } from "../../../../lib/auth/guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Live credit balance + plan for the connected Higgsfield workspace. */
export async function GET(req: Request) {
  const viewer = requireUser(req);
  if (viewer instanceof Response) return viewer;
  if (!isHiggsfieldMcpConnected()) {
    return NextResponse.json({ connected: false, credits: null, plan: null });
  }
  // The workspace's credits and plan are the operator's business, not a tester's.
  if (viewer.role !== "admin") return NextResponse.json({ connected: true, credits: null, plan: null });
  try {
    const { credits, plan } = await getBalanceViaMcp();
    return NextResponse.json({ connected: true, credits, plan });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ connected: true, credits: null, plan: null, error: msg.slice(0, 200) });
  }
}
