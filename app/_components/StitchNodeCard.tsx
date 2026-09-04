"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { X } from "./icons";
import { Status } from "./ui/status";
import { useConfirm } from "./ui/alert-dialog";

export interface StitchNodeData {
  frame_url: string | null;
  clip_state?: string;
  duration: number;
  beat_n: number | null;
  beat_title: string | null;
  variant_n: number | null;
  onDelete: () => void;
  [key: string]: unknown;
}

/* A shot on the graph. Its colours come from the tokens (stage-shots.css), so
   it follows the theme instead of freezing a dark snapshot. */

export function StitchNodeCard({ data, selected }: NodeProps) {
  const confirmDialog = useConfirm();
  const d = data as StitchNodeData;
  const scene = d.beat_n ? `S${String(d.beat_n).padStart(2, "0")}` : "—";

  return (
    <div className="stitch-node" data-selected={selected}>
      <Handle type="target" position={Position.Left} className="stitch-node-handle is-target" />

      <button
        type="button"
        className="stitch-node-delete"
        aria-label="Remove from the board"
        title="Remove from the board"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={async (e) => {
          e.stopPropagation();
          const label = d.beat_n
            ? `Beat ${String(d.beat_n).padStart(2, "0")}${d.variant_n ? ` V${String(d.variant_n).padStart(2, "0")}` : ""}`
            : "this shot";
          if (
            await confirmDialog({
              title: `Remove ${label} from the board?`,
              description: "Its transition clips go with it. The storyboard frame is kept.",
              confirmLabel: "Remove shot",
              destructive: true
            })
          )
            d.onDelete();
        }}
      >
        <X size={12} />
      </button>

      <div className="stitch-node-head">
        <span className="stitch-node-scene">{scene} · img→vid</span>
        {d.clip_state === "complete" && <Status domain="generation" value="Complete" />}
        {d.clip_state === "generating" && <Status domain="generation" value="Rendering" />}
        {d.clip_state === "error" && <Status domain="generation" value="Failed" />}
      </div>

      <div className="stitch-node-frame">
        {d.frame_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.frame_url} alt={d.beat_title ?? ""} draggable={false} />
        ) : (
          <span className="stitch-node-empty">{d.beat_n ? "Frame pending" : "No beat"}</span>
        )}
        {d.clip_state === "generating" && <span className="shot-strip-shimmer" aria-hidden="true" />}
      </div>

      <div className="stitch-node-body">
        <span className="stitch-node-title" title={d.beat_title ?? undefined}>{d.beat_title ?? "Untitled"}</span>
        <div className="stitch-node-meta">
          <span>duration</span>
          <strong>{d.duration.toFixed(1)}s</strong>
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="stitch-node-handle is-source" />
    </div>
  );
}
