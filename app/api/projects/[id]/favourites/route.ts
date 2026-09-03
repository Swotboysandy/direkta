import { NextResponse } from "next/server";
import { getDb } from "../../../../../lib/db/client";

export const dynamic = "force-dynamic";

const KINDS = ["image", "video", "character", "location", "prop"];

/** Mark or unmark an item on the canvas.
 *
 *  Addressed by (kind, item_id) — the same pair the assets route returns —
 *  because favourites span two different sources: generated media lives in
 *  `assets`, while characters, locations and props are their own tables. A
 *  single id column would collide the moment two of them shared one.
 */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as
    | { kind?: string; item_id?: string; favourite?: boolean }
    | null;

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Expected an object request body." }, { status: 400 });
  }
  const { kind, item_id: itemId, favourite } = body;
  if (typeof kind !== "string" || !KINDS.includes(kind)) {
    return NextResponse.json({ error: `kind must be one of: ${KINDS.join(", ")}.` }, { status: 400 });
  }
  if (typeof itemId !== "string" || !itemId.trim()) {
    return NextResponse.json({ error: "item_id is required." }, { status: 400 });
  }
  if (typeof favourite !== "boolean") {
    return NextResponse.json({ error: "favourite must be true or false." }, { status: 400 });
  }

  const db = getDb();
  const project = db.prepare("SELECT id FROM projects WHERE id = ?").get(id) as { id: string } | undefined;
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

  if (favourite) {
    // Idempotent: starring an already-starred item is a no-op rather than an error,
    // because the UI toggles optimistically and may resend.
    db.prepare(
      "INSERT OR IGNORE INTO asset_favourites (project_id, kind, item_id) VALUES (?, ?, ?)"
    ).run(id, kind, itemId);
  } else {
    db.prepare(
      "DELETE FROM asset_favourites WHERE project_id = ? AND kind = ? AND item_id = ?"
    ).run(id, kind, itemId);
  }

  return NextResponse.json({ ok: true, kind, item_id: itemId, favourite });
}
