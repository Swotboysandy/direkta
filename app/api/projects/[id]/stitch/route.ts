import { NextResponse } from "next/server";
import { getDb } from "../../../../../lib/db/client";

export const dynamic = "force-dynamic";

interface NodeRow {
  id: string;
  beat_id: string | null;
  variant_id: string | null;
  variant_n: number | null;
  x: number;
  y: number;
  duration: number;
  beat_n: number | null;
  beat_title: string | null;
  beat_scene: string | null;
  beat_chars: string | null;
  beat_loc: string | null;
  selected_variant_id: string | null;
  variant_url: string | null;
}

interface TransitionRow {
  id: string;
  from_node_id: string;
  to_node_id: string;
  style: string;
  state: string;
  clip_asset_id: string | null;
  duration: number;
  clip_url: string | null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();

  /* Each stitch node prefers its own variant_id for the frame. If that's
     NULL (legacy node), fall back to the row's selected variant. The asset
     URL is resolved via whichever variant id wins, with COALESCE. */
  const nodes = db
    .prepare(
      `SELECT sn.id, sn.beat_id, sn.variant_id, sn.x, sn.y, sn.duration,
              b.n as beat_n, b.title as beat_title, b.scene_heading as beat_scene,
              b.characters as beat_chars, b.location_id as beat_loc,
              sr.selected_variant_id,
              v.n as variant_n,
              COALESCE(a_direct.url, a_selected.url) as variant_url
       FROM stitch_nodes sn
       LEFT JOIN beats b ON b.id = sn.beat_id
       LEFT JOIN storyboard_rows sr ON sr.beat_id = sn.beat_id
       LEFT JOIN storyboard_variants v ON v.id = sn.variant_id
       LEFT JOIN assets a_direct ON a_direct.target_id = sn.variant_id AND a_direct.target_kind = 'storyboard_variant'
       LEFT JOIN assets a_selected ON a_selected.target_id = sr.selected_variant_id AND a_selected.target_kind = 'storyboard_variant'
       WHERE sn.project_id = ?
       ORDER BY sn.x ASC, sn.y ASC`
    )
    .all(id) as unknown as NodeRow[];

  const transitions = db
    .prepare(
      `SELECT t.id, t.from_node_id, t.to_node_id, t.style, t.state, t.clip_asset_id, t.duration,
              a.url as clip_url
       FROM transitions t
       LEFT JOIN assets a ON a.id = t.clip_asset_id
       WHERE t.project_id = ?`
    )
    .all(id) as unknown as TransitionRow[];

  return NextResponse.json({
    nodes: nodes.map((n) => ({
      id: n.id,
      beat_id: n.beat_id,
      variant_id: n.variant_id,
      variant_n: n.variant_n,
      x: n.x,
      y: n.y,
      duration: n.duration,
      beat: n.beat_id
        ? {
            n: n.beat_n,
            title: n.beat_title,
            scene_heading: n.beat_scene,
            characters: n.beat_chars ? JSON.parse(n.beat_chars) : [],
            location_id: n.beat_loc
          }
        : null,
      frame_url: n.variant_url
    })),
    transitions
  });
}
