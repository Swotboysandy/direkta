"use client";

import { memo } from "react";
import type { StitchPromptType } from "../../../lib/stitch/nodeTypes";
import type { StitchBoardNode } from "../../../lib/types";
import { BoardNode } from "./BoardNode";
import type { Box } from "./nodeGeometry";
import { useCommitOnBlur } from "./useCommitOnBlur";

/* One component, three variants — the three boxes differ only in their eyebrow,
   their placeholder and a 3px accent rail (keyed off data-kind in CSS), so three
   files would be three copies of the same textarea. */
const PROMPT_META: Record<StitchPromptType, { eyebrow: string; hint: string }> = {
  video_prompt: { eyebrow: "VIDEO PROMPT", hint: "What the camera does in this shot…" },
  sound_prompt: { eyebrow: "SOUND PROMPT", hint: "Music, ambience, SFX direction…" },
  dialogue_prompt: { eyebrow: "DIALOGUE", hint: "Spoken lines, VO…" }
};

export interface PromptNodeProps {
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
  onDuplicate: () => void;
  onDelete: () => void;
}

function PromptNodeBase({
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
  onDuplicate,
  onDelete
}: PromptNodeProps) {
  const meta = PROMPT_META[node.node_type as StitchPromptType] ?? PROMPT_META.video_prompt;
  const field = useCommitOnBlur(node.id, node.content, onCommit);

  return (
    <BoardNode
      node={node}
      kind={node.node_type}
      className="stitch-prompt"
      selected={selected}
      dimmed={dimmed}
      editing={editing}
      hovered={hovered}
      soleSelection={soleSelection}
      drop={drop}
      override={override}
      headerLeft={<span className="t-eyebrow">{meta.eyebrow}</span>}
      onDuplicate={onDuplicate}
      onDelete={onDelete}
    >
      <label className="stitch-node-field">
        <textarea
          className="input input-mono"
          data-part="text"
          readOnly={!editing}
          value={field.value}
          placeholder={meta.hint}
          autoFocus={autoFocus}
          style={{ padding: "8px 10px", fontSize: "var(--t-body-s)", lineHeight: 1.4, resize: "none" }}
          onChange={(e) => field.onChange(e.target.value)}
          onBlur={field.onBlur}
        />
      </label>
    </BoardNode>
  );
}

/* Memoized: during a drag only the dragged cards get a changed `override`,
   and every callback below is stable per node id (see nodeHandlers in
   Stitch.tsx), so the rest of the board bails out of re-rendering. */
export const PromptNode = memo(PromptNodeBase);
