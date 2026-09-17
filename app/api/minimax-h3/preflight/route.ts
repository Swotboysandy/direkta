import { NextResponse } from "next/server";
import { getH3Preflight } from "../../../../lib/agents/minimax-h3";
import { h3Settings, H3_CANVAS } from "../../../../lib/agents/h3-settings";
import { vendors } from "../../../../lib/db/repo";
import { requireUser } from "../../../../lib/auth/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Read-only cost preview. POST describes the batch; it never starts a pod. */
export async function POST(req: Request) {
  const viewer = requireUser(req);
  if (viewer instanceof Response) return viewer;
  let shots;
  try {
    const body = await req.json();
    const count = body.shotCount ?? 1;
    if (!Number.isSafeInteger(count) || count < 1 || count > 100) throw new Error("shotCount must be between 1 and 100.");
    if (body.aspectRatio !== undefined && !Object.hasOwn(H3_CANVAS, body.aspectRatio)) throw new Error("Unsupported aspect ratio.");
    const [width, height] = H3_CANVAS[body.aspectRatio as keyof typeof H3_CANVAS] ?? H3_CANVAS["16:9"];
    const input = { durationSeconds: body.durationSeconds ?? 5, width, height };
    h3Settings(input);
    shots = Array.from({ length: count }, () => input);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Invalid H3 estimate request." }, { status: 400 });
  }
  const promptExpansionAvailable = Boolean(vendors.firstEnabled());
  try {
    const preflight = await getH3Preflight(shots);
    // The GPU account's money is the operator's business, not a tester's.
    const hidden = viewer.role === "admin" ? {} : { balanceUsd: null, requiredBalanceUsd: null };
    return NextResponse.json({ ok: true, ...preflight, ...hidden, promptExpansionAvailable });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Could not verify RunPod balance.", promptExpansionAvailable }, { status: 503 });
  }
}
