/**
 * Chain derivation for the Stitch board.
 *
 * A "chain" is a maximal linear run of connected scene nodes. The server
 * enforces at most one outgoing and one incoming transition per node, so a
 * chain is always a simple path — no branching, no merge resolution needed.
 * Multiple disjoint chains are how alternates are laid out side by side.
 *
 * Pure module: no imports, no React, no DB.
 */

export interface Chain {
  headId: string;
  nodeIds: string[];
}

/**
 * @param orderedNodeIds Live node ids, pre-sorted by the caller (y, then x, then id).
 *                       Chains come back in that same order, so the topmost chain is Chain A.
 */
export function deriveChains(
  orderedNodeIds: string[],
  transitions: { from_node_id: string; to_node_id: string }[]
): Chain[] {
  const live = new Set(orderedNodeIds);

  const next = new Map<string, string>();
  const incoming = new Set<string>();
  for (const t of transitions) {
    if (!live.has(t.from_node_id) || !live.has(t.to_node_id)) continue;
    // First write wins — defensive; the server guarantees uniqueness both ways.
    if (next.has(t.from_node_id)) continue;
    if (incoming.has(t.to_node_id)) continue;
    next.set(t.from_node_id, t.to_node_id);
    incoming.add(t.to_node_id);
  }

  const chains: Chain[] = [];
  for (const id of orderedNodeIds) {
    // A head has an outgoing edge and no incoming one. A node with no edges at
    // all is loose: it belongs to no chain, gets no order badge, is never dimmed.
    if (!next.has(id) || incoming.has(id)) continue;

    const nodeIds: string[] = [];
    const visited = new Set<string>();
    let cursor: string | undefined = id;
    while (cursor && !visited.has(cursor)) {
      visited.add(cursor);
      nodeIds.push(cursor);
      cursor = next.get(cursor);
    }
    chains.push({ headId: id, nodeIds });
  }

  return chains;
}

/**
 * Exact head match, then the chain that still *contains* the stored head, then
 * the topmost chain.
 *
 * The middle step matters: heads are recomputed from scratch on every render, so
 * wiring a new shot into the front of the active chain stops the stored id from
 * being a head. Without the containment fallback that lands on `chains[0]` — a
 * different cut silently becomes active, every order badge jumps, and the stored
 * pointer never self-corrects. The last step is the real "the head was deleted"
 * case.
 */
export function resolveActiveChain(chains: Chain[], activeHead: string | null): Chain | null {
  if (activeHead) {
    const hit = chains.find((c) => c.headId === activeHead);
    if (hit) return hit;
    const owner = chains.find((c) => c.nodeIds.includes(activeHead));
    if (owner) return owner;
  }
  return chains[0] ?? null;
}

/** node id → 1-based position in the chain. */
export function orderIndexMap(chain: Chain | null): Map<string, number> {
  const map = new Map<string, number>();
  if (!chain) return map;
  chain.nodeIds.forEach((id, i) => map.set(id, i + 1));
  return map;
}
