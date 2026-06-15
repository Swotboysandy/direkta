import crypto from "node:crypto";
import { getDb } from "../db/client";

/**
 * Higgsfield OAuth (the consumer MCP at mcp.higgsfield.ai).
 *
 * This connects Direkta to the user's OWN Higgsfield account so the app can
 * generate on their plan/credits — the same account the Claude MCP uses, NOT
 * the separately-billed platform.higgsfield.ai Cloud API.
 *
 * Flow: dynamic client registration (open DCR) → authorization-code + PKCE →
 * tokens with offline_access (refresh). All state is kept in the single-row
 * higgsfield_connection table.
 */

const ISSUER = "https://mcp.higgsfield.ai";
export const MCP_URL = `${ISSUER}/mcp`;
const AUTHORIZE = `${ISSUER}/oauth2/authorize`;
const TOKEN = `${ISSUER}/oauth2/token`;
const REGISTER = `${ISSUER}/oauth2/register`;
const SCOPE = "openid email offline_access";

export function baseUrl(): string {
  return (process.env.PUBLIC_BASE_URL || "https://direkta.147.93.168.21.nip.io").replace(/\/$/, "");
}
function redirectUri(): string {
  return `${baseUrl()}/api/higgsfield/callback`;
}

type Conn = {
  client_id: string | null;
  client_secret: string | null;
  code_verifier: string | null;
  state: string | null;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: number;
  connected_at: string | null;
};

function loadConn(): Conn {
  const db = getDb();
  db.prepare("INSERT OR IGNORE INTO higgsfield_connection (id) VALUES (1)").run();
  return db.prepare("SELECT * FROM higgsfield_connection WHERE id = 1").get() as unknown as Conn;
}
function saveConn(patch: Partial<Conn>) {
  const db = getDb();
  loadConn();
  const keys = Object.keys(patch);
  if (!keys.length) return;
  const set = keys.map((k) => `${k} = ?`).join(", ");
  db.prepare(`UPDATE higgsfield_connection SET ${set} WHERE id = 1`).run(...keys.map((k) => (patch as any)[k]));
}

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Register Direkta as an OAuth client (DCR) if we haven't yet. */
async function ensureClient(): Promise<{ clientId: string; clientSecret: string | null }> {
  const conn = loadConn();
  if (conn.client_id) return { clientId: conn.client_id, clientSecret: conn.client_secret };

  const res = await fetch(REGISTER, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_name: "Direkta",
      redirect_uris: [redirectUri()],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      scope: SCOPE
    })
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(`DCR failed (${res.status}): ${txt.slice(0, 240)}`);
  const data = JSON.parse(txt) as { client_id: string; client_secret?: string };
  saveConn({ client_id: data.client_id, client_secret: data.client_secret ?? null });
  return { clientId: data.client_id, clientSecret: data.client_secret ?? null };
}

/** Begin the OAuth dance — returns the URL to send the user's browser to. */
export async function startAuth(): Promise<string> {
  const { clientId } = await ensureClient();
  const verifier = b64url(crypto.randomBytes(32));
  const challenge = b64url(crypto.createHash("sha256").update(verifier).digest());
  const state = b64url(crypto.randomBytes(16));
  saveConn({ code_verifier: verifier, state });

  const q = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri(),
    scope: SCOPE,
    state,
    code_challenge: challenge,
    code_challenge_method: "S256"
  });
  return `${AUTHORIZE}?${q.toString()}`;
}

/** Exchange the authorization code for tokens after the user grants access. */
export async function handleCallback(code: string | null, state: string | null): Promise<void> {
  if (!code) throw new Error("Missing authorization code");
  const conn = loadConn();
  if (!conn.state || state !== conn.state) throw new Error("State mismatch — restart the connection");
  if (!conn.client_id || !conn.code_verifier) throw new Error("No pending authorization");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri(),
    client_id: conn.client_id,
    code_verifier: conn.code_verifier
  });
  if (conn.client_secret) body.set("client_secret", conn.client_secret);

  const res = await fetch(TOKEN, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(`Token exchange failed (${res.status}): ${txt.slice(0, 240)}`);
  const tok = JSON.parse(txt) as { access_token: string; refresh_token?: string; expires_in?: number };
  saveConn({
    access_token: tok.access_token,
    refresh_token: tok.refresh_token ?? conn.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + (tok.expires_in ?? 3600),
    code_verifier: null,
    state: null,
    connected_at: new Date().toISOString()
  });
}

async function refresh(): Promise<void> {
  const conn = loadConn();
  if (!conn.refresh_token || !conn.client_id) throw new Error("Not connected");
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: conn.refresh_token,
    client_id: conn.client_id
  });
  if (conn.client_secret) body.set("client_secret", conn.client_secret);
  const res = await fetch(TOKEN, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(`Token refresh failed (${res.status}): ${txt.slice(0, 240)}`);
  const tok = JSON.parse(txt) as { access_token: string; refresh_token?: string; expires_in?: number };
  saveConn({
    access_token: tok.access_token,
    refresh_token: tok.refresh_token ?? conn.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + (tok.expires_in ?? 3600)
  });
}

/** Returns a valid access token, refreshing if it's near expiry. */
export async function getValidAccessToken(): Promise<string> {
  const conn = loadConn();
  if (!conn.access_token && !conn.refresh_token) throw new Error("Higgsfield not connected");
  if (!conn.access_token || conn.expires_at - 60 < Math.floor(Date.now() / 1000)) {
    await refresh();
  }
  return (loadConn().access_token as string) || "";
}

export function isConnected(): boolean {
  const conn = loadConn();
  return Boolean(conn.refresh_token || conn.access_token);
}

export function connectionStatus(): { connected: boolean; connectedAt: string | null; expiresAt: number } {
  const conn = loadConn();
  return {
    connected: Boolean(conn.refresh_token || conn.access_token),
    connectedAt: conn.connected_at,
    expiresAt: conn.expires_at
  };
}

export function disconnect(): void {
  saveConn({
    access_token: null,
    refresh_token: null,
    code_verifier: null,
    state: null,
    expires_at: 0,
    connected_at: null
  });
}
