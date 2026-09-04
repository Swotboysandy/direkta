import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/db/client";

export const dynamic = "force-dynamic";

const KINDS = ["image", "video", "character", "location", "prop"];

/**
 * Membership, and removing a collection.
 *
 * `PUT` takes the same (project_id, kind, item_id) triple the assets route
 * returns and the favourites route already accepts, so the UI has one way of
 * naming a thing whatever table it actually lives in. Idempotent in both
 * directions, because the toggle is optimistic and may resend.
 */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as
    | { project_id?: string; kind?: string; item_id?: string; member?: boolean }
    | null;

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Expected an object request body." }, { status: 400 });
  }
  const { project_id: projectId, kind, item_id: itemId, member } = body;
  if (typeof projectId !== "string" || !projectId.trim()) {
    return NextResponse.json({ error: "project_id is required." }, { status: 400 });
  }
  if (typeof kind !== "string" || !KINDS.includes(kind)) {
    return NextResponse.json({ error: `kind must be one of: ${KINDS.join(", ")}.` }, { status: 400 });
  }
  if (typeof itemId !== "string" || !itemId.trim()) {
    return NextResponse.json({ error: "item_id is required." }, { status: 400 });
  }
  if (typeof member !== "boolean") {
    return NextResponse.json({ error: "member must be true or false." }, { status: 400 });
  }

  const db = getDb();
  const collection = db.prepare("SELECT id FROM asset_collections WHERE id = ?").get(id) as
    | { id: string }
    | undefined;
  if (!collection) return NextResponse.json({ error: "Collection not found." }, { status: 404 });
  const project = db.prepare("SELECT id FROM projects WHERE id = ?").get(projectId) as
    | { id: string }
    | undefined;
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

  if (member) {
    db.prepare(
      "INSERT OR IGNORE INTO asset_collection_items (collection_id, project_id, kind, item_id) VALUES (?, ?, ?, ?)"
    ).run(id, projectId, kind, itemId);
  } else {
    db.prepare(
      "DELETE FROM asset_collection_items WHERE collection_id = ? AND kind = ? AND item_id = ?"
    ).run(id, kind, itemId);
  }

  return NextResponse.json({ ok: true, collection_id: id, kind, item_id: itemId, member });
}

/** Removing a collection removes the set, never the assets in it. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  getDb().prepare("DELETE FROM asset_collections WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
