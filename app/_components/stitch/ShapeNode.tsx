"use client";

import { memo } from "react";
import { Circle, Square } from "lucide-react";
import { TINTS, type StitchShapeKind, type StitchTint } from "../../../lib/stitch/nodeTypes";
import type { StitchBoardNode } from "../../../lib/types";
import { BoardNode } from "./BoardNode";
import type { Box } from "./nodeGeometry";

export interface ShapeNodeProps {
  node: StitchBoardNode;
  selected: boolean;
  dimmed: boolean;
  hovered: boolean;
  soleSelection: boolean;
  drop?: "ok" | "no";
  override?: Box;
  onSetTint: (tint: StitchTint) => void;
  onSetShapeKind: (kind: StitchShapeKind) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

/**
 * A tinted backdrop for grouping things visually. It sits behind the edges and
 * its interior is click-through (CSS `pointer-events: none`) so it can never eat
 * a click meant for a card resting on top of it.
 *
 * That is a named exception to "drag anywhere on the body": a shape is grabbed
 * by its header strip, its eight handles, its four side dots, or the live 10px
 * border ring `.stitch-shape-ring` adds. Everything inside the ring stays
 * click-through, which is the whole point of a backdrop.
 */
function ShapeNodeBase({
  node,
  selected,
  dimmed,
  hovered,
  soleSelection,
  drop,
  override,
  onSetTint,
  onSetShapeKind,
  onDuplicate,
  onDelete
}: ShapeNodeProps) {
  const tint = node.tint || "cocoa";
  const ellipse = node.shape_kind === "ellipse";

  return (
    <BoardNode
      node={node}
      kind="shape"
      className={ellipse ? "stitch-shape stitch-shape-ellipse" : "stitch-shape"}
      style={{ ["--tint" as string]: `var(--tint-${tint})` }}
      selected={selected}
      dimmed={dimmed}
      editing={false}
      hovered={hovered}
      soleSelection={soleSelection}
      drop={drop}
      override={override}
      headerLeft={<span className="t-eyebrow">{ellipse ? "ELLIPSE" : "SHAPE"}</span>}
      headerRight={
        <>
          <span className="stitch-note-tints" data-part="chrome">
            {TINTS.filter((t): t is Exclude<StitchTint, ""> => t !== "").map((t) => (
              <button
                key={t}
                type="button"
                title={t}
                aria-label={`Tint ${t}`}
                data-active={tint === t}
                style={{ background: `var(--tint-${t})` }}
                onClick={() => onSetTint(t)}
              />
            ))}
          </span>
          {/* The only way to reach shape_kind — the dock places every shape as a
              rect, so without this the ellipse variant is unreachable. */}
          <button
            type="button"
            title={ellipse ? "Make it a rectangle" : "Make it an ellipse"}
            aria-label={ellipse ? "Make it a rectangle" : "Make it an ellipse"}
            onClick={() => onSetShapeKind(ellipse ? "rect" : "ellipse")}
          >
            {ellipse ? <Square size={12} /> : <Circle size={12} />}
          </button>
        </>
      }
      onDuplicate={onDuplicate}
      onDelete={onDelete}
    >
      {/* The grabbable border band. data-part="body" so the router treats a press
          on it exactly like a press on any other node body. */}
      <span className="stitch-shape-ring" data-part="body" aria-hidden />
    </BoardNode>
  );
}

/* Memoized: during a drag only the dragged cards get a changed `override`,
   and every callback below is stable per node id (see nodeHandlers in
   Stitch.tsx), so the rest of the board bails out of re-rendering. */
export const ShapeNode = memo(ShapeNodeBase);
