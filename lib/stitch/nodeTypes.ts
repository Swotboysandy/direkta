/**
 * The Stitch board's node vocabulary.
 *
 * Imported by both the client components and the API routes so classification
 * can never fork between the two. Pure module: no imports, no React, no DB.
 */

export type StitchNodeType =
  | "frame"
  | "video_prompt"
  | "sound_prompt"
  | "dialogue_prompt"
  | "note"
  | "shape";

export const NODE_TYPES: StitchNodeType[] = [
  "frame",
  "video_prompt",
  "sound_prompt",
  "dialogue_prompt",
  "note",
  "shape"
];

export const PROMPT_TYPES = ["video_prompt", "sound_prompt", "dialogue_prompt"] as const;

export type StitchPromptType = (typeof PROMPT_TYPES)[number];

/** Token *keys*, never colours — CSS resolves them to --tint-* on .stitch-shell. */
export type StitchTint = "" | "cream" | "tomato" | "mustard" | "viridian" | "cocoa";

export const TINTS: StitchTint[] = ["", "cream", "tomato", "mustard", "viridian", "cocoa"];

export type StitchShapeKind = "rect" | "ellipse";

export const SHAPE_KINDS: StitchShapeKind[] = ["rect", "ellipse"];

export function isFrame(t: StitchNodeType): boolean {
  return t === "frame";
}

export function isPrompt(t: StitchNodeType): t is StitchPromptType {
  return t === "video_prompt" || t === "sound_prompt" || t === "dialogue_prompt";
}

/** Edge classification — inferred from endpoint types, never stored. */
export type EdgeKind = "chain" | "attach" | "link";

/**
 * frame → frame    = a cut. The only edge that contributes to the cut order.
 * frame ↔ prompt   = an attachment. The prompt box belongs to that frame.
 * anything else    = a free connector, purely visual.
 */
export function edgeKind(from: StitchNodeType, to: StitchNodeType): EdgeKind {
  if (isFrame(from) && isFrame(to)) return "chain";
  if ((isFrame(from) && isPrompt(to)) || (isPrompt(from) && isFrame(to))) return "attach";
  return "link";
}
