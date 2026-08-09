"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { connectVerdict } from "../../../lib/stitch/connectRules";
import { SHAPE_MIN, boxOf, nodeBox, type Box } from "./nodeGeometry";
import type { StitchNodeType } from "../../../lib/stitch/nodeTypes";
import type { StitchBoardNode, StitchBoardTransition } from "../../../lib/types";
import { buildCandidates, snap, type Candidates, type Guide } from "./alignGuides";
import { applyHandle, type Handle } from "./resize";
import type { Side } from "./edgeGeometry";

/**
 * The board's whole input layer: tool state, selection, the interaction state
 * machine, and every pointer / wheel / keyboard route into it.
 *
 * Nodes render data attributes only (`data-node-id`, `data-part`, `data-handle`,
 * `data-side`) and hold no pointer handlers of their own; this hook hit-tests
 * with `closest()` from a single listener on `.stitch-board`. That inversion is
 * what makes "drag anywhere on the body", marquee, multi-drag and alt-duplicate
 * one decision table instead of five components each guessing.
 *
 * Move/up/cancel are bound to `window` for the life of an interaction, never to
 * the board: the drawer, dock, chain bar and zoom cluster are siblings painted
 * over `.stitch-board`, so a release over any of them never reaches the board
 * itself. That was the v2 connect-drag bug, and the guarantee is kept here for
 * every interaction rather than patched per-feature.
 */

export type Tool = StitchNodeType | "select" | "hand";

export interface Pt {
  x: number;
  y: number;
}

/** Movement in screen px before a press becomes a drag rather than a click. */
const DRAG_ARM_PX = 3;
/** Under this a shape drag is a click and lands at the default size. */
const DRAG_SIZE_THRESHOLD = 8;
/** Snap threshold in *screen* px — see the note in the drag flush below. */
const SNAP_SCREEN_PX = 6;

type Interaction =
  | { kind: "idle" }
  | { kind: "pan"; lastClient: Pt }
  | { kind: "marquee"; originWorld: Pt; additive: boolean; base: Set<string> }
  | {
      kind: "drag-nodes";
      ids: string[];
      grabWorld: Pt;
      start: Map<string, Pt>;
      startBoxes: Box[];
      duplicating: boolean;
      moved: boolean;
      cand: Candidates;
      /* Shift-clicking an already-selected node means "drop it from the
         selection" — but only if it turns out to be a click. Removing it on
         pointerdown would make shift-dragging an existing multi-selection by one
         of its own members leave that member behind. */
      deselectOnUp: string | null;
    }
  | { kind: "resize"; id: string; type: StitchNodeType; handle: Handle; start: Box; box: Box }
  | { kind: "connect"; sourceId: string; side: Side }
  | { kind: "place"; startWorld: Pt; startClient: Pt };

export interface BoardMenuState {
  x: number;
  y: number;
  nodeId: string | null;
  edgeId: string | null;
}

export interface ConnectDraft {
  sourceId: string;
  side: Side;
  to: Pt;
  targetId: string | null;
  ok: boolean;
}

export interface BoardInputOptions {
  boardRef: RefObject<HTMLDivElement | null>;
  shellRef: RefObject<HTMLDivElement | null>;
  nodesRef: RefObject<StitchBoardNode[]>;
  transitionsRef: RefObject<StitchBoardTransition[]>;
  zoomRef: RefObject<number>;
  toWorld: (clientX: number, clientY: number) => Pt;
  worldRect: () => Box;
  panBy: (dx: number, dy: number) => void;
  zoomBy: (factor: number) => void;
  setPanning: (v: boolean) => void;

  onCommitMove: (items: { id: string; from: Pt; to: Pt }[]) => void;
  onCommitResize: (id: string, from: Box, to: Box) => void;
  onDuplicateDrag: (ids: string[], dx: number, dy: number) => void;
  onPlace: (type: StitchNodeType, x: number, y: number, size?: { w: number; h: number }) => void;
  onConnect: (sourceId: string, targetId: string) => void;
  onDeleteSelection: (ids: string[]) => void;
  onDuplicateSelection: (ids: string[]) => void;
  onQuickAdd: (frameId: string) => void;
  onCopy: (ids: string[]) => void;
  onPaste: (world: Pt | null) => void;
  onUndo: () => void;
  onRedo: () => void;
  onFitAll: () => void;
}

export function useBoardInput(o: BoardInputOptions) {
  const opts = useRef(o);
  opts.current = o;

  const [tool, setTool] = useState<Tool>("select");
  const [sticky, setSticky] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [menu, setMenu] = useState<BoardMenuState | null>(null);

  /* Published per-frame interaction state. Kept minimal on purpose: a drag
     publishes one {ids, dx, dy} rather than rewriting the node array, so only
     the dragged cards and the edges touching them re-render (see F3). */
  const [drag, setDrag] = useState<{ ids: Set<string>; dx: number; dy: number } | null>(null);
  const [resizeDraft, setResizeDraft] = useState<{ id: string; box: Box } | null>(null);
  const [marquee, setMarquee] = useState<Box | null>(null);
  const [connect, setConnect] = useState<ConnectDraft | null>(null);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [shapeDraft, setShapeDraft] = useState<Box | null>(null);

  const inter = useRef<Interaction>({ kind: "idle" });
  const pending = useRef<{ x: number; y: number; alt: boolean } | null>(null);
  const raf = useRef<number | null>(null);
  const downClient = useRef<Pt>({ x: 0, y: 0 });
  const armed = useRef(false);
  const selectedRef = useRef(selectedIds);
  selectedRef.current = selectedIds;
  const toolRef = useRef(tool);
  toolRef.current = tool;
  const editingRef = useRef(editingId);
  editingRef.current = editingId;

  const nodeMap = useCallback(() => {
    const m = new Map<string, StitchBoardNode>();
    for (const n of opts.current.nodesRef.current ?? []) m.set(n.id, n);
    return m;
  }, []);

  /* ─── Interaction lifecycle ──────────────────────────────── */

  const clearPublished = useCallback(() => {
    setDrag(null);
    setResizeDraft(null);
    setMarquee(null);
    setConnect(null);
    setGuides([]);
    setShapeDraft(null);
  }, []);

  const detach = useRef<(() => void) | null>(null);

  const endInteraction = useCallback(() => {
    if (raf.current !== null) {
      cancelAnimationFrame(raf.current);
      raf.current = null;
    }
    pending.current = null;
    inter.current = { kind: "idle" };
    armed.current = false;
    detach.current?.();
    detach.current = null;
    opts.current.setPanning(false);
    clearPublished();
  }, [clearPublished]);

  /** Abandon whatever is in flight and put the board back where it was. */
  const cancelInteraction = useCallback(() => {
    const i = inter.current;
    if (i.kind === "drag-nodes" && i.moved) {
      // Local-only restore: nothing was PATCHed until the drop.
      opts.current.onCommitMove(
        i.ids.map((id) => {
          const from = i.start.get(id) ?? { x: 0, y: 0 };
          return { id, from, to: from };
        })
      );
    }
    if (i.kind === "resize") {
      opts.current.onCommitResize(i.id, i.start, i.start);
    }
    endInteraction();
  }, [endInteraction]);

  /* ─── Per-frame flush ────────────────────────────────────── */

  const flush = useCallback(() => {
    raf.current = null;
    const p = pending.current;
    if (!p) return;
    pending.current = null;
    const i = inter.current;
    const { toWorld } = opts.current;

    if (i.kind === "pan") {
      opts.current.panBy(p.x - i.lastClient.x, p.y - i.lastClient.y);
      i.lastClient = { x: p.x, y: p.y };
      return;
    }

    if (i.kind === "marquee") {
      const w = toWorld(p.x, p.y);
      const rect = {
        x: Math.min(i.originWorld.x, w.x),
        y: Math.min(i.originWorld.y, w.y),
        w: Math.abs(w.x - i.originWorld.x),
        h: Math.abs(w.y - i.originWorld.y)
      };
      setMarquee(rect);
      const hit = new Set(i.additive ? i.base : []);
      for (const n of opts.current.nodesRef.current ?? []) {
        const b = boxOf(n);
        if (
          b.x < rect.x + rect.w &&
          b.x + b.w > rect.x &&
          b.y < rect.y + rect.h &&
          b.y + b.h > rect.y
        ) {
          hit.add(n.id);
        }
      }
      setSelectedIds(hit);
      return;
    }

    if (i.kind === "drag-nodes") {
      const w = toWorld(p.x, p.y);
      let dx = w.x - i.grabWorld.x;
      let dy = w.y - i.grabWorld.y;
      /* Threshold in screen px, not world px: a fixed world threshold is 1.5
         screen px at 0.25× (unfeelable) and 12 at 2× (grabby). One constant. */
      const zoom = opts.current.zoomRef.current ?? 1;
      const moved = { x: 0, y: 0, w: 0, h: 0 };
      const bb = i.startBoxes;
      moved.x = Math.min(...bb.map((b) => b.x)) + dx;
      moved.y = Math.min(...bb.map((b) => b.y)) + dy;
      moved.w = Math.max(...bb.map((b) => b.x + b.w)) - Math.min(...bb.map((b) => b.x));
      moved.h = Math.max(...bb.map((b) => b.y + b.h)) - Math.min(...bb.map((b) => b.y));
      const s = snap(moved, i.cand, SNAP_SCREEN_PX / zoom);
      dx += s.dx;
      dy += s.dy;
      i.moved = true;
      setGuides(s.guides);
      setDrag({ ids: new Set(i.ids), dx: Math.round(dx), dy: Math.round(dy) });
      return;
    }

    if (i.kind === "resize") {
      const w = toWorld(p.x, p.y);
      const box = applyHandle(i.type, i.start, i.handle, w);
      i.box = box;
      setResizeDraft({ id: i.id, box });
      return;
    }

    if (i.kind === "connect") {
      const w = toWorld(p.x, p.y);
      /* elementFromPoint once per frame, not per event — the same hit-test the
         drawer drop uses, and the only way to find a target under a pointer
         that took no capture. */
      const targetId = nodeIdAtPoint(p.x, p.y);
      let ok = false;
      if (targetId && targetId !== i.sourceId) {
        const map = nodeMap();
        const src = map.get(i.sourceId);
        const tgt = map.get(targetId);
        ok = !!src && !!tgt && connectVerdict(src, tgt, map, opts.current.transitionsRef.current ?? []).ok;
      }
      setConnect({ sourceId: i.sourceId, side: i.side, to: w, targetId, ok });
      return;
    }

    if (i.kind === "place") {
      if (toolRef.current !== "shape") return;
      const w = toWorld(p.x, p.y);
      setShapeDraft({
        x: Math.min(i.startWorld.x, w.x),
        y: Math.min(i.startWorld.y, w.y),
        w: Math.abs(w.x - i.startWorld.x),
        h: Math.abs(w.y - i.startWorld.y)
      });
    }
  }, [nodeMap]);

  const schedule = useCallback(
    (e: PointerEvent) => {
      pending.current = { x: e.clientX, y: e.clientY, alt: e.altKey };
      if (raf.current === null) raf.current = requestAnimationFrame(flush);
    },
    [flush]
  );

  /* ─── Commit on release ──────────────────────────────────── */

  const finish = useCallback(
    (e: PointerEvent) => {
      // Flush synchronously so the drop uses the pointer's final position.
      if (raf.current !== null) {
        cancelAnimationFrame(raf.current);
        raf.current = null;
      }
      pending.current = { x: e.clientX, y: e.clientY, alt: e.altKey };
      flush();

      const i = inter.current;
      const c = opts.current;

      if (i.kind === "drag-nodes" && !armed.current) {
        if (i.deselectOnUp) {
          const next = new Set(selectedRef.current);
          next.delete(i.deselectOnUp);
          setSelectedIds(next);
        }
      } else if (i.kind === "drag-nodes") {
        // `drag` state was just written by flush; recompute from the same source.
        const w = c.toWorld(e.clientX, e.clientY);
        const dx = w.x - i.grabWorld.x;
        const dy = w.y - i.grabWorld.y;
        const zoom = c.zoomRef.current ?? 1;
        const bb = i.startBoxes;
        const moved = {
          x: Math.min(...bb.map((b) => b.x)) + dx,
          y: Math.min(...bb.map((b) => b.y)) + dy,
          w: Math.max(...bb.map((b) => b.x + b.w)) - Math.min(...bb.map((b) => b.x)),
          h: Math.max(...bb.map((b) => b.y + b.h)) - Math.min(...bb.map((b) => b.y))
        };
        const s = snap(moved, i.cand, SNAP_SCREEN_PX / zoom);
        const dxdy = { dx: Math.round(dx + s.dx), dy: Math.round(dy + s.dy) };
        if (i.duplicating) {
          /* Figma semantics: the originals never moved (the drag was a preview
             of where the copies land), so they snap back with no PATCH and one
             duplicate call per node places the copies at the drop delta. One
             round trip, and no id race against a locally-invented copy. */
          c.onDuplicateDrag(i.ids, dxdy.dx, dxdy.dy);
        } else if (dxdy.dx !== 0 || dxdy.dy !== 0) {
          c.onCommitMove(
            i.ids.map((id) => {
              const from = i.start.get(id) ?? { x: 0, y: 0 };
              return { id, from, to: { x: from.x + dxdy.dx, y: from.y + dxdy.dy } };
            })
          );
        }
      } else if (i.kind === "resize") {
        if (i.box.w !== i.start.w || i.box.h !== i.start.h || i.box.x !== i.start.x || i.box.y !== i.start.y) {
          c.onCommitResize(i.id, i.start, i.box);
        }
      } else if (i.kind === "connect") {
        const targetId = nodeIdAtPoint(e.clientX, e.clientY);
        if (targetId && targetId !== i.sourceId) c.onConnect(i.sourceId, targetId);
      } else if (i.kind === "marquee") {
        // A plain click on empty board with no movement clears the selection.
        if (!armed.current) setSelectedIds(new Set());
      } else if (i.kind === "place") {
        const t = toolRef.current;
        if (t !== "select" && t !== "hand") {
          const w = c.toWorld(e.clientX, e.clientY);
          const d = {
            x: Math.min(i.startWorld.x, w.x),
            y: Math.min(i.startWorld.y, w.y),
            w: Math.abs(w.x - i.startWorld.x),
            h: Math.abs(w.y - i.startWorld.y)
          };
          if (t === "shape" && Math.max(d.w, d.h) >= DRAG_SIZE_THRESHOLD) {
            c.onPlace("shape", d.x, d.y, { w: Math.max(SHAPE_MIN, d.w), h: Math.max(SHAPE_MIN, d.h) });
          } else {
            // A click drops the node centred on the pointer, not hanging off it.
            const box = nodeBox({ node_type: t, w: 0, h: 0 });
            c.onPlace(t, i.startWorld.x - box.w / 2, i.startWorld.y - box.h / 2);
          }
          if (!sticky) setTool("select");
        }
      }

      endInteraction();
    },
    [flush, endInteraction, sticky]
  );

  /**
   * `arm: true` skips the 3px threshold. Pan, resize and connect have no
   * click/drag ambiguity to resolve and feel dead if they only start after 3px;
   * a node press and a board press do, because a click there means "select".
   */
  const startInteraction = useCallback(
    (next: Interaction, e: React.PointerEvent | PointerEvent, arm = false) => {
      /* A second press during a live interaction (middle button mid-drag, a
         second finger) would otherwise overwrite `detach` and orphan the first
         interaction's window listeners for the life of the component — two
         `finish` runs per release, then a stray `endInteraction` on every
         pointerup on the page. Drop the previous binding before rebinding. */
      detach.current?.();
      detach.current = null;
      inter.current = next;
      armed.current = arm;
      downClient.current = { x: e.clientX, y: e.clientY };
      if (next.kind === "pan") opts.current.setPanning(true);

      const move = (ev: PointerEvent) => {
        if (!armed.current) {
          const far = Math.hypot(ev.clientX - downClient.current.x, ev.clientY - downClient.current.y);
          if (far <= DRAG_ARM_PX) return;
          armed.current = true;
        }
        schedule(ev);
      };
      const up = (ev: PointerEvent) => finish(ev);
      const cancel = () => cancelInteraction();

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", cancel);
      detach.current = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", cancel);
      };
    },
    [schedule, finish, cancelInteraction]
  );

  /* ─── Pointer-down decision table ────────────────────────── */

  const onBoardPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // A right-press does nothing here; onContextMenu owns it.
      if (e.button === 2) return;
      // A press while something is already in flight abandons it cleanly rather
      // than stacking a second interaction on top of the first.
      if (inter.current.kind !== "idle") cancelInteraction();
      setMenu(null);
      opts.current.shellRef.current?.focus({ preventScroll: true });

      const el = e.target as HTMLElement | null;
      const partEl = el?.closest?.("[data-part]") as HTMLElement | null;
      const nodeEl = el?.closest?.("[data-node-id]") as HTMLElement | null;
      const part = partEl?.dataset.part ?? null;
      const nodeId = nodeEl?.dataset.nodeId ?? null;

      if (e.button === 1 || spaceHeld || tool === "hand") {
        e.preventDefault();
        startInteraction({ kind: "pan", lastClient: { x: e.clientX, y: e.clientY } }, e, true);
        return;
      }
      // Chrome (tool clusters, tint swatches, foot buttons) keeps its native click.
      if (part === "chrome") return;
      // The caret only lives in the node that is actually in edit mode.
      if (part === "text" && nodeId && editingId === nodeId) return;

      if (part === "handle" && nodeId) {
        const node = nodeMap().get(nodeId);
        const handle = partEl?.dataset.handle as Handle | undefined;
        if (node && handle) {
          const start = boxOf(node);
          startInteraction(
            { kind: "resize", id: nodeId, type: node.node_type, handle, start, box: start },
            e,
            true
          );
          return;
        }
      }

      if (part === "port" && nodeId) {
        const side = (partEl?.dataset.side as Side | undefined) ?? "e";
        startInteraction({ kind: "connect", sourceId: nodeId, side }, e, true);
        setConnect({
          sourceId: nodeId,
          side,
          to: opts.current.toWorld(e.clientX, e.clientY),
          targetId: null,
          ok: false
        });
        return;
      }

      if (nodeId && tool === "select") {
        if (editingId && editingId !== nodeId) setEditingId(null);
        let ids = selectedRef.current;
        let deselectOnUp: string | null = null;
        if (e.shiftKey || e.metaKey || e.ctrlKey) {
          if (ids.has(nodeId)) {
            deselectOnUp = nodeId;
          } else {
            ids = new Set(ids).add(nodeId);
          }
        } else if (!ids.has(nodeId)) {
          // Pressing inside an existing multi-selection keeps it, so the whole
          // group drags from any one of its members.
          ids = new Set([nodeId]);
        }
        setSelectedIds(ids);
        if (editingId === nodeId) return; // dragging is off inside edit mode
        const map = nodeMap();
        const start = new Map<string, Pt>();
        const startBoxes: Box[] = [];
        const dragIds: string[] = [];
        for (const id of ids) {
          const n = map.get(id);
          if (!n) continue;
          dragIds.push(id);
          start.set(id, { x: n.x, y: n.y });
          startBoxes.push(boxOf(n));
        }
        if (dragIds.length === 0) return;
        const exclude = new Set(dragIds);
        const cand = buildCandidates(
          (opts.current.nodesRef.current ?? []).map((n) => ({ id: n.id, box: boxOf(n) })),
          exclude,
          inflate(opts.current.worldRect(), 400)
        );
        startInteraction(
          {
            kind: "drag-nodes",
            ids: dragIds,
            grabWorld: opts.current.toWorld(e.clientX, e.clientY),
            start,
            startBoxes,
            duplicating: e.altKey,
            moved: false,
            cand,
            deselectOnUp
          },
          e
        );
        return;
      }

      // Empty board.
      if (editingId) setEditingId(null);
      // `hand` already returned above, so anything not `select` is an armed tool.
      if (tool !== "select") {
        const w = opts.current.toWorld(e.clientX, e.clientY);
        startInteraction({ kind: "place", startWorld: w, startClient: { x: e.clientX, y: e.clientY } }, e);
        return;
      }
      startInteraction(
        {
          kind: "marquee",
          originWorld: opts.current.toWorld(e.clientX, e.clientY),
          additive: e.shiftKey || e.metaKey || e.ctrlKey,
          base: new Set(selectedRef.current)
        },
        e
      );
    },
    [tool, spaceHeld, editingId, startInteraction, nodeMap, cancelInteraction]
  );

  const onBoardPointerMove = useCallback((e: React.PointerEvent) => {
    if (inter.current.kind !== "idle") return;
    const el = e.target as HTMLElement | null;
    const nodeEl = el?.closest?.("[data-node-id]") as HTMLElement | null;
    const id = nodeEl?.dataset.nodeId ?? null;
    setHoverId((prev) => (prev === id ? prev : id));
  }, []);

  const onBoardPointerLeave = useCallback(() => setHoverId(null), []);

  const onBoardDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const el = e.target as HTMLElement | null;
      const nodeEl = el?.closest?.("[data-node-id]") as HTMLElement | null;
      const id = nodeEl?.dataset.nodeId ?? null;
      if (!id) return;
      const node = nodeMap().get(id);
      if (!node) return;
      if (node.node_type === "frame" || node.node_type === "shape") return;
      setSelectedIds(new Set([id]));
      setEditingId(id);
      // Caret at the click point when the browser can tell us; end-of-text otherwise.
      requestAnimationFrame(() => {
        const area = nodeEl?.querySelector('[data-part="text"]') as HTMLTextAreaElement | null;
        if (!area) return;
        area.focus();
        const doc = document as Document & {
          caretPositionFromPoint?: (x: number, y: number) => { offset: number } | null;
        };
        const pos = doc.caretPositionFromPoint?.(e.clientX, e.clientY);
        const offset = pos?.offset;
        if (typeof offset === "number") area.setSelectionRange(offset, offset);
        else area.setSelectionRange(area.value.length, area.value.length);
      });
    },
    [nodeMap]
  );

  const onBoardContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const el = e.target as HTMLElement | null;
      const nodeEl = el?.closest?.("[data-node-id]") as HTMLElement | null;
      const edgeEl = el?.closest?.("[data-edge-id]") as HTMLElement | null;
      const nodeId = nodeEl?.dataset.nodeId ?? null;
      const edgeId = edgeEl?.dataset.edgeId ?? null;
      if (nodeId && !selectedRef.current.has(nodeId)) setSelectedIds(new Set([nodeId]));
      setMenu({ x: e.clientX, y: e.clientY, nodeId, edgeId });
    },
    []
  );

  /* ─── Window-level cancels (F2) ──────────────────────────── */

  useEffect(() => {
    const bail = () => {
      setSpaceHeld(false);
      if (inter.current.kind !== "idle") cancelInteraction();
      setMenu(null);
    };
    window.addEventListener("blur", bail);
    document.addEventListener("visibilitychange", bail);
    return () => {
      window.removeEventListener("blur", bail);
      document.removeEventListener("visibilitychange", bail);
    };
  }, [cancelInteraction]);

  // Unmounting mid-drag would otherwise leave window listeners and a live rAF.
  useEffect(() => () => endInteraction(), [endInteraction]);

  /* ─── Keyboard ───────────────────────────────────────────── */

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const shell = opts.current.shellRef.current;
      if (!shell || !shell.contains(document.activeElement)) return;
      const mod = e.metaKey || e.ctrlKey;

      if (editingRef.current !== null) {
        // Everything else — including the textarea's own Cmd+Z — passes through.
        if (e.key === "Escape") {
          e.preventDefault();
          (document.activeElement as HTMLElement | null)?.blur?.();
          setEditingId(null);
        }
        return;
      }

      /* instanceof, not a cast: a key event can be dispatched at `window`, and
         `window.closest` is undefined — an optional chain on `target` would not
         save it, and the throw would silently kill every shortcut below. */
      const target = e.target instanceof Element ? e.target : null;

      if (e.code === "Space" && !mod) {
        /* Space is the activation key for every focusable control in the shell
           (the dock, the zoom cluster, the drawer thumbs). Swallowing it there
           would both eat the click and latch pan mode on. */
        if (target?.closest('input, textarea, select, [contenteditable], button, [role="button"], a[href]')) {
          return;
        }
        e.preventDefault();
        setSpaceHeld(true);
        return;
      }

      if (mod && (e.key === "0" || e.code === "Digit0")) {
        e.preventDefault();
        opts.current.onFitAll();
        return;
      }
      if (mod && (e.key === "=" || e.key === "+" || e.code === "Equal")) {
        e.preventDefault();
        opts.current.zoomBy(1.15);
        return;
      }
      if (mod && (e.key === "-" || e.key === "_" || e.code === "Minus")) {
        e.preventDefault();
        opts.current.zoomBy(0.85);
        return;
      }

      if (target?.closest("input, textarea, select, [contenteditable]")) return;

      if (mod && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setSelectedIds(new Set((opts.current.nodesRef.current ?? []).map((n) => n.id)));
        return;
      }
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) opts.current.onRedo();
        else opts.current.onUndo();
        return;
      }
      if (mod && e.key.toLowerCase() === "c") {
        e.preventDefault();
        opts.current.onCopy([...selectedRef.current]);
        return;
      }
      if (mod && e.key.toLowerCase() === "v") {
        e.preventDefault();
        opts.current.onPaste(null);
        return;
      }
      if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        opts.current.onDuplicateSelection([...selectedRef.current]);
        return;
      }
      if (mod && e.key.toLowerCase() === "e") {
        e.preventDefault();
        const only = [...selectedRef.current][0];
        const node = only ? nodeMap().get(only) : undefined;
        if (selectedRef.current.size === 1 && node?.node_type === "frame") {
          opts.current.onQuickAdd(node.id);
        }
        return;
      }
      if (mod) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedRef.current.size === 0) return;
        e.preventDefault();
        opts.current.onDeleteSelection([...selectedRef.current]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        /* One Esc peels one layer. An in-flight interaction comes first: mid-drag
           the director means "put that back", not "deselect". */
        if (inter.current.kind !== "idle") cancelInteraction();
        else if (menu) setMenu(null);
        else if (selectedRef.current.size) setSelectedIds(new Set());
        else if (toolRef.current !== "select") {
          setTool("select");
          setSticky(false);
        }
        return;
      }
      // Bare tool letters, FigJam-style.
      const k = e.key.toLowerCase();
      if (k === "v") setTool("select");
      else if (k === "h") setTool("hand");
      else if (k === "n") setTool("note");
      else if (k === "s") setTool("shape");
    }

    function onKeyUp(e: KeyboardEvent) {
      if (e.code === "Space") setSpaceHeld(false);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [cancelInteraction, menu, nodeMap]);

  /* Wheel and an outside press both dismiss the menu — a stale menu floating
     over a panned board is the classic freeform bug. */
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener("wheel", close, { passive: true });
    return () => window.removeEventListener("wheel", close);
  }, [menu]);

  const armTool = useCallback((next: StitchNodeType, shift: boolean) => {
    if (toolRef.current === next) {
      setTool("select");
      setSticky(false);
      return;
    }
    // Shift keeps a tool armed for repeat placement, Freeform-style.
    setSticky(shift);
    setTool(next);
  }, []);

  const selectOnly = useCallback((id: string | null) => {
    setSelectedIds(id ? new Set([id]) : new Set());
  }, []);

  const selectMany = useCallback((ids: string[]) => setSelectedIds(new Set(ids)), []);

  return {
    tool,
    setTool,
    sticky,
    setSticky,
    armTool,
    selectedIds,
    setSelectedIds,
    selectOnly,
    selectMany,
    editingId,
    setEditingId,
    hoverId,
    spaceHeld,
    menu,
    setMenu,
    drag,
    dragging: !!drag,
    resizeDraft,
    marquee,
    connect,
    guides,
    shapeDraft,
    onBoardPointerDown,
    onBoardPointerMove,
    onBoardPointerLeave,
    onBoardDoubleClick,
    onBoardContextMenu,
    cancelInteraction
  };
}

/**
 * The node under a screen point, looking *through* board chrome.
 *
 * `elementFromPoint` alone returns the topmost element, and an edge label
 * (z-index 4, `pointer-events: auto`) paints over every card — a connector
 * dropped on the part of a frame its own attach pill covers would hit-test to
 * nothing and be silently swallowed. Walking the full stack finds the card
 * beneath it.
 */
function nodeIdAtPoint(x: number, y: number): string | null {
  for (const el of document.elementsFromPoint(x, y)) {
    const node = (el as HTMLElement).closest?.("[data-node-id]") as HTMLElement | null;
    if (node) return node.dataset.nodeId ?? null;
  }
  return null;
}

function inflate(b: Box, by: number): Box {
  return { x: b.x - by, y: b.y - by, w: b.w + by * 2, h: b.h + by * 2 };
}
