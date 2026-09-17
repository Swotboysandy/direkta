import { NextResponse } from "next/server";
import { requireUser } from "../../../../lib/auth/guard";
import { generationsUsed } from "../../../../lib/auth/limits";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Who is signed in, and how much of today's generation allowance is left. */
export async function GET(req: Request) {
  const user = requireUser(req);
  if (user instanceof Response) return user;
  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    generations: { used: generationsUsed(user.id), limit: user.role === "admin" ? null : user.daily_limit }
  });
}
