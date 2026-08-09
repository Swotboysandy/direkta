import { NextResponse } from "next/server";
import { getDb } from "../../../../../lib/db/client";
import { deleteStitchNode } from "../../../../../lib/db/stitch";
import { SHAPE_KINDS, TINTS, type StitchShapeKind, type StitchTint } from "../../../../../lib/stitch/nodeTypes";

export const dynamic = "force-dynamic";

const COL_WIDTH = 280;

interface PatchBody {
  x?: number;
  y?: number;
  duration?: number;
  trim_start?: number;
  scene_number?: number;
  /** Legacy seed carriers — kept writable for duplicate + future importers, not live UI state. */
  video_prompt?: string;
  sound_prompt?: string;
  content?: string;
  w?: number;
  h?: number;
  /** Paint order within the node's CSS band — bring-to-front / send-to-back. */
  z?: number;
  tint?: string;
  shape_kind?: string;
}

/**
 * node_type is deliberately absent from the whitelist and is immutable: edge
 * kind is inferred from endpoint types (lib/stitch/nodeTypes.ts), so a type
 * change would silently reclassify every edge already touching this node.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as PatchBody;
  const db = getDb();

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (typeof body.x === "number") {
    fields.push("x = ?");
    values.push(body.x);
  }
  if (typeof body.y === "number") {
    fields.push("y = ?");
    values.push(body.y);
  }
  if (typeof body.duration === "number") {
    fields.push("duration = ?");
    values.push(body.duration);
  }
  if (typeof body.trim_start === "number") {
    fields.push("trim_start = ?");
    values.push(Math.max(0, body.trim_start));
  }
  if (typeof body.video_prompt === "string") {
    fields.push("video_prompt = ?");
    values.push(body.video_prompt.slice(0, 4000));
  }
  if (typeof body.sound_prompt === "string") {
    fields.push("sound_prompt = ?");
    values.push(body.sound_prompt.slice(0, 4000));
  }
  if (typeof body.content === "string") {
    fields.push("content = ?");
    values.push(body.content.slice(0, 4000));
  }
  if (typeof body.w === "number" && Number.isFinite(body.w)) {
    fields.push("w = ?");
    values.push(Math.min(4000, Math.max(0, body.w)));
  }
  if (typeof body.h === "number" && Number.isFinite(body.h)) {
    fields.push("h = ?");
    values.push(Math.min(4000, Math.max(0, body.h)));
  }
  if (typeof body.z === "number" && Number.isFinite(body.z)) {
    fields.push("z = ?");
    values.push(Math.min(1e6, Math.max(-1e6, body.z)));
  }
  // Unknown enum values are skipped, not defaulted — a bad tint must never
  // silently reset a swatch the director already picked.
  if (typeof body.tint === "string" && TINTS.includes(body.tint as StitchTint)) {
    fields.push("tint = ?");
    values.push(body.tint);
  }
  if (typeof body.shape_kind === "string" && SHAPE_KINDS.includes(body.shape_kind as StitchShapeKind)) {
    fields.push("shape_kind = ?");
    values.push(body.shape_kind);
  }
  if (Number.isFinite(body.scene_number)) {
    // Scene number snaps the node's x position into the right column.
    const scene = Math.max(1, Math.floor(body.scene_number!));
    fields.push("x = ?");
    values.push((scene - 1) * COL_WIDTH + 80);
  }

  if (!fields.length) return NextResponse.json({ ok: true });

  values.push(id);
  db.prepare(`UPDATE stitch_nodes SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Cascade lives in lib/db/stitch.ts so this and the by-variant delete in
  // /api/stitch/nodes can never disagree about what "remove" means.
  deleteStitchNode(getDb(), id);
  return NextResponse.json({ ok: true });
}
