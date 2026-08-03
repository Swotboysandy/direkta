import { NextResponse } from "next/server";
import { allFlags, setFlag, type FlagKey } from "../../../../lib/settings";
import { browserSessionStatus } from "../../../../lib/higgsfield/browser";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ flags: allFlags(), session: browserSessionStatus() });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const valid: FlagKey[] = ["browser_images", "browser_video"];
  for (const k of valid) {
    if (typeof body[k] === "boolean") setFlag(k, body[k]);
  }
  return NextResponse.json({ flags: allFlags(), session: browserSessionStatus() });
}
