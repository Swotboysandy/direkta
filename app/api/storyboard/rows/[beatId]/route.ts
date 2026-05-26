import { NextResponse } from "next/server";
import { getDb } from "../../../../../lib/db/client";

export const dynamic = "force-dynamic";

interface RowState {
  state?: "waiting" | "generating" | "complete" | "error";
  selected_variant_id?: string | null;
  style?: Record<string, unknown>;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ beatId: string }> }) {
  const { beatId } = await params;
  const body = (await req.json().catch(() => ({}))) as RowState;

  const db = getDb();
  const existing = db.prepare("SELECT * FROM storyboard_rows WHERE beat_id = ?").get(beatId) as
    | { style: string }
    | undefined;
  if (!existing) {
    db.prepare(
      "INSERT INTO storyboard_rows (beat_id, state, selected_variant_id, style) VALUES (?, 'waiting', NULL, ?)"
    ).run(beatId, JSON.stringify(body.style ?? {}));
  }

  const fields: string[] = [];
  const values: (string | null)[] = [];

  if (body.state) {
    fields.push("state = ?");
    values.push(body.state);
  }
  if (body.selected_variant_id !== undefined) {
    fields.push("selected_variant_id = ?");
    values.push(body.selected_variant_id);
  }
  if (body.style !== undefined) {
    // Merge into existing style so partial updates work.
    const current = existing?.style ? JSON.parse(existing.style) : {};
    const merged = { ...current, ...body.style };
    fields.push("style = ?");
    values.push(JSON.stringify(merged));
  }

  if (fields.length) {
    fields.push("updated_at = datetime('now')");
    values.push(beatId);
    db.prepare(`UPDATE storyboard_rows SET ${fields.join(", ")} WHERE beat_id = ?`).run(...values);
  }

  return NextResponse.json({ ok: true });
}
