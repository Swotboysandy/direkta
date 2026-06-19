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
  asset_url: string | null;
};

type ShotMeta = { n: number; angle?: string; negative?: string; aspect?: string; seed_identity?: string };

/** Read the coverage shots for a project (optionally one beat) — the prompts to generate from.
 *  Per-shot metadata (angle/negative/aspect/seed) is read from the row style, where import_shotlist
 *  records it — variant.note is reserved for the director's review note. */
export function getShotlist(projectId: string, beatId?: string): ShotRow[] {
  const db = getDb();

  // Map beat_id -> (variant n -> shot metadata) from the row style.
  const rows = db
    .prepare(
      `SELECT sr.beat_id, sr.style FROM storyboard_rows sr
       JOIN beats b ON b.id = sr.beat_id
       WHERE b.project_id = ?${beatId ? " AND sr.beat_id = ?" : ""}`
    )
    .all(...(beatId ? [projectId, beatId] : [projectId])) as Array<{ beat_id: string; style: string }>;
  const metaByBeat = new Map<string, Map<number, ShotMeta>>();
  for (const r of rows) {
    let shots: ShotMeta[] = [];
    try {
      shots = (r.style ? JSON.parse(r.style).shots : []) ?? [];
    } catch {
      shots = [];
    }
    metaByBeat.set(r.beat_id, new Map(shots.map((s) => [s.n, s])));
  }

  const variants = db
    .prepare(
      `SELECT v.id, v.beat_id, b.n AS beat_n, b.scene_heading, b.title AS beat_title,
              v.n, v.prompt, v.state, a.url AS asset_url
       FROM storyboard_variants v
       JOIN beats b ON b.id = v.beat_id
       LEFT JOIN assets a ON a.id = v.asset_id
       WHERE b.project_id = ?${beatId ? " AND v.beat_id = ?" : ""}
       ORDER BY b.n ASC, v.n ASC`
    )
    .all(...(beatId ? [projectId, beatId] : [projectId])) as Raw[];

  return variants.map((r) => {
    const meta = metaByBeat.get(r.beat_id)?.get(r.n);
    return {
      variant_id: r.id,
      beat_id: r.beat_id,
      beat_n: r.beat_n,
      scene_heading: r.scene_heading,
      beat_title: r.beat_title,
      n: r.n,
      prompt: r.prompt,
      state: r.state,
      angle: meta?.angle ?? null,
      negative: meta?.negative ?? null,
      aspect: meta?.aspect ?? null,
      seed_identity: meta?.seed_identity ?? null,
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
