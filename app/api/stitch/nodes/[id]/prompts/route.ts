import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getDb } from "../../../../../../lib/db/client";
import { boardNode } from "../../../../../../lib/db/stitch";
import { PROMPT_TYPES, type StitchPromptType } from "../../../../../../lib/stitch/nodeTypes";
import { seedVideoPromptFor } from "../../../../../../lib/stitch/seed";
import type { StitchBoardNode, StitchBoardTransition } from "../../../../../../lib/types";

export const dynamic = "force-dynamic";

/* Geometry mirrors app/_components/stitch/nodeGeometry.ts — the boxes stack in a
   column to the right of the frame. No collision check: the director drags them
   where he wants them, and a deterministic landing spot beats a clever one. */
const FRAME_W = 260;
const PROMPT_H = 148;
const GUTTER = 56;
const STACK_GAP = 12;

interface FrameRow {
  id: string;
  project_id: string;
  beat_id: string | null;
  variant_id: string | null;
  x: number;
  y: number;
  node_type: string | null;
  video_prompt: string | null;
  sound_prompt: string | null;
}

/**
 * Quick-add: ensure the frame's three prompt boxes exist, attached and placed.
 *
 * One call rather than six (3 creates + 3 connects) — a half-failed sequence
 * would leave orphan boxes on the board with no attachment. Idempotent: a kind
 * that is already attached is returned as-is, so pressing the button twice never
 * doubles the boxes.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();

  const frame = db
    .prepare(
      `SELECT id, project_id, beat_id, variant_id, x, y, node_type, video_prompt, sound_prompt
       FROM stitch_nodes WHERE id = ?`
    )
    .get(id) as unknown as FrameRow | undefined;
  if (!frame) return NextResponse.json({ error: "Node not found" }, { status: 404 });
  if ((frame.node_type ?? "frame") !== "frame") {
    return NextResponse.json({ error: "Only a shot can carry prompt boxes" }, { status: 400 });
  }

  // Everything already hanging off this frame, by kind.
  const existing = db
    .prepare(
      `SELECT n.id, n.node_type FROM transitions t
        INNER JOIN stitch_nodes n ON n.id = t.to_node_id
        WHERE t.from_node_id = ?
          AND n.node_type IN ('video_prompt','sound_prompt','dialogue_prompt')
        ORDER BY n.y ASC, n.x ASC, n.id ASC`
    )
    .all(id) as unknown as { id: string; node_type: string }[];
  const byKind = new Map<string, string>();
  for (const row of existing) if (!byKind.has(row.node_type)) byKind.set(row.node_type, row.id);

  const nodes: StitchBoardNode[] = [];
  const transitions: StitchBoardTransition[] = [];

  PROMPT_TYPES.forEach((kind: StitchPromptType, i) => {
    const already = byKind.get(kind);
    if (already) {
      const node = boardNode(db, already);
      if (node) nodes.push(node);
      return;
    }

    const nodeId = nanoid(10);
    db.prepare(
      `INSERT INTO stitch_nodes
         (id, project_id, beat_id, variant_id, x, y, duration, video_prompt, sound_prompt,
          node_type, content, w, h, tint, shape_kind)
       VALUES (?, ?, NULL, NULL, ?, ?, 0, '', '', ?, ?, 0, 0, '', 'rect')`
    ).run(
      nodeId,
      frame.project_id,
      Math.round(frame.x + FRAME_W + GUTTER),
      Math.round(frame.y + i * (PROMPT_H + STACK_GAP)),
      kind,
      seedFor(db, frame, kind)
    );

    const transitionId = nanoid(10);
    db.prepare(
      "INSERT INTO transitions (id, project_id, from_node_id, to_node_id, style, state, clip_asset_id, duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(transitionId, frame.project_id, frame.id, nodeId, "cut", "pending", null, 0);

    const node = boardNode(db, nodeId);
    if (node) nodes.push(node);
    transitions.push({
      id: transitionId,
      from_node_id: frame.id,
      to_node_id: nodeId,
      style: "cut",
      state: "pending",
      clip_asset_id: null,
      duration: 0,
      clip_url: null
    });
  });

  return NextResponse.json({ ok: true, nodes, transitions }, { status: 201 });
}

/* Pre-fill from the v1 seed carriers when the director has text there, so a
   hand-edited v1 board is one click from having its prompts back. Nothing
   appears on the board unbidden — recovery is entirely opt-in. */
function seedFor(db: ReturnType<typeof getDb>, frame: FrameRow, kind: StitchPromptType): string {
  if (kind === "video_prompt") {
    const carried = frame.video_prompt?.trim();
    if (carried) return carried;
    return frame.beat_id ? seedVideoPromptFor(db, frame.beat_id, frame.variant_id) : "";
  }
  if (kind === "sound_prompt") return frame.sound_prompt?.trim() ?? "";
  // Nothing in v1 held dialogue separately — the box starts on its placeholder.
  return "";
}
