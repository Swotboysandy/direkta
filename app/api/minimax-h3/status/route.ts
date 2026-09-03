import { NextResponse } from "next/server";
import { getH3Preflight } from "../../../../lib/agents/minimax-h3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** What the header shows: is the generator reachable, is it awake, and is there
 *  money left.
 *
 *  The header used to display the BytePlus token pack, which stopped being what
 *  generates anything once H3 became the video path — so the one number always
 *  on screen described a system no longer in use, while the GPU that does the
 *  work, bills by the hour and can be out of credit was invisible.
 *
 *  Never throws: a header chip must degrade to "unknown" rather than take the
 *  page down with it, so a missing key or an unreachable RunPod is reported as
 *  state, not as an error page.
 */
export async function GET() {
  try {
    const p = await getH3Preflight([{}]);
    return NextResponse.json({
      ok: true,
      podId: p.podId,
      /** RUNNING | EXITED | UNKNOWN — desired state, from RunPod. */
      podStatus: p.podStatus,
      /** True when ComfyUI answered, i.e. a shot can start without a cold boot. */
      warm: p.warm,
      balanceUsd: p.balanceUsd,
      hourlyRateUsd: p.hourlyRateUsd,
      /** Whether one 5s shot is affordable right now. */
      canStart: p.canStart,
      estimatedCostUsd: p.estimatedCostUsd
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      reason: error?.message || "MiniMax H3 is not reachable.",
      podStatus: "UNKNOWN",
      warm: false,
      balanceUsd: null
    });
  }
}
