import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getDb } from "../../../../../../lib/db/client";
import { boardNode } from "../../../../../../lib/db/stitch";

export const dynamic = "force-dynamic";

interface SourceRow {
  project_id: string;
  beat_id: string | null;
  variant_id: string | null;
  x: number;
  y: number;
  duration: number;
  video_prompt: string | null;
  sound_prompt: string | null;
  node_type: string | null;
  content: string | null;
  w: number | null;
  h: number | null;
  z: number | null;
  tint: string | null;
  shape_kind: string | null;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { dx?: number; dy?: number };
  const db = getDb();

  const src = db
    .prepare(
      `SELECT project_id, beat_id, variant_id, x, y, duration, video_prompt, sound_prompt,
              node_type, content, w, h, z, tint, shape_kind
       FROM stitch_nodes WHERE id = ?`
    )
    .get(id) as unknown as SourceRow | undefined;
  if (!src) return NextResponse.json({ error: "Node not found" }, { status: 404 });

  const dx = Number.isFinite(body.dx) ? body.dx! : 40;
  const dy = Number.isFinite(body.dy) ? body.dy! : 40;

  /* Transitions are deliberately not copied — a duplicate starts loose so the
     director can wire it into an alternate chain. That also means a duplicated
     frame arrives without prompt boxes, and a duplicated prompt box arrives
     detached, ready to attach somewhere else. */
  const newId = nanoid(10);
  db.prepare(
    `INSERT INTO stitch_nodes
       (id, project_id, beat_id, variant_id, x, y, duration, video_prompt, sound_prompt,
        node_type, content, w, h, z, tint, shape_kind)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    newId,
    src.project_id,
    src.beat_id,
    src.variant_id,
    src.x + dx,
    src.y + dy,
    src.duration,
    src.video_prompt ?? "",
    src.sound_prompt ?? "",
    src.node_type ?? "frame",
    src.content ?? "",
    src.w ?? 0,
    src.h ?? 0,
    src.z ?? 0,
    src.tint ?? "",
    src.shape_kind ?? "rect"
  );

  return NextResponse.json({ ok: true, node: boardNode(db, newId) }, { status: 201 });
}
