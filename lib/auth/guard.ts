import { NextResponse } from "next/server";
import { getDb } from "../db/client";
import { sessions, type User } from "./store";

/**
 * Route-level access control. Middleware only checks that a session cookie is
 * present so pages can redirect to sign-in; every API handler still validates
 * the session itself and checks ownership here, so a forged cookie or a
 * direct call to a handler gets nothing.
 */

export const SESSION_COOKIE = "direkta_session";

export function tokenFrom(req: Request): string | null {
  const header = req.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() !== SESSION_COOKIE) continue;
    const value = part.slice(eq + 1).trim();
    try {
      return decodeURIComponent(value) || null;
    } catch {
      return null;
    }
  }
  return null;
}

export function currentUser(req: Request): User | null {
  const token = tokenFrom(req);
  return token ? sessions.userFor(token) : null;
}

function deny(status: 401 | 403 | 404, error: string): Response {
  return NextResponse.json({ error }, { status });
}

export function requireUser(req: Request): User | Response {
  return currentUser(req) ?? deny(401, "Sign in required.");
}

export function requireAdmin(req: Request): User | Response {
  const user = currentUser(req);
  if (!user) return deny(401, "Sign in required.");
  if (user.role !== "admin") return deny(403, "Only an admin can do that.");
  return user;
}

/** Admins can see every production; everyone else only their own. */
export function canAccessProject(user: User, projectId: string): boolean {
  if (user.role === "admin") return true;
  const row = getDb().prepare("SELECT owner_id FROM projects WHERE id = ?").get(projectId) as
    | { owner_id: string | null }
    | undefined;
  return !!row && row.owner_id === user.id;
}

export type OwnedKind =
  | "project"
  | "character"
  | "location"
  | "prop"
  | "node"
  | "edge"
  | "stitch_node"
  | "beat"
  | "variant"
  | "asset";

const LOOKUP: Record<Exclude<OwnedKind, "asset">, string> = {
  project: "SELECT id AS project_id FROM projects WHERE id = ?",
  character: "SELECT project_id FROM characters WHERE id = ?",
  location: "SELECT project_id FROM locations WHERE id = ?",
  prop: "SELECT project_id FROM props WHERE id = ?",
  node: "SELECT project_id FROM nodes WHERE id = ?",
  edge: "SELECT project_id FROM edges WHERE id = ?",
  stitch_node: "SELECT project_id FROM stitch_nodes WHERE id = ?",
  beat: "SELECT project_id FROM beats WHERE id = ?",
  variant: "SELECT b.project_id FROM storyboard_variants v JOIN beats b ON b.id = v.beat_id WHERE v.id = ?"
};

/** Which production a thing belongs to, following the same links the data does. */
export function projectIdOf(kind: OwnedKind, id: string): string | null {
  if (!id) return null;
  const db = getDb();
  if (kind === "asset") {
    const asset = db.prepare("SELECT node_id, target_kind, target_id FROM assets WHERE id = ?").get(id) as
      | { node_id: string | null; target_kind: string; target_id: string | null }
      | undefined;
    if (!asset) return null;
    if (asset.node_id) return projectIdOf("node", asset.node_id);
    if (!asset.target_id) return null;
    switch (asset.target_kind) {
      case "storyboard_variant":
        return projectIdOf("variant", asset.target_id);
      case "stitch_clip":
        return projectIdOf("stitch_node", asset.target_id);
      case "beat":
        return projectIdOf("beat", asset.target_id);
      case "sequence":
      case "library":
        return projectIdOf("project", asset.target_id);
      default:
        return null;
    }
  }
  const row = db.prepare(LOOKUP[kind]).get(id) as { project_id: string } | undefined;
  return row?.project_id ?? null;
}

/**
 * The signed-in user plus the production the thing belongs to — or a response
 * to return. Someone else's thing is a 404, not a 403, so ids cannot be probed
 * to learn what exists.
 */
export function requireAccess(req: Request, kind: OwnedKind, id: string): { user: User; projectId: string } | Response {
  const user = currentUser(req);
  if (!user) return deny(401, "Sign in required.");
  const projectId = projectIdOf(kind, id);
  if (user.role === "admin") {
    return projectId ? { user, projectId } : deny(404, "Not found.");
  }
  if (!projectId || !canAccessProject(user, projectId)) return deny(404, "Not found.");
  return { user, projectId };
}

/** Collections span productions, so they are owned directly. */
export function requireCollection(req: Request, id: string): { user: User } | Response {
  const user = currentUser(req);
  if (!user) return deny(401, "Sign in required.");
  const row = getDb().prepare("SELECT owner_id FROM asset_collections WHERE id = ?").get(id) as
    | { owner_id: string | null }
    | undefined;
  if (!row) return deny(404, "Not found.");
  if (user.role !== "admin" && row.owner_id !== user.id) return deny(404, "Not found.");
  return { user };
}
