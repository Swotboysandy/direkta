"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { X } from "./icons";

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

/* Graph nodes are a fixed dark "theatre" card — always near-black regardless
   of the app's light/dark theme, matching the Stitch graph canvas. */

export function StitchNodeCard({ data, selected }: NodeProps) {
  const d = data as StitchNodeData;
  const scene = d.beat_n ? `S${String(d.beat_n).padStart(2, "0")}` : "—";

  return (
    <div
      className="stitch-node"
      data-selected={selected}
      style={{
        background: "#17171B",
        borderRadius: 14,
        boxShadow: selected
          ? "inset 0 0 0 2px var(--accent), 0 10px 26px rgba(0,0,0,0.45)"
          : "0 6px 18px rgba(0,0,0,0.35)"
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{
          top: 86,
          left: -6,
          transform: "none",
          width: 11,
          height: 11,
          borderRadius: "50%",
          background: "var(--accent)",
          border: "2px solid #0B0B0D",
          boxSizing: "border-box",
          opacity: 1
        }}
      />

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

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "7px 10px",
          background: "#1F1F25",
          borderRadius: "14px 14px 0 0",
          borderBottom: "1px solid rgba(237,232,220,0.08)"
        }}
      >
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.02em", color: "var(--accent)" }}>
          {scene} · img→vid
        </span>
        {d.clip_state === "complete" && (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 8.5,
              letterSpacing: "0.02em",
              padding: "1px 6px",
              borderRadius: 999,
              background: "var(--viridian)",
              color: "var(--on-accent-3)"
            }}
          >
            ▶ Clip
          </span>
        )}
        {d.clip_state === "generating" && (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 8.5,
              letterSpacing: "0.02em",
              padding: "1px 6px",
              borderRadius: 999,
              background: "var(--mustard)",
              color: "#14100C"
            }}
          >
            rend…
          </span>
        )}
      </div>

      <div style={{ position: "relative", aspectRatio: "16/9", background: "#0A0A0C", overflow: "hidden" }}>
        {d.frame_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={d.frame_url}
            alt={d.beat_title ?? ""}
            draggable={false}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              color: "var(--mute)"
            }}
          >
            {d.beat_n ? "Frame pending" : "No beat"}
          </span>
        )}
        {d.clip_state === "generating" && (
          <span
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(100deg, transparent 35%, rgba(255,251,241,0.3) 50%, transparent 65%)",
              transform: "translateX(-100%)",
              animation: "fx-shimmer 1.6s ease-out infinite"
            }}
          />
        )}
      </div>

      <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--ink)", lineHeight: 1.3 }}>
          {d.beat_title ?? "Untitled"}
        </span>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.02em", color: "var(--mute)" }}>
            duration
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)" }}>
            {d.duration.toFixed(1)}s
          </span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{
          top: 86,
          right: -6,
          transform: "none",
          width: 11,
          height: 11,
          borderRadius: "50%",
          background: "var(--accent)",
          border: "2px solid #0B0B0D",
          boxSizing: "border-box",
          opacity: 1
        }}
      />
    </div>
  );
}
