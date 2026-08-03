import { NextResponse } from "next/server";
import { isHiggsfieldMcpConnected, listMcpTools } from "../../../../lib/higgsfield/mcp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Read-only: what the connected Higgsfield MCP actually advertises, so model
 *  parameters (Unlimited mode, durations, ratios) come from the provider's own
 *  schema instead of being guessed. */
export async function GET() {
  if (!isHiggsfieldMcpConnected()) {
    return NextResponse.json({ error: "Higgsfield is not connected." }, { status: 400 });
  }
  try {
    return NextResponse.json(await listMcpTools());
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
