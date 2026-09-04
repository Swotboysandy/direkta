import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/db/client";
import { assets } from "../../../../lib/db/repo";

export const dynamic = "force-dynamic";

/** The recipe (brief §35): what made this, with what settings.
 *
 *  `meta` is the row the animate route writes — provider, settings, actual
 *  timings, continuity — and it is too big to ride along on every item in a
 *  list of hundreds. Read it when something is actually being inspected.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = getDb()
    .prepare(
      `SELECT id, kind, url, prompt, vendor_id, meta, target_kind, target_id, created_at
         FROM assets WHERE id = ?`
    )
    .get(id) as
    | {
        id: string;
        kind: string;
        url: string;
        prompt: string;
        vendor_id: string | null;
        meta: string;
        target_kind: string;
        target_id: string | null;
        created_at: string;
      }
    | undefined;
  if (!row) return NextResponse.json({ error: "Asset not found." }, { status: 404 });

  let meta: unknown = {};
  try {
    meta = JSON.parse(row.meta || "{}");
  } catch {
    // A malformed meta blob is not a reason to fail the whole panel.
    meta = {};
  }
  return NextResponse.json({ asset: { ...row, meta } });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  assets.delete(id);
  return NextResponse.json({ ok: true });
}
