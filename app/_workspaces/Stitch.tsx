"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { ArrowRight, Film, Trash2, X } from "../_components/icons";
import { fadeUp } from "../_components/motion";
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

const EDGE_COLOR: Record<Transition["state"], string> = {
  complete: "#3DA89B", // viridian — done
  generating: "#F2B83C", // mustard — in progress
  pending: "#7A6855", // cocoa-mute
  error: "#E84A35" // tomato
};

export function Stitch({ project, onSwitchWorkspace }: Props) {
  const [stitchNodes, setStitchNodes] = useState<StitchNode[]>([]);
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [rfNodes, setRfNodes] = useState<RFNode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<"board" | "timeline">("board");
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
        label:
          t.state === "complete" && t.duration > 0
            ? `${t.style} · ${t.duration.toFixed(1)}s`
            : t.state === "generating"
            ? "Generating…"
            : t.state === "pending"
            ? `+ ${t.style}`
            : t.style,
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
  const completedTransitions = transitions.filter((t) => t.state === "complete").length;

  return (
    <div className="main-inner" style={{ paddingBottom: 0 }}>
      <motion.header className="page-head" {...fadeUp}>
        <div>
          <span className="t-eyebrow crumb">05 / WORKSPACE · STITCH</span>
          <h1 className="t-display-m" style={{ marginTop: "var(--sp-2)" }}>Stitch</h1>
          <p className="lead" style={{ marginTop: "var(--sp-3)", maxWidth: "64ch" }}>
            Freeform board. Drag any frame to reposition. The Video Director generates clips
            between every pair you wire. Click a frame to edit its scene number or duration.
          </p>
        </div>
        <div className="actions">
          {stitchNodes.length > 0 && (
            <div className="view-toggle" role="tablist" aria-label="Stitch view">
              <button role="tab" aria-selected={view === "board"} data-active={view === "board"} onClick={() => setView("board")}>
                Board
              </button>
              <button role="tab" aria-selected={view === "timeline"} data-active={view === "timeline"} onClick={() => setView("timeline")}>
                Timeline
              </button>
            </div>
          )}
          <span
            className="pip-state"
            data-status={completedTransitions === transitions.length && transitions.length > 0 ? "done" : "working"}
          >
            {completedTransitions} / {transitions.length || "—"} CLIPS · {totalDuration.toFixed(1)}s
          </span>
          <button className="btn btn-primary" onClick={() => onSwitchWorkspace("export")}>
            Continue to Export <ArrowRight size={14} />
          </button>
        </div>
      </motion.header>

      <div className="stitch-shell">
        {view === "board" ? (
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
          <Background gap={28} size={1} color="rgba(125, 104, 85, 0.22)" />
          <Controls
            showInteractive={false}
            style={{ background: "var(--surface)", border: "none", boxShadow: "var(--shadow-1)", borderRadius: "var(--radius)" }}
          />
          <MiniMap
            nodeStrokeWidth={0}
            nodeColor={(n) => (n.selected ? "#E84A35" : "#3DA89B")}
            nodeBorderRadius={6}
            maskColor="rgba(125, 104, 85, 0.18)"
            style={{
              background: "var(--surface)",
              border: "none",
              boxShadow: "var(--shadow-1)",
              borderRadius: "var(--radius)"
            }}
          />
        </ReactFlow>
        ) : (
          <StitchTimeline nodes={stitchNodes} selectedId={selectedId} onSelect={setSelectedId} />
        )}

        {selected && (
          <StitchInspector
            node={selected}
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

function StitchTimeline({
  nodes,
  selectedId,
  onSelect
}: {
  nodes: StitchNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const PX_PER_SEC = 46;
  const ordered = [...nodes].sort((a, b) => (a.beat?.n ?? 999) - (b.beat?.n ?? 999) || a.x - b.x);
  const total = ordered.reduce((s, n) => s + n.duration, 0);

  if (ordered.length === 0) {
    return (
      <div className="stitch-timeline">
        <span className="t-eyebrow" style={{ padding: "var(--sp-5)", color: "var(--mute)" }}>
          NO SHOTS YET · push frames from Storyboard
        </span>
      </div>
    );
  }

  return (
    <div className="stitch-timeline">
      <div className="stitch-timeline-head">
        <span className="t-eyebrow">TIMELINE · {ordered.length} SHOTS · {total.toFixed(1)}s RUNTIME</span>
        <span className="t-mute" style={{ fontSize: 11 }}>Click a shot to edit · width ∝ duration</span>
      </div>
      <div className="stitch-timeline-track">
        {ordered.map((n, i) => (
          <button
            key={n.id}
            className="stitch-tl-clip"
            data-selected={n.id === selectedId}
            style={{ width: Math.max(110, n.duration * PX_PER_SEC) }}
            onClick={() => onSelect(n.id)}
            title={`${n.beat?.title ?? "Untitled"} · ${n.duration.toFixed(1)}s`}
          >
            <span className="stitch-tl-thumb">
              {n.frame_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={n.frame_url} alt={n.beat?.title ?? ""} />
              ) : (
                <span className="t-eyebrow" style={{ color: "var(--mute)" }}>NO FRAME</span>
              )}
              {n.clip_url && <span className="stitch-tl-badge">▶ CLIP</span>}
              {n.clip_state === "generating" && (
                <span className="stitch-tl-badge" data-gen="true">RENDERING…</span>
              )}
            </span>
            <span className="stitch-tl-meta">
              <span className="stitch-tl-scene">S{String(n.beat?.n ?? i + 1).padStart(2, "0")}</span>
              <span className="stitch-tl-dur">{n.duration.toFixed(1)}s</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── Inspector ───────────────────────── */

function StitchInspector({
  node,
  onClose,
  onSetSceneNumber,
  onSetDuration,
  balance,
  onAnimate,
  onDelete
}: {
  node: StitchNode;
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
  const credits = balance?.credits ?? null;
  const tooPoor = credits != null && credits < model.approxCost;

  useEffect(() => {
    setScene(node.beat?.n ?? 1);
    setDurationLocal(node.duration);
    setNote(null);
  }, [node.id, node.beat?.n, node.duration]);

  return (
    <aside className="stitch-inspector">
      <header>
        <div>
          <span className="t-eyebrow">
            SCENE {String(scene).padStart(2, "0")}
            {node.variant_n ? ` · V${String(node.variant_n).padStart(2, "0")}` : ""}
          </span>
          <h3 className="t-h3" style={{ marginTop: "var(--sp-1)", color: "var(--ink)" }}>
            {node.beat?.title ?? "Untitled"}
          </h3>
        </div>
        <button className="btn-ghost btn btn-sm" onClick={onClose} aria-label="Close">
          <X size={14} />
        </button>
      </header>

      {node.clip_url ? (
        <div style={{ overflow: "hidden", borderRadius: "var(--radius)", background: "#14100c" }}>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            src={node.clip_url}
            poster={node.frame_url ?? undefined}
            controls
            loop
            muted
            playsInline
            style={{ display: "block", width: "100%" }}
          />
        </div>
      ) : node.frame_url ? (
        <div style={{ position: "relative", overflow: "hidden", borderRadius: "var(--radius)", background: "var(--cream-deep)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={node.frame_url} alt={node.beat?.title ?? ""} style={{ display: "block", width: "100%" }} />
          {(animating || node.clip_state === "generating") && (
            <div className="stitch-clip-rendering">
              <span className="t-eyebrow">RENDERING CLIP…</span>
            </div>
          )}
        </div>
      ) : null}

      <div>
        <span className="t-eyebrow">SCENE NUMBER</span>
        <div style={{ display: "flex", gap: "var(--sp-2)", marginTop: "var(--sp-2)", alignItems: "center" }}>
          <input
            type="number"
            min={1}
            value={scene}
            onChange={(e) => setScene(Math.max(1, Number(e.target.value) || 1))}
            onBlur={() => {
              if (scene !== (node.beat?.n ?? 1)) onSetSceneNumber(scene);
            }}
            style={{ width: 80, fontFamily: "var(--font-mono)", textAlign: "center" }}
          />
          <span className="t-mute" style={{ fontSize: "var(--t-body-s)" }}>
            Sets the horizontal column on the board.
          </span>
        </div>
      </div>

      <div>
        <span className="t-eyebrow">SCENE HEADING</span>
        <div
          style={{
            marginTop: "var(--sp-2)",
            padding: "var(--sp-2) var(--sp-3)",
            background: "var(--bg)",
            borderRadius: "var(--radius)",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--t-body-s)",
            color: "var(--ink-soft)"
          }}
        >
          {node.beat?.scene_heading ?? "—"}
        </div>
      </div>

      {(node.beat?.characters?.length ?? 0) > 0 && (
        <div>
          <span className="t-eyebrow">CAST IN FRAME</span>
          <div className="tag-strip" style={{ marginTop: "var(--sp-2)" }}>
            {(node.beat?.characters ?? []).map((c) => (
              <span key={c} className="tag">{c}</span>
            ))}
          </div>
        </div>
      )}

      <div>
        <span className="t-eyebrow">DURATION · {duration.toFixed(1)}s</span>
        <input
          type="range"
          min={0.5}
          max={20}
          step={0.5}
          value={duration}
          onChange={(e) => setDurationLocal(Number(e.target.value))}
          onMouseUp={() => onSetDuration(duration)}
          onTouchEnd={() => onSetDuration(duration)}
          style={{ width: "100%", marginTop: "var(--sp-2)" }}
        />
      </div>

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
        <span className="t-eyebrow" style={{ color: "var(--mute)" }}>VIDEO MODEL</span>
        <select value={modelId} onChange={(e) => setModelId(e.target.value)} style={{ width: "100%" }}>
          {VIDEO_MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label} · ≈{m.approxCost} cr
            </option>
          ))}
        </select>
        <p className="t-mute" style={{ fontSize: 11, lineHeight: 1.35, margin: 0 }}>{model.description}</p>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: tooPoor ? "var(--accent)" : "var(--mute)"
          }}
        >
          <span>≈ {model.approxCost} credits</span>
          <span>
            {credits != null
              ? `Balance ${credits}`
              : balance?.connected === false
              ? "Higgsfield off"
              : "—"}
          </span>
        </div>
        <button
          className="btn btn-sm btn-primary"
          style={{ width: "100%", justifyContent: "center" }}
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
        <p className="t-mute" style={{ fontSize: 11, marginTop: "var(--sp-2)", lineHeight: 1.4 }}>
          {note}
        </p>
      )}
      <button
        className="btn btn-sm btn-danger"
        onClick={onDelete}
        style={{ width: "100%", justifyContent: "center" }}
      >
        <Trash2 size={12} /> Remove from Stitch
      </button>
    </aside>
  );
}
