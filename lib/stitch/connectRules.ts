import { edgeKind, isFrame, isPrompt, type EdgeKind, type StitchNodeType } from "./nodeTypes";

/**
 * The client-side mirror of the four rules POST /api/transitions enforces.
 *
 * It exists so the hover highlight during a connector drag and the check on
 * drop are literally the same function call — a target that lights up green can
 * never then 409. The reason strings are the server's, verbatim, so the toast
 * on a genuine failure reads identically to the pre-check.
 *
 * Pure module: no React, no DB, no fetch. Imported by the board only.
 */

export interface RuleNode {
  id: string;
  node_type: StitchNodeType;
}

export interface RuleEdge {
  from_node_id: string;
  to_node_id: string;
}

export type Verdict = { ok: true; kind: EdgeKind } | { ok: false; reason: string };

export function connectVerdict(
  source: RuleNode,
  target: RuleNode,
  nodes: Map<string, RuleNode>,
  transitions: RuleEdge[]
): Verdict {
  if (source.id === target.id) return { ok: false, reason: "A node cannot connect to itself" };

  const kind = edgeKind(source.node_type, target.node_type);
  /* Unknown endpoint → "frame", matching the server (app/api/transitions) and
     mapBoardNode's NULL coalesce. Defaulting the other way made the client
     *permissive* for an edge whose endpoint is transiently missing from the
     local map: the target lights up green and then 409s, which is exactly what
     this file promises can never happen. */
  const typeOf = (id: string) => nodes.get(id)?.node_type;

  if (kind === "chain") {
    // Frame→frame edges only. Attached prompt boxes are also outgoing rows, and
    // counting those would report "already has an output" on every wired shot.
    const chainEdges = transitions.filter(
      (t) => isFrame(typeOf(t.from_node_id) ?? "frame") && isFrame(typeOf(t.to_node_id) ?? "frame")
    );
    if (chainEdges.some((t) => t.from_node_id === source.id)) {
      return { ok: false, reason: "That shot already has an output" };
    }
    if (chainEdges.some((t) => t.to_node_id === target.id)) {
      return { ok: false, reason: "That shot already has an input" };
    }
    // Walk forward from the target; coming back round to the source is a loop.
    const next = new Map<string, string>();
    for (const t of chainEdges) if (!next.has(t.from_node_id)) next.set(t.from_node_id, t.to_node_id);
    let cursor: string | undefined = target.id;
    for (let hops = 0; cursor; hops += 1) {
      if (cursor === source.id || hops > 500) {
        return { ok: false, reason: "That would loop the chain" };
      }
      cursor = next.get(cursor);
    }
    return { ok: true, kind };
  }

  if (kind === "attach") {
    // The prompt end is the one that may only belong to a single frame; the
    // server normalizes the row frame-first whichever way it was dragged.
    const promptEnd = isPrompt(source.node_type) ? source : target;
    const already = transitions.some(
      (t) => t.to_node_id === promptEnd.id && isFrame(typeOf(t.from_node_id) ?? "frame")
    );
    if (already) return { ok: false, reason: "That prompt is already attached to a shot" };
    return { ok: true, kind };
  }

  // link: decoration, no structural rules — but the same pair must not be wired
  // twice in either direction. Both rows draw the identical dashed path and
  // stack their hover-× hit targets, so removing one looks like nothing happened.
  const dup = transitions.some(
    (t) =>
      (t.from_node_id === source.id && t.to_node_id === target.id) ||
      (t.from_node_id === target.id && t.to_node_id === source.id)
  );
  if (dup) return { ok: false, reason: "Those two are already connected" };
  return { ok: true, kind };
}
