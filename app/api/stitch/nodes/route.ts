import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getDb } from "../../../../lib/db/client";

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
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as AddNodeBody;
  const db = getDb();

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
  const x = (scene - 1) * COL_WIDTH + 80;

  // Idempotency: if the same variant is already on stitch, return existing.
  if (variantId) {
    const dup = db
      .prepare("SELECT id FROM stitch_nodes WHERE project_id = ? AND variant_id = ?")
      .get(beatRow.project_id, variantId) as { id: string } | undefined;
    if (dup) {
      return NextResponse.json({
        ok: true,
        node_id: dup.id,
        action: "exists",
        beat_n: beatRow.n,
        scene_number: scene
      });
    }
  }

  // Stack multiple cuts of the same beat vertically so they're visually separate.
  const sameBeatCount = db
    .prepare("SELECT COUNT(*) AS n FROM stitch_nodes WHERE project_id = ? AND beat_id = ?")
    .get(beatRow.project_id, beatRow.id) as { n: number };
  const y = ROW_BASE_Y + sameBeatCount.n * ROW_GAP_Y;

  const id = nanoid(10);
  db.prepare(
    "INSERT INTO stitch_nodes (id, project_id, beat_id, variant_id, x, y, duration) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(id, beatRow.project_id, beatRow.id, variantId, x, y, duration);

  return NextResponse.json({
    ok: true,
    node_id: id,
    action: "created",
    beat_n: beatRow.n,
    scene_number: scene
  });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const variantId = url.searchParams.get("variant_id");
  const nodeId = url.searchParams.get("node_id");
  if (!variantId && !nodeId) {
    return NextResponse.json({ error: "variant_id or node_id required" }, { status: 400 });
  }

  const db = getDb();
  if (nodeId) {
    db.prepare("DELETE FROM stitch_nodes WHERE id = ?").run(nodeId);
  } else if (variantId) {
    db.prepare("DELETE FROM stitch_nodes WHERE variant_id = ?").run(variantId);
  }
  return NextResponse.json({ ok: true });
}
