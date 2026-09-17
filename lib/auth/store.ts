import { createHash, randomBytes } from "node:crypto";
import { nanoid } from "nanoid";
import { getDb } from "../db/client";

export type Role = "admin" | "user";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  /** Media generations allowed per rolling 24 hours. null = unlimited. */
  daily_limit: number | null;
  disabled: boolean;
  created_at: string;
  last_login_at: string | null;
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: Role;
  daily_limit: number | null;
  disabled: number;
  created_at: string;
  last_login_at: string | null;
  password_hash: string;
}

/** A new tester's allowance unless the admin sets another. */
export const DEFAULT_DAILY_LIMIT = 25;
export const SESSION_TTL_DAYS = 30;

const COLUMNS = "id, email, name, role, daily_limit, disabled, created_at, last_login_at";

function toUser(row: Omit<UserRow, "password_hash">): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    daily_limit: row.daily_limit,
    disabled: row.disabled === 1,
    created_at: row.created_at,
    last_login_at: row.last_login_at
  };
}

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function looksLikeEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

/** Only this digest is stored; the token itself lives in the user's cookie. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export const users = {
  count(): number {
    return (getDb().prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }).n;
  },

  list(): User[] {
    const rows = getDb().prepare(`SELECT ${COLUMNS} FROM users ORDER BY created_at ASC`).all() as unknown as UserRow[];
    return rows.map(toUser);
  },

  get(id: string): User | null {
    const row = getDb().prepare(`SELECT ${COLUMNS} FROM users WHERE id = ?`).get(id) as UserRow | undefined;
    return row ? toUser(row) : null;
  },

  byEmailWithHash(email: string): (User & { password_hash: string }) | null {
    const row = getDb()
      .prepare(`SELECT ${COLUMNS}, password_hash FROM users WHERE email = ?`)
      .get(normaliseEmail(email)) as UserRow | undefined;
    return row ? { ...toUser(row), password_hash: row.password_hash } : null;
  },

  create(input: { email: string; name: string; passwordHash: string; role: Role; dailyLimit: number | null }): User {
    const db = getDb();
    const id = nanoid(12);
    const firstAdmin =
      input.role === "admin" &&
      (db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'").get() as { n: number }).n === 0;

    db.exec("BEGIN");
    try {
      db.prepare(
        "INSERT INTO users (id, email, name, password_hash, role, daily_limit) VALUES (?, ?, ?, ?, ?, ?)"
      ).run(id, normaliseEmail(input.email), input.name.trim(), input.passwordHash, input.role, input.dailyLimit);
      // Productions made before accounts existed belong to nobody. The first
      // admin inherits them, so nothing that was already built disappears
      // from view when sign-in is switched on.
      if (firstAdmin) {
        db.prepare("UPDATE projects SET owner_id = ? WHERE owner_id IS NULL").run(id);
        db.prepare("UPDATE asset_collections SET owner_id = ? WHERE owner_id IS NULL").run(id);
      }
      db.exec("COMMIT");
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
    return this.get(id)!;
  },

  update(
    id: string,
    patch: { name?: string; role?: Role; daily_limit?: number | null; disabled?: boolean; password_hash?: string }
  ): User | null {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];
    if (patch.name !== undefined) (fields.push("name = ?"), values.push(patch.name.trim()));
    if (patch.role !== undefined) (fields.push("role = ?"), values.push(patch.role));
    if (patch.daily_limit !== undefined) (fields.push("daily_limit = ?"), values.push(patch.daily_limit));
    if (patch.disabled !== undefined) (fields.push("disabled = ?"), values.push(patch.disabled ? 1 : 0));
    if (patch.password_hash !== undefined) (fields.push("password_hash = ?"), values.push(patch.password_hash));
    if (fields.length) getDb().prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`).run(...values, id);
    return this.get(id);
  },

  adminCount(): number {
    return (
      getDb().prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND disabled = 0").get() as { n: number }
    ).n;
  },

  touchLogin(id: string): void {
    getDb().prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").run(id);
  }
};

export const sessions = {
  create(userId: string): { token: string; maxAgeSeconds: number } {
    const token = randomBytes(32).toString("base64url");
    getDb()
      .prepare(`INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, datetime('now', '+${SESSION_TTL_DAYS} days'))`)
      .run(hashToken(token), userId);
    return { token, maxAgeSeconds: SESSION_TTL_DAYS * 24 * 60 * 60 };
  },

  /** The signed-in user, or null for a missing, expired or disabled login. */
  userFor(token: string): User | null {
    const row = getDb()
      .prepare(
        `SELECT u.id, u.email, u.name, u.role, u.daily_limit, u.disabled, u.created_at, u.last_login_at
           FROM sessions s JOIN users u ON u.id = s.user_id
          WHERE s.token_hash = ? AND s.expires_at > datetime('now') AND u.disabled = 0`
      )
      .get(hashToken(token)) as UserRow | undefined;
    return row ? toUser(row) : null;
  },

  revoke(token: string): void {
    getDb().prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
  },

  revokeAllFor(userId: string): void {
    getDb().prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
  },

  pruneExpired(): void {
    getDb().prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')").run();
  }
};
