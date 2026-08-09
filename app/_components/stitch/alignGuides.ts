import { type Box, sides } from "./nodeGeometry";

/**
 * Smart alignment guides — the light lines a board draws when a dragged node's
 * edges or centres line up with a neighbour's. Pure module: no React, no DOM.
 *
 * No grid snapping anywhere; this only ever snaps to another node.
 */

export interface Guide {
  axis: "x" | "y";
  /** World coordinate of the line. */
  at: number;
  /** The span the line covers, so it reads as a relationship not a page rule. */
  from: number;
  to: number;
}

export interface Candidates {
  xs: { at: number; box: Box }[];
  ys: { at: number; box: Box }[];
}

/**
 * Left / centre-x / right and top / centre-y / bottom of every non-dragged node
 * near the viewport. Built once at drag start — nothing but the dragged nodes
 * moves during a drag — and capped so a huge board can't make each frame O(n).
 */
export function buildCandidates(
  boxes: { id: string; box: Box }[],
  excludeIds: Set<string>,
  worldRect: Box,
  limit = 200
): Candidates {
  const xs: { at: number; box: Box }[] = [];
  const ys: { at: number; box: Box }[] = [];
  let used = 0;
  for (const { id, box } of boxes) {
    if (excludeIds.has(id)) continue;
    if (
      box.x > worldRect.x + worldRect.w ||
      box.x + box.w < worldRect.x ||
      box.y > worldRect.y + worldRect.h ||
      box.y + box.h < worldRect.y
    ) {
      continue;
    }
    const g = sides(box);
    xs.push({ at: g.left, box }, { at: g.cx, box }, { at: g.right, box });
    ys.push({ at: g.top, box }, { at: g.cy, box }, { at: g.bottom, box });
    used += 1;
    if (used >= limit) break;
  }
  return { xs, ys };
}

export interface SnapResult {
  dx: number;
  dy: number;
  guides: Guide[];
}

/**
 * Nearest alignment per axis under `threshold`, as a correction to apply to the
 * dragged bounding box. At most one guide per axis — three parallel lines for
 * left/centre/right all matching at once is noise, not information.
 */
export function snap(box: Box, cand: Candidates, threshold: number): SnapResult {
  const g = sides(box);
  const xLines = [g.left, g.cx, g.right];
  const yLines = [g.top, g.cy, g.bottom];

  let best: { delta: number; at: number; other: Box } | null = null;
  for (const line of xLines) {
    for (const c of cand.xs) {
      const delta = c.at - line;
      if (Math.abs(delta) > threshold) continue;
      if (!best || Math.abs(delta) < Math.abs(best.delta)) best = { delta, at: c.at, other: c.box };
    }
  }
  const xHit = best;

  best = null;
  for (const line of yLines) {
    for (const c of cand.ys) {
      const delta = c.at - line;
      if (Math.abs(delta) > threshold) continue;
      if (!best || Math.abs(delta) < Math.abs(best.delta)) best = { delta, at: c.at, other: c.box };
    }
  }
  const yHit = best;

  const guides: Guide[] = [];
  if (xHit) {
    const o = sides(xHit.other);
    guides.push({
      axis: "x",
      at: xHit.at,
      from: Math.min(o.top, g.top + xHit.delta),
      to: Math.max(o.bottom, g.bottom + xHit.delta)
    });
  }
  if (yHit) {
    const o = sides(yHit.other);
    guides.push({
      axis: "y",
      at: yHit.at,
      from: Math.min(o.left, g.left + (xHit?.delta ?? 0)),
      to: Math.max(o.right, g.right + (xHit?.delta ?? 0))
    });
  }

  return { dx: xHit?.delta ?? 0, dy: yHit?.delta ?? 0, guides };
}
