import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getDb } from "../../../../../lib/db/client";

export const dynamic = "force-dynamic";

/** Start a shot from a typed prompt instead of from the storyboard.
 *
 *  Every shot until now had to originate at a beat: POST /api/stitch/nodes
 *  requires a beat or variant id, because the pipeline runs
 *  screenplay → beats → storyboard → stitch. The composer inverts that — you
 *  describe a shot and it exists — so it needs a node with no beat behind it.
 *  The schema already permits that (stitch_nodes.beat_id is nullable); nothing
 *  had ever created one.
 *
 *  This only creates the shot. The client then calls the existing animate route
 *  with the prompt and its references, so there is one generation path rather
 *  than a second copy of it living here.
 */

const COL_WIDTH = 280;
/** Composed shots sit on their own row, below the storyboard-derived ones, so
 *  they do not land on top of the sequence the board established. */
const COMPOSED_ROW_Y = 620;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { prompt?: string; duration?: number } | null;

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Expected an object request body." }, { status: 400 });
  }
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) {
    return NextResponse.json({ error: "A shot needs a description." }, { status: 400 });
  }
  if (prompt.length > 4000) {
    return NextResponse.json({ error: "That description is too long for one shot." }, { status: 400 });
  }

  const duration = typeof body.duration === "number" && Number.isFinite(body.duration) ? body.duration : 5;
  if (duration <= 0 || duration > 15) {
    return NextResponse.json({ error: "Shot duration must be between 0 and 15 seconds." }, { status: 400 });
  }

  const db = getDb();
  const project = db.prepare("SELECT id FROM projects WHERE id = ?").get(id) as { id: string } | undefined;
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

  // Place it after whatever composed shots already exist, so a run of prompts
  // reads left to right instead of stacking on one spot.
  const placed = db
    .prepare("SELECT COUNT(*) AS n FROM stitch_nodes WHERE project_id = ? AND beat_id IS NULL")
    .get(id) as { n: number };

  const nodeId = nanoid(12);
  db.prepare(
    `INSERT INTO stitch_nodes (id, project_id, beat_id, x, y, duration, direction)
     VALUES (?, ?, NULL, ?, ?, ?, ?)`
  ).run(nodeId, id, (placed.n + 1) * COL_WIDTH, COMPOSED_ROW_Y, duration, prompt);

  return NextResponse.json({ ok: true, node_id: nodeId, duration });
}
