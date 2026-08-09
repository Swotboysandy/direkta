import type { EdgeKind } from "../../../lib/stitch/nodeTypes";
import { type Box, sides } from "./nodeGeometry";

/**
 * FigJam-style connector geometry: an edge leaves from whichever side of the
 * source box faces the target and arrives on the facing side of the target,
 * recomputed from the live boxes on every render. Pure module — no React.
 */

export type Side = "n" | "e" | "s" | "w";

export interface Pt {
  x: number;
  y: number;
}

/* Horizontal unless the vertical separation dominates. The chain bias is the
   larger of the two so a left-to-right cut chain keeps reading side-to-side
   even when the director stacks shots with a vertical offset; the milder bias
   elsewhere is hysteresis against the two sides flickering while a node is
   dragged across the diagonal. */
const BIAS_CHAIN = 1.6;
const BIAS_OTHER = 1.15;

/** Midpoint of one side of a box. */
export function sideAnchor(b: Box, s: Side): Pt {
  const g = sides(b);
  if (s === "n") return { x: g.cx, y: g.top };
  if (s === "s") return { x: g.cx, y: g.bottom };
  if (s === "w") return { x: g.left, y: g.cy };
  return { x: g.right, y: g.cy };
}

/** Which side of `a` faces `b`, and which side of `b` faces back. */
export function nearestFacingSides(a: Box, b: Box, kind: EdgeKind): [Side, Side] {
  const ga = sides(a);
  const gb = sides(b);
  const dx = gb.cx - ga.cx;
  const dy = gb.cy - ga.cy;
  const bias = kind === "chain" ? BIAS_CHAIN : BIAS_OTHER;
  if (Math.abs(dy) > bias * Math.abs(dx)) return dy > 0 ? ["s", "n"] : ["n", "s"];
  return dx > 0 ? ["e", "w"] : ["w", "e"];
}

/** Control-point offset for a side: each endpoint pushes out along its normal. */
function normal(s: Side, k: number): Pt {
  if (s === "n") return { x: 0, y: -k };
  if (s === "s") return { x: 0, y: k };
  if (s === "w") return { x: -k, y: 0 };
  return { x: k, y: 0 };
}

export interface EdgePath {
  d: string;
  /** Cubic midpoint (t = 0.5) — where the label sits, on the curve not beside it. */
  label: Pt;
  p1: Pt;
  p2: Pt;
}

export function edgePath(a: Box, b: Box, kind: EdgeKind): EdgePath {
  const [sa, sb] = nearestFacingSides(a, b, kind);
  const p1 = sideAnchor(a, sa);
  const p2 = sideAnchor(b, sb);
  const k = Math.min(160, Math.max(32, 0.42 * Math.hypot(p2.x - p1.x, p2.y - p1.y)));
  const n1 = normal(sa, k);
  const n2 = normal(sb, k);
  const c1 = { x: p1.x + n1.x, y: p1.y + n1.y };
  const c2 = { x: p2.x + n2.x, y: p2.y + n2.y };
  return {
    d: `M ${p1.x} ${p1.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`,
    label: {
      x: (p1.x + 3 * c1.x + 3 * c2.x + p2.x) / 8,
      y: (p1.y + 3 * c1.y + 3 * c2.y + p2.y) / 8
    },
    p1,
    p2
  };
}

/** The dashed path drawn while a connector is being dragged to nowhere yet. */
export function draftPath(from: Pt, side: Side, to: Pt): string {
  const k = Math.min(160, Math.max(32, 0.42 * Math.hypot(to.x - from.x, to.y - from.y)));
  const n1 = normal(side, k);
  const c1 = { x: from.x + n1.x, y: from.y + n1.y };
  // The free end has no side of its own, so mirror the source's tangent into it.
  const c2 = { x: to.x - n1.x * 0.5, y: to.y - n1.y * 0.5 };
  return `M ${from.x} ${from.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${to.x} ${to.y}`;
}
