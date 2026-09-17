import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/auth/guard";
import { generationsUsed } from "../../../../lib/auth/limits";
import { generatePassword, hashPassword, passwordProblem } from "../../../../lib/auth/password";
import { DEFAULT_DAILY_LIMIT, looksLikeEmail, users, type Role } from "../../../../lib/auth/store";
import { getDb } from "../../../../lib/db/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Every account, with what each has generated in the last 24 hours. */
export async function GET(req: Request) {
  const admin = requireAdmin(req);
  if (admin instanceof Response) return admin;
  const db = getDb();
  const projectCount = db.prepare("SELECT COUNT(*) AS n FROM projects WHERE owner_id = ?");
  return NextResponse.json({
    users: users.list().map((u) => ({
      ...u,
      generations_used: generationsUsed(u.id),
      projects: (projectCount.get(u.id) as { n: number }).n
    }))
  });
}

/**
 * Create an account. With no password given, a strong one is generated. The
 * password is returned in this response only — it is never stored in a form
 * that can be read back, so the admin must pass it on now.
 */
export async function POST(req: Request) {
  const admin = requireAdmin(req);
  if (admin instanceof Response) return admin;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 80) : "";
  const role: Role = body?.role === "admin" ? "admin" : "user";

  if (!looksLikeEmail(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  if (users.byEmailWithHash(email)) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  let dailyLimit: number | null = DEFAULT_DAILY_LIMIT;
  if (body && "daily_limit" in body) {
    if (body.daily_limit === null) dailyLimit = null;
    else if (Number.isInteger(body.daily_limit) && (body.daily_limit as number) >= 0) dailyLimit = body.daily_limit as number;
    else return NextResponse.json({ error: "The daily limit must be a whole number, or empty for unlimited." }, { status: 400 });
  }

  const supplied = typeof body?.password === "string" && body.password.length > 0 ? body.password : null;
  if (supplied) {
    const problem = passwordProblem(supplied);
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });
  }
  const password = supplied ?? generatePassword();

  const user = users.create({
    email,
    name,
    passwordHash: await hashPassword(password),
    role,
    dailyLimit: role === "admin" ? null : dailyLimit
  });
  return NextResponse.json({ user, password }, { status: 201 });
}
