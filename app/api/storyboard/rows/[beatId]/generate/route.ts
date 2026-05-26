import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getDb } from "../../../../../../lib/db/client";

export const dynamic = "force-dynamic";

/**
 * Simulated Cinematographer pass. Real wiring (Fal/OpenAI image) lives in
 * lib/agents/image.ts but is gated on a vendor with an API key. Until those
 * are configured, we drop the row into `generating` and (optionally) create
 * empty variants the UI can paint as loading shimmers.
 */
export async function POST(req: Request, { params }: { params: Promise<{ beatId: string }> }) {
  const { beatId } = await params;
  const body = await req.json().catch(() => ({} as { variants?: number; prompt?: string }));
  const variantCount = Math.max(1, Math.min(8, Number(body.variants ?? 4)));
  const prompt = typeof body.prompt === "string" ? body.prompt : "";

  const db = getDb();

  // Flip row state to generating and persist the prompt onto the row style.
  const existing = db.prepare("SELECT style FROM storyboard_rows WHERE beat_id = ?").get(beatId) as
    | { style: string }
    | undefined;
  const style = existing?.style ? JSON.parse(existing.style) : {};
  if (prompt) style.prompt_override = prompt;

  if (existing) {
    db.prepare(
      "UPDATE storyboard_rows SET state = 'generating', style = ?, updated_at = datetime('now') WHERE beat_id = ?"
    ).run(JSON.stringify(style), beatId);
  } else {
    db.prepare(
      "INSERT INTO storyboard_rows (beat_id, state, selected_variant_id, style) VALUES (?, 'generating', NULL, ?)"
    ).run(beatId, JSON.stringify(style));
  }

  // Clear prior variants for this beat — fresh roll.
  db.prepare(
    "DELETE FROM assets WHERE target_kind = 'storyboard_variant' AND target_id IN (SELECT id FROM storyboard_variants WHERE beat_id = ?)"
  ).run(beatId);
  db.prepare("DELETE FROM storyboard_variants WHERE beat_id = ?").run(beatId);

  // Seed N placeholder variants in `waiting` state so the UI has something to draw.
  const insert = db.prepare(
    "INSERT INTO storyboard_variants (id, beat_id, n, prompt, state, asset_id) VALUES (?, ?, ?, ?, 'waiting', NULL)"
  );
  for (let n = 1; n <= variantCount; n++) {
    insert.run(nanoid(10), beatId, n, prompt);
  }

  return NextResponse.json({
    ok: true,
    note:
      "Generation queued (simulated). Wire an image vendor with an API key in /settings to roll real frames."
  });
}
