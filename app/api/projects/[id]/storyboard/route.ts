import { NextResponse } from "next/server";
import { beats } from "../../../../../lib/db/repo";
import { getDb } from "../../../../../lib/db/client";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const projectBeats = beats.forProject(id);
  const db = getDb();

  const rows = db
    .prepare(
      "SELECT sr.beat_id, sr.state, sr.selected_variant_id, sr.style FROM storyboard_rows sr INNER JOIN beats b ON b.id = sr.beat_id WHERE b.project_id = ?"
    )
    .all(id) as Array<{ beat_id: string; state: string; selected_variant_id: string | null; style: string }>;

  const variants = db
    .prepare(
      "SELECT v.id, v.beat_id, v.n, v.prompt, v.state, v.asset_id, a.url as asset_url FROM storyboard_variants v INNER JOIN beats b ON b.id = v.beat_id LEFT JOIN assets a ON a.id = v.asset_id WHERE b.project_id = ? ORDER BY v.beat_id, v.n"
    )
    .all(id) as Array<{ id: string; beat_id: string; n: number; prompt: string; state: string; asset_id: string | null; asset_url: string | null }>;

  return NextResponse.json({
    beats: projectBeats,
    rows: rows.map((r) => ({
      beat_id: r.beat_id,
      state: r.state,
      selected_variant_id: r.selected_variant_id,
      style: r.style ? JSON.parse(r.style) : {}
    })),
    variants
  });
}
