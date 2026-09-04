"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
  type Node as RFNode,
  type Edge as RFEdge,
  type NodeChange,
  type EdgeChange,
  type NodeTypes,
  type ReactFlowInstance
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion } from "framer-motion";
import { ArrowRight, Music, Pause, Play } from "../_components/icons";
import { Button, IconButton } from "../_components/ui/button";
import { EmptyState } from "../_components/ui/empty-state";
import { useSelection } from "../_state/selection";
import { fadeUp } from "../_components/motion";
import { StitchNodeCard, type StitchNodeData } from "../_components/StitchNodeCard";
import { DEFAULT_VIDEO_MODEL } from "../../lib/higgsfield/catalog";
import type { H3ShotOptions } from "../_components/H3Controls";
import { DEFAULT_LIPSYNC_MODEL } from "../../lib/lipsync/catalog";
import { Status } from "../_components/ui/status";
import { publishShotDesk, shotStatus, type ShotBalance, type ShotNode } from "../_components/inspectors/ShotInspector";
import type { Project, TransitionStyle, WorkspaceId } from "../../lib/types";

/* The shot and balance shapes live with the Shot Desk (ShotInspector.tsx),
   which reads the same objects this stage publishes. */
type Balance = ShotBalance;
type StitchNode = ShotNode;

interface Transition {
  id: string;
  from_node_id: string;
  to_node_id: string;
  style: TransitionStyle;
  state: "pending" | "generating" | "complete" | "error";
  clip_asset_id: string | null;
  duration: number;
  clip_url: string | null;
}

interface Props {
  project: Project;
  onSwitchWorkspace: (ws: WorkspaceId) => void;
}

const NODE_TYPES: NodeTypes = { stitch: StitchNodeCard };

/* Semantic colours pulled live from tokens.css via var() — stays in sync with
   the current theme instead of freezing a hex snapshot (edges/labels are set
   via inline `style`, which resolves CSS custom properties normally). */
const EDGE_COLOR: Record<Transition["state"], string> = {
  complete: "var(--status-success)",
  generating: "var(--status-warning)",
  pending: "var(--text-tertiary)",
  error: "var(--status-error)"
};

function transitionLabel(t: Transition): string {
  if (t.state === "complete" && t.duration > 0) return `${t.style} · ${t.duration.toFixed(1)}s`;
  if (t.state === "generating") return "Generating…";
  if (t.state === "pending") return `+ ${t.style}`;
  return t.style;
}

function formatTC(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function Stitch({ project, onSwitchWorkspace }: Props) {
  const [stitchNodes, setStitchNodes] = useState<StitchNode[]>([]);
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [rfNodes, setRfNodes] = useState<RFNode[]>([]);
  const [view, setView] = useState<"board" | "timeline">("timeline");
  const rfInstance = useRef<ReactFlowInstance | null>(null);
  const didFit = useRef(false);
  const [balance, setBalance] = useState<Balance | null>(null);
  const { primary, select, clear } = useSelection();
  // The selection is app-wide (brief §58): the Shot Desk, the Dock chip and
  // this stage's highlight all read the same thing, so closing the inspector
  // also drops the highlight here.
  const selectedId = primary?.kind === "shot" && primary.projectId === project.id ? primary.id : null;

  /** One selection for both views: the timeline clip and the graph node are
   *  the same `kind:'shot'`, so the Shot Desk serves either. */
  const selectShot = useCallback(
    (id: string) => {
      const n = stitchNodes.find((s) => s.id === id);
      const label = n?.beat?.n != null ? `Shot ${String(n.beat.n).padStart(2, "0")}` : "Shot";
      select({ kind: "shot", id, label, projectId: project.id });
    },
    [stitchNodes, select, project.id]
  );

  const loadBalance = useCallback(() => {
    fetch("/api/higgsfield/balance")
      .then((r) => r.json())
      .then(setBalance)
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  const reload = useCallback(async () => {
    const res = await fetch(`/api/projects/${project.id}/stitch`);
    if (!res.ok) return;
    const data = await res.json();
    setStitchNodes(data.nodes);
    setTransitions(data.transitions);
  }, [project.id]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Frame the board once the first batch of nodes has mounted and been measured.
  // `fitView` as a prop only runs on init (when nodes are still loading async),
  // so it can miss; this guarantees the board is framed on first open.
  useEffect(() => {
    if (didFit.current || rfNodes.length === 0) return;
    const t = setTimeout(() => {
      rfInstance.current?.fitView({ padding: 0.25, maxZoom: 1, duration: 300 });
      didFit.current = true;
    }, 80);
    return () => clearTimeout(t);
  }, [rfNodes.length]);

  async function patchNode(id: string, patch: { x?: number; y?: number; duration?: number; trim_start?: number; scene_number?: number }) {
    await fetch(`/api/stitch/nodes/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch)
    }).catch(() => {});
  }

  async function deleteNode(id: string) {
    setStitchNodes((prev) => prev.filter((n) => n.id !== id));
    setTransitions((prev) => prev.filter((t) => t.from_node_id !== id && t.to_node_id !== id));
    if (selectedId === id) clear();
    await fetch(`/api/stitch/nodes/${id}`, { method: "DELETE" }).catch(() => {});
  }

  async function setSceneNumber(node: StitchNode, scene: number) {
    const newX = xForScene(scene);
    setStitchNodes((prev) => prev.map((n) => (n.id === node.id ? { ...n, x: newX } : n)));
    await patchNode(node.id, { scene_number: scene });
  }

  /** The timeline's new order, first to last. Every shot whose column no
   *  longer matches its place gets `scene_number` written — the same field
   *  the inspector's scene input uses — so the render (ORDER BY x) follows. */
  async function reorder(orderedIds: string[]) {
    const byId = new Map(stitchNodes.map((n) => [n.id, n]));
    const patches: { id: string; scene: number; x: number }[] = [];
    orderedIds.forEach((id, i) => {
      const n = byId.get(id);
      const x = xForScene(i + 1);
      if (n && n.x !== x) patches.push({ id, scene: i + 1, x });
    });
    if (!patches.length) return;
    setStitchNodes((prev) =>
      prev.map((n) => {
        const p = patches.find((q) => q.id === n.id);
        return p ? { ...n, x: p.x } : n;
      })
    );
    await Promise.all(patches.map((p) => patchNode(p.id, { scene_number: p.scene })));
  }

  async function setDuration(node: StitchNode, duration: number) {
    setStitchNodes((prev) => prev.map((n) => (n.id === node.id ? { ...n, duration } : n)));
    await patchNode(node.id, { duration });
  }

  async function setTrimStart(node: StitchNode, trim_start: number) {
    setStitchNodes((prev) => prev.map((n) => (n.id === node.id ? { ...n, trim_start } : n)));
    await patchNode(node.id, { trim_start });
  }

  async function animate(
    node: StitchNode,
    modelId?: string,
    motion?: string,
    audio?: boolean,
    h3?: H3ShotOptions
  ): Promise<{ ok?: boolean; simulated?: boolean; error?: string; note?: string; vendor?: string; warnings?: string[] } | null> {
    setStitchNodes((prev) => prev.map((n) => (n.id === node.id ? { ...n, clip_state: "generating" } : n)));
    let data: { ok?: boolean; simulated?: boolean; error?: string; note?: string; vendor?: string; warnings?: string[] } | null = null;
    try {
      const res = await fetch(`/api/stitch/nodes/${node.id}/animate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model: modelId ?? DEFAULT_VIDEO_MODEL, motion: motion ?? "auto", audio: audio ?? false, ...h3 })
      });
      data = await res.json().catch(() => null);
    } catch {
      /* network error surfaced via reload state */
    }
    await reload();
    loadBalance(); // credits changed
    return data;
  }

  async function uploadClip(node: StitchNode, file: File): Promise<{ error?: string } | null> {
    setStitchNodes((prev) => prev.map((n) => (n.id === node.id ? { ...n, clip_state: "generating" } : n)));
    const form = new FormData();
    form.append("file", file);
    let data: { ok?: boolean; error?: string } | null = null;
    try {
      const res = await fetch(`/api/stitch/nodes/${node.id}/upload-clip`, { method: "POST", body: form });
      data = await res.json().catch(() => null);
    } catch {
      /* network error surfaced via reload state */
    }
    await reload();
    return data;
  }

  async function uploadDialogue(node: StitchNode, file: File): Promise<{ error?: string } | null> {
    const form = new FormData();
    form.append("file", file);
    let data: { ok?: boolean; error?: string } | null = null;
    try {
      const res = await fetch(`/api/stitch/nodes/${node.id}/dialogue`, { method: "POST", body: form });
      data = await res.json().catch(() => null);
    } catch {
      /* network error surfaced via reload state */
    }
    await reload();
    return data;
  }

  async function lipsync(
    node: StitchNode,
    modelId?: string
  ): Promise<{ ok?: boolean; error?: string; vendor?: string } | null> {
    setStitchNodes((prev) => prev.map((n) => (n.id === node.id ? { ...n, lipsync_state: "generating" } : n)));
    let data: { ok?: boolean; error?: string; vendor?: string } | null = null;
    try {
      const res = await fetch(`/api/stitch/nodes/${node.id}/lipsync`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model: modelId ?? DEFAULT_LIPSYNC_MODEL })
      });
      data = await res.json().catch(() => null);
    } catch {
      /* network error surfaced via reload state */
    }
    await reload();
    return data;
  }

  // The Shot Desk (the registered "shot" inspector) reads this stage's data and
  // calls its handlers, so every route, body and response field stays here.
  // Published after every render so the desk never sees a stale closure;
  // cleared on unmount so it closes instead of showing a dead panel.
  useEffect(() => {
    publishShotDesk({
      projectId: project.id,
      aspectRatio: project.aspect_ratio,
      nodes: stitchNodes,
      balance,
      setSceneNumber,
      setDuration,
      setTrimStart,
      animate,
      uploadClip,
      uploadDialogue,
      lipsync,
      remove: deleteNode,
      openStoryboard: () => onSwitchWorkspace("storyboard")
    });
  });
  useEffect(() => () => publishShotDesk(null), []);

  // Sync our data into React Flow's nodes whenever the underlying list changes.
  useEffect(() => {
    setRfNodes(
      stitchNodes.map<RFNode>((n) => ({
        id: n.id,
        type: "stitch",
        position: { x: n.x, y: n.y },
        data: {
          frame_url: n.frame_url,
          clip_state: n.clip_state,
          duration: n.duration,
          beat_n: n.beat?.n ?? null,
          beat_title: n.beat?.title ?? null,
          variant_n: n.variant_n,
          onDelete: () => deleteNode(n.id)
        } satisfies StitchNodeData,
        selected: n.id === selectedId
      }))
    );
    // The `deleteNode` closure changes every render, but we want a stable sync —
    // selectedId in deps is enough to refresh the selected flag.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stitchNodes, selectedId]);

  const rfEdges: RFEdge[] = useMemo(
    () =>
      transitions.map((t) => ({
        id: t.id,
        source: t.from_node_id,
        target: t.to_node_id,
        type: "smoothstep",
        animated: t.state === "generating",
        style: {
          stroke: EDGE_COLOR[t.state],
          strokeWidth: 2,
          strokeDasharray: t.state === "pending" ? "4 4" : t.state === "generating" ? "6 4" : undefined
        },
        label: transitionLabel(t),
        labelStyle: {
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          fill: EDGE_COLOR[t.state]
        },
        labelBgStyle: {
          fill: "var(--surface-overlay)",
          stroke: EDGE_COLOR[t.state],
          strokeWidth: 1
        },
        labelBgPadding: [6, 10],
        labelBgBorderRadius: 6
      })),
    [transitions]
  );

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setRfNodes((prev) => applyNodeChanges(changes, prev));
  }, []);

  const onEdgesChange = useCallback((_changes: EdgeChange[]) => {
    // Transitions are managed server-side; ignore React Flow's local edge edits.
  }, []);

  const onNodeDragStop = useCallback(
    (_evt: unknown, node: RFNode) => {
      patchNode(node.id, { x: Math.round(node.position.x), y: Math.round(node.position.y) });
      setStitchNodes((prev) =>
        prev.map((n) => (n.id === node.id ? { ...n, x: node.position.x, y: node.position.y } : n))
      );
    },
    []
  );

  const onNodeClick = useCallback(
    (_evt: unknown, node: RFNode) => {
      selectShot(node.id);
    },
    [selectShot]
  );

  const onPaneClick = useCallback(() => {
    if (selectedId) clear();
  }, [selectedId, clear]);

  const totalDuration = stitchNodes.reduce((sum, n) => sum + n.duration, 0);
  // Motion-clip progress: how many SHOTS have a rendered clip.
  const clipsDone = stitchNodes.filter((n) => n.clip_url).length;
  const allClipsDone = clipsDone === stitchNodes.length && stitchNodes.length > 0;
  const balanceLabel =
    balance?.connected === false ? "Higgsfield off" : balance?.credits != null ? `${balance.credits} credits` : "—";

  return (
    <div className="main-inner cut-page">
      <motion.header className="page-head" {...fadeUp}>
        <div>
          <span className="ws-eyebrow">
            Shots
          </span>
          <h1 className="ws-title">Shots
          </h1>
          <p className="ws-lead">
            The assembly. Scrub the timeline, play the cut in the monitor, and click a shot to set duration, pick a
            video model, and roll a motion clip.
          </p>
        </div>
        <div className="actions">
          {stitchNodes.length > 0 && (
            <div role="tablist" aria-label="Cut view" className="cut-view-switch">
              <button
                role="tab"
                type="button"
                className="cut-view-tab"
                aria-selected={view === "timeline"}
                onClick={() => setView("timeline")}
              >
                Timeline
              </button>
              <button
                role="tab"
                type="button"
                className="cut-view-tab"
                aria-selected={view === "board"}
                onClick={() => setView("board")}
              >
                Graph
              </button>
            </div>
          )}
          <span className="cut-fact" data-tone={allClipsDone ? "good" : "active"}>
            {clipsDone} / {stitchNodes.length || "—"} clips · {totalDuration.toFixed(1)}s
          </span>
          <span className="cut-fact" data-plain="">
            {balanceLabel}
          </span>
          <Button intent="primary" onClick={() => onSwitchWorkspace("export")}>
            Continue to Finish <ArrowRight size={14} />
          </Button>
        </div>
      </motion.header>

      <div className="stitch-shell">
        {view === "board" ? (
          <div className="cut-graph">
            <ReactFlow
              nodes={rfNodes}
              edges={rfEdges}
              nodeTypes={NODE_TYPES}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeDragStop={onNodeDragStop}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              onInit={(inst) => { rfInstance.current = inst; }}
              proOptions={{ hideAttribution: true }}
              fitView
              fitViewOptions={{ padding: 0.25, maxZoom: 1 }}
              minZoom={0.25}
              maxZoom={2}
              defaultEdgeOptions={{ type: "smoothstep" }}
            >
              <Background gap={22} size={1} color="var(--border-standard)" />
              <Controls showInteractive={false} className="cut-graph-panel" />
              <MiniMap
                className="cut-graph-panel"
                nodeStrokeWidth={0}
                nodeColor={(n) => (n.selected ? "var(--brand-accent)" : "var(--text-tertiary)")}
                nodeBorderRadius={6}
                maskColor="color-mix(in srgb, var(--surface-canvas) 60%, transparent)"
              />
            </ReactFlow>
            <div className="cut-graph-hint">
              <span className="ws-meta">
                Node graph · drag a node to move · drag the canvas to pan · click a node to edit
              </span>
            </div>
          </div>
        ) : (
          <StitchTimeline
            nodes={stitchNodes}
            transitions={transitions}
            selectedId={selectedId}
            onSelect={selectShot}
            projectId={project.id}
            aspectRatio={project.aspect_ratio}
            onSetDuration={setDuration}
            onSetTrimStart={setTrimStart}
            onReorder={reorder}
            onGoToStoryboard={() => onSwitchWorkspace("storyboard")}
          />
        )}

      </div>
    </div>
  );
}

/* ───────────────────────── Timeline view ───────────────────────── */
/* The cut as a film timeline: a monitor that plays the assembly, a ruler you
   scrub, and a clip lane with transition marks. Trim handles on the selected
   clip commit on release; drag (or `[` / `]`) reorders by writing
   scene_number, which is `x` on the server — the order the render reads. */

const PX_PER_SEC = 46;
const COL_WIDTH = 280;
const MIN_SHOT_SEC = 0.5;
/** The x the server assigns to scene `n` (stitch/nodes PATCH). */
const xForScene = (scene: number) => (Math.max(1, scene) - 1) * COL_WIDTH + 80;

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

function StitchTimeline({
  nodes,
  transitions,
  selectedId,
  onSelect,
  projectId,
  aspectRatio,
  onSetDuration,
  onSetTrimStart,
  onReorder,
  onGoToStoryboard
}: {
  nodes: StitchNode[];
  transitions: Transition[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  projectId: string;
  aspectRatio: string;
  onSetDuration: (node: StitchNode, duration: number) => void;
  onSetTrimStart: (node: StitchNode, trimStart: number) => void;
  onReorder: (orderedIds: string[]) => void;
  onGoToStoryboard: () => void;
}) {
  // Render order: `x` is what scene_number writes and what the render reads
  // (ORDER BY x, y); beat number and y break ties.
  const ordered = useMemo(
    () => [...nodes].sort((a, b) => a.x - b.x || (a.beat?.n ?? 999) - (b.beat?.n ?? 999) || a.y - b.y),
    [nodes]
  );

  // A trim in progress: the lane shows the draft; the PATCH goes on release.
  const [draft, setDraft] = useState<{ id: string; duration: number; trim_start: number } | null>(null);
  const shown = useMemo(
    () => ordered.map((n) => (draft && draft.id === n.id ? { ...n, duration: draft.duration, trim_start: draft.trim_start } : n)),
    [ordered, draft]
  );

  const offsets = useMemo(() => {
    let t = 0;
    return shown.map((n) => {
      const start = t;
      t += n.duration;
      return { node: n, start, end: t };
    });
  }, [shown]);

  const total = offsets.length ? offsets[offsets.length - 1].end : 0;

  const [playing, setPlaying] = useState(false);
  const [playheadSec, setPlayheadSec] = useState(0);

  // Audio lane only when a score is attached (GET score.attached).
  const [scoreAttached, setScoreAttached] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch(`/api/projects/${projectId}/score`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d) setScoreAttached(Boolean(d.attached));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [projectId]);

  // Keep the playhead in range if the assembly's total runtime shrinks
  // (a shot's duration drops, or a shot is removed) while it's parked past the end.
  useEffect(() => {
    setPlayheadSec((t) => Math.min(t, total));
  }, [total]);

  useEffect(() => {
    if (!playing || total <= 0) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setPlayheadSec((prev) => {
        const next = prev + dt;
        if (next >= total) {
          setPlaying(false);
          return total;
        }
        return next;
      });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, total]);

  // Monitor video sync — when the current shot has a rendered clip, the
  // <video> plays it in the monitor, kept loosely in sync with the playhead.
  const monitorVideoRef = useRef<HTMLVideoElement | null>(null);
  const currentEntry =
    offsets.find((e) => playheadSec >= e.start && playheadSec < e.end) ?? offsets[offsets.length - 1] ?? null;
  useEffect(() => {
    const v = monitorVideoRef.current;
    if (!v || !currentEntry) return;
    const local = Math.max(0, playheadSec - currentEntry.start);
    // Re-seek only when meaningfully off (scrub or shot change) — the video's
    // own clock carries playback between corrections.
    if (Math.abs(v.currentTime - local) > 0.35) {
      try {
        v.currentTime = local;
      } catch {
        /* metadata not ready yet */
      }
    }
    if (playing && v.paused) v.play().catch(() => {});
    if (!playing && !v.paused) v.pause();
  }, [playing, playheadSec, currentEntry]);

  // Reorder: drag a clip onto another, or `[` / `]` on the selected clip.
  const [dragId, setDragId] = useState<string | null>(null);
  const [drop, setDrop] = useState<{ id: string; side: "before" | "after" } | null>(null);

  const moveTo = useCallback(
    (id: string, index: number) => {
      const ids = ordered.map((n) => n.id);
      const from = ids.indexOf(id);
      if (from < 0) return;
      ids.splice(from, 1);
      ids.splice(Math.max(0, Math.min(ids.length, index)), 0, id);
      if (ids.every((x, i) => x === ordered[i].id)) return;
      onReorder(ids);
    },
    [ordered, onReorder]
  );

  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "[" && e.key !== "]") return;
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      const i = ordered.findIndex((n) => n.id === selectedId);
      if (i < 0) return;
      e.preventDefault();
      moveTo(selectedId, e.key === "[" ? i - 1 : i + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, ordered, moveTo]);

  function finishDrop() {
    if (dragId && drop && drop.id !== dragId) {
      const target = ordered.findIndex((n) => n.id === drop.id);
      const from = ordered.findIndex((n) => n.id === dragId);
      let index = drop.side === "before" ? target : target + 1;
      if (from < index) index -= 1;
      moveTo(dragId, index);
    }
    setDragId(null);
    setDrop(null);
  }

  // Trim: pointer capture on the handle; draft while dragging, PATCH on release.
  function startTrim(e: React.PointerEvent<HTMLButtonElement>, node: StitchNode, edge: "in" | "out") {
    e.preventDefault();
    e.stopPropagation();
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);
    const x0 = e.clientX;
    const base = { duration: node.duration, trim_start: node.trim_start };
    let last = base;
    setDraft({ id: node.id, ...base });
    const onMove = (ev: PointerEvent) => {
      const dSec = (ev.clientX - x0) / PX_PER_SEC;
      if (edge === "out") {
        last = { duration: Math.max(MIN_SHOT_SEC, round1(base.duration + dSec)), trim_start: base.trim_start };
      } else {
        // The in-point moves: what is cut from the head is added to trim_start.
        const cut = Math.max(-base.trim_start, Math.min(base.duration - MIN_SHOT_SEC, round1(dSec)));
        last = { duration: round1(base.duration - cut), trim_start: round1(base.trim_start + cut) };
      }
      setDraft({ id: node.id, ...last });
    };
    const onUp = () => {
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
      handle.removeEventListener("pointercancel", onUp);
      setDraft(null);
      if (last.duration !== base.duration) onSetDuration(node, last.duration);
      if (last.trim_start !== base.trim_start) onSetTrimStart(node, last.trim_start);
    };
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
    handle.addEventListener("pointercancel", onUp);
  }

  if (ordered.length === 0) {
    return (
      <div className="cut-empty">
        <EmptyState
          title="No shots on the timeline"
          why="Shots arrive here when you push frames from the Storyboard. Once they do, this is where you play, trim and order the cut."
          action={{ label: "Open Storyboard", onClick: onGoToStoryboard }}
        />
      </div>
    );
  }

  const current = currentEntry ?? offsets[offsets.length - 1];
  const pct = total > 0 ? (playheadSec / total) * 100 : 0;

  function togglePlay() {
    setPlaying((p) => {
      if (!p && playheadSec >= total) setPlayheadSec(0);
      return !p;
    });
  }

  // Scrub: press anywhere on the ruler and drag.
  function scrubTo(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setPlayheadSec(Math.max(0, Math.min(total, x / PX_PER_SEC)));
  }
  function onRulerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    setPlaying(false);
    scrubTo(e);
  }
  function onRulerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.buttons & 1) scrubTo(e);
  }

  // Coarser tick spacing on longer assemblies so the ruler doesn't render
  // thousands of DOM nodes for a long timeline.
  const tickStep = total > 240 ? 10 : total > 90 ? 5 : 1;
  const ticks: { sec: number; x: number; major: boolean }[] = [];
  for (let s = 0; s <= total; s += tickStep) {
    ticks.push({ sec: s, x: s * PX_PER_SEC, major: tickStep >= 5 || s % 5 === 0 });
  }

  // Include the lane's flex `gap` so the declared width always contains the
  // clip row exactly — otherwise the fixed-width clips (plus their gaps) can
  // exceed this box and overflow the scrollable ancestor.
  const tlWidth = total * PX_PER_SEC + Math.max(0, offsets.length - 1) * 2;
  const monitorAspect = /^\d+:\d+$/.test(aspectRatio) ? aspectRatio.replace(":", " / ") : "16 / 9";

  return (
    <div className="cut">
      {/* Monitor */}
      <div className="cut-monitor">
        <div className="cut-monitor-frame" style={{ aspectRatio: monitorAspect }}>
          {current.node.clip_url ? (
            /* eslint-disable-next-line jsx-a11y/media-has-caption */
            <video
              key={current.node.id}
              ref={monitorVideoRef}
              src={current.node.clip_url}
              poster={current.node.frame_url ?? undefined}
              muted
              playsInline
              preload="auto"
            />
          ) : current.node.frame_url ? (
            <div
              role="img"
              aria-label={current.node.beat?.title ?? ""}
              className="cut-monitor-still"
              style={{ backgroundImage: `url(${current.node.frame_url})` }}
            />
          ) : (
            <div className="cut-monitor-pending">
              <span className="ws-meta">
                Frame pending · S{current.node.beat?.n ? String(current.node.beat.n).padStart(2, "0") : "—"}
              </span>
            </div>
          )}
          <span className="cut-monitor-heading">{current.node.beat?.scene_heading ?? "—"}</span>
          <span className="cut-monitor-tc">
            {formatTC(playheadSec)} / {formatTC(total)}
          </span>
          <IconButton label={playing ? "Pause" : "Play"} className="cut-monitor-play" onClick={togglePlay}>
            {playing ? <Pause size={14} /> : <Play size={14} />}
          </IconButton>
          <span className="cut-monitor-title">{current.node.beat?.title ?? "Untitled"}</span>
          <div className="cut-monitor-progress">
            <span style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* Tracks */}
      <div className="cut-tracks">
        <div className="cut-tracks-head">
          <span className="ws-meta">
            {ordered.length} shots · {total.toFixed(1)}s runtime
          </span>
          <span className="cut-tracks-hint">
            Drag the ruler to scrub · click a shot to edit · drag a shot, or press [ ] on the selected one, to reorder
          </span>
        </div>
        <div className="cut-scroll">
          <div className="cut-track" style={{ width: tlWidth }}>
            <div className="cut-ruler" role="slider" aria-label="Playhead" aria-valuemin={0} aria-valuemax={total} aria-valuenow={playheadSec} onPointerDown={onRulerDown} onPointerMove={onRulerMove}>
              {ticks.map((tk) => (
                <Fragment key={tk.sec}>
                  <span className="cut-tick" data-major={tk.major || undefined} style={{ left: tk.x }} />
                  {tk.major && (
                    <span className="cut-tick-label" style={{ left: tk.x }}>
                      {formatTC(tk.sec)}
                    </span>
                  )}
                </Fragment>
              ))}
            </div>
            <div className="cut-lane">
              {offsets.map(({ node: n }, i) => (
                <div
                  key={n.id}
                  className="cut-clip"
                  style={{ width: n.duration * PX_PER_SEC }}
                  data-selected={n.id === selectedId || undefined}
                  data-dragging={dragId === n.id || undefined}
                  data-drop={drop?.id === n.id && dragId !== n.id ? drop.side : undefined}
                  draggable={draft === null}
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", n.id);
                    setDragId(n.id);
                  }}
                  onDragOver={(e) => {
                    if (!dragId) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    const r = e.currentTarget.getBoundingClientRect();
                    const side = e.clientX < r.left + r.width / 2 ? "before" : "after";
                    if (drop?.id !== n.id || drop.side !== side) setDrop({ id: n.id, side });
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    finishDrop();
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setDrop(null);
                  }}
                >
                  <button
                    type="button"
                    className="shot-strip-item"
                    data-selected={n.id === selectedId}
                    onClick={() => onSelect(n.id)}
                    title={`${n.beat?.title ?? "Untitled"} · ${n.duration.toFixed(1)}s`}
                    style={{ width: n.duration * PX_PER_SEC }}
                  >
                    {n.frame_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="shot-strip-frame" src={n.frame_url} alt={n.beat?.title ?? ""} draggable={false} />
                    ) : n.clip_url ? (
                      // A shot made outside the Storyboard has no frame; the
                      // clip it rendered is its own poster. preload="metadata"
                      // paints the first frame without fetching the video.
                      <video className="shot-strip-frame" src={n.clip_url} muted playsInline preload="metadata" />
                    ) : (
                      <span className="shot-strip-empty">No frame yet</span>
                    )}
                    {/* Only a shot that needs attention says so. A row of
                        eighteen COMPLETE badges is noise over the footage
                        it is covering. */}
                    {shotStatus(n) && shotStatus(n) !== "Complete" && (
                      <Status domain="generation" value={shotStatus(n)!} className="shot-strip-status" />
                    )}
                    {n.clip_state === "generating" && <span className="shot-strip-shimmer" aria-hidden="true" />}
                    <span className="shot-strip-foot">
                      <span className="shot-strip-n">S{String(n.beat?.n ?? i + 1).padStart(2, "0")}</span>
                      <span className="shot-strip-dur">{n.duration.toFixed(1)}s</span>
                    </span>
                  </button>
                  {n.id === selectedId && (
                    <>
                      <button
                        type="button"
                        className="cut-trim"
                        data-edge="in"
                        aria-label={`Trim in-point (offset ${n.trim_start.toFixed(1)}s)`}
                        title="Drag to trim the head of the shot"
                        onPointerDown={(e) => startTrim(e, n, "in")}
                      />
                      <button
                        type="button"
                        className="cut-trim"
                        data-edge="out"
                        aria-label={`Trim out-point (${n.duration.toFixed(1)}s)`}
                        title="Drag to change the shot's duration"
                        onPointerDown={(e) => startTrim(e, n, "out")}
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
            {scoreAttached && (
              <div className="cut-lane cut-lane-audio" aria-label="Score">
                <Music size={12} /> Score · runs under the whole cut
              </div>
            )}
            {transitions.map((t) => {
              const from = offsets.find((e) => e.node.id === t.from_node_id);
              if (!from) return null;
              return (
                <span key={t.id} className="cut-transition" data-state={t.state} style={{ left: from.end * PX_PER_SEC }}>
                  {transitionLabel(t)}
                </span>
              );
            })}
            <div className="cut-playhead" style={{ left: playheadSec * PX_PER_SEC }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
