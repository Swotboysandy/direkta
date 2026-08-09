/**
 * Server-side seed for a scene node's video prompt.
 *
 * Ports the fallback chain from Storyboard's `defaultPromptFor`. Note that
 * Storyboard's `GlobalStyle` (visual / light / temp / aspect defaults chosen in
 * the workspace header) is React state that is never persisted, so the server
 * cannot reproduce the director's global picks — it falls back to the same
 * literal defaults the beat editor starts from.
 *
 * The seeded prompt is only a starting point: once the director edits it on the
 * node it lives in `stitch_nodes.video_prompt` and is never re-derived.
 */

export interface SeedStyle {
  shot_size?: string;
  lens?: string;
  movement?: string;
  visual?: string;
  light?: string;
  temp?: string;
  aspect?: string;
}

export interface SeedBeat {
  scene_heading: string;
  title: string;
  characters: string[];
  mood: string[];
}

export function seedVideoPrompt(input: {
  variantPrompt: string | null;
  promptOverride: string | null;
  beat: SeedBeat | null;
  style: SeedStyle;
}): string {
  const variant = input.variantPrompt?.trim();
  if (variant) return variant;

  const override = input.promptOverride?.trim();
  if (override) return override;

  const beat = input.beat;
  if (!beat) return "";

  const s = input.style;
  const shot = s.shot_size ?? "Wide";
  const lens = s.lens ?? "35mm";
  const movement = s.movement ?? "Locked";
  const visual = s.visual ?? "Naturalistic";
  const light = s.light ?? "Natural";
  const temp = s.temp ?? "Neutral";
  const aspect = s.aspect ?? "16:9";

  return `${shot} shot, ${lens}, ${movement.toLowerCase()} camera. ${beat.scene_heading}. ${beat.title}. ${
    beat.characters.length ? `Featuring ${beat.characters.join(", ")}. ` : ""
  }${beat.mood.length ? `Mood: ${beat.mood.join(", ")}. ` : ""}${visual} aesthetic, ${light.toLowerCase()} lighting, ${temp.toLowerCase()} palette. Aspect ${aspect}.`;
}
