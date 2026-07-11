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
import { ArrowRight, Film, Pause, Play, Trash2, X } from "../_components/icons";
import { fadeUp, popIn } from "../_components/motion";
import { StitchNodeCard, type StitchNodeData } from "../_components/StitchNodeCard";
import { VIDEO_MODELS, DEFAULT_VIDEO_MODEL, videoModel } from "../../lib/higgsfield/catalog";
import type { Project, TransitionStyle, WorkspaceId } from "../../lib/types";

interface Balance {
  connected: boolean;
  credits: number | null;
  plan: string | null;
}

interface StitchNode {
  id: string;
  beat_id: string | null;
  variant_id: string | null;
  variant_n: number | null;
  x: number;
  y: number;
  duration: number;
  beat: {
    n: number;
    title: string;
    scene_heading: string;
    characters: string[];
    location_id: string | null;
  } | null;
  frame_url: string | null;
  clip_url: string | null;
  clip_state: string;
}

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
  complete: "var(--viridian)",
  generating: "var(--mustard)",
  pending: "var(--mute)",
  error: "var(--tomato)"
};

const TRANSITION_PILL_COLOR: Record<Transition["state"], { bg: string; fg: string }> = {
  complete: { bg: "color-mix(in srgb, var(--viridian) 18%, transparent)", fg: "var(--viridian-deep)" },
  generating: { bg: "color-mix(in srgb, var(--mustard) 20%, transparent)", fg: "var(--mustard-deep)" },
  pending: { bg: "var(--surface)", fg: "var(--mute)" },
  error: { bg: "color-mix(in srgb, var(--tomato) 16%, transparent)", fg: "var(--tomato-deep)" }
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<"board" | "timeline">("timeline");
  const rfInstance = useRef<ReactFlowInstance | null>(null);
  const didFit = useRef(false);
  const [balance, setBalance] = useState<Balance | null>(null);

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

  async function patchNode(id: string, patch: { x?: number; y?: number; duration?: number; scene_number?: number }) {
    await fetch(`/api/stitch/nodes/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch)
    }).catch(() => {});
  }

  async function deleteNode(id: string) {
    setStitchNodes((prev) => prev.filter((n) => n.id !== id));
    setTransitions((prev) => prev.filter((t) => t.from_node_id !== id && t.to_node_id !== id));
    if (selectedId === id) setSelectedId(null);
    await fetch(`/api/stitch/nodes/${id}`, { method: "DELETE" }).catch(() => {});
  }

  async function setSceneNumber(node: StitchNode, scene: number) {
    const newX = Math.max(1, scene) * 280 - 200;
    setStitchNodes((prev) => prev.map((n) => (n.id === node.id ? { ...n, x: newX } : n)));
    await patchNode(node.id, { scene_number: scene });
  }

  async function setDuration(node: StitchNode, duration: number) {
    setStitchNodes((prev) => prev.map((n) => (n.id === node.id ? { ...n, duration } : n)));
    await patchNode(node.id, { duration });
  }

  async function animate(node: StitchNode, modelId?: string): Promise<{ ok?: boolean; simulated?: boolean; error?: string; note?: string; vendor?: string } | null> {
    setStitchNodes((prev) => prev.map((n) => (n.id === node.id ? { ...n, clip_state: "generating" } : n)));
    let data: { ok?: boolean; simulated?: boolean; error?: string; note?: string; vendor?: string } | null = null;
    try {
      const res = await fetch(`/api/stitch/nodes/${node.id}/animate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model: modelId ?? DEFAULT_VIDEO_MODEL })
      });
      data = await res.json().catch(() => null);
    } catch {
      /* network error surfaced via reload state */
    }
    await reload();
    loadBalance(); // credits changed
    return data;
  }

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
          fill: "var(--surface)",
          stroke: EDGE_COLOR[t.state],
          strokeWidth: 1
        },
        labelBgPadding: [6, 10],
        labelBgBorderRadius: 999
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

  const onNodeClick = useCallback((_evt: unknown, node: RFNode) => {
    setSelectedId(node.id);
  }, []);

  const onPaneClick = useCallback(() => setSelectedId(null), []);

  const selected = stitchNodes.find((n) => n.id === selectedId) ?? null;
  const totalDuration = stitchNodes.reduce((sum, n) => sum + n.duration, 0);
  // Motion-clip progress: how many SHOTS have a rendered clip.
  const clipsDone = stitchNodes.filter((n) => n.clip_url).length;
  const allClipsDone = clipsDone === stitchNodes.length && stitchNodes.length > 0;
  const balanceLabel =
    balance?.connected === false ? "Higgsfield off" : balance?.credits != null ? `${balance.credits} credits` : "—";

  return (
    <div className="main-inner" style={{ paddingBottom: 0 }}>
      <motion.header className="page-head" {...fadeUp}>
        <div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 500, letterSpacing: "0.02em", color: "var(--accent)" }}>
            05 / Workspace · Stitch
          </span>
          <h1
            style={{
              margin: "8px 0 0",
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: "clamp(24px, 2.4vw, 32px)",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              color: "var(--ink)"
            }}
          >
            Stitch
          </h1>
          <p className="lead" style={{ marginTop: 12, maxWidth: "60ch" }}>
            The assembly. Scrub the timeline, play the cut in the monitor, and click a shot to set duration, pick a
            video model, and roll a motion clip.
          </p>
        </div>
        <div className="actions">
          {stitchNodes.length > 0 && (
            <div
              role="tablist"
              aria-label="Stitch view"
              style={{ display: "inline-flex", alignItems: "center", gap: 2, padding: 3, background: "var(--surface-2)", borderRadius: 999 }}
            >
              <button
                role="tab"
                aria-selected={view === "timeline"}
                onClick={() => setView("timeline")}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  letterSpacing: "0.02em",
                  padding: "6px 14px",
                  border: "none",
                  borderRadius: 999,
                  cursor: "pointer",
                  color: view === "timeline" ? "var(--ink)" : "var(--mute)",
                  background: view === "timeline" ? "var(--surface)" : "transparent",
                  boxShadow: view === "timeline" ? "var(--shadow-1)" : "none"
                }}
              >
                Timeline
              </button>
              <button
                role="tab"
                aria-selected={view === "board"}
                onClick={() => setView("board")}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  letterSpacing: "0.02em",
                  padding: "6px 14px",
                  border: "none",
                  borderRadius: 999,
                  cursor: "pointer",
                  color: view === "board" ? "var(--ink)" : "var(--mute)",
                  background: view === "board" ? "var(--surface)" : "transparent",
                  boxShadow: view === "board" ? "var(--shadow-1)" : "none"
                }}
              >
                Graph
              </button>
            </div>
          )}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.02em",
              borderRadius: 999,
              background: allClipsDone
                ? "color-mix(in srgb, var(--viridian) 18%, transparent)"
                : "color-mix(in srgb, var(--mustard) 20%, transparent)",
              color: allClipsDone ? "var(--viridian-deep)" : "var(--mustard-deep)"
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", opacity: 0.6 }} />
            {clipsDone} / {stitchNodes.length || "—"} clips · {totalDuration.toFixed(1)}s
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.02em",
              borderRadius: 999,
              background: "var(--cream-deep)",
              color: "var(--ink-soft)"
            }}
          >
            {balanceLabel}
          </span>
          <button className="btn btn-primary" onClick={() => onSwitchWorkspace("export")}>
            Continue to Export <ArrowRight size={14} />
          </button>
        </div>
      </motion.header>

      <div className="stitch-shell" style={{ height: "calc(100vh - 64px - 230px)", borderRadius: 18 }}>
        {view === "board" ? (
          <div style={{ position: "absolute", inset: 0, background: "#0B0B0D" }}>
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
              <Background gap={22} size={1} color="rgba(237,232,220,0.07)" />
              <Controls
                showInteractive={false}
                style={{ background: "var(--surface)", border: "none", boxShadow: "var(--shadow-1)", borderRadius: "var(--radius)" }}
              />
              <MiniMap
                nodeStrokeWidth={0}
                nodeColor={(n) => (n.selected ? "var(--tomato)" : "var(--viridian)")}
                nodeBorderRadius={6}
                maskColor="rgba(11, 12, 16, 0.55)"
                style={{
                  background: "var(--surface)",
                  border: "none",
                  boxShadow: "var(--shadow-1)",
                  borderRadius: "var(--radius)"
                }}
              />
            </ReactFlow>
            <div
              style={{
                position: "absolute",
                top: 16,
                left: 16,
                zIndex: 10,
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "6px 12px",
                background: "rgba(23,23,27,0.85)",
                borderRadius: 999,
                boxShadow: "var(--shadow-1)",
                pointerEvents: "none"
              }}
            >
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--mute)" }}>
                Node graph · drag a node to move · drag the canvas to pan · click a node to edit
              </span>
            </div>
          </div>
        ) : (
          <StitchTimeline nodes={stitchNodes} transitions={transitions} selectedId={selectedId} onSelect={setSelectedId} />
        )}

        {selected && (
          <StitchInspector
            node={selected}
            view={view}
            onClose={() => setSelectedId(null)}
            onSetSceneNumber={(scene) => setSceneNumber(selected, scene)}
            onSetDuration={(duration) => setDuration(selected, duration)}
            balance={balance}
            onAnimate={(modelId) => animate(selected, modelId)}
            onDelete={() => {
              if (confirm("Remove this frame from Stitch? The transition clips connected to it will also be removed.")) {
                deleteNode(selected.id);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── Timeline view ───────────────────────── */
/* An NLE-style assembly: a monitor (plays the cut in real time), a
   scrubbable ruler, and a filmstrip of shots with transition pills between
   them. Replaces the plain filmstrip the app used to show in this slot. */

const PX_PER_SEC = 46;

function StitchTimeline({
  nodes,
  transitions,
  selectedId,
  onSelect
}: {
  nodes: StitchNode[];
  transitions: Transition[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const ordered = useMemo(
    () => [...nodes].sort((a, b) => (a.beat?.n ?? 999) - (b.beat?.n ?? 999) || a.x - b.x),
    [nodes]
  );

  const offsets = useMemo(() => {
    let t = 0;
    return ordered.map((n) => {
      const start = t;
      t += n.duration;
      return { node: n, start, end: t };
    });
  }, [ordered]);

  const total = offsets.length ? offsets[offsets.length - 1].end : 0;

  const [playing, setPlaying] = useState(false);
  const [playheadSec, setPlayheadSec] = useState(0);

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

  if (ordered.length === 0) {
    return (
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
        <span className="t-eyebrow" style={{ color: "var(--mute)" }}>
          No shots yet · push frames from Storyboard
        </span>
      </div>
    );
  }

  const current = offsets.find((e) => playheadSec >= e.start && playheadSec < e.end) ?? offsets[offsets.length - 1];
  const pct = total > 0 ? (playheadSec / total) * 100 : 0;

  function togglePlay() {
    setPlaying((p) => {
      if (!p && playheadSec >= total) setPlayheadSec(0);
      return !p;
    });
  }

  function onRulerClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setPlayheadSec(Math.max(0, Math.min(total, x / PX_PER_SEC)));
  }

  // Coarser tick spacing on longer assemblies so the ruler doesn't render
  // thousands of DOM nodes for a long timeline.
  const tickStep = total > 240 ? 10 : total > 90 ? 5 : 1;
  const ticks: { sec: number; x: number; major: boolean }[] = [];
  for (let s = 0; s <= total; s += tickStep) {
    ticks.push({ sec: s, x: s * PX_PER_SEC, major: tickStep >= 5 || s % 5 === 0 });
  }

  // Include the filmstrip's flex `gap` so the declared width always contains
  // the clip row exactly — otherwise the fixed-width clip buttons (plus their
  // gaps) can exceed this box and overflow the scrollable ancestor.
  const tlWidth = total * PX_PER_SEC + Math.max(0, offsets.length - 1) * 2;

  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateRows: "minmax(0, 1fr) 190px", background: "var(--bg)", overflow: "hidden" }}>
      {/* Monitor */}
      <div style={{ position: "relative", display: "grid", placeItems: "center", background: "#060607", overflow: "hidden", borderBottom: "1px solid var(--cream-deep)", padding: 20 }}>
        <div style={{ position: "relative", height: "100%", maxHeight: "100%", aspectRatio: "16/9", maxWidth: "100%", background: "#000", borderRadius: 12, overflow: "hidden", boxShadow: "var(--shadow-2)" }}>
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
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : current.node.frame_url ? (
            <div
              role="img"
              aria-label={current.node.beat?.title ?? ""}
              style={{ position: "absolute", inset: 0, backgroundImage: `url(${current.node.frame_url})`, backgroundSize: "cover", backgroundPosition: "center" }}
            />
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 500, letterSpacing: "0.02em", color: "var(--mute)" }}>
                Frame pending · S{current.node.beat?.n ? String(current.node.beat.n).padStart(2, "0") : "—"}
              </span>
            </div>
          )}
          <span
            style={{
              position: "absolute",
              top: 10,
              left: 14,
              maxWidth: "calc(100% - 150px)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.02em",
              color: "rgba(237,232,220,0.85)",
              textShadow: "0 1px 3px rgba(0,0,0,0.7)"
            }}
          >
            {current.node.beat?.scene_heading ?? "—"}
          </span>
          <span
            style={{
              position: "absolute",
              top: 10,
              right: 14,
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.08em",
              color: "rgba(237,232,220,0.85)",
              textShadow: "0 1px 3px rgba(0,0,0,0.7)"
            }}
          >
            {formatTC(playheadSec)} / {formatTC(total)}
          </span>
          <button
            onClick={togglePlay}
            aria-label="Play / pause assembly"
            style={{
              position: "absolute",
              bottom: 12,
              left: 14,
              width: 34,
              height: 34,
              display: "grid",
              placeItems: "center",
              background: "rgba(10,10,12,0.72)",
              color: "#EDE8DC",
              border: "1px solid rgba(237,232,220,0.25)",
              borderRadius: 999,
              cursor: "pointer"
            }}
          >
            {playing ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <span
            style={{
              position: "absolute",
              bottom: 20,
              right: 14,
              fontSize: 12,
              fontWeight: 500,
              color: "rgba(237,232,220,0.9)",
              textShadow: "0 1px 3px rgba(0,0,0,0.7)"
            }}
          >
            {current.node.beat?.title ?? "Untitled"}
          </span>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 3, background: "rgba(237,232,220,0.15)" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: "var(--accent)" }} />
          </div>
        </div>
      </div>

      {/* Filmstrip */}
      <div style={{ display: "flex", flexDirection: "column", background: "var(--surface)", minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 20px", borderBottom: "1px solid var(--cream-deep)" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 500, letterSpacing: "0.02em", color: "var(--mute)" }}>
            {ordered.length} shots · {total.toFixed(1)}s runtime
          </span>
          <span style={{ fontSize: 11, color: "var(--mute)" }}>Click the ruler to scrub · click a shot to edit · ▶ plays the assembly</span>
        </div>
        <div style={{ flex: 1, overflowX: "auto", overflowY: "hidden", padding: "0 20px 12px" }}>
          <div style={{ position: "relative", width: tlWidth, minWidth: "100%", height: "100%" }}>
            <div onClick={onRulerClick} style={{ position: "relative", height: 26, cursor: "pointer", borderBottom: "1px solid var(--cream-deep)" }}>
              {ticks.map((tk) => (
                <Fragment key={tk.sec}>
                  <span style={{ position: "absolute", left: tk.x, bottom: 0, width: 1, height: tk.major ? 16 : 8, background: "var(--cream-deep)", pointerEvents: "none" }} />
                  {tk.major && (
                    <span style={{ position: "absolute", left: tk.x, top: 1, transform: "translateX(4px)", fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--mute)", pointerEvents: "none" }}>
                      {formatTC(tk.sec)}
                    </span>
                  )}
                </Fragment>
              ))}
            </div>
            <div style={{ position: "absolute", top: 36, left: 0, right: 0, bottom: 0, display: "flex", gap: 2 }}>
              {offsets.map(({ node: n }, i) => (
                <button
                  key={n.id}
                  onClick={() => onSelect(n.id)}
                  title={`${n.beat?.title ?? "Untitled"} · ${n.duration.toFixed(1)}s`}
                  style={{
                    position: "relative",
                    flex: "0 0 auto",
                    height: "100%",
                    width: n.duration * PX_PER_SEC,
                    border: "none",
                    borderRadius: 12,
                    overflow: "hidden",
                    background: "var(--cream-deep)",
                    boxShadow: n.id === selectedId ? "inset 0 0 0 2px var(--accent), var(--shadow-2)" : "var(--shadow-1)",
                    cursor: "pointer",
                    padding: 0
                  }}
                >
                  {n.frame_url ? (
                    <span
                      role="img"
                      aria-label={n.beat?.title ?? ""}
                      style={{ position: "absolute", inset: 0, backgroundImage: `url(${n.frame_url})`, backgroundSize: "cover", backgroundPosition: "center" }}
                    />
                  ) : (
                    <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--mute)" }}>
                      Pending
                    </span>
                  )}
                  <span style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(6,6,7,0.75), transparent 45%)" }} />
                  <span style={{ position: "absolute", bottom: 6, left: 8, fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#EDE8DC" }}>
                    S{String(n.beat?.n ?? i + 1).padStart(2, "0")}
                  </span>
                  <span style={{ position: "absolute", bottom: 6, right: 8, fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.06em", color: "var(--accent)" }}>
                    {n.duration.toFixed(1)}s
                  </span>
                  {n.clip_url && (
                    <span
                      style={{
                        position: "absolute",
                        top: 6,
                        left: 8,
                        fontFamily: "var(--font-mono)",
                        fontSize: 8.5,
                        letterSpacing: "0.02em",
                        padding: "2px 6px",
                        borderRadius: 999,
                        background: "var(--viridian)",
                        color: "var(--on-accent-3)"
                      }}
                    >
                      ▶ Clip
                    </span>
                  )}
                  {n.clip_state === "generating" && (
                    <>
                      <span
                        style={{
                          position: "absolute",
                          top: 6,
                          left: 8,
                          fontFamily: "var(--font-mono)",
                          fontSize: 8.5,
                          letterSpacing: "0.02em",
                          padding: "2px 6px",
                          borderRadius: 999,
                          background: "var(--mustard)",
                          color: "#14100C"
                        }}
                      >
                        Rendering…
                      </span>
                      <span
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "linear-gradient(100deg, transparent 35%, rgba(255,251,241,0.35) 50%, transparent 65%)",
                          transform: "translateX(-100%)",
                          animation: "fx-shimmer 1.6s ease-out infinite"
                        }}
                      />
                    </>
                  )}
                </button>
              ))}
            </div>
            {transitions.map((t) => {
              const from = offsets.find((e) => e.node.id === t.from_node_id);
              if (!from) return null;
              const colors = TRANSITION_PILL_COLOR[t.state];
              return (
                <span
                  key={t.id}
                  style={{
                    position: "absolute",
                    top: 26,
                    left: from.end * PX_PER_SEC,
                    transform: "translate(-50%, -50%)",
                    zIndex: 5,
                    display: "inline-flex",
                    padding: "2px 8px",
                    background: colors.bg,
                    color: colors.fg,
                    fontFamily: "var(--font-mono)",
                    fontSize: 8.5,
                    letterSpacing: "0.02em",
                    borderRadius: 999,
                    boxShadow: "var(--shadow-1)",
                    whiteSpace: "nowrap",
                    pointerEvents: "none"
                  }}
                >
                  {transitionLabel(t)}
                </span>
              );
            })}
            <div style={{ position: "absolute", top: 0, bottom: 0, left: playheadSec * PX_PER_SEC, width: 2, background: "var(--accent)", zIndex: 6, pointerEvents: "none" }}>
              <span style={{ position: "absolute", top: 0, left: -4, width: 10, height: 9, background: "var(--accent)", clipPath: "polygon(0 0, 100% 0, 50% 100%)" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Inspector ───────────────────────── */

function StitchInspector({
  node,
  view,
  onClose,
  onSetSceneNumber,
  onSetDuration,
  balance,
  onAnimate,
  onDelete
}: {
  node: StitchNode;
  view: "board" | "timeline";
  onClose: () => void;
  onSetSceneNumber: (n: number) => void;
  onSetDuration: (d: number) => void;
  balance: Balance | null;
  onAnimate: (modelId: string) => Promise<{ ok?: boolean; simulated?: boolean; error?: string; note?: string; vendor?: string } | null>;
  onDelete: () => void;
}) {
  const [scene, setScene] = useState<number>(node.beat?.n ?? 1);
  const [duration, setDurationLocal] = useState<number>(node.duration);
  const [animating, setAnimating] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [modelId, setModelId] = useState<string>(DEFAULT_VIDEO_MODEL);
  const model = videoModel(modelId);
  const isHiggs = model.provider !== "byteplus";
  const credits = balance?.credits ?? null;
  const tooPoor = isHiggs && credits != null && credits < model.approxCost;

  useEffect(() => {
    setScene(node.beat?.n ?? 1);
    setDurationLocal(node.duration);
    setNote(null);
  }, [node.id, node.beat?.n, node.duration]);

  return (
    <motion.aside
      {...popIn}
      style={{
        position: "absolute",
        top: 16,
        right: 16,
        // The timeline view reserves its 190px filmstrip along the bottom; the
        // graph view has no bottom chrome to clear.
        bottom: view === "timeline" ? 206 : 16,
        width: 320,
        backdropFilter: "blur(20px)",
        background: "var(--surface)",
        borderRadius: 18,
        boxShadow: "var(--shadow-2)",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        overflow: "auto"
      }}
    >
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, paddingBottom: 12, borderBottom: "1px solid var(--cream-deep)" }}>
        <div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.02em", color: "var(--mute)" }}>
            SCENE {String(scene).padStart(2, "0")}
            {node.variant_n ? ` · V${String(node.variant_n).padStart(2, "0")}` : ""}
          </span>
          <h3 style={{ margin: "4px 0 0", fontWeight: 600, fontSize: 18, letterSpacing: "-0.005em", color: "var(--ink)" }}>
            {node.beat?.title ?? "Untitled"}
          </h3>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: 6,
            color: "var(--ink)",
            backdropFilter: "blur(10px)",
            background: "color-mix(in srgb, var(--ink) 5%, transparent)",
            border: 0,
            boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--ink) 22%, transparent)",
            borderRadius: 999,
            cursor: "pointer"
          }}
        >
          <X size={14} />
        </button>
      </header>

      {node.clip_url ? (
        <div style={{ position: "relative", overflow: "hidden", borderRadius: 18, background: "#14100c", aspectRatio: "16/9", flexShrink: 0, minHeight: 160 }}>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            src={node.clip_url}
            poster={node.frame_url ?? undefined}
            controls
            loop
            muted
            playsInline
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
          <span
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              letterSpacing: "0.02em",
              padding: "2px 6px",
              borderRadius: 999,
              background: "var(--viridian)",
              color: "var(--on-accent-3)",
              pointerEvents: "none"
            }}
          >
            ▶ Clip ready
          </span>
        </div>
      ) : node.frame_url ? (
        <div style={{ position: "relative", overflow: "hidden", borderRadius: 18, background: "var(--cream-deep)", aspectRatio: "16/9", flexShrink: 0, minHeight: 160 }}>
          <div
            role="img"
            aria-label={node.beat?.title ?? ""}
            style={{ width: "100%", height: "100%", backgroundImage: `url(${node.frame_url})`, backgroundSize: "cover", backgroundPosition: "center" }}
          />
          {(animating || node.clip_state === "generating") && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.62)" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.02em", color: "#FFFBF1" }}>Rendering clip…</span>
            </div>
          )}
        </div>
      ) : null}

      <div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.02em", color: "var(--mute)" }}>Scene number</span>
        <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
          <input
            type="number"
            min={1}
            value={scene}
            onChange={(e) => setScene(Math.max(1, Number(e.target.value) || 1))}
            onBlur={() => {
              if (scene !== (node.beat?.n ?? 1)) onSetSceneNumber(scene);
            }}
            style={{
              width: 80,
              padding: "8px 10px",
              background: "var(--bg)",
              color: "var(--ink)",
              border: "none",
              borderRadius: 12,
              boxShadow: "inset 0 0 0 1.5px var(--cream-deep)",
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              textAlign: "center",
              outline: "none"
            }}
          />
          <span style={{ fontSize: 11, color: "var(--mute)", lineHeight: 1.35 }}>Sets the horizontal column on the board.</span>
        </div>
      </div>

      <div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.02em", color: "var(--mute)" }}>Scene heading</span>
        <div
          style={{
            marginTop: 8,
            padding: "8px 12px",
            background: "var(--bg)",
            borderRadius: 18,
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            color: "var(--ink-soft)"
          }}
        >
          {node.beat?.scene_heading ?? "—"}
        </div>
      </div>

      {(node.beat?.characters?.length ?? 0) > 0 && (
        <div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.02em", color: "var(--mute)" }}>Cast in frame</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {(node.beat?.characters ?? []).map((c) => (
              <span
                key={c}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "5px 12px",
                  fontWeight: 500,
                  fontSize: 13,
                  borderRadius: 999,
                  background: "var(--bg)",
                  color: "var(--ink)",
                  boxShadow: "var(--shadow-1)"
                }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.02em", color: "var(--mute)" }}>
          Duration · {duration.toFixed(1)}s
        </span>
        <input
          type="range"
          min={0.5}
          max={20}
          step={0.5}
          value={duration}
          onChange={(e) => setDurationLocal(Number(e.target.value))}
          onMouseUp={() => onSetDuration(duration)}
          onTouchEnd={() => onSetDuration(duration)}
          style={{ width: "100%", marginTop: 8, accentColor: "var(--accent)" }}
        />
      </div>

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.02em", color: "var(--mute)" }}>Video model</span>
        <select
          value={modelId}
          onChange={(e) => setModelId(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            background: "var(--bg)",
            color: "var(--ink)",
            border: "none",
            borderRadius: 18,
            boxShadow: "inset 0 0 0 1.5px var(--cream-deep)",
            fontFamily: "var(--font-ui)",
            fontSize: 13,
            fontWeight: 500,
            outline: "none",
            cursor: "pointer"
          }}
        >
          {VIDEO_MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label} · {m.costText}
            </option>
          ))}
        </select>
        <p style={{ margin: 0, color: "var(--mute)", fontSize: 11, lineHeight: 1.35 }}>{model.description}</p>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: tooPoor ? "var(--accent)" : "var(--mute)"
          }}
        >
          <span>
            {model.costText}
            {isHiggs ? " credits" : " / clip"}
          </span>
          <span>
            {!isHiggs
              ? "BytePlus · free tokens"
              : credits != null
              ? `Balance ${credits}`
              : balance?.connected === false
              ? "Higgsfield off"
              : "—"}
          </span>
        </div>
        <button
          disabled={animating || !node.frame_url}
          onClick={async () => {
            setNote(null);
            setAnimating(true);
            try {
              const res = await onAnimate(modelId);
              if (res?.simulated) setNote(res.note ?? "Simulated — connect Higgsfield or add a video key to render real motion.");
              else if (res?.error) setNote(res.error);
              else if (res?.ok) setNote(`Clip rendered by ${res.vendor ?? "the video model"}.`);
            } finally {
              setAnimating(false);
            }
          }}
          style={{
            width: "100%",
            justifyContent: "center",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            fontWeight: 600,
            fontSize: 13,
            color: "var(--on-accent)",
            background: "var(--accent)",
            border: "none",
            borderRadius: 999,
            boxShadow: "var(--shadow-1)",
            cursor: "pointer"
          }}
        >
          <Film size={12} /> {animating ? "Rendering…" : node.clip_url ? "Re-roll clip" : "Generate clip"}
        </button>
        {tooPoor && (
          <span style={{ fontSize: 11, color: "var(--accent)", lineHeight: 1.35 }}>
            Balance is below ≈{model.approxCost} cr — top up Higgsfield or pick a cheaper model.
          </span>
        )}
      </div>
      {note && (
        <p style={{ fontSize: 11, marginTop: 8, lineHeight: 1.4, color: "var(--mute)" }}>{note}</p>
      )}
      <button
        onClick={onDelete}
        style={{
          width: "100%",
          justifyContent: "center",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 14px",
          fontWeight: 600,
          fontSize: 13,
          color: "var(--on-accent)",
          background: "var(--tomato-deep)",
          border: "none",
          borderRadius: 999,
          boxShadow: "var(--shadow-1)",
          cursor: "pointer"
        }}
      >
        <Trash2 size={12} /> Remove from Stitch
      </button>
    </motion.aside>
  );
}
