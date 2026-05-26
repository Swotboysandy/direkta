import { NextResponse } from "next/server";
import { getDb } from "../../../../../lib/db/client";

export const dynamic = "force-dynamic";

const COL_WIDTH = 280;

interface PatchBody {
  x?: number;
  y?: number;
  duration?: number;
  scene_number?: number;
}

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
  const db = getDb();
  // Drop any transitions that reference this node first, then the node itself.
  db.prepare("DELETE FROM transitions WHERE from_node_id = ? OR to_node_id = ?").run(id, id);
  db.prepare("DELETE FROM stitch_nodes WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
