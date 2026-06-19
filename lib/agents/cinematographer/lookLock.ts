// Look-lock + cast-identity builders.
//
// Deterministic, derived from the Movie Bible the Screenplay Agent produced. The look-lock is
// the single block composed byte-identically into every prompt; the cast-identity lines are the
// verbatim descriptors the Cinematographer holds for each character. Together they are what make
// a whole film's frames feel like one eye shot them.

import type { Bible, Character } from "../../types";

/** Compose the sacred look-lock block from the Bible's visual language. */
export function buildLookLock(bible: Bible | null): string {
  if (!bible) return "";
  const parts: string[] = [];
  if (bible.visual_palette?.length)
    parts.push(`Palette: ${bible.visual_palette.map((s) => `${s.name} ${s.hex}`).join(", ")}.`);
  if (bible.lighting_philosophy?.trim()) parts.push(`Lighting: ${bible.lighting_philosophy.trim()}.`);
  if (bible.cinematography_notes?.trim()) parts.push(`Lens/camera: ${bible.cinematography_notes.trim()}.`);
  if (bible.editorial_rhythm?.trim()) parts.push(`Editorial: ${bible.editorial_rhythm.trim()}.`);
  if (bible.visual_motifs?.length) parts.push(`Motifs: ${bible.visual_motifs.join(", ")}.`);
  return parts.join(" ");
}

/** Verbatim identity descriptors for the cast — optionally filtered to the names present in a beat. */
export function castIdentityLines(chars: Character[], names?: string[]): string[] {
  const want = names ? new Set(names.map((n) => n.trim().toLowerCase())) : null;
  return chars
    .filter((c) => !want || want.has(c.name.trim().toLowerCase()))
    .map(
      (c) =>
        `${c.name} — ${c.identity_descriptor?.trim() || "(no identity descriptor in the Bible)"}` +
        (c.wardrobe_direction?.trim() ? `; wardrobe: ${c.wardrobe_direction.trim()}` : "")
    );
}
