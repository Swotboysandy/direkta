import { NextResponse } from "next/server";
import { SESSION_COOKIE, tokenFrom } from "../../../../lib/auth/guard";
import { sessions } from "../../../../lib/auth/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Ends this session on the server, not just in the browser. */
export async function POST(req: Request) {
  const token = tokenFrom(req);
  if (token) sessions.revoke(token);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return res;
}
