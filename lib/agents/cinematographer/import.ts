// Import a Cinematographer shotlist into Direkta.
//
// In the in-house model the Cinematographer reasoning happens in the Claude chat session (the
// cinematographer rule file). This is the persistence side the Direkta MCP server exposes as the
// `import_shotlist` tool: it stores a beat's look-locked coverage as storyboard_variants (one per
// shot, prompt = the 5-layer positive, awaiting generation) and records the look-lock + cast
// identity + dramatic point on the storyboard row. No LLM call. Generation is a later stage.

import { nanoid } from "nanoid";
import { getDb } from "../../db/client";
import { beats } from "../../db/repo";

export interface ShotInput {
  angle: string;
  positive: string;
  negative: string;
  aspect: string;
  seed_identity: string;
}

export interface ShotlistInput {
  look_lock: string;
  cast_identity: string[];
  dramatic_point: string;
  coverage_rationale: string;
  shots: ShotInput[];
}

export interface ShotlistImportResult {
  beat_id: string;
  beat_n: number;
  shots: number;
}

/** Persist a Claude-produced coverage shotlist for one beat. Replaces prior variants for the beat. */
export function importShotlist(projectId: string, beatId: string, payload: ShotlistInput): ShotlistImportResult {
  const beat = beats.get(beatId);
  if (!beat) throw new Error(`Beat not found: ${beatId}`);
  if (beat.project_id !== projectId) throw new Error(`Beat ${beatId} does not belong to project ${projectId}`);

  const db = getDb();

  // Clean re-import: drop prior variants + their assets for this beat.
  db.prepare(
    "DELETE FROM assets WHERE target_kind = 'storyboard_variant' AND target_id IN (SELECT id FROM storyboard_variants WHERE beat_id = ?)"
  ).run(beatId);
  db.prepare("DELETE FROM storyboard_variants WHERE beat_id = ?").run(beatId);

  // One variant per shot — prompt = the 5-layer positive; per-shot extras live in note.
  const insertVariant = db.prepare(
    "INSERT INTO storyboard_variants (id, beat_id, n, prompt, state, asset_id, note) VALUES (?, ?, ?, ?, 'waiting', NULL, ?)"
  );
  const shots = payload.shots ?? [];
  shots.forEach((s, i) => {
    const note = JSON.stringify({
      angle: s.angle,
      negative: s.negative,
      aspect: s.aspect,
      seed_identity: s.seed_identity
    });
    insertVariant.run(nanoid(10), beatId, i + 1, s.positive ?? "", note);
  });

  // Record the look-lock + cast identity + dramatic point on the row.
  const style = JSON.stringify({
    look_lock: payload.look_lock ?? "",
    cast_identity: payload.cast_identity ?? [],
    dramatic_point: payload.dramatic_point ?? "",
    coverage_rationale: payload.coverage_rationale ?? ""
  });
  db.prepare(
    "INSERT INTO storyboard_rows (beat_id, state, selected_variant_id, style) VALUES (?, 'complete', NULL, ?) " +
      "ON CONFLICT(beat_id) DO UPDATE SET state = 'complete', style = excluded.style, updated_at = datetime('now')"
  ).run(beatId, style);

  return { beat_id: beatId, beat_n: beat.n, shots: shots.length };
}
