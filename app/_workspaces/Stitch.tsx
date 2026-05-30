"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  type NodeTypes
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowRight, Film, Play, RefreshCcw, Trash2, X } from "lucide-react";
import { StitchNodeCard, type StitchNodeData } from "../_components/StitchNodeCard";
import type { Project, TransitionStyle, WorkspaceId } from "../../lib/types";

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

  // Sync our data into React Flow's nodes whenever the underlying list changes.
  useEffect(() => {
    setRfNodes(
      stitchNodes.map<RFNode>((n) => ({
        id: n.id,
        type: "stitch",
        position: { x: n.x, y: n.y },
        data: {
          frame_url: n.frame_url,
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
      <header className="page-head">
        <div>
          <span className="t-eyebrow crumb">05 / WORKSPACE · STITCH</span>
          <h1 className="t-display-m" style={{ marginTop: "var(--sp-2)" }}>Stitch</h1>
          <p className="lead" style={{ marginTop: "var(--sp-3)", maxWidth: "64ch" }}>
            Freeform board. Drag any frame to reposition. The Video Director generates clips
            between every pair you wire. Click a frame to edit its scene number or duration.
          </p>
        </div>
        <div className="actions">
          <span
            className="pip-state"
            data-status={completedTransitions === transitions.length && transitions.length > 0 ? "done" : "working"}
          >
            {completedTransitions} / {transitions.length || "—"} CLIPS · {totalDuration.toFixed(1)}s
          </span>
          <button className="btn">
            <Play size={14} /> Preview animatic
          </button>
          <button className="btn btn-primary" onClick={() => onSwitchWorkspace("export")}>
            Continue to Export <ArrowRight size={14} />
          </button>
        </div>
      </header>

      <div className="stitch-shell">
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={NODE_TYPES}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={onNodeDragStop}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          proOptions={{ hideAttribution: true }}
          fitView
          fitViewOptions={{ padding: 0.25, maxZoom: 1 }}
          minZoom={0.25}
          maxZoom={2}
          defaultEdgeOptions={{ type: "smoothstep" }}
        >
          <Background gap={28} size={1} color="rgba(42, 26, 18, 0.10)" />
          <Controls
            showInteractive={false}
            style={{ background: "var(--surface)", border: "none", boxShadow: "var(--shadow-1)", borderRadius: "var(--radius)" }}
          />
          <MiniMap
            nodeStrokeWidth={0}
            nodeColor={(n) => (n.selected ? "#E84A35" : "#3DA89B")}
            nodeBorderRadius={6}
            maskColor="rgba(42, 26, 18, 0.08)"
            style={{
              background: "var(--surface)",
              border: "none",
              boxShadow: "var(--shadow-1)",
              borderRadius: "var(--radius)"
            }}
          />
        </ReactFlow>

        {selected && (
          <StitchInspector
            node={selected}
            onClose={() => setSelectedId(null)}
            onSetSceneNumber={(scene) => setSceneNumber(selected, scene)}
            onSetDuration={(duration) => setDuration(selected, duration)}
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

/* ───────────────────────── Inspector ───────────────────────── */

function StitchInspector({
  node,
  onClose,
  onSetSceneNumber,
  onSetDuration,
  onDelete
}: {
  node: StitchNode;
  onClose: () => void;
  onSetSceneNumber: (n: number) => void;
  onSetDuration: (d: number) => void;
  onDelete: () => void;
}) {
  const [scene, setScene] = useState<number>(node.beat?.n ?? 1);
  const [duration, setDurationLocal] = useState<number>(node.duration);

  useEffect(() => {
    setScene(node.beat?.n ?? 1);
    setDurationLocal(node.duration);
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

      {node.frame_url && (
        <div style={{ overflow: "hidden", borderRadius: "var(--radius)", background: "var(--cream-deep)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={node.frame_url} alt={node.beat?.title ?? ""} style={{ display: "block", width: "100%" }} />
        </div>
      )}

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

      <div style={{ display: "flex", gap: "var(--sp-2)", marginTop: "auto" }}>
        <button className="btn btn-sm" style={{ flex: 1, justifyContent: "center" }}>
          <RefreshCcw size={12} /> Replace frame
        </button>
        <button className="btn btn-sm btn-primary" style={{ flex: 1, justifyContent: "center" }}>
          <Film size={12} /> Generate clip
        </button>
      </div>
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
