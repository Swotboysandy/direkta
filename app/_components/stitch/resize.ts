import type { StitchNodeType } from "../../../lib/stitch/nodeTypes";
import { SHAPE_MIN, type Box, frameHeightFor } from "./nodeGeometry";

/**
 * The shared resize system: which handles a type offers, how small it may get,
 * and what one handle drag does to a box. Pure module — no React, no DOM.
 */

export type Handle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

export const CORNERS: Handle[] = ["nw", "ne", "se", "sw"];
export const ALL8: Handle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

const MAX = 4000;

export const MIN: Record<StitchNodeType, { w: number; h: number }> = {
  // A frame's height is derived from its width, so only w matters here.
  frame: { w: 180, h: frameHeightFor(180) },
  video_prompt: { w: 200, h: 120 },
  sound_prompt: { w: 200, h: 120 },
  dialogue_prompt: { w: 200, h: 120 },
  note: { w: 120, h: 120 },
  shape: { w: SHAPE_MIN, h: SHAPE_MIN }
};

/* Frames and prompt boxes keep corners only: an edge handle on a frame would
   promise independent width and height, and its image area cannot deliver it. */
export const HANDLES: Record<StitchNodeType, Handle[]> = {
  frame: CORNERS,
  video_prompt: CORNERS,
  sound_prompt: CORNERS,
  dialogue_prompt: CORNERS,
  note: ALL8,
  shape: ALL8
};

export const CURSORS: Record<Handle, string> = {
  nw: "nwse-resize",
  n: "ns-resize",
  ne: "nesw-resize",
  e: "ew-resize",
  se: "nwse-resize",
  s: "ns-resize",
  sw: "nesw-resize",
  w: "ew-resize"
};

/**
 * Move the dragged edge(s) to the pointer, hold the opposite edge fixed, then
 * clamp. `nw` / `n` / `w` therefore move x/y as well as w/h.
 *
 * A frame is 1-DOF: the width the handle asks for wins and the height follows
 * from the 16:9 image area, so the card can never be squashed out of ratio.
 */
export function applyHandle(
  type: StitchNodeType,
  start: Box,
  handle: Handle,
  world: { x: number; y: number }
): Box {
  const min = MIN[type] ?? MIN.frame;
  let { x, y, w, h } = start;
  const right = start.x + start.w;
  const bottom = start.y + start.h;

  if (handle.includes("e")) w = world.x - start.x;
  if (handle.includes("w")) {
    w = right - world.x;
    x = world.x;
  }
  if (handle.includes("s")) h = world.y - start.y;
  if (handle.includes("n")) {
    h = bottom - world.y;
    y = world.y;
  }

  w = Math.min(MAX, Math.max(min.w, Math.round(w)));
  h = Math.min(MAX, Math.max(min.h, Math.round(h)));
  if (type === "frame") h = frameHeightFor(w);

  // Re-pin the fixed edge after clamping, so a min-size hit doesn't drift the box.
  if (handle.includes("w")) x = right - w;
  else x = start.x;
  if (handle.includes("n")) y = bottom - h;
  else y = start.y;

  return { x: Math.round(x), y: Math.round(y), w, h };
}
