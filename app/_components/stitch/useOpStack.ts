"use client";

import { useCallback, useRef, useState } from "react";
import type { StitchBoardNode, StitchBoardTransition } from "../../../lib/types";
import type { Box } from "./nodeGeometry";

/**
 * Client-session undo/redo for the Stitch board.
 *
 * Every board mutation is optimistic-then-fire-and-forget against routes that
 * already exist, so undo is built from their inverses rather than from any new
 * server surface: no schema change, no soft-delete column, no new endpoint.
 *
 * The one genuinely hard case is delete-undo. Ids are minted server-side
 * (nanoid), so a recreated node comes back with a *new* id and every op still
 * sitting on the stack is holding the old one. Rather than rewriting the stack
 * in place — which would have to reach into ops that may themselves be undone
 * later — a remap is recorded and `resolve()` chases it at replay time. That
 * makes the map the single source of truth and survives
 * delete → undo → delete → undo → redo without special-casing.
 *
 * Undo is per session. A reload starts from the server's truth, which is the
 * honest thing for a board with no server-side history.
 */

export type FieldKey = "content" | "tint" | "shape_kind" | "duration" | "z";

export interface Pt {
  x: number;
  y: number;
}

export type Op =
  | { t: "move"; items: { id: string; from: Pt; to: Pt }[] }
  | { t: "resize"; items: { id: string; from: Box; to: Box }[] }
  | { t: "create"; nodes: StitchBoardNode[]; edges: StitchBoardTransition[] }
  | { t: "delete"; nodes: StitchBoardNode[]; edges: StitchBoardTransition[] }
  | { t: "connect"; edge: StitchBoardTransition }
  | { t: "field"; id: string; key: FieldKey; from: string | number; to: string | number };

/** Ops pushed between begin() and end() undo and redo as a single step. */
type Step = Op[];

const BOUND = 50;

export interface OpStackHooks {
  /** Merge server-authored nodes/edges back into local state. */
  onRestore: (nodes: StitchBoardNode[], edges: StitchBoardTransition[]) => void;
  /** Drop these ids from local state — the caller's snapshot already cascaded. */
  onRemove: (nodeIds: string[], edgeIds: string[]) => void;
  onMove: (items: { id: string; x: number; y: number }[]) => void;
  onResize: (items: { id: string; box: Box }[]) => void;
  onField: (id: string, key: FieldKey, value: string | number) => void;
  /** Rewrite live references (selection, active head, clipboard) after a remap. */
  onRemap: (map: Map<string, string>) => void;
  onError: (message: string) => void;
}

export function useOpStack(hooks: OpStackHooks) {
  const hooksRef = useRef(hooks);
  hooksRef.current = hooks;

  const undoStack = useRef<Step[]>([]);
  const redoStack = useRef<Step[]>([]);
  const batch = useRef<Op[] | null>(null);
  const busy = useRef(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  /* old id → current id, chased transitively. Never rewritten backwards: a
     re-deleted, re-undone node just adds another link to the chain. */
  const idMap = useRef(new Map<string, string>());

  const resolve = useCallback((id: string) => {
    let cur = id;
    for (let hops = 0; hops < 32; hops += 1) {
      const next = idMap.current.get(cur);
      if (!next || next === cur) return cur;
      cur = next;
    }
    return cur;
  }, []);

  const sync = useCallback(() => {
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(redoStack.current.length > 0);
  }, []);

  const push = useCallback(
    (op: Op) => {
      if (batch.current) {
        batch.current.push(op);
        return;
      }
      undoStack.current.push([op]);
      if (undoStack.current.length > BOUND) undoStack.current.shift();
      redoStack.current = [];
      sync();
    },
    [sync]
  );

  const begin = useCallback(() => {
    if (!batch.current) batch.current = [];
  }, []);

  const end = useCallback(() => {
    const ops = batch.current;
    batch.current = null;
    if (!ops || ops.length === 0) return;
    undoStack.current.push(ops);
    if (undoStack.current.length > BOUND) undoStack.current.shift();
    redoStack.current = [];
    sync();
  }, [sync]);

  const clear = useCallback(() => {
    undoStack.current = [];
    redoStack.current = [];
    batch.current = null;
    idMap.current = new Map();
    sync();
  }, [sync]);

  /* ─── Primitives ─────────────────────────────────────────── */

  const patch = useCallback(
    async (id: string, body: object) => {
      const res = await fetch(`/api/stitch/nodes/${resolve(id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
      }).catch(() => null);
      // A silently dropped PATCH leaves the board permanently ahead of the DB.
      if (!res?.ok) hooksRef.current.onError("That change did not save.");
    },
    [resolve]
  );

  /**
   * Recreate a snapshot and record where every id landed.
   *
   * Frames go back through the by-variant / by-beat branch of POST
   * /api/stitch/nodes; furniture through the node_type branch. Neither branch
   * takes w/h for a frame, so anything the create call can't carry follows in
   * one PATCH. Edges go last, resolved through the fresh map so a wholly
   * recreated cluster rewires to itself rather than to its dead originals.
   */
  const recreate = useCallback(
    async (nodes: StitchBoardNode[], edges: StitchBoardTransition[], projectId: string) => {
      const map = new Map<string, string>();
      const restoredNodes: StitchBoardNode[] = [];

      for (const n of nodes) {
        const isFrame = n.node_type === "frame";
        const body = isFrame
          ? {
              ...(n.variant_id ? { variant_id: n.variant_id } : { beat_id: n.beat_id }),
              x: n.x,
              y: n.y,
              z: n.z,
              duration: n.duration,
              video_prompt: n.video_prompt,
              sound_prompt: n.sound_prompt,
              allow_duplicate: true
            }
          : {
              node_type: n.node_type,
              project_id: projectId,
              x: n.x,
              y: n.y,
              z: n.z,
              w: n.w,
              h: n.h,
              tint: n.tint,
              shape_kind: n.shape_kind,
              content: n.content
            };
        const res = await fetch("/api/stitch/nodes", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body)
        }).catch(() => null);
        const data = (await res?.json().catch(() => ({}))) as { node?: StitchBoardNode };
        if (!res?.ok || !data.node) {
          hooksRef.current.onError("Could not restore everything.");
          continue;
        }
        let restored = data.node;
        // Only a frame needs the follow-up: its create branch takes no w/h.
        if (isFrame && (n.w > 0 || n.h > 0)) {
          await fetch(`/api/stitch/nodes/${restored.id}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ w: n.w, h: n.h })
          }).catch(() => {});
          restored = { ...restored, w: n.w, h: n.h };
        }
        /* Append to the chain rather than overwriting its head: the op still
           holds the original id, but any *live* reference (selection, active
           head, clipboard) holds whatever the last recreate produced. Linking
           `current → new` keeps resolve() walking the whole chain, and handing
           both keys to onRemap lets live references follow too. */
        const current = resolve(n.id);
        idMap.current.set(current, restored.id);
        map.set(n.id, restored.id);
        map.set(current, restored.id);
        restoredNodes.push(restored);
      }

      const restoredEdges: StitchBoardTransition[] = [];
      for (const e of edges) {
        const res = await fetch("/api/transitions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            from_node_id: resolve(e.from_node_id),
            to_node_id: resolve(e.to_node_id),
            style: e.style
          })
        }).catch(() => null);
        const data = (await res?.json().catch(() => ({}))) as { transition?: StitchBoardTransition };
        if (!res?.ok || !data.transition) {
          /* A restored shot whose chain edges 409 comes back floating; saying so
             is the difference between a partial undo and an invisible one. */
          hooksRef.current.onError("Could not restore everything.");
          continue;
        }
        const currentEdge = resolve(e.id);
        idMap.current.set(currentEdge, data.transition.id);
        map.set(e.id, data.transition.id);
        map.set(currentEdge, data.transition.id);
        restoredEdges.push(data.transition);
      }

      hooksRef.current.onRestore(restoredNodes, restoredEdges);
      if (map.size) hooksRef.current.onRemap(map);
    },
    [resolve]
  );

  /** Remove a snapshot again. Node deletes cascade server-side; edges follow. */
  const destroy = useCallback(
    async (nodes: StitchBoardNode[], edges: StitchBoardTransition[]) => {
      /* Resolved ids, always: the op holds the ids the nodes had when it was
         recorded, but local state holds whatever the last recreate minted.
         Removing by the recorded id silently no-ops and leaves a ghost card
         that the very next undo then duplicates. */
      const nodeIds = nodes.map((n) => resolve(n.id));
      hooksRef.current.onRemove(nodeIds, edges.map((e) => resolve(e.id)));
      for (const id of nodeIds) {
        await fetch(`/api/stitch/nodes/${id}`, { method: "DELETE" }).catch(() => {});
      }
      // Only edges the node deletes didn't already cascade away.
      const owned = new Set(nodeIds);
      for (const e of edges) {
        if (owned.has(resolve(e.from_node_id)) || owned.has(resolve(e.to_node_id))) continue;
        await fetch(`/api/transitions/${resolve(e.id)}`, { method: "DELETE" }).catch(() => {});
      }
    },
    [resolve]
  );

  const applyMove = useCallback(
    async (items: { id: string; to: Pt }[]) => {
      // Local state is keyed by current ids; the op holds the recorded ones.
      hooksRef.current.onMove(items.map((i) => ({ id: resolve(i.id), x: i.to.x, y: i.to.y })));
      for (const i of items) await patch(i.id, { x: i.to.x, y: i.to.y });
    },
    [patch, resolve]
  );

  const applyResize = useCallback(
    async (items: { id: string; to: Box }[]) => {
      hooksRef.current.onResize(items.map((i) => ({ id: resolve(i.id), box: i.to })));
      for (const i of items) await patch(i.id, i.to);
    },
    [patch, resolve]
  );

  /* ─── Replay ─────────────────────────────────────────────── */

  const runOp = useCallback(
    async (op: Op, dir: "undo" | "redo", projectId: string) => {
      switch (op.t) {
        case "move":
          await applyMove(op.items.map((i) => ({ id: i.id, to: dir === "undo" ? i.from : i.to })));
          return;
        case "resize":
          await applyResize(op.items.map((i) => ({ id: i.id, to: dir === "undo" ? i.from : i.to })));
          return;
        case "create":
          if (dir === "undo") await destroy(op.nodes, op.edges);
          else await recreate(op.nodes, op.edges, projectId);
          return;
        case "delete":
          if (dir === "undo") await recreate(op.nodes, op.edges, projectId);
          else await destroy(op.nodes, op.edges);
          return;
        case "connect":
          if (dir === "undo") {
            const edgeId = resolve(op.edge.id);
            hooksRef.current.onRemove([], [edgeId]);
            await fetch(`/api/transitions/${edgeId}`, { method: "DELETE" }).catch(() => {});
          } else {
            await recreate([], [op.edge], projectId);
          }
          return;
        case "field": {
          const value = dir === "undo" ? op.from : op.to;
          hooksRef.current.onField(resolve(op.id), op.key, value);
          await patch(op.id, { [op.key]: value });
        }
      }
    },
    [applyMove, applyResize, destroy, recreate, patch, resolve]
  );

  /* One pending slot, not a drop: a replay awaits a PATCH per node, so a held
     Cmd+Z fires repeats straight into the busy window and the stack looks
     empty after a single step. One slot is enough to keep a hold moving without
     letting a leaned-on key queue an unbounded rewind. */
  const queued = useRef<{ dir: "undo" | "redo"; projectId: string } | null>(null);
  const replayRef = useRef<(dir: "undo" | "redo", projectId: string) => Promise<void>>(async () => {});

  const replay = useCallback(
    async (dir: "undo" | "redo", projectId: string) => {
      // Serialized: a held Cmd+Z must not interleave two replays over one id map.
      if (busy.current) {
        queued.current = { dir, projectId };
        return;
      }
      const from = dir === "undo" ? undoStack.current : redoStack.current;
      const to = dir === "undo" ? redoStack.current : undoStack.current;
      const step = from.pop();
      if (!step) {
        queued.current = null;
        return;
      }
      busy.current = true;
      try {
        // Undo runs the step backwards so a group's internal order inverts too.
        const ops = dir === "undo" ? [...step].reverse() : step;
        for (const op of ops) await runOp(op, dir, projectId);
        to.push(step);
        if (to.length > BOUND) to.shift();
      } finally {
        busy.current = false;
        sync();
      }
      const next = queued.current;
      queued.current = null;
      if (next) await replayRef.current(next.dir, next.projectId);
    },
    [runOp, sync]
  );
  replayRef.current = replay;

  const undo = useCallback((projectId: string) => replay("undo", projectId), [replay]);
  const redo = useCallback((projectId: string) => replay("redo", projectId), [replay]);

  return { push, begin, end, clear, undo, redo, canUndo, canRedo, resolve };
}
