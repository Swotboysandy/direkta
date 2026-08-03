import { NextResponse } from "next/server";
import {
  browserSessionStatus,
  clearBrowserSession,
  saveBrowserSession,
  type HiggsfieldCookie
} from "../../../../lib/higgsfield/browser";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Is a logged-in Higgsfield browser session stored, and is it still working? */
export async function GET() {
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
    return NextResponse.json({ error: "Send { cookies: [...] } from a signed-in higgsfield.ai tab." }, { status: 400 });
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
    return NextResponse.json({ error: "No usable cookies in that payload." }, { status: 400 });
  }
  saveBrowserSession(cookies);
  return NextResponse.json({ ok: true, saved: cookies.length, ...browserSessionStatus() });
}

export async function DELETE() {
  clearBrowserSession();
  return NextResponse.json({ ok: true, ...browserSessionStatus() });
}
