import { NextResponse } from "next/server";
import {
  browserSessionStatus,
  clearBrowserSession,
  saveBrowserSession,
  type HiggsfieldCookie,
  checkBrowserSession,
  isBrowserSessionSaved
} from "../../../../lib/higgsfield/browser";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* The capture flow runs from a signed-in higgsfield.ai tab, so the POST is
   cross-origin. Allow exactly that one origin — nothing else needs to reach
   this route from a browser. */
const CORS = {
  "Access-Control-Allow-Origin": "https://higgsfield.ai",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type"
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

/** Is a logged-in Higgsfield browser session stored, and is it still working? */
export async function GET(req: Request) {
  // ?check=1 launches a headless login probe (slow, ~15s); default is instant status.
  if (new URL(req.url).searchParams.get("check") === "1") {
    // HIGGS_CDP_URL drives the real, already-logged-in browser directly — no
    // cookie row needed, so skip the "no session saved" gate in that mode.
    if (!process.env.HIGGS_CDP_URL && !isBrowserSessionSaved()) {
      return NextResponse.json({ ...browserSessionStatus(), check: { ok: false, signedIn: false, detail: "no session saved" } });
    }
    const check = await checkBrowserSession();
    return NextResponse.json({ ...browserSessionStatus(), check });
  }
  return NextResponse.json(browserSessionStatus());
}

/**
 * Save the cookies for a signed-in higgsfield.ai session. Unlimited mode is a
 * web-UI-only feature, so plan-included (zero-credit) generation has to run
 * through a real browser — this is what lets Direkta do that itself instead of
 * a human clicking the toggle for every shot.
 *
 * Body: { cookies: [{ name, value, domain?, path?, ... }] }
 * Capture them from a logged-in tab (devtools → Application → Cookies, or a
 * cookie-export extension) for the higgsfield.ai domain.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const raw = body?.cookies;
  if (!Array.isArray(raw) || !raw.length) {
    return NextResponse.json({ error: "Send { cookies: [...] } from a signed-in higgsfield.ai tab." }, { status: 400, headers: CORS });
  }
  const cookies: HiggsfieldCookie[] = [];
  for (const c of raw) {
    if (!c || typeof c.name !== "string" || typeof c.value !== "string") continue;
    cookies.push({
      name: c.name,
      value: c.value,
      domain: typeof c.domain === "string" ? c.domain : ".higgsfield.ai",
      path: typeof c.path === "string" ? c.path : "/",
      ...(typeof c.expires === "number" ? { expires: c.expires } : {}),
      ...(typeof c.httpOnly === "boolean" ? { httpOnly: c.httpOnly } : {}),
      ...(typeof c.secure === "boolean" ? { secure: c.secure } : {})
    });
  }
  if (!cookies.length) {
    return NextResponse.json({ error: "No usable cookies in that payload." }, { status: 400, headers: CORS });
  }
  saveBrowserSession(cookies);
  return NextResponse.json({ ok: true, saved: cookies.length, ...browserSessionStatus() }, { headers: CORS });
}

export async function DELETE() {
  clearBrowserSession();
  return NextResponse.json({ ok: true, ...browserSessionStatus() });
}
