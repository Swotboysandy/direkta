import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/auth/guard";
import { generatePassword, hashPassword, passwordProblem } from "../../../../../lib/auth/password";
import { sessions, users, type Role } from "../../../../../lib/auth/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Change an account: its daily limit, name, role, whether it can sign in, or
 * its password. Disabling an account, changing its role or resetting its
 * password signs it out everywhere at once.
 *
 * The last active admin cannot be demoted or disabled, and an admin cannot
 * disable themselves — either would lock everyone out of this page.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = requireAdmin(req);
  if (admin instanceof Response) return admin;
  const { id } = await params;

  const target = users.get(id);
  if (!target) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Expected an object request body." }, { status: 400 });

  const patch: { name?: string; role?: Role; daily_limit?: number | null; disabled?: boolean; password_hash?: string } = {};
  let revoke = false;
  let issuedPassword: string | null = null;

  if (typeof body.name === "string") patch.name = body.name.slice(0, 80);

  if ("daily_limit" in body) {
    if (body.daily_limit === null) patch.daily_limit = null;
    else if (Number.isInteger(body.daily_limit) && (body.daily_limit as number) >= 0) patch.daily_limit = body.daily_limit as number;
    else return NextResponse.json({ error: "The daily limit must be a whole number, or empty for unlimited." }, { status: 400 });
  }

  const losesAdmin =
    target.role === "admin" && !target.disabled && ((body.role !== undefined && body.role !== "admin") || body.disabled === true);
  if (losesAdmin && users.adminCount() <= 1) {
    return NextResponse.json({ error: "This is the only active admin. Add another admin first." }, { status: 409 });
  }

  if (body.role === "admin" || body.role === "user") {
    if (body.role !== target.role) revoke = true;
    patch.role = body.role;
  }

  if (typeof body.disabled === "boolean") {
    if (body.disabled && target.id === admin.id) {
      return NextResponse.json({ error: "You cannot disable your own account." }, { status: 409 });
    }
    if (body.disabled) revoke = true;
    patch.disabled = body.disabled;
  }

  if (body.reset_password === true || typeof body.password === "string") {
    const password = typeof body.password === "string" ? body.password : generatePassword();
    const problem = passwordProblem(password);
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });
    patch.password_hash = await hashPassword(password);
    revoke = true;
    issuedPassword = typeof body.password === "string" ? null : password;
  }

  const updated = users.update(id, patch);
  if (revoke) sessions.revokeAllFor(id);

  return NextResponse.json({ user: updated, ...(issuedPassword ? { password: issuedPassword } : {}) });
}
