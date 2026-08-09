"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import type { DrawerBeatGroup, DrawerVariant } from "../../../lib/types";

export const DRAWER_W = 296;

export interface FrameDrawerProps {
  open: boolean;
  groups: DrawerBeatGroup[];
  /** variant_id → how many copies of it are on the board. */
  placedCount: Map<string, number>;
  /** Bounds to clamp the panel inside — the .stitch-shell rect. */
  shellRef: React.RefObject<HTMLDivElement | null>;
  onToggle: () => void;
  onThumbPointerDown: (e: React.PointerEvent, v: DrawerVariant, g: DrawerBeatGroup) => void;
}

/**
 * The frame library, floating over the board rather than docked beside it.
 *
 * It stays a *sibling* of .stitch-board, absolutely positioned to overlay it —
 * deliberately not a child. The drag-out drop test in Stitch.tsx is
 * `elementFromPoint` + `board.contains(...)`, written so that releasing a thumb
 * over the library is *not* a drop; reparenting the panel under the board would
 * turn "drop it back on the library" into "create a node hidden behind it".
 *
 * Position is UI state only: no schema, no API, resets per mount.
 */
export function FrameDrawer({
  open,
  groups,
  placedCount,
  shellRef,
  onToggle,
  onThumbPointerDown
}: FrameDrawerProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [pos, setPos] = useState({ x: 16, y: 16 });
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  function toggleGroup(beatId: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(beatId)) next.delete(beatId);
      else next.add(beatId);
      return next;
    });
  }

  function onHeadPointerDown(e: React.PointerEvent) {
    // The close button lives in the header — let it keep its click.
    if ((e.target as HTMLElement).closest("button")) return;
    const rect = shellRef.current?.getBoundingClientRect();
    if (!rect) return;
    drag.current = { dx: e.clientX - rect.left - pos.x, dy: e.clientY - rect.top - pos.y };
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    function move(e: PointerEvent) {
      const d = drag.current;
      const rect = shellRef.current?.getBoundingClientRect();
      if (!d || !rect) return;
      // Clamped every frame; the -80 keeps the header grabbable even at the bottom.
      const x = Math.min(Math.max(8, e.clientX - rect.left - d.dx), rect.width - DRAWER_W - 8);
      const y = Math.min(Math.max(8, e.clientY - rect.top - d.dy), rect.height - 80);
      setPos({ x: Math.round(x), y: Math.round(y) });
    }
    function up() {
      drag.current = null;
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [shellRef]);

  return (
    <aside
      className="stitch-drawer"
      data-open={open}
      aria-hidden={!open}
      style={{ left: pos.x, top: pos.y, width: DRAWER_W }}
    >
      <div className="stitch-drawer-head" onPointerDown={onHeadPointerDown}>
        <span className="t-eyebrow">FRAME LIBRARY</span>
        <button className="btn btn-sm btn-ghost" onClick={onToggle} aria-label="Close drawer">
          <X size={14} />
        </button>
      </div>

      <div className="stitch-drawer-body">
        {groups.length === 0 && (
          <p className="t-mute" style={{ fontSize: "var(--t-body-s)" }}>
            No storyboard frames yet. Generate variants in Storyboard and they land here.
          </p>
        )}

        {groups.map((g, i) => {
          const isCollapsed = collapsed.has(g.beat_id);
          return (
            <section
              key={g.beat_id}
              className="stitch-drawer-group fx-enter-up"
              style={{ ["--fx-delay" as string]: `${Math.min(i, 8) * 30}ms` }}
            >
              <button type="button" onClick={() => toggleGroup(g.beat_id)}>
                <span className="t-eyebrow">SCENE {String(g.beat_n).padStart(2, "0")}</span>
                <span className="title">{g.beat_title || g.scene_heading || "Untitled"}</span>
                <span className="chev">
                  {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                </span>
              </button>

              {!isCollapsed && (
                <div className="stitch-drawer-grid">
                  {g.variants.map((v) => {
                    const count = placedCount.get(v.id) ?? 0;
                    if (!v.url) {
                      return (
                        <div key={v.id} className="stitch-drawer-thumb" data-empty="true">
                          V{String(v.n).padStart(2, "0")}
                        </div>
                      );
                    }
                    return (
                      <div
                        key={v.id}
                        className="stitch-drawer-thumb"
                        role="button"
                        tabIndex={0}
                        title={v.prompt || `Variant ${v.n}`}
                        onPointerDown={(e) => onThumbPointerDown(e, v, g)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={v.url} alt={`Scene ${g.beat_n} variant ${v.n}`} draggable={false} />
                        <span className="stitch-drawer-badge">V{String(v.n).padStart(2, "0")}</span>
                        {count > 0 && <span className="stitch-drawer-count">{count}</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </aside>
  );
}
