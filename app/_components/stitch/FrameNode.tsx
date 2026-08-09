"use client";

import { memo } from "react";
import { Minus, Plus, Sparkles } from "lucide-react";
import type { StitchBoardNode } from "../../../lib/types";
import { BoardNode } from "./BoardNode";
import type { Box } from "./nodeGeometry";

export interface FrameNodeProps {
  node: StitchBoardNode;
  selected: boolean;
  /** 1-based index in the active chain; null when the node isn't in it. */
  orderNo: number | null;
  /** In a chain, but not the active one. */
  dimmed: boolean;
  hovered: boolean;
  soleSelection: boolean;
  drop?: "ok" | "no";
  override?: Box;
  isChainHead: boolean;
  onSetDuration: (d: number) => void;
  onQuickAdd: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMakeActive: () => void;
}

/**
 * The image-led beat card. It carries no prompt text of its own any more — the
 * video / sound / dialogue direction lives in separate prompt nodes attached to
 * it, so each one can be moved, duplicated and compared on its own.
 */
function FrameNodeBase({
  node,
  selected,
  orderNo,
  dimmed,
  hovered,
  soleSelection,
  drop,
  override,
  isChainHead,
  onSetDuration,
  onQuickAdd,
  onDuplicate,
  onDelete,
  onMakeActive
}: FrameNodeProps) {
  const scene = node.beat?.n != null ? String(node.beat.n).padStart(2, "0") : "—";
  const variant = node.variant_n != null ? ` · V${String(node.variant_n).padStart(2, "0")}` : "";

  function stepDuration(delta: number) {
    const next = Math.min(20, Math.max(0.5, Math.round((node.duration + delta) * 2) / 2));
    if (next !== node.duration) onSetDuration(next);
  }

  return (
    <BoardNode
      node={node}
      kind="frame"
      selected={selected}
      dimmed={dimmed}
      editing={false}
      hovered={hovered}
      soleSelection={soleSelection}
      drop={drop}
      override={override}
      headerLeft={
        <>
          {orderNo !== null && <span className="stitch-node-order">{String(orderNo).padStart(2, "0")}</span>}
          <span className="t-eyebrow">
            SCENE {scene}
            {variant}
          </span>
        </>
      }
      headerRight={
        <button type="button" title="Add prompt boxes" onClick={onQuickAdd}>
          <Sparkles size={12} />
        </button>
      }
      onDuplicate={onDuplicate}
      onDelete={onDelete}
    >
      <div className="stitch-node-frame">
        {node.frame_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={node.frame_url} alt={node.beat?.title ?? ""} draggable={false} />
        ) : (
          <span className="t-eyebrow">{node.beat ? "FRAME PENDING" : "NO BEAT"}</span>
        )}
      </div>

      {/* One row, so the card stays its derived height: the beat title gives way
          to "Make active" on a dimmed head — the less urgent of the two. */}
      {/* The strip itself is body, not chrome: marking the whole row chrome made
          the beat title a dead zone that could neither select nor drag the card,
          against "drag anywhere on the body". Only the controls opt out. */}
      <div className="stitch-node-foot">
        {isChainHead && dimmed ? (
          <button type="button" className="stitch-make-active" data-part="chrome" onClick={onMakeActive}>
            Make active
          </button>
        ) : (
          <span className="stitch-node-title" title={node.beat?.title ?? ""}>
            {node.beat?.title ?? "Untitled"}
          </span>
        )}
        <button type="button" title="Shorter" data-part="chrome" onClick={() => stepDuration(-0.5)}>
          <Minus size={11} />
        </button>
        <span>{node.duration.toFixed(1)}s</span>
        <button type="button" title="Longer" data-part="chrome" onClick={() => stepDuration(0.5)}>
          <Plus size={11} />
        </button>
      </div>
    </BoardNode>
  );
}

/* Memoized: during a drag only the dragged cards get a changed `override`,
   and every callback below is stable per node id (see nodeHandlers in
   Stitch.tsx), so the rest of the board bails out of re-rendering. */
export const FrameNode = memo(FrameNodeBase);
