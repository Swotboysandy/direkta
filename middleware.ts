import { NextResponse, type NextRequest } from "next/server";

/**
 * The sign-in gate.
 *
 * This only checks that a session cookie is present — middleware runs before
 * the database is reachable, so it cannot validate one. That is enough to send
 * a signed-out browser to /login instead of painting an app that cannot load.
 * The real check happens inside every API handler (lib/auth/guard.ts), which
 * validates the session and ownership on each request.
 *
 * Left open on purpose:
 *  - /login and the login endpoint, or no one could sign in
 *  - /oss/*, because image and video vendors fetch our frames by URL while
 *    generating; filenames are random, so they are not enumerable
 *  - /api/mcp, which authenticates with its own bearer token
 *  - static files (anything with an extension), e.g. shared campaign pages
 *
 * It also refuses writes that another site's page sends. The session cookie is
 * SameSite=Lax, but "site" means registrable domain, and on a shared wildcard
 * domain such as nip.io anyone can host a page that counts as the same site.
 * The browser's Origin header cannot be forged by that page, so a write whose
 * Origin is not this host is turned away before it reaches a handler.
 */

const SESSION_COOKIE = "direkta_session";

const OPEN = [/^\/login\/?$/, /^\/api\/auth\/login\/?$/, /^\/oss\//, /^\/api\/mcp(\/|$)/];

const WRITES = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** The first value of a header a chain of proxies may have appended to. */
function first(value: string | null): string | null {
  return value ? value.split(",")[0].trim() || null : null;
}

/** The host the visitor actually used. Behind a proxy, req.nextUrl carries the
 *  address `next start` listens on (localhost:3002), which no browser can reach. */
function publicHost(req: NextRequest): string {
  return first(req.headers.get("x-forwarded-host")) ?? first(req.headers.get("host")) ?? req.nextUrl.host;
}

function fromAnotherOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false; // same-origin GETs and non-browser clients send none
  try {
    return new URL(origin).host !== publicHost(req);
  } catch {
    return true; // "null" and anything unparseable
  }
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (pathname.startsWith("/api/") && WRITES.has(req.method) && fromAnotherOrigin(req)) {
    // MCP clients call from anywhere with a token, and without our cookie
    // they carry no one's session to misuse.
    const tokenClient = /^\/api\/mcp(\/|$)/.test(pathname) && !req.cookies.get(SESSION_COOKIE)?.value;
    if (!tokenClient) return NextResponse.json({ error: "Cross-site request refused." }, { status: 403 });
  }

  if (OPEN.some((rule) => rule.test(pathname))) return NextResponse.next();
  if (req.cookies.get(SESSION_COOKIE)?.value) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  // Absolute, because Next rejects a relative Location from middleware.
  const proto = first(req.headers.get("x-forwarded-proto")) ?? req.nextUrl.protocol.replace(/:$/, "");
  const url = new URL(`${proto}://${publicHost(req)}/login`);
  if (pathname !== "/") url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next's own assets and any path ending in a file extension.
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.[A-Za-z0-9]+$).*)"]
};
