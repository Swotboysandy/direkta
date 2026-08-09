"use client";

import { useCallback, useEffect, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const INITIAL: Viewport = { x: 40, y: 60, zoom: 0.7 };
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;

const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

/**
 * Pan / cursor-anchored zoom / world-space conversion for the Stitch board.
 * The single coordinate conversion in the app — everything that needs world
 * coordinates goes through `toWorld`.
 *
 * v3 removed the `onDragMove` / `onDragEnd` inversion and the exported
 * `panHandlers`: every interaction now funnels through useBoardInput, and the
 * viewport is pure math it drives, not a listener that claims events first.
 */
export function useBoardViewport(boardRef: RefObject<HTMLDivElement | null>) {
  const [viewport, setViewport] = useState<Viewport>(INITIAL);
  const [panning, setPanning] = useState(false);

  /* Cached board rect. toWorld runs on every pointermove of every drag, and a
     getBoundingClientRect() in that path is a forced layout read per event. A
     ResizeObserver plus scroll/resize listeners keep this fresh without one. */
  const rectRef = useRef<{ left: number; top: number; width: number; height: number }>({
    left: 0,
    top: 0,
    width: 0,
    height: 0
  });

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      rectRef.current = { left: r.left, top: r.top, width: r.width, height: r.height };
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [boardRef]);

  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;

  const toWorld = useCallback((clientX: number, clientY: number) => {
    const rect = rectRef.current;
    const v = viewportRef.current;
    return {
      x: (clientX - rect.left - v.x) / v.zoom,
      y: (clientY - rect.top - v.y) / v.zoom
    };
  }, []);

  const toScreen = useCallback((worldX: number, worldY: number) => {
    const rect = rectRef.current;
    const v = viewportRef.current;
    return { x: worldX * v.zoom + v.x + rect.left, y: worldY * v.zoom + v.y + rect.top };
  }, []);

  const panBy = useCallback((dx: number, dy: number) => {
    setViewport((current) => ({ ...current, x: current.x + dx, y: current.y + dy }));
  }, []);

  /** Zoom keeping the world point under (clientX, clientY) pinned to it. */
  const zoomAt = useCallback((clientX: number, clientY: number, factor: number) => {
    setViewport((current) => {
      const nextZoom = clampZoom(current.zoom * factor);
      if (nextZoom === current.zoom) return current;
      const rect = rectRef.current;
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      const wx = (px - current.x) / current.zoom;
      const wy = (py - current.y) / current.zoom;
      return { zoom: nextZoom, x: px - wx * nextZoom, y: py - wy * nextZoom };
    });
  }, []);

  /* React registers `wheel` as a passive listener on its root container, so
     preventDefault() inside an onWheel prop is a no-op — the board would act
     *and* the scrollable workspace behind it would scroll, with a console
     warning on every tick. Bind it natively with passive:false instead. */
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    function onWheel(event: WheelEvent) {
      event.preventDefault();
      /* macOS trackpad pinch arrives as ctrl+wheel with fractional deltaY, so
         that — and cmd+wheel — is zoom; a bare two-finger scroll pans, which is
         what every real board does. exp(-dy/100) rather than a fixed 1.1/0.9
         step because pinch deltas are continuous and a step feels notchy; a
         discrete mouse notch (±100) still lands within a hair of 1.1×. */
      if (event.ctrlKey || event.metaKey) {
        /* Clamped exponent, not a raw exp(-dy/100): trackpad pinch deltas are
           fractional (≈1–10 → 1.01–1.10×, smooth and continuous, which a fixed
           1.1/0.9 step could never be), but a discrete mouse notch is deltaY
           ±100, and unclamped that is a 2.7× teleport per click of the wheel.
           ±0.22 caps one event at ~1.25×, which is a normal zoom step. */
        const k = Math.max(-0.22, Math.min(0.22, -event.deltaY * 0.01));
        zoomAt(event.clientX, event.clientY, Math.exp(k));
      } else if (event.shiftKey) {
        panBy(-(event.deltaY || event.deltaX), 0);
      } else {
        panBy(-event.deltaX, -event.deltaY);
      }
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [boardRef, panBy, zoomAt]);

  const frameTo = useCallback((boxes: Box[], pad = 160) => {
    const rect = rectRef.current;
    if (!rect.width || boxes.length === 0) return;
    const minX = Math.min(...boxes.map((b) => b.x));
    const maxX = Math.max(...boxes.map((b) => b.x + b.w));
    const minY = Math.min(...boxes.map((b) => b.y));
    const maxY = Math.max(...boxes.map((b) => b.y + b.h));
    const w = Math.max(1, maxX - minX);
    const h = Math.max(1, maxY - minY);
    const zoom = clampZoom(Math.min(rect.width / (w + pad), rect.height / (h + pad)));
    setViewport({
      x: (rect.width - (minX + maxX) * zoom) / 2,
      y: (rect.height - (minY + maxY) * zoom) / 2,
      zoom
    });
  }, []);

  const reset = useCallback(() => setViewport(INITIAL), []);

  /** Zoom about the board's visual centre — the ± buttons and cmd +/−. */
  const zoomBy = useCallback((factor: number) => {
    const rect = rectRef.current;
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, factor);
  }, [zoomAt]);

  /** The world rectangle currently on screen — guide candidates read it. */
  const worldRect = useCallback((): Box => {
    const rect = rectRef.current;
    const v = viewportRef.current;
    return { x: -v.x / v.zoom, y: -v.y / v.zoom, w: rect.width / v.zoom, h: rect.height / v.zoom };
  }, []);

  return {
    viewport,
    setViewport: setViewport as Dispatch<SetStateAction<Viewport>>,
    toWorld,
    toScreen,
    worldRect,
    rectRef,
    panBy,
    zoomAt,
    panning,
    setPanning,
    frameTo,
    reset,
    zoomBy
  };
}
