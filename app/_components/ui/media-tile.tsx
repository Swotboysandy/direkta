"use client";

import { useRef } from "react";

/**
 * A frame or a clip in a tile (brief §34, §69).
 *
 * A clip paints its first frame as the poster from `preload="metadata"` and
 * plays only after the pointer has rested on it for a moment — a sweep across
 * a grid of forty clips should not start forty decodes. One clip plays at a
 * time: starting another pauses the last. Under reduced motion nothing
 * autoplays; the poster stays.
 */

const INTENT_MS = 400;
let playing: HTMLVideoElement | null = null;

function reducedMotion() {
  return typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function MediaTile({
  url,
  kind,
  alt = "",
  className
}: {
  url: string;
  kind: "image" | "video";
  alt?: string;
  className?: string;
}) {
  const timer = useRef<number | null>(null);

  if (kind !== "video") {
    return <img className={className} src={url} alt={alt} loading="lazy" decoding="async" />;
  }

  const stop = (el: HTMLVideoElement) => {
    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    el.pause();
    el.currentTime = 0;
    if (playing === el) playing = null;
  };

  return (
    <video
      className={className}
      src={url}
      muted
      playsInline
      preload="metadata"
      aria-label={alt || undefined}
      onPointerEnter={(e) => {
        if (reducedMotion()) return;
        const el = e.currentTarget;
        timer.current = window.setTimeout(() => {
          if (playing && playing !== el) stop(playing);
          playing = el;
          void el.play().catch(() => {});
        }, INTENT_MS);
      }}
      onPointerLeave={(e) => stop(e.currentTarget)}
    />
  );
}
