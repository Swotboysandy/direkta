// Generation read/write for the Higgsfield Operator stage.
//
// In the in-house model the Operator runs in the Claude chat session: it reads a beat's shotlist
// (the Cinematographer's prompts), calls a creative-generation MCP (image/video) to render each
// shot, then imports the resulting asset back onto its variant. These are the read + persistence
// halves the Direkta MCP server exposes (get_shotlist / import_generation). No API keys — the
// actual generation is an MCP tool Claude drives.

import { nanoid } from "nanoid";
import { getDb } from "../../db/client";

export interface ShotRow {
  variant_id: string;
  beat_id: string;
  beat_n: number;
  scene_heading: string;
  beat_title: string;
  n: number;
  prompt: string;
  state: string;
  angle: string | null;
  negative: string | null;
  aspect: string | null;
  seed_identity: string | null;
  asset_url: string | null;
}

type Raw = {
  id: string;
  beat_id: string;
  beat_n: number;
  scene_heading: string;
  beat_title: string;
  n: number;
  prompt: string;
  state: string;
  note: string | null;
  asset_url: string | null;
};

/** Read the coverage shots for a project (optionally one beat) — the prompts to generate from. */
export function getShotlist(projectId: string, beatId?: string): ShotRow[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT v.id, v.beat_id, b.n AS beat_n, b.scene_heading, b.title AS beat_title,
              v.n, v.prompt, v.state, v.note, a.url AS asset_url
       FROM storyboard_variants v
       JOIN beats b ON b.id = v.beat_id
       LEFT JOIN assets a ON a.id = v.asset_id
       WHERE b.project_id = ?${beatId ? " AND v.beat_id = ?" : ""}
       ORDER BY b.n ASC, v.n ASC`
    )
    .all(...(beatId ? [projectId, beatId] : [projectId])) as Raw[];

  return rows.map((r) => {
    let note: Record<string, unknown> = {};
    try {
      note = r.note ? JSON.parse(r.note) : {};
    } catch {
      note = {};
    }
    return {
      variant_id: r.id,
      beat_id: r.beat_id,
      beat_n: r.beat_n,
      scene_heading: r.scene_heading,
      beat_title: r.beat_title,
      n: r.n,
      prompt: r.prompt,
      state: r.state,
      angle: (note.angle as string) ?? null,
      negative: (note.negative as string) ?? null,
      aspect: (note.aspect as string) ?? null,
      seed_identity: (note.seed_identity as string) ?? null,
      asset_url: r.asset_url
    };
  });
}

export interface ImportGenerationResult {
  variant_id: string;
  asset_id: string;
  url: string;
}

/** Attach a generated frame (from a creative MCP) to a storyboard variant and mark it complete. */
export function importGeneration(
  variantId: string,
  input: { url: string; prompt?: string; model?: string }
): ImportGenerationResult {
  const db = getDb();
  const variant = db.prepare("SELECT id FROM storyboard_variants WHERE id = ?").get(variantId) as
    | { id: string }
    | undefined;
  if (!variant) throw new Error(`Variant not found: ${variantId}`);

  const assetId = nanoid(10);
  db.prepare(
    "INSERT INTO assets (id, target_kind, target_id, kind, url, prompt, vendor_id, meta) VALUES (?, 'storyboard_variant', ?, 'image', ?, ?, NULL, ?)"
  ).run(assetId, variantId, input.url, input.prompt ?? "", JSON.stringify({ model: input.model ?? null, source: "mcp" }));
  db.prepare("UPDATE storyboard_variants SET state = 'complete', asset_id = ? WHERE id = ?").run(assetId, variantId);

  return { variant_id: variantId, asset_id: assetId, url: input.url };
}
