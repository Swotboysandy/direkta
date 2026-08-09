import type { DatabaseSync } from "node:sqlite";
import type { StitchNodeType, StitchShapeKind, StitchTint } from "../stitch/nodeTypes";
import { safeList } from "../stitch/seed";
import type { StitchBoardNode, StitchGenState } from "../types";

/**
 * The board-node JOIN. Shared by GET /api/projects/[id]/stitch,
 * POST /api/stitch/nodes and POST /api/stitch/nodes/[id]/duplicate so the
 * three of them can never drift apart.
 *
 * Plus `deleteStitchNode` — the one delete cascade, shared by both routes that
 * remove a node (DELETE /api/stitch/nodes/[id] and the by-variant / by-node_id
 * DELETE /api/stitch/nodes).
 */

export interface BoardNodeRow {
  id: string;
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
  beat_n: number | null;
  beat_title: string | null;
  beat_scene: string | null;
  beat_chars: string | null;
  beat_loc: string | null;
  variant_n: number | null;
  variant_url: string | null;
  /* Generation state (image→video, dialogue upload, lip sync). Owned by the
     /api/stitch/nodes/[id]/{animate,dialogue,lipsync,upload-clip} routes; the
     board only reads it. */
  trim_start: number | null;
  clip_state: string | null;
  clip_url: string | null;
  dialogue_audio_url: string | null;
  lipsync_state: string | null;
  lipsync_url: string | null;
}

/* A node prefers its own pinned variant's frame; legacy nodes with variant_id
   IS NULL fall back to the beat row's selected variant.

   The frames are scalar subqueries, not LEFT JOINs: nothing constrains assets to
   one row per (target_kind, target_id), and a joined second asset row would fan
   the node out into duplicates — duplicate React keys on the board, doubled
   placed-count badges. Newest row wins. */
const BOARD_NODE_SELECT = `
  SELECT sn.id, sn.beat_id, sn.variant_id, sn.x, sn.y, sn.duration,
         sn.video_prompt, sn.sound_prompt,
         sn.node_type, sn.content, sn.w, sn.h, sn.z, sn.tint, sn.shape_kind,
         b.n AS beat_n, b.title AS beat_title, b.scene_heading AS beat_scene,
         b.characters AS beat_chars, b.location_id AS beat_loc,
         v.n AS variant_n,
         COALESCE(
           (SELECT a.url FROM assets a
             WHERE a.target_kind = 'storyboard_variant' AND a.target_id = sn.variant_id
             ORDER BY a.created_at DESC, a.rowid DESC LIMIT 1),
           (SELECT a.url FROM assets a
             WHERE a.target_kind = 'storyboard_variant' AND a.target_id = sr.selected_variant_id
             ORDER BY a.created_at DESC, a.rowid DESC LIMIT 1)
         ) AS variant_url,
         sn.trim_start, sn.clip_state, sn.dialogue_audio_url, sn.lipsync_state,
         a_clip.url AS clip_url, a_lipsync.url AS lipsync_url
  FROM stitch_nodes sn
  LEFT JOIN beats b               ON b.id = sn.beat_id
  LEFT JOIN storyboard_rows sr    ON sr.beat_id = sn.beat_id
  LEFT JOIN storyboard_variants v ON v.id = sn.variant_id
  /* Safe as joins, unlike the variant frames above: both match assets.id, the
     primary key, so neither can fan a node row out into duplicates. */
  LEFT JOIN assets a_clip         ON a_clip.id = sn.clip_asset_id
  LEFT JOIN assets a_lipsync      ON a_lipsync.id = sn.lipsync_asset_id
`;

export function mapBoardNode(r: BoardNodeRow): StitchBoardNode {
  return {
    id: r.id,
    beat_id: r.beat_id,
    variant_id: r.variant_id,
    variant_n: r.variant_n,
    x: r.x,
    y: r.y,
    duration: r.duration,
    video_prompt: r.video_prompt ?? "",
    sound_prompt: r.sound_prompt ?? "",
    node_type: (r.node_type ?? "frame") as StitchNodeType,
    content: r.content ?? "",
    w: r.w ?? 0,
    h: r.h ?? 0,
    z: r.z ?? 0,
    tint: (r.tint ?? "") as StitchTint,
    shape_kind: (r.shape_kind ?? "rect") as StitchShapeKind,
    beat: r.beat_id
      ? {
          n: r.beat_n,
          title: r.beat_title,
          scene_heading: r.beat_scene,
          /* safeList, not a bare JSON.parse: one malformed beats.characters row
             would throw here and take the whole board GET down with it. */
          characters: safeList(r.beat_chars),
          location_id: r.beat_loc
        }
      : null,
    frame_url: r.variant_url,
    trim_start: r.trim_start ?? 0,
    clip_state: (r.clip_state ?? "none") as StitchGenState,
    clip_url: r.clip_url,
    dialogue_audio_url: r.dialogue_audio_url,
    lipsync_state: (r.lipsync_state ?? "none") as StitchGenState,
    lipsync_url: r.lipsync_url
  };
}

export function boardNodes(db: DatabaseSync, projectId: string): StitchBoardNode[] {
  const rows = db
    .prepare(`${BOARD_NODE_SELECT} WHERE sn.project_id = ? ORDER BY sn.z ASC, sn.x ASC, sn.y ASC`)
    .all(projectId) as unknown as BoardNodeRow[];
  return rows.map(mapBoardNode);
}

export function boardNode(db: DatabaseSync, nodeId: string): StitchBoardNode | null {
  const row = db.prepare(`${BOARD_NODE_SELECT} WHERE sn.id = ?`).get(nodeId) as
    | unknown
    | undefined;
  return row ? mapBoardNode(row as BoardNodeRow) : null;
}

/**
 * Removes a node plus everything that only existed because of it: its attached
 * prompt boxes, every transition touching any of them, and the project's
 * active-head pointer if it named the node.
 *
 * A prompt box belongs to exactly one frame, so dropping the frame has to take
 * its boxes with it — otherwise they are stranded on the board unattached and
 * unlabelled, and `POST /api/transitions` refuses to re-attach an already
 * attached box. Notes and shapes are free-standing furniture and never cascade.
 *
 * Both delete entry points call this, so "remove from Stitch" in Storyboard and
 * "remove from board" in Stitch can never mean two different things.
 */
export function deleteStitchNode(db: DatabaseSync, nodeId: string): void {
  const row = db.prepare("SELECT node_type FROM stitch_nodes WHERE id = ?").get(nodeId) as
    | { node_type: string | null }
    | undefined;

  if ((row?.node_type ?? "frame") === "frame") {
    // Runs before the transitions delete below, because it reads them.
    const attached = db
      .prepare(
        `SELECT id FROM stitch_nodes
          WHERE node_type IN ('video_prompt','sound_prompt','dialogue_prompt')
            AND id IN (SELECT to_node_id FROM transitions WHERE from_node_id = ?)`
      )
      .all(nodeId) as unknown as { id: string }[];
    for (const p of attached) {
      // A prompt box can also carry loose link edges; clear those too.
      db.prepare("DELETE FROM transitions WHERE from_node_id = ? OR to_node_id = ?").run(p.id, p.id);
      db.prepare("DELETE FROM stitch_nodes WHERE id = ?").run(p.id);
    }
  }

  db.prepare("DELETE FROM transitions WHERE from_node_id = ? OR to_node_id = ?").run(nodeId, nodeId);
  db.prepare("DELETE FROM stitch_nodes WHERE id = ?").run(nodeId);
  /* projects.stitch_active_head is a bare node id with no FK, so without this it
     keeps pointing at a dead node forever. The UI silently falls back to the
     topmost chain, but a server-side export reading the column would disagree. */
  db.prepare("UPDATE projects SET stitch_active_head = NULL WHERE stitch_active_head = ?").run(nodeId);
}
