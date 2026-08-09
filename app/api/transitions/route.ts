import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getDb } from "../../../lib/db/client";
import { edgeKind, isPrompt, type StitchNodeType } from "../../../lib/stitch/nodeTypes";
import type { TransitionStyle } from "../../../lib/types";

export const dynamic = "force-dynamic";

const STYLES: TransitionStyle[] = ["cut", "dissolve", "push", "whip", "match"];

interface Body {
  from_node_id?: string;
  to_node_id?: string;
  style?: string;
}

/**
 * Creates one connection on the Stitch board.
 *
 * An edge's meaning is inferred from its endpoint types (lib/stitch/nodeTypes),
 * never stored — `node_type` is immutable, so the classification can never
 * silently change under an existing edge.
 *
 *   chain  (frame → frame)   strictly linear: at most one outgoing and one
 *                            incoming per node, and no loops. That is what
 *                            makes "multiple parallel chains" mean "multiple
 *                            disjoint linear cut orders" with an unambiguous
 *                            derived order.
 *   attach (frame ↔ prompt)  a prompt box belongs to exactly one frame; a frame
 *                            may carry many. Stored frame-first (normalized).
 *   link   (anything else)   free connector, no constraints.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;
  let from = body.from_node_id;
  let to = body.to_node_id;

  if (!from || !to) {
    return NextResponse.json({ error: "from_node_id and to_node_id required" }, { status: 400 });
  }
  if (from === to) {
    return NextResponse.json({ error: "A node cannot connect to itself" }, { status: 400 });
  }

  const db = getDb();
  const lookup = db.prepare("SELECT id, project_id, node_type FROM stitch_nodes WHERE id = ?");
  let fromNode = lookup.get(from) as
    | { id: string; project_id: string; node_type: string | null }
    | undefined;
  let toNode = lookup.get(to) as
    | { id: string; project_id: string; node_type: string | null }
    | undefined;
  if (!fromNode || !toNode) {
    return NextResponse.json({ error: "Node not found" }, { status: 404 });
  }
  if (fromNode.project_id !== toNode.project_id) {
    return NextResponse.json({ error: "Nodes belong to different projects" }, { status: 400 });
  }

  const fromType = (fromNode.node_type ?? "frame") as StitchNodeType;
  const toType = (toNode.node_type ?? "frame") as StitchNodeType;
  const kind = edgeKind(fromType, toType);

  /* Normalize an attach edge frame-first, whichever way the director dragged it.
     Rendering can then always assume frame → prompt, and "which prompts hang off
     this frame" is a single from_node_id lookup. */
  if (kind === "attach" && isPrompt(fromType)) {
    [from, to] = [to, from];
    [fromNode, toNode] = [toNode, fromNode];
  }

  if (kind === "chain") {
    /* Every one of these looks at frame→frame edges only. A frame carrying three
       attached prompt boxes has three outgoing rows, and counting those would
       report "already has an output" and refuse the next cut. */
    const hasOut = db
      .prepare(
        `SELECT 1 AS hit FROM transitions t
          INNER JOIN stitch_nodes n ON n.id = t.to_node_id
          WHERE t.from_node_id = ? AND n.node_type = 'frame'`
      )
      .get(from);
    if (hasOut) {
      return NextResponse.json({ error: "That shot already has an output" }, { status: 409 });
    }
    const hasIn = db
      .prepare(
        `SELECT 1 AS hit FROM transitions t
          INNER JOIN stitch_nodes n ON n.id = t.from_node_id
          WHERE t.to_node_id = ? AND n.node_type = 'frame'`
      )
      .get(to);
    if (hasIn) {
      return NextResponse.json({ error: "That shot already has an input" }, { status: 409 });
    }

    // Walk forward from the target; if we come back round to the source it loops.
    const step = db.prepare(
      `SELECT t.to_node_id FROM transitions t
        INNER JOIN stitch_nodes n ON n.id = t.to_node_id
        WHERE t.from_node_id = ? AND n.node_type = 'frame'`
    );
    let cursor: string | null = to;
    for (let hops = 0; cursor; hops += 1) {
      if (cursor === from || hops > 500) {
        return NextResponse.json({ error: "That would loop the chain" }, { status: 409 });
      }
      const nextRow = step.get(cursor) as { to_node_id: string } | undefined;
      cursor = nextRow?.to_node_id ?? null;
    }
  } else if (kind === "attach") {
    // `to` is the prompt end after normalization. One frame per prompt box.
    const attached = db
      .prepare(
        `SELECT 1 AS hit FROM transitions t
          INNER JOIN stitch_nodes f ON f.id = t.from_node_id
          WHERE t.to_node_id = ? AND f.node_type = 'frame'`
      )
      .get(to);
    if (attached) {
      return NextResponse.json({ error: "That prompt is already attached to a shot" }, { status: 409 });
    }
  } else {
    /* link: no structural constraints and no loop check — it is decoration. But
       the same pair must not be wired twice in either direction: both rows draw
       the identical dashed path and stack their 20px hover-× hit targets on the
       identical midpoint, so removing one looks like nothing happened. */
    const dup = db
      .prepare(
        `SELECT 1 AS hit FROM transitions
          WHERE (from_node_id = ? AND to_node_id = ?)
             OR (from_node_id = ? AND to_node_id = ?)`
      )
      .get(from, to, to, from);
    if (dup) {
      return NextResponse.json({ error: "Those two are already connected" }, { status: 409 });
    }
  }

  const style: TransitionStyle = STYLES.includes(body.style as TransitionStyle)
    ? (body.style as TransitionStyle)
    : "cut";

  const id = nanoid(10);
  db.prepare(
    "INSERT INTO transitions (id, project_id, from_node_id, to_node_id, style, state, clip_asset_id, duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(id, fromNode.project_id, from, to, style, "pending", null, 0);

  return NextResponse.json(
    {
      transition: {
        id,
        from_node_id: from,
        to_node_id: to,
        style,
        state: "pending",
        clip_asset_id: null,
        duration: 0,
        clip_url: null
      }
    },
    { status: 201 }
  );
}
