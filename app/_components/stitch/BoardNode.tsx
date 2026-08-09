"use client";

import { memo, type ReactNode } from "react";
import { Copy, Trash2 } from "lucide-react";
import type { StitchBoardNode } from "../../../lib/types";
import { ConnectHandles } from "./ConnectHandles";
import { ResizeHandles } from "./ResizeHandles";
import { nodeBox, type Box } from "./nodeGeometry";

export interface BoardNodeProps {
  node: StitchBoardNode;
  selected: boolean;
  dimmed: boolean;
  /** Text edit mode — the textarea is live, dragging is off. */
  editing: boolean;
  /** The pointer is over this node with the select tool: reveal the side dots. */
  hovered: boolean;
  /** Sole member of the selection — resize grips only ever show on one node. */
  soleSelection: boolean;
  /** Live drop-target verdict while a connector is being dragged onto it. */
  drop?: "ok" | "no";
  /** Live geometry override while this node is being dragged or resized. */
  override?: Box;
  /** Order badge / eyebrow, left of the grab bar. */
  headerLeft?: ReactNode;
  /** Per-type extras — quick-add, tint swatches. */
  headerRight?: ReactNode;
  /** data-kind on the shell — drives the per-type CSS variants. */
  kind: string;
  style?: React.CSSProperties;
  className?: string;
  onDuplicate: () => void;
  onDelete: () => void;
  children: ReactNode;
}

/**
 * The shared shell every board node wears: absolute placement, selection and
 * dim state, the header strip, the hover tool cluster, and the connect / resize
 * grips.
 *
 * It handles no pointer events. Every node publishes `data-node-id` plus a
 * `data-part` on each region and `useBoardInput` hit-tests with `closest()`.
 * That is what makes drag-anywhere, marquee, multi-drag and alt-duplicate a
 * single decision table rather than five components each guessing which of
 * their children should have stopped propagation.
 *
 * Memoized: during a drag only the dragged cards get a changed `override`, so
 * the rest of the board bails out of re-rendering entirely.
 */
function BoardNodeBase({
  node,
  selected,
  dimmed,
  editing,
  hovered,
  soleSelection,
  drop,
  override,
  headerLeft,
  headerRight,
  kind,
  style,
  className,
  onDuplicate,
  onDelete,
  children
}: BoardNodeProps) {
  /* No inline z-index anywhere: `z` reorders nodes *within* a CSS band by
     changing their DOM order (see paintOrder in Stitch.tsx), so the band ladder
     in globals.css keeps deciding shapes-under-edges-under-cards. */
  const box = nodeBox(node);
  const w = override?.w ?? box.w;
  const h = override?.h ?? box.h;
  const x = override?.x ?? node.x;
  const y = override?.y ?? node.y;

  return (
    <div
      className={className ? `stitch-node ${className}` : "stitch-node"}
      data-node-id={node.id}
      data-part="body"
      data-kind={kind}
      data-selected={selected}
      data-dim={dimmed}
      data-editing={editing}
      data-hover={hovered || undefined}
      data-drop={drop}
      style={{ left: x, top: y, width: w, height: h, ...style }}
    >
      {/* The header is still the visual grab bar, but the whole body drags now. */}
      <div className="stitch-node-grab">
        {headerLeft}
        <div className="stitch-node-tools" data-part="chrome">
          {headerRight}
          <button type="button" title="Duplicate" onClick={onDuplicate}>
            <Copy size={12} />
          </button>
          <button type="button" title="Remove from board" onClick={onDelete}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {children}

      {(hovered || soleSelection) && !editing && <ConnectHandles />}
      {soleSelection && !editing && <ResizeHandles type={node.node_type} />}
    </div>
  );
}

export const BoardNode = memo(BoardNodeBase);
