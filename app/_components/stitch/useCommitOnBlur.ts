"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Local text state for a board node's editable body, committed on blur.
 *
 * Re-seeds when the component is pointed at a different node, and when the
 * incoming value changes while nothing is pending — that second case is what
 * makes undo/redo of a text edit visible, since a `field` op reaches the board
 * as a new `initial` under an unchanged node id. An uncommitted edit is never
 * clobbered: while `pending` holds keystrokes the local value wins. An
 * in-flight edit is flushed on unmount so closing the workspace never drops it.
 */
export function useCommitOnBlur(nodeId: string, initial: string, commit: (v: string) => void) {
  const [value, setValue] = useState(initial);
  const pending = useRef<string | null>(null);
  const lastInitial = useRef(initial);
  const commitRef = useRef(commit);
  commitRef.current = commit;

  useEffect(() => {
    setValue(initial);
    lastInitial.current = initial;
    pending.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId]);

  useEffect(() => {
    if (initial === lastInitial.current) return;
    lastInitial.current = initial;
    // Mid-edit: the director's keystrokes outrank a late server/undo value.
    if (pending.current !== null) return;
    setValue(initial);
  }, [initial]);

  useEffect(
    () => () => {
      if (pending.current !== null) commitRef.current(pending.current);
    },
    []
  );

  return {
    value,
    onChange(next: string) {
      setValue(next);
      pending.current = next;
    },
    onBlur() {
      if (pending.current === null) return;
      const next = pending.current;
      pending.current = null;
      commitRef.current(next);
    }
  };
}
