import { NextResponse } from "next/server";
import { connectionStatus } from "../../../../lib/higgsfield/oauth";
import { requireUser } from "../../../../lib/auth/guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const viewer = requireUser(req);
  if (viewer instanceof Response) return viewer;
  return NextResponse.json(connectionStatus());
}
