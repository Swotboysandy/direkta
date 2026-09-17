import { NextResponse } from "next/server";
import { startAuth, baseUrl } from "../../../../lib/higgsfield/oauth";
import { requireAdmin } from "../../../../lib/auth/guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Kick off the Higgsfield OAuth flow — redirects the user's browser to log in. */
export async function GET(req: Request) {
  const admin = requireAdmin(req);
  if (admin instanceof Response) return admin;
  try {
    const url = await startAuth();
    return NextResponse.redirect(url);
  } catch (e: any) {
    return NextResponse.redirect(`${baseUrl()}/?higgsfield=error&reason=${encodeURIComponent(e?.message ?? String(e))}`);
  }
}
