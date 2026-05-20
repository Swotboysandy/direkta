"use client";

import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CanvasEdge, CanvasNode } from "../../lib/types";

interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

interface ConnectDraft {
  sourceId: string;
  pointerX: number;
  pointerY: number;
}

interface Props {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMoveNode: (id: string, x: number, y: number) => void;
  onConnect: (sourceId: string, targetId: string) => void;
  onDeleteEdge: (id: string) => void;
  onFrameAll?: () => void;
}

export function Canvas({
  nodes,
  edges,
  selectedId,
  onSelect,
  onMoveNode,
  onConnect,
  onDeleteEdge
}: Props) {
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [panning, setPanning] = useState(false);
  const [draft, setDraft] = useState<ConnectDraft | null>(null);
  const panOrigin = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const dragState = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const toWorld = useCallback(
    (clientX: number, clientY: number) => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: (clientX - rect.left - viewport.x) / viewport.zoom,
        y: (clientY - rect.top - viewport.y) / viewport.zoom
      };
    },
    [viewport.x, viewport.y, viewport.zoom]
  );

  const onWheel = useCallback((event: React.WheelEvent) => {
    event.preventDefault();
    const factor = event.deltaY < 0 ? 1.1 : 0.9;
    setViewport((current) => {
      const nextZoom = Math.min(2, Math.max(0.3, current.zoom * factor));
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return { ...current, zoom: nextZoom };
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      const wx = (px - current.x) / current.zoom;
      const wy = (py - current.y) / current.zoom;
      return {
        zoom: nextZoom,
        x: px - wx * nextZoom,
        y: py - wy * nextZoom
      };
    });
  }, []);

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (event.target !== event.currentTarget) return;
      onSelect(null);
      setPanning(true);
      panOrigin.current = { x: event.clientX, y: event.clientY, vx: viewport.x, vy: viewport.y };
      (event.currentTarget as Element).setPointerCapture(event.pointerId);
    },
    [viewport.x, viewport.y, onSelect]
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (draft) {
        const world = toWorld(event.clientX, event.clientY);
        setDraft({ ...draft, pointerX: world.x, pointerY: world.y });
        return;
      }
      if (dragState.current) {
        const { id, offsetX, offsetY } = dragState.current;
        const world = toWorld(event.clientX, event.clientY);
        onMoveNode(id, world.x - offsetX, world.y - offsetY);
        return;
      }
      if (!panning || !panOrigin.current) return;
      const dx = event.clientX - panOrigin.current.x;
      const dy = event.clientY - panOrigin.current.y;
      setViewport((current) => ({
        ...current,
        x: panOrigin.current!.vx + dx,
        y: panOrigin.current!.vy + dy
      }));
    },
    [panning, draft, toWorld, onMoveNode]
  );

  const onPointerUp = useCallback(
    (event: React.PointerEvent) => {
      setPanning(false);
      panOrigin.current = null;
      dragState.current = null;
      if (draft) setDraft(null);
      try {
        (event.currentTarget as Element).releasePointerCapture(event.pointerId);
      } catch {
        // ignore
      }
    },
    [draft]
  );

  const startNodeDrag = useCallback(
    (event: React.PointerEvent, node: CanvasNode) => {
      event.stopPropagation();
      onSelect(node.id);
      const world = toWorld(event.clientX, event.clientY);
      dragState.current = {
        id: node.id,
        offsetX: world.x - node.x,
        offsetY: world.y - node.y
      };
    },
    [onSelect, toWorld]
  );

  const beginConnect = useCallback(
    (event: React.PointerEvent, node: CanvasNode) => {
      event.stopPropagation();
      const world = toWorld(event.clientX, event.clientY);
      setDraft({ sourceId: node.id, pointerX: world.x, pointerY: world.y });
    },
    [toWorld]
  );

  const finishConnect = useCallback(
    (event: React.PointerEvent, target: CanvasNode) => {
      event.stopPropagation();
      if (!draft || draft.sourceId === target.id) {
        setDraft(null);
        return;
      }
      onConnect(draft.sourceId, target.id);
      setDraft(null);
    },
    [draft, onConnect]
  );

  useEffect(() => {
    if (nodes.length && viewport.x === 0 && viewport.y === 0) {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (rect) setViewport((v) => ({ ...v, x: rect.width / 2 - 200, y: 60 }));
    }
  }, [nodes.length, viewport.x, viewport.y]);

  const frameAll = useCallback(() => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect || nodes.length === 0) {
      setViewport({ x: 0, y: 0, zoom: 1 });
      return;
    }
    const minX = Math.min(...nodes.map((n) => n.x));
    const maxX = Math.max(...nodes.map((n) => n.x + n.width));
    const minY = Math.min(...nodes.map((n) => n.y));
    const maxY = Math.max(...nodes.map((n) => n.y + n.height));
    const w = Math.max(1, maxX - minX);
    const h = Math.max(1, maxY - minY);
    const zoom = Math.min(2, Math.max(0.3, Math.min(rect.width / (w + 200), rect.height / (h + 200))));
    setViewport({
      x: (rect.width - (minX + maxX) * zoom) / 2,
      y: (rect.height - (minY + maxY) * zoom) / 2,
      zoom
    });
  }, [nodes]);

  return (
    <div
      ref={wrapperRef}
      className={clsx("canvas-wrapper", panning && "panning", draft && "connecting")}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        className="canvas-grid"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`
        }}
      >
        <svg className="canvas-edges" width="6000" height="6000">
          {edges.map((edge) => {
            const a = nodes.find((node) => node.id === edge.source);
            const b = nodes.find((node) => node.id === edge.target);
            if (!a || !b) return null;
            const x1 = a.x + a.width / 2;
            const y1 = a.y + a.height;
            const x2 = b.x + b.width / 2;
            const y2 = b.y;
            const midY = (y1 + y2) / 2;
            return (
              <g key={edge.id} className="canvas-edge">
                <path
                  d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                  fill="none"
                  stroke="rgba(232, 232, 236, 0.32)"
                  strokeWidth={1.6}
                />
                <path
                  d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={12}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (confirm("Delete this connection?")) onDeleteEdge(edge.id);
                  }}
                  style={{ cursor: "pointer" }}
                />
              </g>
            );
          })}

          {draft && (() => {
            const source = nodes.find((node) => node.id === draft.sourceId);
            if (!source) return null;
            const x1 = source.x + source.width / 2;
            const y1 = source.y + source.height;
            const midY = (y1 + draft.pointerY) / 2;
            return (
              <path
                d={`M ${x1} ${y1} C ${x1} ${midY}, ${draft.pointerX} ${midY}, ${draft.pointerX} ${draft.pointerY}`}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={2}
                strokeDasharray="6 4"
              />
            );
          })()}
        </svg>

        {nodes.map((node) => {
          const image = typeof node.meta?.image === "string" ? (node.meta.image as string) : null;
          return (
            <div
              key={node.id}
              className={clsx("canvas-node", `kind-${node.kind}`, selectedId === node.id && "selected")}
              style={{
                left: node.x,
                top: node.y,
                width: node.width,
                minHeight: node.height
              }}
              onPointerDown={(event) => startNodeDrag(event, node)}
              onPointerUp={(event) => draft && draft.sourceId !== node.id && finishConnect(event, node)}
            >
              <span
                className="port port-top"
                onPointerUp={(event) => draft && draft.sourceId !== node.id && finishConnect(event, node)}
                aria-hidden
              />
              <header>
                <span className="node-kind">{node.kind}</span>
                <strong>{node.title}</strong>
              </header>
              {image && (
                <div className="node-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt={node.title} draggable={false} />
                </div>
              )}
              <p>{node.body || "Empty. Drop a brief or run the agent."}</p>
              <span
                className="port port-bottom"
                onPointerDown={(event) => beginConnect(event, node)}
                title="Drag to connect"
                aria-label="Connection handle"
              />
            </div>
          );
        })}
      </div>

      <div className="canvas-hud">
        <button onClick={frameAll} title="Frame all">⌖</button>
        <button onClick={() => setViewport({ x: 0, y: 0, zoom: 1 })} title="Reset view">⌂</button>
        <button onClick={() => setViewport((v) => ({ ...v, zoom: Math.min(2, v.zoom * 1.15) }))} title="Zoom in">+</button>
        <button onClick={() => setViewport((v) => ({ ...v, zoom: Math.max(0.3, v.zoom * 0.85) }))} title="Zoom out">−</button>
        <span>{Math.round(viewport.zoom * 100)}%</span>
      </div>
    </div>
  );
}
