"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { X } from "lucide-react";

export interface StitchNodeData {
  frame_url: string | null;
  duration: number;
  beat_n: number | null;
  beat_title: string | null;
  variant_n: number | null;
  onDelete: () => void;
  [key: string]: unknown;
}

export function StitchNodeCard({ data, selected }: NodeProps) {
  const d = data as StitchNodeData;
  return (
    <div className="stitch-node" data-selected={selected}>
      <Handle type="target" position={Position.Left} className="stitch-node-handle" />
      <button
        type="button"
        className="stitch-node-delete"
        aria-label="Remove from Stitch"
        title="Remove from Stitch"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          const label = d.beat_n
            ? `Beat ${String(d.beat_n).padStart(2, "0")}${d.variant_n ? ` V${String(d.variant_n).padStart(2, "0")}` : ""}`
            : "this frame";
          if (confirm(`Remove ${label} from Stitch?`)) d.onDelete();
        }}
      >
        <X size={12} />
      </button>
      <div className="frame">
        {d.frame_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={d.frame_url} alt={d.beat_title ?? ""} draggable={false} />
        ) : (
          <div className="t-eyebrow" style={{ padding: 16, color: "var(--mute)" }}>
            {d.beat_n ? "FRAME PENDING" : "NO BEAT"}
          </div>
        )}
      </div>
      <div className="meta">
        <div className="t-eyebrow" style={{ color: "var(--mute)" }}>
          SCENE {d.beat_n ? String(d.beat_n).padStart(2, "0") : "—"}
          {d.variant_n ? ` · V${String(d.variant_n).padStart(2, "0")}` : ""}
        </div>
        <div className="title">{d.beat_title ?? "Untitled"}</div>
        <div className="duration">{d.duration.toFixed(1)}s</div>
      </div>
      <Handle type="source" position={Position.Right} className="stitch-node-handle" />
    </div>
  );
}
