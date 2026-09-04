"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A frame or a clip in a tile (brief §34, §69).
 *
 * A clip paints its first frame as the poster from `preload="metadata"` and
 * plays only after the pointer has rested on it for a moment — a sweep across
 * a grid of forty clips should not start forty decodes. One clip plays at a
 * time: starting another pauses the last. Under reduced motion nothing
 * autoplays; the poster stays.
 *
 * Nothing off screen touches the network. Images carry `loading="lazy"`, which
 * the browser honours on its own; video has no such attribute, so a grid of
 * clips used to fetch every one of their metadata ranges at load however far
 * down the page they were. Each tile now starts at `preload="none"` and asks
 * for its poster only once it is within a screen of view.
 */

const INTENT_MS = 400;

/** How far ahead of the viewport a clip starts loading its poster. Roughly one
 *  screen, so a normal scroll never outruns it. */
const PRELOAD_MARGIN = "600px";

let playing: HTMLVideoElement | null = null;

/** The nearest ancestor that actually scrolls, or null for the viewport. */
function scrollParent(el: HTMLElement): HTMLElement | null {
  for (let p = el.parentElement; p; p = p.parentElement) {
    const o = getComputedStyle(p).overflowY;
    if ((o === "auto" || o === "scroll") && p.scrollHeight > p.clientHeight) return p;
  }
  return null;
}

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
  const video = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);

  // Hooks run for images too — they must not sit behind the early return below.
  useEffect(() => {
    if (kind !== "video" || near) return;
    const el = video.current;
    if (!el) return;
    // No observer (older browsers, jsdom): behave as before rather than never
    // loading the poster at all.
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      // Against the real scroll container, not the viewport. The stage scrolls
      // inside .main, and an ancestor scroller clips the intersection rect no
      // matter what rootMargin says - so with the default root the margin was
      // discarded and a tile only loaded once it had already reached the edge
      // of view, which is a blank tile for as long as the fetch takes.
      { root: scrollParent(el), rootMargin: PRELOAD_MARGIN }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [kind, near]);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

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
      ref={video}
      className={className}
      src={url}
      muted
      playsInline
      preload={near ? "metadata" : "none"}
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
