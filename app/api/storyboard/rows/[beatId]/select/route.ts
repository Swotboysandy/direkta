import { NextResponse } from "next/server";
import { getDb } from "../../../../../../lib/db/client";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ beatId: string }> }) {
  const { beatId } = await params;
  const body = await req.json().catch(() => ({}));
  const variantId = typeof body.variant_id === "string" ? body.variant_id : null;
  if (!variantId) {
    return NextResponse.json({ error: "variant_id required" }, { status: 400 });
  }

  const db = getDb();
  const row = db.prepare("SELECT beat_id FROM storyboard_rows WHERE beat_id = ?").get(beatId);
  if (row) {
    db.prepare("UPDATE storyboard_rows SET selected_variant_id = ?, updated_at = datetime('now') WHERE beat_id = ?").run(
      variantId,
      beatId
    );
  } else {
    db.prepare(
      "INSERT INTO storyboard_rows (beat_id, state, selected_variant_id) VALUES (?, 'complete', ?)"
    ).run(beatId, variantId);
  }
  return NextResponse.json({ ok: true });
}
