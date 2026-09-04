"use client";

import * as React from "react";
import { useSelection, type Selected, type SelectionKind } from "../_state/selection";
import { Sheet, SheetContent } from "./ui/sheet";
import { IconButton } from "./ui/button";
import { X } from "./icons";

/**
 * The contextual inspector (brief §58).
 *
 * It exists only while something is selected, and only if something knows how
 * to inspect that kind of thing. A stage registers a body for a selection
 * kind — Shots registers the Shot Desk for "shot", World a character panel
 * for "character" — and the shell handles everything else: where the panel
 * sits, how wide it is, that it can be dragged, that it becomes a sheet on a
 * narrow screen, and that it disappears when the selection clears.
 *
 * Nothing here reserves space when there is nothing to inspect. The work
 * column takes the whole width back.
 */

export interface InspectorBodyProps {
  selected: Selected;
  close: () => void;
}

type Body = React.ComponentType<InspectorBodyProps>;
const registry = new Map<SelectionKind, Body>();
const listeners = new Set<() => void>();

/** Called once per stage module. Re-registering replaces. */
export function registerInspector(kind: SelectionKind, body: Body) {
  registry.set(kind, body);
  listeners.forEach((l) => l());
}

function useRegistry() {
  const [, force] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => {
    listeners.add(force);
    return () => {
      listeners.delete(force);
    };
  }, []);
  return registry;
}

const MIN_W = 280;
const MAX_W = 560;
const DEFAULT_W = 360;
const STORE = "fylmer:inspector-w";

function useNarrow() {
  const [narrow, setNarrow] = React.useState(false);
  React.useEffect(() => {
    const mq = matchMedia("(max-width: 1279px)");
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return narrow;
}

export function Inspector() {
  const { primary, clear } = useSelection();
  const reg = useRegistry();
  const narrow = useNarrow();
  const [width, setWidth] = React.useState<number>(() => {
    try {
      const v = Number(localStorage.getItem(STORE));
      return v >= MIN_W && v <= MAX_W ? v : DEFAULT_W;
    } catch {
      return DEFAULT_W;
    }
  });
  const dragging = React.useRef<{ startX: number; startW: number } | null>(null);

  const Body = primary ? reg.get(primary.kind) : undefined;

  // Publish the width so the body grid can give the panel its column.
  React.useLayoutEffect(() => {
    const root = document.documentElement;
    if (primary && Body && !narrow) root.style.setProperty("--inspector-w", `${width}px`);
    else root.style.setProperty("--inspector-w", "0px");
    return () => root.style.setProperty("--inspector-w", "0px");
  }, [primary, Body, narrow, width]);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = { startX: e.clientX, startW: width };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    // The handle is on the panel's left edge, so dragging left widens it.
    const next = Math.min(MAX_W, Math.max(MIN_W, dragging.current.startW + (dragging.current.startX - e.clientX)));
    setWidth(next);
  };
  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = null;
    try {
      localStorage.setItem(STORE, String(width));
    } catch {
      /* per-viewer convenience only */
    }
  };

  if (!primary || !Body) return null;

  if (narrow) {
    return (
      <Sheet open onOpenChange={(o) => !o && clear()}>
        <SheetContent side="bottom" title={primary.label}>
          <Body selected={primary} close={clear} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className="inspector" aria-label={`Inspect ${primary.label}`} style={{ width }}>
      <div
        className="inspector-handle"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize inspector"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setWidth((w) => Math.min(MAX_W, w + 16));
          if (e.key === "ArrowRight") setWidth((w) => Math.max(MIN_W, w - 16));
        }}
      />
      <header className="inspector-head">
        <span className="inspector-kind">{primary.kind}</span>
        <span className="inspector-title">{primary.label}</span>
        <IconButton label="Close inspector" size="sm" onClick={clear}>
          <X size={14} />
        </IconButton>
      </header>
      <div className="inspector-body">
        <Body selected={primary} close={clear} />
      </div>
    </aside>
  );
}
