"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";

export interface MenuItem {
  key: string;
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onPick: () => void;
}

interface Props {
  /** Client coordinates of the right-click. */
  x: number;
  y: number;
  /** The menu positions itself inside this element's box. */
  shellRef: RefObject<HTMLDivElement | null>;
  items: (MenuItem | "sep")[];
  onClose: () => void;
}

/**
 * The board's own context menu — never the native one, because the native menu
 * cannot offer "bring to front" and reads as a browser affordance on a surface
 * that is meant to feel like an app.
 *
 * Positioned in shell-local coordinates and flipped when it would overflow, so
 * a right-click near the bottom-right corner still shows the whole list.
 */
export function BoardMenu({ x, y, shellRef, items, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    const shell = shellRef.current;
    const el = ref.current;
    if (!shell || !el) return;
    const shellRect = shell.getBoundingClientRect();
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    let left = x - shellRect.left;
    let top = y - shellRect.top;
    if (left + w > shellRect.width) left = Math.max(0, left - w);
    if (top + h > shellRect.height) top = Math.max(0, top - h);
    setPos({ left, top });
  }, [x, y, shellRef]);

  useEffect(() => {
    // Capture phase: an outside press must close the menu before the board's own
    // pointerdown starts a marquee under it.
    function onDown(e: PointerEvent) {
      if (ref.current?.contains(e.target as Node)) return;
      onClose();
    }
    window.addEventListener("pointerdown", onDown, true);
    return () => window.removeEventListener("pointerdown", onDown, true);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="stitch-menu"
      style={{ left: pos?.left ?? -9999, top: pos?.top ?? -9999, visibility: pos ? "visible" : "hidden" }}
      role="menu"
    >
      {items.map((item, i) =>
        item === "sep" ? (
          <span key={`sep-${i}`} className="sep" />
        ) : (
          <button
            key={item.key}
            type="button"
            role="menuitem"
            data-danger={item.danger ? "true" : undefined}
            disabled={item.disabled}
            onClick={() => {
              onClose();
              item.onPick();
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        )
      )}
    </div>
  );
}
