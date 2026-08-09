"use client";

import { memo } from "react";
import { TINTS, type StitchTint } from "../../../lib/stitch/nodeTypes";
import type { StitchBoardNode } from "../../../lib/types";
import { BoardNode } from "./BoardNode";
import type { Box } from "./nodeGeometry";
import { useCommitOnBlur } from "./useCommitOnBlur";

export interface NoteNodeProps {
  node: StitchBoardNode;
  selected: boolean;
  dimmed: boolean;
  hovered: boolean;
  soleSelection: boolean;
  editing: boolean;
  drop?: "ok" | "no";
  override?: Box;
  autoFocus: boolean;
  onCommit: (content: string) => void;
  onSetTint: (tint: StitchTint) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

/** The board's sticky note: tinted body, borderless text, five brand swatches. */
function NoteNodeBase({
  node,
  selected,
  dimmed,
  hovered,
  soleSelection,
  editing,
  drop,
  override,
  autoFocus,
  onCommit,
  onSetTint,
  onDuplicate,
  onDelete
}: NoteNodeProps) {
  const field = useCommitOnBlur(node.id, node.content, onCommit);
  const tint = node.tint || "mustard";

  return (
    <BoardNode
      node={node}
      kind="note"
      className="stitch-note"
      style={{ ["--tint" as string]: `var(--tint-${tint})` }}
      selected={selected}
      dimmed={dimmed}
      editing={editing}
      hovered={hovered}
      soleSelection={soleSelection}
      drop={drop}
      override={override}
      headerLeft={<span className="t-eyebrow">NOTE</span>}
      headerRight={
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
      }
      onDuplicate={onDuplicate}
      onDelete={onDelete}
    >
      {/* readOnly outside edit mode: a single click selects and drags the note,
          a double-click puts the caret in. CSS also drops pointer-events on it
          so the press reaches the board router in the first place. */}
      <textarea
        className="stitch-note-body"
        data-part="text"
        readOnly={!editing}
        value={field.value}
        placeholder="Note…"
        autoFocus={autoFocus}
        onChange={(e) => field.onChange(e.target.value)}
        onBlur={field.onBlur}
      />
    </BoardNode>
  );
}

/* Memoized: during a drag only the dragged cards get a changed `override`,
   and every callback below is stable per node id (see nodeHandlers in
   Stitch.tsx), so the rest of the board bails out of re-rendering. */
export const NoteNode = memo(NoteNodeBase);
