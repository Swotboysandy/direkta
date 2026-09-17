import { NextResponse } from "next/server";
import { handleCallback, baseUrl } from "../../../../lib/higgsfield/oauth";
import { requireAdmin } from "../../../../lib/auth/guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** OAuth redirect target — exchanges the code for tokens, then returns to the app. */
export async function GET(req: Request) {
  const admin = requireAdmin(req);
  if (admin instanceof Response) return admin;
  const u = new URL(req.url);
  const err = u.searchParams.get("error");
  if (err) {
    return NextResponse.redirect(`${baseUrl()}/?higgsfield=error&reason=${encodeURIComponent(err)}`);
  }
  try {
    await handleCallback(u.searchParams.get("code"), u.searchParams.get("state"));
    return NextResponse.redirect(`${baseUrl()}/?higgsfield=connected`);
  } catch (e: any) {
    return NextResponse.redirect(`${baseUrl()}/?higgsfield=error&reason=${encodeURIComponent(e?.message ?? String(e))}`);
  }
}
