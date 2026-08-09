import { NextResponse } from "next/server";
import { getDb } from "../../../../../lib/db/client";
import { boardNodes } from "../../../../../lib/db/stitch";
import type { DrawerBeatGroup, DrawerVariant, StoryboardState } from "../../../../../lib/types";

export const dynamic = "force-dynamic";

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

interface DrawerRow {
  id: string;
  beat_id: string;
  n: number;
  prompt: string;
  state: string;
  beat_n: number;
  beat_title: string;
  scene_heading: string;
  url: string | null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();

  const nodes = boardNodes(db, id);

  const transitions = db
    .prepare(
      `SELECT t.id, t.from_node_id, t.to_node_id, t.style, t.state, t.clip_asset_id, t.duration,
              a.url as clip_url
       FROM transitions t
       LEFT JOIN assets a ON a.id = t.clip_asset_id
       WHERE t.project_id = ?`
    )
    .all(id) as unknown as TransitionRow[];

  /* The drawer lists every generated storyboard variant in the project, grouped
     by beat. Variant→asset is linked two ways in this codebase (the generator
     writes assets.id onto the variant, the seed writes target_kind/target_id
     back at the variant), so both are COALESCEd. The target_id lookup is a
     scalar subquery rather than a join — nothing stops a variant owning two
     asset rows, and a fan-out would list the same frame twice in the drawer. */
  const drawerRows = db
    .prepare(
      `SELECT v.id, v.beat_id, v.n, v.prompt, v.state,
              b.n AS beat_n, b.title AS beat_title, b.scene_heading,
              COALESCE(
                a_direct.url,
                (SELECT a.url FROM assets a
                  WHERE a.target_kind = 'storyboard_variant' AND a.target_id = v.id
                  ORDER BY a.created_at DESC, a.rowid DESC LIMIT 1)
              ) AS url
       FROM storyboard_variants v
       INNER JOIN beats b ON b.id = v.beat_id
       LEFT JOIN assets a_direct ON a_direct.id = v.asset_id
       WHERE b.project_id = ?
       ORDER BY b.n ASC, v.n ASC`
    )
    .all(id) as unknown as DrawerRow[];

  const groups: DrawerBeatGroup[] = [];
  const byBeat = new Map<string, DrawerBeatGroup>();
  for (const r of drawerRows) {
    let group = byBeat.get(r.beat_id);
    if (!group) {
      group = {
        beat_id: r.beat_id,
        beat_n: r.beat_n,
        beat_title: r.beat_title,
        scene_heading: r.scene_heading,
        variants: []
      };
      byBeat.set(r.beat_id, group);
      groups.push(group);
    }
    const variant: DrawerVariant = {
      id: r.id,
      beat_id: r.beat_id,
      n: r.n,
      prompt: r.prompt,
      state: r.state as StoryboardState,
      url: r.url
    };
    group.variants.push(variant);
  }

  const project = db.prepare("SELECT stitch_active_head FROM projects WHERE id = ?").get(id) as
    | { stitch_active_head: string | null }
    | undefined;

  return NextResponse.json({
    nodes,
    transitions,
    drawer: groups,
    active_chain_head: project?.stitch_active_head ?? null
  });
}

/** Sets which chain head defines the project's active cut order. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { active_chain_head?: string | null };
  const db = getDb();

  const head = body.active_chain_head ?? null;
  if (head !== null) {
    // Frames only — the cut order derives from frame→frame edges, so a note or a
    // prompt box could never be a chain head.
    const node = db
      .prepare("SELECT id FROM stitch_nodes WHERE id = ? AND project_id = ? AND node_type = 'frame'")
      .get(head, id) as { id: string } | undefined;
    if (!node) return NextResponse.json({ error: "Node not found" }, { status: 404 });
  }

  db.prepare("UPDATE projects SET stitch_active_head = ? WHERE id = ?").run(head, id);
  return NextResponse.json({ ok: true, active_chain_head: head });
}
