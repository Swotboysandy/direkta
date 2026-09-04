import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getDb } from "../../../lib/db/client";

export const dynamic = "force-dynamic";

/**
 * Collections (brief §34) — a named set an asset can belong to.
 *
 * Not under `/api/projects/{id}`, because a collection is the one thing in
 * Assets that is allowed to cross a production: "night plates" is useful
 * precisely when it holds plates from three films. Membership is written on
 * the collection (`PUT /api/collections/{id}`), which keeps the whole feature
 * to two files.
 */

export interface CollectionRow {
  id: string;
  name: string;
  created_at: string;
  /** How many items are in it — the one number a filter row needs. */
  count: number;
}

export async function GET() {
  const rows = getDb()
    .prepare(
      `SELECT c.id, c.name, c.created_at, COUNT(i.item_id) AS count
         FROM asset_collections c
         LEFT JOIN asset_collection_items i ON i.collection_id = c.id
        GROUP BY c.id
        ORDER BY c.name COLLATE NOCASE ASC`
    )
    .all() as unknown as CollectionRow[];
  return NextResponse.json({ collections: rows });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { name?: string } | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "A collection needs a name." }, { status: 400 });
  if (name.length > 80) {
    return NextResponse.json({ error: "That name is too long for a collection." }, { status: 400 });
  }

  const db = getDb();
  // Names are how the user finds one again, so two called the same thing is a
  // mistake, not a feature. The existing one is returned instead of a second.
  const existing = db
    .prepare("SELECT id, name, created_at FROM asset_collections WHERE name = ? COLLATE NOCASE")
    .get(name) as { id: string; name: string; created_at: string } | undefined;
  if (existing) return NextResponse.json({ collection: { ...existing, count: 0 }, existed: true });

  const id = nanoid(10);
  db.prepare("INSERT INTO asset_collections (id, name) VALUES (?, ?)").run(id, name);
  const row = db
    .prepare("SELECT id, name, created_at FROM asset_collections WHERE id = ?")
    .get(id) as { id: string; name: string; created_at: string };
  return NextResponse.json({ collection: { ...row, count: 0 } });
}
