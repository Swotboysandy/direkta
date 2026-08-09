import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getDb } from "../../../../lib/db/client";
import { boardNode, deleteStitchNode } from "../../../../lib/db/stitch";
import {
  NODE_TYPES,
  SHAPE_KINDS,
  TINTS,
  type StitchNodeType,
  type StitchShapeKind,
  type StitchTint
} from "../../../../lib/stitch/nodeTypes";
import { seedVideoPromptFor } from "../../../../lib/stitch/seed";

export const dynamic = "force-dynamic";

const COL_WIDTH = 280;
const ROW_BASE_Y = 200;
const ROW_GAP_Y = 220;

interface AddNodeBody {
  /** Preferred — adds the specific variant. beat_id + scene_number derived. */
  variant_id?: string;
  /** Legacy fallback — adds the beat's currently-selected variant. */
  beat_id?: string;
  /** Optional override for x positioning (1-indexed). Defaults to beat.n. */
  scene_number?: number;
  duration?: number;
  /** Explicit world x — overrides the scene-column formula (board drops). */
  x?: number;
  /** Explicit world y — overrides the same-beat stack formula (board drops). */
  y?: number;
  /** Skip the (project_id, variant_id) idempotency check, so alternates can coexist. */
  allow_duplicate?: boolean;
  /** Explicit seed; omit to let the server derive one from the beat + style. */
  video_prompt?: string;
  sound_prompt?: string;
  /** Board furniture — anything other than 'frame' takes the non-frame branch. */
  node_type?: string;
  /** Required for non-frame nodes: they carry no beat to derive the project from. */
  project_id?: string;
  content?: string;
  w?: number;
  h?: number;
  /** Paint order within the CSS band. Needed by paste and by delete-undo. */
  z?: number;
  tint?: string;
  shape_kind?: string;
}

/** 0 stays 0 — the client reads it as "use the type default". */
function clampSize(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? Math.min(4000, Math.max(0, v)) : 0;
}

function clampZ(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? Math.min(1e6, Math.max(-1e6, v)) : 0;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as AddNodeBody;
  const db = getDb();

  const type = (body.node_type ?? "frame") as StitchNodeType;
  if (type !== "frame") {
    /* Board furniture: prompt boxes, notes and shapes. No beat, no variant, no
       prompt seeding, no idempotency check — every placement is a new object. */
    if (!NODE_TYPES.includes(type)) {
      return NextResponse.json({ error: "Unknown node_type" }, { status: 400 });
    }
    if (!body.project_id) {
      return NextResponse.json({ error: "project_id required" }, { status: 400 });
    }
    const project = db.prepare("SELECT id FROM projects WHERE id = ?").get(body.project_id) as
      | { id: string }
      | undefined;
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    // Bad enum values fall back to the default rather than erroring — a stray
    // tint is not worth losing the director's placement over.
    const tint: StitchTint = TINTS.includes(body.tint as StitchTint) ? (body.tint as StitchTint) : "";
    const shapeKind: StitchShapeKind = SHAPE_KINDS.includes(body.shape_kind as StitchShapeKind)
      ? (body.shape_kind as StitchShapeKind)
      : "rect";

    const furnitureId = nanoid(10);
    db.prepare(
      `INSERT INTO stitch_nodes
         (id, project_id, beat_id, variant_id, x, y, duration, video_prompt, sound_prompt,
          node_type, content, w, h, z, tint, shape_kind)
       VALUES (?, ?, NULL, NULL, ?, ?, 0, '', '', ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      furnitureId,
      body.project_id,
      Number.isFinite(body.x) ? body.x! : 0,
      Number.isFinite(body.y) ? body.y! : 0,
      type,
      typeof body.content === "string" ? body.content.slice(0, 4000) : "",
      clampSize(body.w),
      clampSize(body.h),
      clampZ(body.z),
      tint,
      shapeKind
    );

    return NextResponse.json({
      ok: true,
      node_id: furnitureId,
      action: "created",
      node: boardNode(db, furnitureId)
    });
  }

  let beatRow: { id: string; project_id: string; n: number } | undefined;
  let variantId: string | null = null;

  if (body.variant_id) {
    variantId = body.variant_id;
    beatRow = db
      .prepare(
        `SELECT b.id, b.project_id, b.n
         FROM storyboard_variants v
         INNER JOIN beats b ON b.id = v.beat_id
         WHERE v.id = ?`
      )
      .get(body.variant_id) as { id: string; project_id: string; n: number } | undefined;
    if (!beatRow) return NextResponse.json({ error: "Variant not found" }, { status: 404 });
  } else if (body.beat_id) {
    beatRow = db
      .prepare("SELECT id, project_id, n FROM beats WHERE id = ?")
      .get(body.beat_id) as { id: string; project_id: string; n: number } | undefined;
    if (!beatRow) return NextResponse.json({ error: "Beat not found" }, { status: 404 });
  } else {
    return NextResponse.json({ error: "variant_id or beat_id required" }, { status: 400 });
  }

  const scene = Number.isFinite(body.scene_number)
    ? Math.max(1, Math.floor(body.scene_number!))
    : beatRow.n;
  const duration = typeof body.duration === "number" ? body.duration : 3.0;
  const x = Number.isFinite(body.x) ? body.x! : (scene - 1) * COL_WIDTH + 80;

  // Idempotency: if the same variant is already on stitch, return existing. The
  // board's drawer opts out with allow_duplicate so alternates can sit side by side.
  if (variantId && !body.allow_duplicate) {
    const dup = db
      .prepare("SELECT id FROM stitch_nodes WHERE project_id = ? AND variant_id = ?")
      .get(beatRow.project_id, variantId) as { id: string } | undefined;
    if (dup) {
      return NextResponse.json({
        ok: true,
        node_id: dup.id,
        action: "exists",
        beat_n: beatRow.n,
        scene_number: scene,
        node: boardNode(db, dup.id)
      });
    }
  }

  // Stack multiple cuts of the same beat vertically so they're visually separate.
  const sameBeatCount = db
    .prepare("SELECT COUNT(*) AS n FROM stitch_nodes WHERE project_id = ? AND beat_id = ?")
    .get(beatRow.project_id, beatRow.id) as { n: number };
  const y = Number.isFinite(body.y) ? body.y! : ROW_BASE_Y + sameBeatCount.n * ROW_GAP_Y;

  const videoPrompt =
    typeof body.video_prompt === "string"
      ? body.video_prompt
      : seedVideoPromptFor(db, beatRow.id, variantId);

  const soundPrompt = typeof body.sound_prompt === "string" ? body.sound_prompt : "";

  const id = nanoid(10);
  db.prepare(
    "INSERT INTO stitch_nodes (id, project_id, beat_id, variant_id, x, y, duration, video_prompt, sound_prompt, z) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(id, beatRow.project_id, beatRow.id, variantId, x, y, duration, videoPrompt, soundPrompt, clampZ(body.z));

  return NextResponse.json({
    ok: true,
    node_id: id,
    action: "created",
    beat_n: beatRow.n,
    scene_number: scene,
    node: boardNode(db, id)
  });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const variantId = url.searchParams.get("variant_id");
  const nodeId = url.searchParams.get("node_id");
  const projectId = url.searchParams.get("project_id");
  const deleteAll = url.searchParams.get("all") === "1";
  if (!variantId && !nodeId) {
    return NextResponse.json({ error: "variant_id or node_id required" }, { status: 400 });
  }

  const db = getDb();

  if (nodeId) {
    deleteStitchNode(db, nodeId);
    return NextResponse.json({ ok: true, deleted: 1 });
  }

  /* allow_duplicate lets one variant sit on the board several times, each copy
     with its own hand-edited prompts, duration and place in a chain — and
     transitions cascade off a deleted node. So a by-variant delete that would
     take out more than one copy needs an explicit all=1 opt-in; the caller is
     expected to confirm with the director first. */
  const rows = (
    projectId
      ? db
          .prepare("SELECT id FROM stitch_nodes WHERE variant_id = ? AND project_id = ?")
          .all(variantId, projectId)
      : db.prepare("SELECT id FROM stitch_nodes WHERE variant_id = ?").all(variantId)
  ) as unknown as { id: string }[];

  if (rows.length === 0) return NextResponse.json({ ok: true, deleted: 0 });
  if (rows.length > 1 && !deleteAll) {
    return NextResponse.json(
      { error: "This frame is on the board more than once", count: rows.length, requires_confirm: true },
      { status: 409 }
    );
  }

  /* deleteStitchNode, not a bare row delete: a frame removed from the Storyboard
     has to take its prompt boxes with it exactly like the board's own delete,
     or the director is left with orphan boxes and no frame to re-attach them to. */
  for (const row of rows) deleteStitchNode(db, row.id);
  return NextResponse.json({ ok: true, deleted: rows.length });
}
