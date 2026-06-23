import fs from "node:fs";
import path from "node:path";
import { getDb } from "../db/client";

const CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
const TOKEN_URL = "https://auth.openai.com/oauth/token";

type CodexRow = {
  access_token: string | null;
  refresh_token: string | null;
  account_id: string | null;
  expires_at: number;
  connected_at: string | null;
};

function getRow(): CodexRow | undefined {
  return getDb()
    .prepare("SELECT * FROM codex_connection WHERE id = 1")
    .get() as CodexRow | undefined;
}

function upsert(data: Partial<CodexRow> & { access_token: string }) {
  const db = getDb();
  db.prepare(`
    INSERT INTO codex_connection (id, access_token, refresh_token, account_id, expires_at, connected_at)
    VALUES (1, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      access_token  = excluded.access_token,
      refresh_token = COALESCE(excluded.refresh_token, refresh_token),
      account_id    = COALESCE(excluded.account_id,    account_id),
      expires_at    = excluded.expires_at,
      connected_at  = COALESCE(excluded.connected_at,  connected_at)
  `).run(
    data.access_token,
    data.refresh_token ?? null,
    data.account_id ?? null,
    data.expires_at ?? 0,
    data.connected_at ?? new Date().toISOString()
  );
}

export function isCodexConnected(): boolean {
  return !!(getRow()?.access_token);
}

export function getCodexStatus() {
  const row = getRow();
  if (!row?.access_token) return { connected: false, connectedAt: null, expiresAt: null };
  return {
    connected: true,
    connectedAt: row.connected_at,
    expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null
  };
}

/** Decode exp from a JWT without verifying signature. Returns ms timestamp. */
function jwtExp(token: string): number {
  try {
    const payload = token.split(".")[1];
    const decoded = Buffer.from(payload, "base64url").toString("utf8");
    const exp = JSON.parse(decoded).exp;
    return exp ? Number(exp) * 1000 : 0;
  } catch {
    return 0;
  }
}

/** Read ~/.codex/auth.json (wherever Codex CLI wrote it) and store in DB. */
export function importFromFile(): void {
  const home = process.env.HOME ?? process.env.USERPROFILE ?? "/root";
  const candidates = [
    path.join(home, ".codex", "auth.json"),
    "/root/.codex/auth.json",
    "/home/claudebot/.codex/auth.json"
  ];

  let raw: string | null = null;
  for (const p of candidates) {
    try {
      raw = fs.readFileSync(p, "utf8");
      break;
    } catch {}
  }
  if (!raw) {
    throw new Error(
      "auth.json not found — run `codex login --device-auth` on the VPS first. " +
      "Checked: " + candidates.join(", ")
    );
  }

  const data = JSON.parse(raw);

  // Codex CLI v0.140+ format: { auth_mode, tokens: { access_token, refresh_token, account_id, id_token }, last_refresh }
  // Older format fallback:    { type, access, refresh, expires, accountId }
  const t = data.tokens ?? {};
  const access: string = t.access_token ?? data.access ?? data.access_token;
  const refresh: string | null = t.refresh_token ?? data.refresh ?? data.refresh_token ?? null;
  const accountId: string | null = t.account_id ?? data.accountId ?? data.account_id ?? null;

  // Derive expiry from id_token JWT exp claim, then access_token, then 1h default
  const expiresAt: number =
    jwtExp(t.id_token ?? "") ||
    jwtExp(t.access_token ?? "") ||
    (data.expires ? Number(data.expires) : 0) ||
    Date.now() + 3600_000;

  if (!access) throw new Error("No access token found in auth.json");

  upsert({
    access_token: access,
    refresh_token: refresh,
    account_id: accountId,
    expires_at: expiresAt,
    connected_at: new Date().toISOString()
  });
}

export async function getValidCodexToken(): Promise<{ access_token: string; account_id: string | null }> {
  const row = getRow();
  if (!row?.access_token) throw new Error("Codex not connected");

  const needsRefresh = row.expires_at > 0 && row.expires_at - Date.now() < 300_000;
  if (needsRefresh && row.refresh_token) {
    try {
      const res = await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: CLIENT_ID,
          refresh_token: row.refresh_token
        })
      });
      if (res.ok) {
        const tokens = await res.json();
        upsert({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token ?? row.refresh_token,
          account_id: row.account_id,
          expires_at: Date.now() + (tokens.expires_in ?? 3600) * 1000
        });
        return { access_token: tokens.access_token, account_id: row.account_id };
      }
    } catch {
      // Fall through and use the existing token
    }
  }

  return { access_token: row.access_token, account_id: row.account_id };
}

export function disconnectCodex(): void {
  getDb().prepare("DELETE FROM codex_connection WHERE id = 1").run();
}
