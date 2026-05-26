"use client";

import clsx from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Film, Maximize2, Minus, Move, Play, Plus, RefreshCcw, Trash2, X } from "lucide-react";
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

const NODE_W = 220;
const NODE_H = 178;

interface Props {
  project: Project;
  onSwitchWorkspace: (ws: WorkspaceId) => void;
}

export function Stitch({ project, onSwitchWorkspace }: Props) {
  const [nodes, setNodes] = useState<StitchNode[]>([]);
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewport, setViewport] = useState({ x: 40, y: 60, zoom: 0.85 });
  const [panning, setPanning] = useState(false);
  const panOrigin = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  // Per-node drag origin — tracked so the node can be moved without panning the canvas.
  const dragOrigin = useRef<{
    nodeId: string;
    pointerX: number;
    pointerY: number;
    nodeX: number;
    nodeY: number;
  } | null>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  const reload = useCallback(async () => {
    const res = await fetch(`/api/projects/${project.id}/stitch`);
    if (!res.ok) return;
    const data = await res.json();
    setNodes(data.nodes);
    setTransitions(data.transitions);
  }, [project.id]);

  /** Persist a node patch (x/y/duration/scene_number) without blocking the UI. */
  async function patchNode(id: string, patch: { x?: number; y?: number; duration?: number; scene_number?: number }) {
    await fetch(`/api/stitch/nodes/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch)
    }).catch(() => {});
  }

  async function deleteNode(id: string) {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setTransitions((prev) => prev.filter((t) => t.from_node_id !== id && t.to_node_id !== id));
    if (selectedId === id) setSelectedId(null);
    await fetch(`/api/stitch/nodes/${id}`, { method: "DELETE" }).catch(() => {});
  }

  function startNodeDrag(event: React.PointerEvent, node: StitchNode) {
    event.stopPropagation();
    setSelectedId(node.id);
    dragOrigin.current = {
      nodeId: node.id,
      pointerX: event.clientX,
      pointerY: event.clientY,
      nodeX: node.x,
      nodeY: node.y
    };
    (event.currentTarget as Element).setPointerCapture(event.pointerId);
  }

  function moveNodeDrag(event: React.PointerEvent) {
    const drag = dragOrigin.current;
    if (!drag) return;
    const dx = (event.clientX - drag.pointerX) / viewport.zoom;
    const dy = (event.clientY - drag.pointerY) / viewport.zoom;
    const nextX = Math.round(drag.nodeX + dx);
    const nextY = Math.round(drag.nodeY + dy);
    setNodes((prev) => prev.map((n) => (n.id === drag.nodeId ? { ...n, x: nextX, y: nextY } : n)));
  }

  function endNodeDrag(event: React.PointerEvent) {
    const drag = dragOrigin.current;
    if (!drag) return;
    dragOrigin.current = null;
    try {
      (event.currentTarget as Element).releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
    const moved = nodes.find((n) => n.id === drag.nodeId);
    if (moved && (moved.x !== drag.nodeX || moved.y !== drag.nodeY)) {
      patchNode(drag.nodeId, { x: moved.x, y: moved.y });
    }
  }

  async function setSceneNumber(node: StitchNode, scene: number) {
    const newX = Math.max(1, scene) * 280 - 200; // (scene-1)*280 + 80
    setNodes((prev) => prev.map((n) => (n.id === node.id ? { ...n, x: newX } : n)));
    await patchNode(node.id, { scene_number: scene });
  }

  async function setDuration(node: StitchNode, duration: number) {
    setNodes((prev) => prev.map((n) => (n.id === node.id ? { ...n, duration } : n)));
    await patchNode(node.id, { duration });
  }

  useEffect(() => {
    reload();
  }, [reload]);

  const nodeById = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);
  const selected = selectedId ? nodeById[selectedId] : null;

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (event.target !== event.currentTarget) return;
      setSelectedId(null);
      setPanning(true);
      panOrigin.current = { x: event.clientX, y: event.clientY, vx: viewport.x, vy: viewport.y };
      (event.currentTarget as Element).setPointerCapture(event.pointerId);
    },
    [viewport.x, viewport.y]
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (!panning || !panOrigin.current) return;
      setViewport((v) => ({
        ...v,
        x: panOrigin.current!.vx + (event.clientX - panOrigin.current!.x),
        y: panOrigin.current!.vy + (event.clientY - panOrigin.current!.y)
      }));
    },
    [panning]
  );

  const onPointerUp = useCallback((event: React.PointerEvent) => {
    setPanning(false);
    panOrigin.current = null;
    try {
      (event.currentTarget as Element).releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
  }, []);

  const onWheel = useCallback((event: React.WheelEvent) => {
    event.preventDefault();
    const factor = event.deltaY < 0 ? 1.1 : 0.9;
    setViewport((v) => ({ ...v, zoom: Math.min(2, Math.max(0.3, v.zoom * factor)) }));
  }, []);

  function frameAll() {
    const rect = shellRef.current?.getBoundingClientRect();
    if (!rect || nodes.length === 0) return;
    const minX = Math.min(...nodes.map((n) => n.x));
    const maxX = Math.max(...nodes.map((n) => n.x + NODE_W));
    const minY = Math.min(...nodes.map((n) => n.y));
    const maxY = Math.max(...nodes.map((n) => n.y + NODE_H));
    const w = maxX - minX;
    const h = maxY - minY;
    const zoom = Math.min(2, Math.max(0.3, Math.min((rect.width - 380) / (w + 120), rect.height / (h + 120))));
    setViewport({
      x: (rect.width - 380 - (minX + maxX) * zoom) / 2,
      y: (rect.height - (minY + maxY) * zoom) / 2,
      zoom
    });
  }

  const totalDuration = nodes.reduce((sum, n) => sum + n.duration, 0);
  const completedTransitions = transitions.filter((t) => t.state === "complete").length;

  return (
    <div className="main-inner" style={{ paddingBottom: 0 }}>
      <header className="page-head">
        <div>
          <div className="crumb">05 / WORKSPACE · STITCH</div>
          <h1>Stitch</h1>
          <div className="sub">
            Connect your selected frames. The Video Director generates clips between every pair.
            Drag nodes to reorder; click an edge label to set the cut style or generate.
          </div>
        </div>
        <div className="actions">
          <span className="pip-state" data-s={completedTransitions === transitions.length && transitions.length > 0 ? "done" : "working"}>
            {completedTransitions} / {transitions.length || "—"} CLIPS · {totalDuration.toFixed(1)}s
          </span>
          <button className="btn">
            <Play size={12} /> Preview animatic
          </button>
          <button className="btn btn-primary" onClick={() => onSwitchWorkspace("export")}>
            Continue to Export <ArrowRight size={14} />
          </button>
        </div>
      </header>

      <div ref={shellRef} className="stitch-shell">
        <div
          className={clsx("stitch-canvas", panning && "dragging")}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              transformOrigin: "0 0",
              transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`
            }}
          >
            <svg
              className="stitch-edges"
              width={6000}
              height={6000}
              viewBox="0 0 6000 6000"
              preserveAspectRatio="none"
              style={{ width: 6000, height: 6000 }}
            >
              {transitions.map((t) => {
                const a = nodeById[t.from_node_id];
                const b = nodeById[t.to_node_id];
                if (!a || !b) return null;
                const x1 = a.x + NODE_W;
                const y1 = a.y + NODE_H / 2;
                const x2 = b.x;
                const y2 = b.y + NODE_H / 2;
                const midX = (x1 + x2) / 2;
                return (
                  <path
                    key={t.id}
                    className="stitch-edge"
                    data-state={t.state}
                    d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                  />
                );
              })}
            </svg>

            {transitions.map((t) => {
              const a = nodeById[t.from_node_id];
              const b = nodeById[t.to_node_id];
              if (!a || !b) return null;
              const x = (a.x + NODE_W + b.x) / 2;
              const y = (a.y + NODE_H / 2 + b.y + NODE_H / 2) / 2;
              return (
                <button
                  key={`label-${t.id}`}
                  className="stitch-edge-label"
                  data-state={t.state}
                  style={{ left: x, top: y }}
                  title={`${t.style} · ${t.state}`}
                >
                  {t.state === "complete" && t.duration > 0
                    ? `${t.style} · ${t.duration.toFixed(1)}s`
                    : t.state === "generating"
                    ? "Generating…"
                    : t.state === "pending"
                    ? `+ ${t.style}`
                    : t.style}
                </button>
              );
            })}

            {nodes.map((node) => (
              <div
                key={node.id}
                className="stitch-node"
                data-selected={node.id === selectedId}
                style={{ left: node.x, top: node.y }}
                onPointerDown={(e) => startNodeDrag(e, node)}
                onPointerMove={moveNodeDrag}
                onPointerUp={endNodeDrag}
                onPointerCancel={endNodeDrag}
              >
                <span className="stitch-node-drag-cue" aria-hidden>
                  <Move size={11} />
                </span>
                <button
                  type="button"
                  className="stitch-node-delete"
                  title="Remove from Stitch"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Remove Beat ${node.beat?.n ? String(node.beat.n).padStart(2, "0") : "—"}${node.variant_n ? ` V${String(node.variant_n).padStart(2, "0")}` : ""} from Stitch?`)) {
                      deleteNode(node.id);
                    }
                  }}
                >
                  <X size={12} />
                </button>
                <div className="frame">
                  {node.frame_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={node.frame_url} alt={node.beat?.title ?? ""} draggable={false} />
                  ) : (
                    <div className="eb" style={{ padding: 16 }}>
                      {node.beat ? "FRAME PENDING" : "NO BEAT"}
                    </div>
                  )}
                </div>
                <div className="meta">
                  <div className="eb">
                    SCENE {node.beat ? String(node.beat.n).padStart(2, "0") : "—"}
                    {node.variant_n ? ` · V${String(node.variant_n).padStart(2, "0")}` : ""}
                  </div>
                  <div className="title">{node.beat?.title ?? "Untitled"}</div>
                  <div className="duration">{node.duration.toFixed(1)}s</div>
                </div>
              </div>
            ))}
          </div>
        </div>

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

        <div className="stitch-hud">
          <button onClick={frameAll} title="Frame all">
            <Maximize2 size={14} />
          </button>
          <button
            onClick={() => setViewport({ x: 40, y: 60, zoom: 0.85 })}
            title="Reset"
            style={{ fontFamily: "var(--f-mono)", fontSize: 11 }}
          >
            ⌂
          </button>
          <button
            onClick={() => setViewport((v) => ({ ...v, zoom: Math.min(2, v.zoom * 1.15) }))}
            title="Zoom in"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={() => setViewport((v) => ({ ...v, zoom: Math.max(0.3, v.zoom * 0.85) }))}
            title="Zoom out"
          >
            <Minus size={14} />
          </button>
          <span
            style={{
              alignSelf: "center",
              padding: "0 8px",
              fontFamily: "var(--f-mono)",
              fontSize: 11,
              color: "var(--ink-60)"
            }}
          >
            {Math.round(viewport.zoom * 100)}%
          </span>
        </div>
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
          <h3
            className="t-h3"
            style={{ marginTop: "var(--sp-1)", color: "var(--ink)" }}
          >
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
