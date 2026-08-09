"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronsDown,
  ChevronsUp,
  Clapperboard,
  Clipboard,
  Copy,
  Hand,
  Home,
  Layers,
  Maximize2,
  MessageSquare,
  Minus,
  MousePointer2,
  Music,
  Pencil,
  Plus,
  Redo2,
  Sparkles,
  Square,
  StickyNote,
  Trash2,
  Undo2,
  X
} from "lucide-react";
import type {
  DrawerBeatGroup,
  DrawerVariant,
  Project,
  StitchBoardNode,
  StitchBoardTransition,
  WorkspaceId
} from "../../lib/types";
import { deriveChains, orderIndexMap, resolveActiveChain } from "../../lib/stitch/chains";
import { connectVerdict } from "../../lib/stitch/connectRules";
import {
  edgeKind,
  type EdgeKind,
  type StitchNodeType,
  type StitchShapeKind,
  type StitchTint
} from "../../lib/stitch/nodeTypes";
import { BoardMenu, type MenuItem } from "../_components/stitch/BoardMenu";
import { FrameDrawer } from "../_components/stitch/FrameDrawer";
import { FrameNode } from "../_components/stitch/FrameNode";
import { NoteNode } from "../_components/stitch/NoteNode";
import { PromptNode } from "../_components/stitch/PromptNode";
import { ShapeNode } from "../_components/stitch/ShapeNode";
import { draftPath, edgePath, sideAnchor } from "../_components/stitch/edgeGeometry";
import { FRAME_H, FRAME_W, boxOf, type Box } from "../_components/stitch/nodeGeometry";
import { useBoardInput } from "../_components/stitch/useBoardInput";
import { useBoardViewport } from "../_components/stitch/useBoardViewport";
import { useOpStack, type FieldKey } from "../_components/stitch/useOpStack";

interface Props {
  project: Project;
  onSwitchWorkspace: (ws: WorkspaceId) => void;
}

type Toast = { kind: "success" | "info" | "error"; text: string };

/** One stable set per node id — see `handlersFor`. */
interface NodeHandlers {
  onDuplicate: () => void;
  onDelete: () => void;
  onCommit: (content: string) => void;
  onSetTint: (t: StitchTint) => void;
  onSetShapeKind: (k: StitchShapeKind) => void;
  onSetDuration: (d: number) => void;
  onQuickAdd: () => void;
  onMakeActive: () => void;
}

const GHOST_W = 160;
const GHOST_H = 90;
const PASTE_OFFSET = 24;

const PLACERS: { tool: StitchNodeType; icon: typeof Clapperboard; title: string }[] = [
  { tool: "video_prompt", icon: Clapperboard, title: "Video prompt box" },
  { tool: "sound_prompt", icon: Music, title: "Sound prompt box" },
  { tool: "dialogue_prompt", icon: MessageSquare, title: "Dialogue prompt box" },
  { tool: "note", icon: StickyNote, title: "Note" },
  { tool: "shape", icon: Square, title: "Shape — click, or drag to size" }
];

const byYXId = (a: StitchBoardNode, b: StitchBoardNode) =>
  a.y - b.y || a.x - b.x || a.id.localeCompare(b.id);
const byZYXId = (a: StitchBoardNode, b: StitchBoardNode) => a.z - b.z || byYXId(a, b);

export function Stitch({ project, onSwitchWorkspace }: Props) {
  const [nodes, setNodes] = useState<StitchBoardNode[]>([]);
  const [transitions, setTransitions] = useState<StitchBoardTransition[]>([]);
  const [drawer, setDrawer] = useState<DrawerBeatGroup[]>([]);
  const [activeHead, setActiveHead] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [ghost, setGhost] = useState<{
    variantId: string;
    url: string | null;
    label: string;
    cx: number;
    cy: number;
  } | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const shellRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const drawerDrag = useRef<{
    variantId: string;
    url: string;
    label: string;
    startX: number;
    startY: number;
    armed: boolean;
  } | null>(null);
  /* Internal clipboard only — no OS clipboard integration, deliberately: the
     board's copy is a node graph, not text, and reading the system clipboard
     would need a permission prompt to deliver nothing extra. */
  const clipboard = useRef<{ nodes: StitchBoardNode[]; edges: StitchBoardTransition[] }>({
    nodes: [],
    edges: []
  });

  /* Latest board state, readable from window-level pointer and key handlers
     without making them re-subscribe on every mutation. */
  const nodesRef = useRef<StitchBoardNode[]>([]);
  nodesRef.current = nodes;
  const transitionsRef = useRef<StitchBoardTransition[]>([]);
  transitionsRef.current = transitions;

  const flashToast = useCallback((kind: Toast["kind"], text: string) => {
    setToast({ kind, text });
    setTimeout(() => setToast((t) => (t?.text === text ? null : t)), 2800);
  }, []);

  /* ─── Board viewport ─────────────────────────────────────── */

  const { viewport, toWorld, worldRect, panBy, panning, setPanning, frameTo, reset, zoomBy } =
    useBoardViewport(boardRef);
  const zoomRef = useRef(viewport.zoom);
  zoomRef.current = viewport.zoom;
  // Window-level drawer drag needs the latest conversion without re-registering.
  const toWorldRef = useRef(toWorld);
  toWorldRef.current = toWorld;

  /* ─── Undo stack ─────────────────────────────────────────── */

  const ops = useOpStack({
    onRestore(restoredNodes, restoredEdges) {
      setNodes((prev) => {
        const seen = new Set(prev.map((n) => n.id));
        return [...prev, ...restoredNodes.filter((n) => !seen.has(n.id))];
      });
      setTransitions((prev) => {
        const seen = new Set(prev.map((t) => t.id));
        return [...prev, ...restoredEdges.filter((t) => !seen.has(t.id))];
      });
    },
    onRemove(nodeIds, edgeIds) {
      const ns = new Set(nodeIds);
      const es = new Set(edgeIds);
      setNodes((prev) => prev.filter((n) => !ns.has(n.id)));
      setTransitions((prev) =>
        prev.filter((t) => !es.has(t.id) && !ns.has(t.from_node_id) && !ns.has(t.to_node_id))
      );
    },
    onMove(items) {
      const m = new Map(items.map((i) => [i.id, i]));
      setNodes((prev) => prev.map((n) => (m.has(n.id) ? { ...n, x: m.get(n.id)!.x, y: m.get(n.id)!.y } : n)));
    },
    onResize(items) {
      const m = new Map(items.map((i) => [i.id, i.box]));
      setNodes((prev) =>
        prev.map((n) => {
          const b = m.get(n.id);
          return b ? { ...n, x: b.x, y: b.y, w: b.w, h: b.h } : n;
        })
      );
    },
    onField(id, key, value) {
      setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, [key]: value } : n)));
    },
    onRemap(map) {
      // Every live reference to a recreated id has to follow it, or the board
      // keeps a selection / active head pointing at a node that no longer exists.
      const pick = (id: string | null) => (id && map.has(id) ? map.get(id)! : id);
      setActiveHead((h) => pick(h));
      setFocusId((f) => pick(f));
      input.setSelectedIds((prev) => new Set([...prev].map((id) => map.get(id) ?? id)));
      input.setEditingId((e) => pick(e));
      clipboard.current = {
        nodes: clipboard.current.nodes.map((n) => (map.has(n.id) ? { ...n, id: map.get(n.id)! } : n)),
        edges: clipboard.current.edges.map((t) => ({
          ...t,
          id: map.get(t.id) ?? t.id,
          from_node_id: map.get(t.from_node_id) ?? t.from_node_id,
          to_node_id: map.get(t.to_node_id) ?? t.to_node_id
        }))
      };
    },
    onError: (message) => flashToast("error", message)
  });

  /* ─── Input layer ────────────────────────────────────────── */

  const input = useBoardInput({
    boardRef,
    shellRef,
    nodesRef,
    transitionsRef,
    zoomRef,
    toWorld,
    worldRect,
    panBy,
    zoomBy,
    setPanning,
    onCommitMove: commitMove,
    onCommitResize: commitResize,
    onDuplicateDrag: duplicateDrag,
    onPlace: placeNode,
    onConnect: finishConnect,
    onDeleteSelection: deleteSelection,
    onDuplicateSelection: duplicateSelection,
    onQuickAdd: quickAdd,
    onCopy: copySelection,
    onPaste: pasteClipboard,
    onUndo: () => ops.undo(project.id),
    onRedo: () => ops.redo(project.id),
    onFitAll: fitAll
  });

  const { selectedIds, editingId, hoverId, tool, drag, resizeDraft, marquee, connect, guides, shapeDraft } =
    input;

  /* ─── Load ───────────────────────────────────────────────── */

  const reload = useCallback(async () => {
    const res = await fetch(`/api/projects/${project.id}/stitch`);
    if (!res.ok) return;
    const data = (await res.json()) as {
      nodes: StitchBoardNode[];
      transitions: StitchBoardTransition[];
      drawer: DrawerBeatGroup[];
      active_chain_head: string | null;
    };
    setNodes(data.nodes);
    setTransitions(data.transitions);
    setDrawer(data.drawer);
    setActiveHead(data.active_chain_head);
  }, [project.id]);

  useEffect(() => {
    reload();
  }, [reload]);

  /* ─── Derived ────────────────────────────────────────────── */

  const nodeById = useMemo(() => {
    const m = new Map<string, StitchBoardNode>();
    for (const n of nodes) m.set(n.id, n);
    return m;
  }, [nodes]);

  /* Two sorts, deliberately. deriveChains labels the topmost chain "Chain A"
     from a (y, x, id) order, so folding `z` into that would relabel every chain
     the moment the director restacked a card. `z` is a painting concern only. */
  const chainOrder = useMemo(() => [...nodes].sort(byYXId), [nodes]);
  const paintOrder = useMemo(() => [...nodes].sort(byZYXId), [nodes]);

  /* Chains are frame→frame only. deriveChains already drops any transition whose
     endpoints aren't in the id set it's given, so feeding it frames alone
     discards every attach and link edge for free. */
  const frames = useMemo(() => chainOrder.filter((n) => n.node_type === "frame"), [chainOrder]);
  const chains = useMemo(() => deriveChains(frames.map((n) => n.id), transitions), [frames, transitions]);
  const activeChain = useMemo(() => resolveActiveChain(chains, activeHead), [chains, activeHead]);
  const orderIndex = useMemo(() => orderIndexMap(activeChain), [activeChain]);

  /* Wiring a shot into the front of the active chain demotes the stored head to
     an ordinary member. resolveActiveChain keeps the right chain active, but the
     column would stay stale forever — so write the new head back once. Guarded on
     containment so the "head was deleted" fallback to the topmost chain is never
     persisted as a deliberate choice. */
  useEffect(() => {
    if (!activeHead || !activeChain) return;
    if (activeChain.headId === activeHead) return;
    if (!activeChain.nodeIds.includes(activeHead)) return;
    const repaired = activeChain.headId;
    setActiveHead(repaired);
    fetch(`/api/projects/${project.id}/stitch`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active_chain_head: repaired })
    }).catch(() => {});
  }, [activeHead, activeChain, project.id]);

  const placedCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const n of nodes) if (n.variant_id) m.set(n.variant_id, (m.get(n.variant_id) ?? 0) + 1);
    return m;
  }, [nodes]);

  /** transition id → derived kind. Endpoints decide; nothing is stored. */
  const kindOf = useMemo(() => {
    const m = new Map<string, EdgeKind>();
    for (const t of transitions) {
      const a = nodeById.get(t.from_node_id);
      const b = nodeById.get(t.to_node_id);
      if (!a || !b) continue;
      m.set(t.id, edgeKind(a.node_type, b.node_type));
    }
    return m;
  }, [transitions, nodeById]);

  const chainedIds = useMemo(() => {
    const s = new Set<string>();
    for (const c of chains) for (const id of c.nodeIds) s.add(id);
    return s;
  }, [chains]);
  const headIds = useMemo(() => new Set(chains.map((c) => c.headId)), [chains]);

  const activeLetter = activeChain
    ? String.fromCharCode(65 + chains.findIndex((c) => c.headId === activeChain.headId))
    : null;
  const activeDuration = activeChain
    ? activeChain.nodeIds.reduce((sum, id) => sum + (nodeById.get(id)?.duration ?? 0), 0)
    : 0;

  /** The node's box as it looks *right now*, mid-drag or mid-resize included. */
  const liveBox = useCallback(
    (n: StitchBoardNode): Box => {
      if (resizeDraft && resizeDraft.id === n.id) return resizeDraft.box;
      const b = boxOf(n);
      if (drag?.ids.has(n.id)) return { ...b, x: b.x + drag.dx, y: b.y + drag.dy };
      return b;
    },
    [drag, resizeDraft]
  );

  /* One memo for every edge path. During a drag only `drag` changes, so this is
     the only thing that recomputes — the untouched cards bail out on memo. */
  const edges = useMemo(() => {
    return transitions.flatMap((t) => {
      const a = nodeById.get(t.from_node_id);
      const b = nodeById.get(t.to_node_id);
      if (!a || !b) return [];
      const kind = kindOf.get(t.id) ?? "link";
      const path = edgePath(liveBox(a), liveBox(b), kind);
      const from = orderIndex.get(t.from_node_id);
      const to = orderIndex.get(t.to_node_id);
      return [{ t, kind, path, from, to, isActive: kind === "chain" && from !== undefined && to !== undefined }];
    });
  }, [transitions, nodeById, kindOf, orderIndex, liveBox]);

  /* ─── Persistence helpers ────────────────────────────────── */

  /* Record, not a per-field shape: the whitelist that actually matters lives in
     PATCH /api/stitch/nodes/[id], and setField writes a computed key. */
  async function patchNode(id: string, patch: object) {
    const res = await fetch(`/api/stitch/nodes/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch)
    }).catch(() => null);
    // Swallowing this leaves the board permanently ahead of the DB, silently.
    if (!res?.ok) flashToast("error", "That change did not save.");
  }

  /**
   * Everything a delete of `ids` takes with it, computed exactly once and used
   * for both the optimistic removal and the undo snapshot — so the two can never
   * disagree about what "remove" meant.
   *
   * Mirrors `deleteStitchNode` in lib/db/stitch.ts: a frame drops its attached
   * prompt boxes plus every transition touching any of them.
   */
  function cascadeOf(ids: string[]) {
    const del = new Set(ids);
    for (const id of ids) {
      if (nodeById.get(id)?.node_type !== "frame") continue;
      for (const t of transitions) {
        if (t.from_node_id === id && kindOf.get(t.id) === "attach") del.add(t.to_node_id);
      }
    }
    return {
      ids: del,
      nodes: nodes.filter((n) => del.has(n.id)),
      edges: transitions.filter((t) => del.has(t.from_node_id) || del.has(t.to_node_id))
    };
  }

  function commitMove(items: { id: string; from: { x: number; y: number }; to: { x: number; y: number } }[]) {
    const m = new Map(items.map((i) => [i.id, i.to]));
    setNodes((prev) => prev.map((n) => (m.has(n.id) ? { ...n, ...m.get(n.id)! } : n)));
    const changed = items.filter((i) => i.from.x !== i.to.x || i.from.y !== i.to.y);
    if (changed.length === 0) return;
    // One PATCH per node, on drop — never one per pointermove.
    for (const i of changed) patchNode(i.id, i.to);
    ops.push({ t: "move", items: changed });
  }

  function commitResize(id: string, from: Box, to: Box) {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, x: to.x, y: to.y, w: to.w, h: to.h } : n)));
    if (from.x === to.x && from.y === to.y && from.w === to.w && from.h === to.h) return;
    patchNode(id, to);
    ops.push({ t: "resize", items: [{ id, from, to }] });
  }

  async function deleteSelection(ids: string[]) {
    if (ids.length === 0) return;
    /* No confirm(): undo covers it. A modal *and* an undo stack is double
       friction, and the confirm was only ever standing in for the undo that
       didn't exist yet. */
    const snap = cascadeOf(ids);
    if (snap.nodes.length === 0) return;
    setNodes((prev) => prev.filter((n) => !snap.ids.has(n.id)));
    setTransitions((prev) =>
      prev.filter((t) => !snap.ids.has(t.from_node_id) && !snap.ids.has(t.to_node_id))
    );
    input.setSelectedIds(new Set());
    if (editingId && snap.ids.has(editingId)) input.setEditingId(null);
    // The server clears projects.stitch_active_head for a deleted node; mirror it.
    if (activeHead && snap.ids.has(activeHead)) setActiveHead(null);
    /* The op is pushed only once the server has agreed. Pushing first and
       swallowing the result meant a failed DELETE left the rows in SQLite while
       undo POSTed fresh copies — one card on the board, two in the DB. */
    let ok = true;
    for (const id of ids) {
      const res = await fetch(`/api/stitch/nodes/${id}`, { method: "DELETE" }).catch(() => null);
      if (!res?.ok) ok = false;
    }
    if (!ok) {
      // Put back exactly what the snapshot took, and record nothing to undo.
      setNodes((prev) => [...prev, ...snap.nodes.filter((n) => !prev.some((p) => p.id === n.id))]);
      setTransitions((prev) => [...prev, ...snap.edges.filter((e) => !prev.some((p) => p.id === e.id))]);
      flashToast("error", "Could not delete that.");
      return;
    }
    ops.push({ t: "delete", nodes: snap.nodes, edges: snap.edges });
  }

  async function duplicateSelection(ids: string[]) {
    if (ids.length === 0) return;
    const made: StitchBoardNode[] = [];
    for (const id of ids) {
      const res = await fetch(`/api/stitch/nodes/${id}/duplicate`, { method: "POST" }).catch(() => null);
      const data = (await res?.json().catch(() => ({}))) as { node?: StitchBoardNode };
      if (res?.ok && data.node) made.push(data.node);
    }
    if (made.length === 0) return flashToast("error", "Could not duplicate that.");
    setNodes((prev) => [...prev, ...made]);
    input.selectMany(made.map((n) => n.id));
    ops.push({ t: "create", nodes: made, edges: [] });
    flashToast("info", made.length > 1 ? `Duplicated ${made.length}` : "Duplicated — alternate ready.");
  }

  /**
   * Alt-drag: the originals never moved (the drag was a preview of where the
   * copies land), so there is nothing to snap back — they simply re-render at
   * their stored position once `drag` clears — and one duplicate call per node
   * places the copies at the drop delta. One round trip, no invented ids.
   */
  async function duplicateDrag(ids: string[], dx: number, dy: number) {
    const made: StitchBoardNode[] = [];
    for (const id of ids) {
      const res = await fetch(`/api/stitch/nodes/${id}/duplicate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ dx, dy })
      }).catch(() => null);
      const data = (await res?.json().catch(() => ({}))) as { node?: StitchBoardNode };
      if (res?.ok && data.node) made.push(data.node);
    }
    if (made.length === 0) return flashToast("error", "Could not duplicate that.");
    setNodes((prev) => [...prev, ...made]);
    input.selectMany(made.map((n) => n.id));
    ops.push({ t: "create", nodes: made, edges: [] });
  }

  function copySelection(ids: string[]) {
    if (ids.length === 0) return;
    const set = new Set(ids);
    clipboard.current = {
      nodes: nodes.filter((n) => set.has(n.id)),
      // Only edges wholly inside the copied set — a half-edge has nowhere to land.
      edges: transitions.filter((t) => set.has(t.from_node_id) && set.has(t.to_node_id))
    };
    flashToast("info", ids.length > 1 ? `Copied ${ids.length}` : "Copied");
  }

  async function pasteClipboard(world: { x: number; y: number } | null) {
    const clip = clipboard.current;
    if (clip.nodes.length === 0) return;
    let dx = PASTE_OFFSET;
    let dy = PASTE_OFFSET;
    if (world) {
      // "Paste here" lands the cluster under the cursor with its layout intact.
      dx = Math.round(world.x - Math.min(...clip.nodes.map((n) => n.x)));
      dy = Math.round(world.y - Math.min(...clip.nodes.map((n) => n.y)));
    }
    const map = new Map<string, string>();
    const made: StitchBoardNode[] = [];
    for (const n of clip.nodes) {
      const res = await fetch(`/api/stitch/nodes/${ops.resolve(n.id)}/duplicate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ dx, dy })
      }).catch(() => null);
      const data = (await res?.json().catch(() => ({}))) as { node?: StitchBoardNode };
      if (!res?.ok || !data.node) continue;
      map.set(n.id, data.node.id);
      made.push(data.node);
    }
    if (made.length === 0) return flashToast("error", "Could not paste that.");

    // Duplicate deliberately copies no edges, so the internal ones are re-made
    // here — through the same verdict the server enforces, so a paste that would
    // double-attach a prompt box quietly lands unattached instead of 409ing.
    const lookup = new Map(made.map((n) => [n.id, n]));
    const madeEdges: StitchBoardTransition[] = [];
    for (const e of clip.edges) {
      const from = map.get(e.from_node_id);
      const to = map.get(e.to_node_id);
      if (!from || !to) continue;
      const a = lookup.get(from);
      const b = lookup.get(to);
      if (!a || !b) continue;
      if (!connectVerdict(a, b, lookup, madeEdges).ok) continue;
      const res = await fetch("/api/transitions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ from_node_id: from, to_node_id: to, style: e.style })
      }).catch(() => null);
      const data = (await res?.json().catch(() => ({}))) as { transition?: StitchBoardTransition };
      if (res?.ok && data.transition) madeEdges.push(data.transition);
    }

    setNodes((prev) => [...prev, ...made]);
    if (madeEdges.length) setTransitions((prev) => [...prev, ...madeEdges]);
    input.selectMany(made.map((n) => n.id));
    ops.push({ t: "create", nodes: made, edges: madeEdges });
  }

  async function makeActive(headId: string) {
    setActiveHead(headId);
    await fetch(`/api/projects/${project.id}/stitch`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active_chain_head: headId })
    }).catch(() => {});
  }

  /** One field write + one undo step. Text arrives here once per blur. */
  function setField(id: string, key: FieldKey, value: string | number) {
    const node = nodeById.get(id);
    if (!node) return;
    const from = (node as unknown as Record<string, string | number>)[key];
    if (from === value) return;
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, [key]: value } : n)));
    patchNode(id, { [key]: value });
    ops.push({ t: "field", id, key, from, to: value });
  }

  function bringToFront(ids: string[]) {
    const top = nodes.reduce((m, n) => Math.max(m, n.z), 0);
    ops.begin();
    ids.forEach((id, i) => setField(id, "z", top + 1 + i));
    ops.end();
  }

  function sendToBack(ids: string[]) {
    const bottom = nodes.reduce((m, n) => Math.min(m, n.z), 0);
    ops.begin();
    ids.forEach((id, i) => setField(id, "z", bottom - 1 - i));
    ops.end();
  }

  function fitAll() {
    frameTo(nodes.map(boxOf), 160);
  }

  /* ─── Quick-add ──────────────────────────────────────────── */

  async function quickAdd(frameId: string) {
    /* One call, not six: three creates plus three connects done separately would
       half-render on a failure and strand prompt boxes with no frame. The route
       is idempotent, so pressing this twice re-selects rather than doubles. */
    const res = await fetch(`/api/stitch/nodes/${frameId}/prompts`, { method: "POST" });
    if (!res.ok) {
      flashToast("error", "Could not add the prompt boxes.");
      return;
    }
    const data = (await res.json()) as {
      nodes: StitchBoardNode[];
      transitions: StitchBoardTransition[];
    };
    const fresh = data.nodes.filter((n) => !nodes.some((p) => p.id === n.id));
    setNodes((prev) => {
      const incoming = new Map(data.nodes.map((n) => [n.id, n]));
      const merged = prev.map((n) => incoming.get(n.id) ?? n);
      for (const n of data.nodes) if (!prev.some((p) => p.id === n.id)) merged.push(n);
      return merged;
    });
    setTransitions((prev) => [...prev, ...data.transitions]);
    if (fresh.length || data.transitions.length) {
      ops.push({ t: "create", nodes: fresh, edges: data.transitions });
    }
    const video = data.nodes.find((n) => n.node_type === "video_prompt");
    if (video) input.selectOnly(video.id);
  }

  /* ─── Connect ────────────────────────────────────────────── */

  async function finishConnect(sourceId: string, targetId: string) {
    const source = nodeById.get(sourceId);
    const target = nodeById.get(targetId);
    if (!source || !target) return;

    /* The same call the hover highlight made, so a target that lit up green can
       never then be refused — and the reason string is the server's verbatim. */
    const verdict = connectVerdict(source, target, nodeById, transitions);
    if (!verdict.ok) return flashToast("error", verdict.reason);

    const res = await fetch("/api/transitions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ from_node_id: sourceId, to_node_id: targetId })
    });
    const data = (await res.json().catch(() => ({}))) as {
      transition?: StitchBoardTransition;
      error?: string;
    };
    if (!res.ok || !data.transition) {
      flashToast("error", data.error ?? "Could not connect those.");
      return;
    }
    setTransitions((prev) => [...prev, data.transition!]);
    ops.push({ t: "connect", edge: data.transition });
  }

  async function deleteTransition(id: string) {
    const edge = transitions.find((t) => t.id === id);
    if (!edge) return;
    setTransitions((prev) => prev.filter((t) => t.id !== id));
    ops.push({ t: "delete", nodes: [], edges: [edge] });
    await fetch(`/api/transitions/${id}`, { method: "DELETE" }).catch(() => {});
  }

  /* ─── Tool placement ─────────────────────────────────────── */

  async function placeNode(type: StitchNodeType, x: number, y: number, size?: { w: number; h: number }) {
    const res = await fetch("/api/stitch/nodes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        node_type: type,
        project_id: project.id,
        x: Math.round(x),
        y: Math.round(y),
        w: size ? Math.round(size.w) : 0,
        h: size ? Math.round(size.h) : 0
      })
    });
    // No optimistic insert — same rule as a drawer drop: the server owns the id.
    const data = (await res.json().catch(() => ({}))) as { node?: StitchBoardNode };
    if (!res.ok || !data.node) {
      flashToast("error", "Could not place that.");
      return;
    }
    setNodes((prev) => [...prev, data.node!]);
    input.selectOnly(data.node.id);
    ops.push({ t: "create", nodes: [data.node], edges: [] });
    if (type !== "shape" && type !== "frame") {
      setFocusId(data.node.id);
      input.setEditingId(data.node.id);
    }
  }

  /* ─── Drawer → board (pointer-based DnD) ─────────────────── */

  /* placeVariant is bound into window listeners that must not re-subscribe on
     every board mutation, so it reaches the two hooks through refs. */
  const inputRef = useRef(input);
  inputRef.current = input;
  const opsRef = useRef(ops);
  opsRef.current = ops;

  const placeVariant = useCallback(
    async (variantId: string, label: string, worldX: number, worldY: number) => {
      const res = await fetch("/api/stitch/nodes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          variant_id: variantId,
          x: Math.round(worldX - FRAME_W / 2),
          y: Math.round(worldY - FRAME_H / 2),
          allow_duplicate: true
        })
      });
      if (!res.ok) {
        flashToast("error", "Could not place that frame.");
        return;
      }
      // No optimistic insert — the server owns the id and the seeded video prompt.
      const data = (await res.json()) as { node: StitchBoardNode | null };
      if (!data.node) {
        flashToast("error", "Could not place that frame.");
        return;
      }
      setNodes((prev) => [...prev, data.node!]);
      inputRef.current.selectOnly(data.node.id);
      opsRef.current.push({ t: "create", nodes: [data.node], edges: [] });
      flashToast("success", `Placed · ${label}`);
    },
    [flashToast]
  );

  function onThumbPointerDown(e: React.PointerEvent, v: DrawerVariant, g: DrawerBeatGroup) {
    if (!v.url) return;
    e.preventDefault();
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    drawerDrag.current = {
      variantId: v.id,
      url: v.url,
      label: `Scene ${String(g.beat_n).padStart(2, "0")} V${String(v.n).padStart(2, "0")}`,
      startX: e.clientX,
      startY: e.clientY,
      armed: false
    };
  }

  // Pointer capture sits on the drawer thumb, so the board's router never sees
  // the drag; window listeners are what still see the move/up.
  useEffect(() => {
    function move(e: PointerEvent) {
      const d = drawerDrag.current;
      if (!d) return;
      if (!d.armed && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) <= 4) return;
      d.armed = true;
      setGhost({ variantId: d.variantId, url: d.url, label: d.label, cx: e.clientX, cy: e.clientY });
    }
    function up(e: PointerEvent) {
      const d = drawerDrag.current;
      drawerDrag.current = null;
      setGhost(null);
      if (!d) return;
      const board = boardRef.current;
      const rect = board?.getBoundingClientRect();
      if (!board || !rect) return;
      if (!d.armed) {
        // A click, not a drag → drop at the board's visual centre.
        const w = toWorldRef.current(rect.left + rect.width / 2, rect.top + rect.height / 2);
        placeVariant(d.variantId, d.label, w.x, w.y);
        return;
      }
      /* .stitch-board is inset:0 on the shell, so its bounding rect also covers
         the drawer and the floating chrome drawn over it — a rect test would
         turn "drop it back on the library" into "create a node hidden behind the
         library". Hit-test the element actually under the pointer instead. */
      const under = document.elementFromPoint(e.clientX, e.clientY);
      if (!under || !board.contains(under)) return;
      const w = toWorldRef.current(e.clientX, e.clientY);
      placeVariant(d.variantId, d.label, w.x, w.y);
    }
    function cancel() {
      drawerDrag.current = null;
      setGhost(null);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
    };
  }, [placeVariant]);

  /* ─── Context menu items ─────────────────────────────────── */

  const menuItems = useMemo((): (MenuItem | "sep")[] => {
    const m = input.menu;
    if (!m) return [];
    if (m.edgeId) {
      return [
        {
          key: "unlink",
          label: "Remove connection",
          icon: <X size={13} />,
          danger: true,
          onPick: () => deleteTransition(m.edgeId!)
        }
      ];
    }
    if (m.nodeId) {
      const ids = selectedIds.has(m.nodeId) ? [...selectedIds] : [m.nodeId];
      const n = ids.length;
      const suffix = n > 1 ? ` ${n}` : "";
      const node = nodeById.get(m.nodeId);
      const textual = !!node && node.node_type !== "frame" && node.node_type !== "shape";
      const items: (MenuItem | "sep")[] = [];
      if (textual && n === 1) {
        items.push({
          key: "edit",
          label: "Edit",
          icon: <Pencil size={13} />,
          onPick: () => input.setEditingId(m.nodeId)
        });
      }
      if (node?.node_type === "frame" && n === 1) {
        items.push({
          key: "prompts",
          label: "Add prompt boxes",
          icon: <Sparkles size={13} />,
          onPick: () => quickAdd(m.nodeId!)
        });
      }
      items.push(
        { key: "dup", label: `Duplicate${suffix}`, icon: <Copy size={13} />, onPick: () => duplicateSelection(ids) },
        { key: "front", label: "Bring to front", icon: <ChevronsUp size={13} />, onPick: () => bringToFront(ids) },
        { key: "back", label: "Send to back", icon: <ChevronsDown size={13} />, onPick: () => sendToBack(ids) },
        "sep",
        {
          key: "del",
          label: `Delete${suffix}`,
          icon: <Trash2 size={13} />,
          danger: true,
          onPick: () => deleteSelection(ids)
        }
      );
      return items;
    }
    const world = toWorld(m.x, m.y);
    const onlyFrame =
      selectedIds.size === 1 && nodeById.get([...selectedIds][0])?.node_type === "frame"
        ? [...selectedIds][0]
        : null;
    const items: (MenuItem | "sep")[] = [
      {
        key: "note",
        label: "Add note",
        icon: <StickyNote size={13} />,
        onPick: () => placeNode("note", world.x - 100, world.y - 100)
      },
      {
        key: "shape",
        label: "Add shape",
        icon: <Square size={13} />,
        onPick: () => placeNode("shape", world.x - 140, world.y - 100)
      }
    ];
    if (onlyFrame) {
      items.push({
        key: "prompts",
        label: "Add prompt boxes",
        icon: <Sparkles size={13} />,
        onPick: () => quickAdd(onlyFrame)
      });
    }
    items.push("sep", {
      key: "paste",
      label: "Paste here",
      icon: <Clipboard size={13} />,
      disabled: clipboard.current.nodes.length === 0,
      onPick: () => pasteClipboard(world)
    });
    items.push({ key: "fit", label: "Fit all", icon: <Maximize2 size={13} />, onPick: fitAll });
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input.menu, selectedIds, nodeById, toWorld]);

  /* ─── Render ─────────────────────────────────────────────── */

  /* Stable callback identities, one set per node id, created on first render of
     that node and never replaced. Without this every node component would get
     six fresh closures per frame and React.memo could never bail — which is the
     whole point of it during a drag, when the board re-renders 60×/second. The
     closures reach the current mutators through a ref, so they never go stale. */
  const calls = useRef({
    setField,
    quickAdd,
    makeActive,
    duplicateSelection,
    deleteSelection
  });
  calls.current = { setField, quickAdd, makeActive, duplicateSelection, deleteSelection };

  const handlerCache = useRef(new Map<string, NodeHandlers>());
  function handlersFor(id: string): NodeHandlers {
    const hit = handlerCache.current.get(id);
    if (hit) return hit;
    const made: NodeHandlers = {
      onDuplicate: () => calls.current.duplicateSelection([id]),
      onDelete: () => calls.current.deleteSelection([id]),
      onCommit: (content: string) => calls.current.setField(id, "content", content),
      onSetTint: (t: StitchTint) => calls.current.setField(id, "tint", t),
      onSetShapeKind: (k: StitchShapeKind) => calls.current.setField(id, "shape_kind", k),
      onSetDuration: (d: number) => calls.current.setField(id, "duration", d),
      onQuickAdd: () => calls.current.quickAdd(id),
      onMakeActive: () => calls.current.makeActive(id)
    };
    handlerCache.current.set(id, made);
    return made;
  }

  const draftSource = connect ? nodeById.get(connect.sourceId) : null;
  const shapes = paintOrder.filter((n) => n.node_type === "shape");
  const cards = paintOrder.filter((n) => n.node_type !== "shape");
  const soleId = selectedIds.size === 1 ? [...selectedIds][0] : null;

  function renderNode(node: StitchBoardNode) {
    const dropTarget =
      connect && connect.targetId === node.id && connect.sourceId !== node.id
        ? connect.ok
          ? ("ok" as const)
          : ("no" as const)
        : undefined;
    const h = handlersFor(node.id);
    const shared = {
      selected: selectedIds.has(node.id),
      dimmed: chainedIds.has(node.id) && !orderIndex.has(node.id),
      // Side dots would be noise on a card that is already moving.
      hovered: hoverId === node.id && tool === "select" && !drag,
      soleSelection: soleId === node.id,
      drop: dropTarget,
      override: drag?.ids.has(node.id) || resizeDraft?.id === node.id ? liveBox(node) : undefined,
      onDuplicate: h.onDuplicate,
      onDelete: h.onDelete
    };

    if (node.node_type === "frame") {
      return (
        <FrameNode
          key={node.id}
          node={node}
          {...shared}
          orderNo={orderIndex.get(node.id) ?? null}
          isChainHead={headIds.has(node.id)}
          onSetDuration={h.onSetDuration}
          onQuickAdd={h.onQuickAdd}
          onMakeActive={h.onMakeActive}
        />
      );
    }
    if (node.node_type === "note") {
      return (
        <NoteNode
          key={node.id}
          node={node}
          {...shared}
          editing={editingId === node.id}
          autoFocus={focusId === node.id}
          onCommit={h.onCommit}
          onSetTint={h.onSetTint}
        />
      );
    }
    if (node.node_type === "shape") {
      return (
        <ShapeNode
          key={node.id}
          node={node}
          {...shared}
          onSetTint={h.onSetTint}
          onSetShapeKind={h.onSetShapeKind}
        />
      );
    }
    return (
      <PromptNode
        key={node.id}
        node={node}
        {...shared}
        editing={editingId === node.id}
        autoFocus={focusId === node.id}
        onCommit={h.onCommit}
      />
    );
  }

  return (
    <div className="main-inner" style={{ paddingBottom: 0 }}>
      <header className="page-head">
        <div>
          <div className="crumb">05 / WORKSPACE · STITCH</div>
          <h1>Stitch</h1>
          <div className="sub">
            Drag frames out of the library onto the board, wire them output → input, and the connected chain
            becomes your cut order. Attach prompt boxes to a shot, and group anything with notes and shapes.
          </div>
        </div>
        <div className="actions">
          <span className="pip-state" data-status={activeChain ? "done" : "draft"}>
            {activeChain
              ? `CHAIN ${activeLetter} · ${activeChain.nodeIds.length} SHOTS · ${activeDuration.toFixed(1)}s`
              : "NO CHAIN CONNECTED"}
          </span>
          <button className="btn btn-primary" onClick={() => onSwitchWorkspace("export")}>
            Continue to Export <ArrowRight size={14} />
          </button>
        </div>
      </header>

      <div ref={shellRef} className="stitch-shell" tabIndex={0}>
        <div
          ref={boardRef}
          className="stitch-board"
          data-panning={panning}
          data-tool={tool}
          data-space={input.spaceHeld}
          data-drag={!!drag}
          data-marquee={!!marquee}
          onPointerDown={input.onBoardPointerDown}
          onPointerMove={input.onBoardPointerMove}
          onPointerLeave={input.onBoardPointerLeave}
          onDoubleClick={input.onBoardDoubleClick}
          onContextMenu={input.onBoardContextMenu}
        >
          <div
            className="stitch-world"
            style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})` }}
          >
            {/* Three passes: shapes are backdrops, then the edges, then the cards.
                The z-index ladder in globals.css keeps that order at any DOM depth. */}
            {shapes.map(renderNode)}

            {/* Zero-size viewport + overflow:visible — paths draw at any world
                coordinate, including negative ones. */}
            <svg className="stitch-edges" width={1} height={1}>
              {edges.map(({ t, kind, path, isActive }) => (
                /* No invisible hit-stroke: a 16px transparent stroke swallowed
                   ordinary clicks near a curve (blocking deselect and marquee)
                   and popped a delete confirm. The label's × below is the delete. */
                <path
                  key={t.id}
                  className="stitch-edge"
                  data-kind={kind}
                  data-state={kind === "chain" ? t.state : undefined}
                  data-active={isActive}
                  d={path.d}
                />
              ))}

              {draftSource && connect && (
                <path
                  className="stitch-edge-draft"
                  d={draftPath(sideAnchor(liveBox(draftSource), connect.side), connect.side, connect.to)}
                />
              )}

              {guides.map((g, i) => (
                <line
                  key={`guide-${i}`}
                  className="stitch-guide"
                  x1={g.axis === "x" ? g.at : g.from}
                  x2={g.axis === "x" ? g.at : g.to}
                  y1={g.axis === "x" ? g.from : g.at}
                  y2={g.axis === "x" ? g.to : g.at}
                />
              ))}

              {marquee && (
                <rect
                  className="stitch-marquee"
                  x={marquee.x}
                  y={marquee.y}
                  width={marquee.w}
                  height={marquee.h}
                />
              )}

              {shapeDraft && (
                <rect
                  className="stitch-shape-draft"
                  x={shapeDraft.x}
                  y={shapeDraft.y}
                  width={shapeDraft.w}
                  height={shapeDraft.h}
                />
              )}
            </svg>

            {edges.map(({ t, kind, path, from, to, isActive }) => (
              <div
                key={`label-${t.id}`}
                className="stitch-edge-label"
                data-edge-id={t.id}
                data-part="chrome"
                /* Attach and link edges get no nn → nn pill and no style name —
                   only a × that appears on hover. */
                data-bare={kind !== "chain"}
                data-active={isActive}
                style={{ left: path.label.x, top: path.label.y }}
                title={kind === "chain" ? `${t.style} · ${t.state}` : "Connection"}
              >
                {kind === "chain" &&
                  (isActive
                    ? `${String(from).padStart(2, "0")} → ${String(to).padStart(2, "0")} · ${t.style}`
                    : t.style)}
                <button type="button" className="x" title="Remove connection" onClick={() => deleteTransition(t.id)}>
                  <X size={10} />
                </button>
              </div>
            ))}

            {cards.map(renderNode)}
          </div>

          {nodes.length === 0 && (
            <div className="stitch-empty">
              <span className="t-eyebrow">EMPTY BOARD</span>
              <p style={{ marginTop: "var(--sp-2)", fontSize: "var(--t-body-s)" }}>
                Drag a frame out of the library, or pick a tool below to drop a prompt, a note or a shape.
              </p>
            </div>
          )}
        </div>

        <FrameDrawer
          open={drawerOpen}
          groups={drawer}
          placedCount={placedCount}
          shellRef={shellRef}
          onToggle={() => setDrawerOpen((v) => !v)}
          onThumbPointerDown={onThumbPointerDown}
        />

        {chains.length > 1 && (
          <div className="stitch-chain-bar">
            {chains.map((c, i) => {
              const secs = c.nodeIds.reduce((sum, id) => sum + (nodeById.get(id)?.duration ?? 0), 0);
              return (
                <button
                  key={c.headId}
                  className="pip-state"
                  data-active={activeChain?.headId === c.headId}
                  onClick={() => makeActive(c.headId)}
                >
                  {`CHAIN ${String.fromCharCode(65 + i)} · ${c.nodeIds.length} SHOTS · ${secs.toFixed(1)}s`}
                </button>
              );
            })}
          </div>
        )}

        <div className="stitch-zoom">
          <button onClick={() => zoomBy(0.85)} title="Zoom out">
            <Minus size={14} />
          </button>
          <span className="readout">{Math.round(viewport.zoom * 100)}%</span>
          <button onClick={() => zoomBy(1.15)} title="Zoom in">
            <Plus size={14} />
          </button>
        </div>

        <div className="stitch-dock">
          <button
            data-armed={tool === "select"}
            onClick={() => {
              input.setTool("select");
              input.setSticky(false);
            }}
            title="Select — drag the board for a marquee"
          >
            <MousePointer2 size={15} />
          </button>
          <button
            data-armed={tool === "hand"}
            onClick={() => {
              input.setTool("hand");
              input.setSticky(false);
            }}
            title="Hand — drag to pan (or hold space)"
          >
            <Hand size={15} />
          </button>
          <span className="sep" />
          <button data-active={drawerOpen} onClick={() => setDrawerOpen((v) => !v)} title="Frame library">
            <Layers size={15} />
          </button>
          <span className="sep" />
          {PLACERS.map(({ tool: t, icon: Icon, title }) => (
            <button key={t} data-armed={tool === t} onClick={(e) => input.armTool(t, e.shiftKey)} title={title}>
              <Icon size={15} />
            </button>
          ))}
          <span className="sep" />
          <button onClick={() => ops.undo(project.id)} disabled={!ops.canUndo} title="Undo">
            <Undo2 size={15} />
          </button>
          <button onClick={() => ops.redo(project.id)} disabled={!ops.canRedo} title="Redo">
            <Redo2 size={15} />
          </button>
          <span className="sep" />
          <button onClick={fitAll} title="Frame all">
            <Maximize2 size={15} />
          </button>
          <button onClick={reset} title="Reset view">
            <Home size={15} />
          </button>
        </div>

        {input.menu && (
          <BoardMenu
            x={input.menu.x}
            y={input.menu.y}
            shellRef={shellRef}
            items={menuItems}
            onClose={() => input.setMenu(null)}
          />
        )}

        {ghost && (
          <div
            className="stitch-drag-ghost"
            style={{
              transform: `translate(${ghost.cx - GHOST_W / 2}px, ${ghost.cy - GHOST_H / 2}px)`
            }}
          >
            {ghost.url && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={ghost.url} alt={ghost.label} draggable={false} />
            )}
          </div>
        )}
      </div>

      {toast && (
        <div className="storyboard-toast" data-kind={toast.kind}>
          {toast.text}
        </div>
      )}
    </div>
  );
}
