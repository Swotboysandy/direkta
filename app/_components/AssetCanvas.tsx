"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { SPRING_SMOOTH } from "./motion";
import {
  Boxes,
  Film,
  Folder,
  Heart,
  Image as ImageIcon,
  LayoutDashboard,
  Play,
  Search,
  Users
} from "./icons";
import { Skeleton } from "./ui/skeleton";
import { ErrorState } from "./AsyncStates";
import { cn } from "@/lib/utils";
import { MediaTile } from "./ui/media-tile";

export interface CanvasItem {
  id: string;
  kind: "image" | "video" | "character" | "location" | "prop";
  url: string | null;
  title: string;
  subtitle: string | null;
  created_at: string;
  mentionable: boolean;
  ref_kind: "image" | "video" | null;
  favourite: boolean;
}

type Filter = "all" | "image" | "video" | "character" | "location" | "prop" | "favourite";

const RAIL: Array<{ id: Filter; label: string; Icon: typeof ImageIcon }> = [
  { id: "all", label: "Everything", Icon: LayoutDashboard },
  { id: "image", label: "Frames", Icon: ImageIcon },
  { id: "video", label: "Clips", Icon: Film },
  { id: "character", label: "Characters", Icon: Users },
  { id: "location", label: "Locations", Icon: Boxes },
  { id: "prop", label: "Props", Icon: Folder },
  { id: "favourite", label: "Favourites", Icon: Heart }
];

/** What each tab is missing, and what actually makes it. */
const EMPTY: Record<Filter, { title: string; next: string }> = {
  all: {
    title: "Nothing in this project yet.",
    next: "Describe a shot in the box below to make the first one."
  },
  image: {
    title: "No frames yet.",
    next: "Describe a shot below, or open Storyboard to generate them per beat."
  },
  video: {
    title: "No clips yet.",
    next: "Clips come from animating a frame — open Shots once you have one."
  },
  character: {
    title: "No cast yet.",
    next: "Add characters in World; their portraits become references you can @-mention."
  },
  location: {
    title: "No locations yet.",
    next: "Add them in World so shots can lock to the same place."
  },
  prop: {
    title: "No props yet.",
    next: "Add them in World to keep objects consistent between shots."
  },
  favourite: {
    title: "No favourites yet.",
    next: "Star anything on the canvas to keep it here."
  }
};

const PAGE = 60;

interface Props {
  projectId: string;
  /** Search text, when a surface above owns the field — the home screen takes
   *  it from the top bar so there is one search box on screen, not two. */
  query?: string;
  /** Changes when something finishes generating, so the new asset appears
   *  without the user having to reload or change filter. */
  assetsVersion?: number;
  onOpen?: (item: CanvasItem) => void;
}

/**
 * Every asset in the project on one surface.
 *
 * Cards use a real <img loading="lazy"> rather than a CSS background, because a
 * background image is fetched and decoded as soon as its element exists — on a
 * few hundred assets that is a few hundred simultaneous decodes on first paint.
 * With lazy images the browser only decodes what is near the viewport, which is
 * what keeps a large project scrolling smoothly without a virtualisation layer.
 *
 * Paging is by the assets route's cursor, requested when a sentinel at the foot
 * of the grid comes into view.
 */
export function AssetCanvas({ projectId, query: externalQuery, assetsVersion = 0, onOpen }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [items, setItems] = useState<CanvasItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  const ownsSearch = externalQuery === undefined;
  const effectiveQuery = ownsSearch ? query : externalQuery;

  // Typing shouldn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(effectiveQuery.trim()), 220);
    return () => clearTimeout(t);
  }, [effectiveQuery]);

  const url = useMemo(() => {
    const p = new URLSearchParams({ limit: String(PAGE) });
    if (filter === "favourite") p.set("favourite", "1");
    else if (filter !== "all") p.set("kind", filter);
    if (debounced) p.set("q", debounced);
    return `/api/projects/${projectId}/assets?${p.toString()}`;
  }, [projectId, filter, debounced]);

  // First page — and a fresh one whenever the filter or search changes.
  useEffect(() => {
    const controller = new AbortController();
    let live = true;
    setStatus("loading");
    setError(null);
    (async () => {
      try {
        const res = await fetch(url, { signal: controller.signal });
        const body = await res.json().catch(() => null);
        if (!live) return;
        if (!res.ok) throw new Error(body?.error || `Request failed (${res.status}).`);
        setItems(body.items ?? []);
        setCursor(body.next_cursor ?? null);
        setStatus((body.items ?? []).length === 0 ? "empty" : "ready");
      } catch (e: any) {
        if (!live || e?.name === "AbortError") return;
        setError(e?.message || "Could not load this project's assets.");
        setStatus("error");
      }
    })();
    return () => {
      live = false;
      controller.abort();
    };
  }, [url, assetsVersion]);

  const loadMore = useCallback(async () => {
    if (!cursor || more) return;
    setMore(true);
    try {
      const res = await fetch(`${url}&cursor=${encodeURIComponent(cursor)}`);
      const body = await res.json().catch(() => null);
      if (res.ok && body?.items) {
        // De-duplicate on id: a favourite toggled between pages can shift the
        // ordering enough to repeat an item across a cursor boundary.
        setItems((prev) => {
          const seen = new Set(prev.map((i) => i.id));
          return [...prev, ...body.items.filter((i: CanvasItem) => !seen.has(i.id))];
        });
        setCursor(body.next_cursor ?? null);
      }
    } finally {
      setMore(false);
    }
  }, [cursor, more, url]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !cursor) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) void loadMore();
    }, { rootMargin: "400px" });
    io.observe(node);
    return () => io.disconnect();
  }, [cursor, loadMore]);

  const toggleFavourite = useCallback(
    async (item: CanvasItem) => {
      const next = !item.favourite;
      // Optimistic: the star is the kind of control that has to feel immediate.
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, favourite: next } : i)));
      const res = await fetch(`/api/projects/${projectId}/favourites`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: item.kind, item_id: item.id, favourite: next })
      }).catch(() => null);
      if (!res || !res.ok) {
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, favourite: !next } : i)));
      }
    },
    [projectId]
  );

  return (
    <div className="canvas">
      <nav className="canvas-filters" aria-label="Filter assets">
        {RAIL.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={cn("canvas-filter", filter === id && "is-active")}
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
          >
            <Icon size={14} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="canvas-main">
        {ownsSearch && (
          <div className="canvas-search">
            <Search size={14} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search this project"
              aria-label="Search assets"
            />
          </div>
        )}

        {status === "loading" && (
          <div className="canvas-grid" aria-hidden="true">
            {Array.from({ length: 12 }, (_, i) => (
              <Skeleton key={i} className="aspect-video w-full rounded-[var(--r-md)]" />
            ))}
          </div>
        )}

        {status === "error" && <ErrorState message={error} onRetry={() => setQuery((q) => q)} />}

        {status === "empty" && (
          <div className="canvas-empty">
            <ImageIcon size={22} />
            <p>{debounced ? `Nothing matching “${debounced}”.` : EMPTY[filter].title}</p>
            {!debounced && <span>{EMPTY[filter].next}</span>}
          </div>
        )}

        {status === "ready" && (
          <>
            <div className="canvas-grid">
              {items.map((item, i) => (
                <motion.article
                  key={`${item.kind}:${item.id}`}
                  className="canvas-card"
                  data-kind={item.kind}
                  data-media={item.url ? "true" : "false"}
                  initial={{ y: 10 }}
                  animate={{ y: 0 }}
                  transition={{
                    ...SPRING_SMOOTH,
                    // Only the first screenful staggers; past that the delay
                    // would be longer than the scroll that revealed the card.
                    delay: i < 12 ? i * 0.025 : 0
                  }}
                >
                  <button
                    className="canvas-card-hit"
                    onClick={() => onOpen?.(item)}
                    aria-label={item.subtitle ? `${item.title} — ${item.subtitle}` : item.title}
                  >
                    {item.url ? (
                      // A clip paints its first frame as the poster and plays
                      // only after the pointer rests on it; one plays at a time.
                      <MediaTile
                        className="canvas-card-img"
                        url={item.url}
                        kind={item.kind === "video" ? "video" : "image"}
                      />
                    ) : (
                      <span className="canvas-card-blank">
                        <span className="canvas-card-initial">{item.title.slice(0, 1)}</span>
                        <span className="canvas-card-none">No image yet</span>
                      </span>
                    )}
                    {item.url && <span className="canvas-card-scrim" />}
                    <span className="canvas-card-title">{item.title}</span>
                  </button>

                  {item.kind === "video" && (
                    <span className="canvas-card-play" aria-hidden="true">
                      <Play size={11} />
                    </span>
                  )}

                  <button
                    className={cn("canvas-card-fav", item.favourite && "is-on")}
                    aria-label={item.favourite ? `Unfavourite ${item.title}` : `Favourite ${item.title}`}
                    aria-pressed={item.favourite}
                    onClick={() => toggleFavourite(item)}
                  >
                    <Heart size={12} />
                  </button>
                </motion.article>
              ))}
            </div>
            <div ref={sentinel} className="canvas-sentinel">
              {more && <span className="canvas-more">Loading more…</span>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
