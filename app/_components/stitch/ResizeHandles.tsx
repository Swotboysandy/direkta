"use client";

import type { StitchNodeType } from "../../../lib/stitch/nodeTypes";
import { HANDLES } from "./resize";

/**
 * The selection's resize grips. Pure markup with `data-part="handle"` —
 * useBoardInput hit-tests them; they carry no pointer handlers of their own.
 *
 * Notes and shapes get all eight; frames and prompt boxes get corners only,
 * because a frame's height is derived from its width (16:9 image area) and an
 * edge handle would promise a degree of freedom the card cannot honour.
 */
export function ResizeHandles({ type }: { type: StitchNodeType }) {
  const handles = HANDLES[type] ?? HANDLES.frame;
  return (
    <>
      {handles.map((h) => (
        <span key={h} className="stitch-handle" data-part="handle" data-handle={h} />
      ))}
    </>
  );
}
