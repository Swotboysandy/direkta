import type { DatabaseSync } from "node:sqlite";
import { seedVideoPrompt, type SeedStyle } from "./prompt";

/**
 * The DB-side half of the video-prompt seed: reads the beat, its storyboard row
 * style and the pinned variant's prompt, then hands them to the pure
 * `seedVideoPrompt`. Shared by POST /api/stitch/nodes (frame creation) and
 * POST /api/stitch/nodes/[id]/prompts (quick-add) so the two can never drift.
 */

interface SeedRow {
  variant_prompt: string | null;
  row_style: string | null;
  scene_heading: string;
  title: string;
  characters: string;
  mood: string;
}

export function seedVideoPromptFor(
  db: DatabaseSync,
  beatId: string,
  variantId: string | null
): string {
  const seed = db
    .prepare(
      `SELECT v.prompt AS variant_prompt, sr.style AS row_style,
              b.scene_heading, b.title, b.characters, b.mood
       FROM beats b
       LEFT JOIN storyboard_rows sr ON sr.beat_id = b.id
       LEFT JOIN storyboard_variants v ON v.id = ?
       WHERE b.id = ?`
    )
    .get(variantId, beatId) as unknown as SeedRow | undefined;

  let style: SeedStyle = {};
  let promptOverride: string | null = null;
  if (seed?.row_style) {
    try {
      const parsed = JSON.parse(seed.row_style) as SeedStyle & { prompt_override?: string };
      style = parsed;
      promptOverride = parsed.prompt_override ?? null;
    } catch {
      // Malformed style JSON — fall back to the literal defaults.
    }
  }

  return seedVideoPrompt({
    variantPrompt: seed?.variant_prompt ?? null,
    promptOverride,
    beat: seed
      ? {
          scene_heading: seed.scene_heading,
          title: seed.title,
          characters: safeList(seed.characters),
          mood: safeList(seed.mood)
        }
      : null,
    style
  });
}

export function safeList(json: string | null): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}
