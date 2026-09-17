import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "../../../../lib/auth/guard";
import { hashPassword, verifyPassword } from "../../../../lib/auth/password";
import { sessions, users } from "../../../../lib/auth/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Sign in with email and password.
 *
 * Wrong email and wrong password get the same message and take comparable
 * time, so the endpoint cannot be used to discover who has an account. Repeated
 * failures from one address against one email are slowed to a stop for a
 * quarter of an hour.
 */

const WINDOW_MS = 15 * 60_000;
const MAX_FAILURES = 8;
const failures = new Map<string, { count: number; since: number }>();

// Verified against when the email is unknown, so both paths do the same work.
let decoyHash: Promise<string> | null = null;

function clientIp(req: Request): string {
  return (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
}

function isHttps(req: Request): boolean {
  return req.headers.get("x-forwarded-proto") === "https" || new URL(req.url).protocol === "https:";
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { email?: unknown; password?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }

  const key = `${clientIp(req)}|${email}`;
  const now = Date.now();
  const record = failures.get(key);
  if (record && now - record.since > WINDOW_MS) failures.delete(key);
  const current = failures.get(key);
  if (current && current.count >= MAX_FAILURES) {
    const minutes = Math.ceil((WINDOW_MS - (now - current.since)) / 60_000);
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` },
      { status: 429 }
    );
  }

  const user = users.byEmailWithHash(email);
  decoyHash ??= hashPassword("decoy-password-for-timing");
  const ok = user ? await verifyPassword(password, user.password_hash) : (await verifyPassword(password, await decoyHash), false);

  if (!user || !ok || user.disabled) {
    const entry = failures.get(key) ?? { count: 0, since: now };
    entry.count += 1;
    failures.set(key, entry);
    return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  }

  failures.delete(key);
  sessions.pruneExpired();
  users.touchLogin(user.id);
  const { token, maxAgeSeconds } = sessions.create(user.id);

  const res = NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role }
  });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps(req),
    path: "/",
    maxAge: maxAgeSeconds
  });
  return res;
}
