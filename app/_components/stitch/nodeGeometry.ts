import type { StitchNodeType } from "../../../lib/stitch/nodeTypes";

/**
 * Board geometry — the single source of truth for per-type size. Everything
 * that draws an edge, centres a drop or frames the board reads it from here;
 * nothing hard-codes a card size any more.
 *
 * v3 dropped the four fixed port anchors (chainOut/chainIn/attachOut/attachIn):
 * connectors now leave from whichever side faces the other node, computed in
 * edgeGeometry.ts from the box alone.
 */

export interface NodeBox {
  w: number;
  h: number;
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Header 30 + a 16:9 image + a 36px foot. Keep in step with globals.css. */
export const FRAME_HEAD = 30;
export const FRAME_FOOT = 36;
export const FRAME_W = 260;
export const FRAME_H = 212;

export const PROMPT_W = 280;
export const PROMPT_H = 148;

export const NOTE_W = 200;
export const NOTE_H = 200;

export const SHAPE_W = 280;
export const SHAPE_H = 200;
export const SHAPE_MIN = 60;

const DEFAULTS: Record<StitchNodeType, NodeBox> = {
  frame: { w: FRAME_W, h: FRAME_H },
  video_prompt: { w: PROMPT_W, h: PROMPT_H },
  sound_prompt: { w: PROMPT_W, h: PROMPT_H },
  dialogue_prompt: { w: PROMPT_W, h: PROMPT_H },
  note: { w: NOTE_W, h: NOTE_H },
  shape: { w: SHAPE_W, h: SHAPE_H }
};

export interface GeomNode {
  node_type: StitchNodeType;
  w: number;
  h: number;
  x: number;
  y: number;
}

/**
 * A frame's image area is locked to 16:9 between a fixed header and foot, so a
 * frame resize is 1-DOF: width drives height. FRAME_W (260) → FRAME_H (212)
 * falls straight out of this, which is why no existing frame shifts.
 */
export function frameHeightFor(w: number): number {
  return FRAME_HEAD + Math.round((w * 9) / 16) + FRAME_FOOT;
}

/** w/h of 0 means "use the type default" — that is what made the v2 migration free. */
export function nodeBox(n: { node_type: StitchNodeType; w: number; h: number }): NodeBox {
  const def = DEFAULTS[n.node_type] ?? DEFAULTS.frame;
  const w = n.w > 0 ? n.w : def.w;
  // A frame's height is never stored independently — it always follows its width.
  const h = n.node_type === "frame" ? frameHeightFor(w) : n.h > 0 ? n.h : def.h;
  return { w, h };
}

/** The node's world-space rectangle. */
export function boxOf(n: GeomNode): Box {
  const box = nodeBox(n);
  return { x: n.x, y: n.y, w: box.w, h: box.h };
}

/** left / right / top / bottom / centres, for guides and side anchors. */
export function sides(b: Box) {
  return {
    left: b.x,
    right: b.x + b.w,
    top: b.y,
    bottom: b.y + b.h,
    cx: b.x + b.w / 2,
    cy: b.y + b.h / 2
  };
}
