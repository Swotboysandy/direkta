"use client";

import * as React from "react";

/**
 * What the user has selected, app-wide (brief §10, §58).
 *
 * The Director Dock reads this to know what "make this slower" refers to;
 * the inspector reads it to decide whether to exist. Workspaces write to it
 * where they already track a selection — Stitch's `selectedId`, the storyboard
 * lightbox, a character card — so the shell never has to ask.
 *
 * One primary selection plus an optional multi-select set. The primary is
 * what the Dock and inspector act on; the set is for batch actions.
 */

export type SelectionKind =
  | "shot"
  | "take"
  | "frame"
  | "beat"
  | "scene"
  | "character"
  | "location"
  | "prop"
  // Assets selects the asset itself. "frame" already means a storyboard frame
  // inside a beat row, which is a narrower thing than "an image in the
  // library" — a still uploaded to a production is not a storyboard frame.
  | "image"
  | "video";

export interface Selected {
  kind: SelectionKind;
  id: string;
  /** What to call it in the Dock's context chip: "Shot 07", "Asha · Soul ID". */
  label: string;
  projectId: string;
}

interface SelectionState {
  primary: Selected | null;
  /** Ids in the current multi-select, keyed by kind so a shot and a frame
   *  with the same id cannot collide. */
  many: Set<string>;
  select: (s: Selected | null) => void;
  toggle: (s: Selected) => void;
  clear: () => void;
}

const key = (s: Pick<Selected, "kind" | "id">) => `${s.kind}:${s.id}`;

const Ctx = React.createContext<SelectionState | null>(null);

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [primary, setPrimary] = React.useState<Selected | null>(null);
  const [many, setMany] = React.useState<Set<string>>(() => new Set());

  const select = React.useCallback((s: Selected | null) => {
    setPrimary(s);
    setMany(s ? new Set([key(s)]) : new Set());
  }, []);

  const toggle = React.useCallback((s: Selected) => {
    setMany((prev) => {
      const next = new Set(prev);
      const k = key(s);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
    setPrimary(s);
  }, []);

  const clear = React.useCallback(() => {
    setPrimary(null);
    setMany(new Set());
  }, []);

  const value = React.useMemo(() => ({ primary, many, select, toggle, clear }), [primary, many, select, toggle, clear]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSelection(): SelectionState {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useSelection needs a <SelectionProvider> above it");
  return ctx;
}

/** True when this item is in the multi-select. */
export function useIsSelected(s: Pick<Selected, "kind" | "id">): boolean {
  return useSelection().many.has(key(s));
}
