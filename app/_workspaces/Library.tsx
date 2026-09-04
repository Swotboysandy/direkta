"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { pageIn, SPRING_SMOOTH } from "../_components/motion";
import { MediaTile } from "../_components/ui/media-tile";
import { Button, IconButton } from "../_components/ui/button";
import { EmptyState } from "../_components/ui/empty-state";
import { InlineError } from "../_components/ui/inline-error";
import { Skeleton } from "../_components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "../_components/ui/dialog";
import { useSelection } from "../_state/selection";
import { useAsync } from "../_hooks/useAsync";
import { Folder, Heart, Play, Plus, Search } from "../_components/icons";
import {
  publishAssets,
  type AssetItem,
  type AssetKind,
  type Collection
} from "../_components/inspectors/AssetInspector";
import { cn } from "@/lib/utils";
import type { Character, Location, Project, WorkspaceId } from "../../lib/types";

/**
 * Assets (brief §34–35).
 *
 * This used to be one production's canvas and nothing else, which made the
 * one question a library exists to answer — "where is that shot of the ruined
 * city, I made it on the other film" — the one question it could not answer.
 * The scope switch is the whole point of the surface: everything, or this
 * production, with the same filters over both.
 *
 * A tile is the image, the name and one quiet line. Nothing sits on it at
 * rest. What can be done with a thing appears when the pointer is on it or
 * when it is selected, and what can be done depends on what it is: a frame can
 * become a character's look or a shot; a clip can go into the cut or give up a
 * still. An action that cannot work on this asset is absent, not greyed out.
 */

const PAGE = 60;

type KindFilter = "all" | AssetKind | "favourite";

const KIND_FILTERS: Array<{ id: KindFilter; label: string }> = [
  { id: "all", label: "Everything" },
  { id: "image", label: "Frames" },
  { id: "video", label: "Clips" },
  { id: "character", label: "Characters" },
  { id: "location", label: "Locations" },
  { id: "prop", label: "Props" },
  { id: "favourite", label: "Favourites" }
];

const KIND_WORD: Record<AssetKind, string> = {
  image: "Frame",
  video: "Clip",
  character: "Character",
  location: "Location",
  prop: "Prop"
};

/** What is missing, why, and the one thing that makes it (brief §40). */
const EMPTY: Record<KindFilter, { title: string; why: string; action: string; go?: WorkspaceId }> = {
  all: {
    title: "Nothing here yet",
    why: "Frames, clips, cast and places appear here as they are made.",
    action: "Describe a shot"
  },
  image: {
    title: "No frames yet",
    why: "Frames are the stills the storyboard generates for each beat, and any still a shot starts from.",
    action: "Open Storyboard",
    go: "storyboard"
  },
  video: {
    title: "No clips yet",
    why: "A clip is a rendered shot. Shots come from storyboard frames, or from a description in the Dock.",
    action: "Describe a shot"
  },
  character: {
    title: "No cast yet",
    why: "Characters live in World. Each gets a Soul ID that keeps them the same person across shots.",
    action: "Open World",
    go: "casting"
  },
  location: {
    title: "No locations yet",
    why: "Locations live in World. Each gets a World ID so shots return to the same place.",
    action: "Open World",
    go: "casting"
  },
  prop: {
    title: "No props yet",
    why: "Props live in World, so an object looks the same every time it appears.",
    action: "Open World",
    go: "casting"
  },
  favourite: {
    title: "No favourites yet",
    why: "Star anything here and it stays within reach, in this production or across all of them.",
    action: "Show everything"
  }
};

interface Props {
  project: Project;
  assetsVersion?: number;
  onSwitchWorkspace: (ws: WorkspaceId) => void;
}

export function Library({ project, assetsVersion = 0, onSwitchWorkspace }: Props) {
  const { primary, select, clear } = useSelection();

  const [global, setGlobal] = useState(false);
  const [kind, setKind] = useState<KindFilter>("all");
  const [production, setProduction] = useState<string>("");
  const [collection, setCollection] = useState<string>("");
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  const [items, setItems] = useState<AssetItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const [nonce, setNonce] = useState(0);
  const sentinel = useRef<HTMLDivElement>(null);

  // The three pickers. Each is one asset waiting on one choice, so one piece
  // of state each rather than a modal manager.
  const [reference, setReference] = useState<{ item: AssetItem; to: "character" | "location" } | null>(null);
  const [collecting, setCollecting] = useState<AssetItem | null>(null);
  const [moving, setMoving] = useState<AssetItem | null>(null);

  const productions = useAsync<Project[]>("/api/projects", (b) => b.projects ?? []);
  const collections = useAsync<Collection[]>(`/api/collections?v=${nonce}`, (b) => b.collections ?? [], {
    isEmpty: () => false
  });
  const sets = collections.data ?? [];

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 220);
    return () => clearTimeout(t);
  }, [query]);

  const url = useMemo(() => {
    const p = new URLSearchParams({ limit: String(PAGE) });
    if (global) p.set("scope", "all");
    if (global && production) p.set("production", production);
    if (kind === "favourite") p.set("favourite", "1");
    else if (kind !== "all") p.set("kind", kind);
    if (collection) p.set("collection", collection);
    if (debounced) p.set("q", debounced);
    return `/api/projects/${project.id}/assets?${p.toString()}`;
  }, [project.id, global, production, kind, collection, debounced]);

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
        setError(e?.message || "Could not load these assets.");
        setStatus("error");
      }
    })();
    return () => {
      live = false;
      controller.abort();
    };
  }, [url, assetsVersion, nonce]);

  const loadMore = useCallback(async () => {
    if (!cursor || more) return;
    setMore(true);
    try {
      const res = await fetch(`${url}&cursor=${encodeURIComponent(cursor)}`);
      const body = await res.json().catch(() => null);
      if (res.ok && body?.items) {
        setItems((prev) => {
          const seen = new Set(prev.map((i) => `${i.kind}:${i.id}`));
          return [...prev, ...body.items.filter((i: AssetItem) => !seen.has(`${i.kind}:${i.id}`))];
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

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  const toggleFavourite = useCallback(async (item: AssetItem) => {
    const next = !item.favourite;
    setItems((prev) =>
      prev.map((i) => (i.kind === item.kind && i.id === item.id ? { ...i, favourite: next } : i))
    );
    const res = await fetch(`/api/projects/${item.project_id}/favourites`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: item.kind, item_id: item.id, favourite: next })
    }).catch(() => null);
    if (!res || !res.ok) {
      setItems((prev) =>
        prev.map((i) => (i.kind === item.kind && i.id === item.id ? { ...i, favourite: !next } : i))
      );
    }
  }, []);

  const setMembership = useCallback(async (item: AssetItem, collectionId: string, member: boolean) => {
    setItems((prev) =>
      prev.map((i) =>
        i.kind === item.kind && i.id === item.id
          ? {
              ...i,
              collections: member
                ? [...i.collections, collectionId]
                : i.collections.filter((c) => c !== collectionId)
            }
          : i
      )
    );
    setCollecting((c) =>
      c && c.kind === item.kind && c.id === item.id
        ? {
            ...c,
            collections: member
              ? [...c.collections, collectionId]
              : c.collections.filter((x) => x !== collectionId)
          }
        : c
    );
    await fetch(`/api/collections/${collectionId}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ project_id: item.project_id, kind: item.kind, item_id: item.id, member })
    }).catch(() => null);
    collections.reload();
  }, [collections]);

  // The inspector is mounted by the shell and cannot see any of this, so it is
  // published where the inspector body can read it.
  useEffect(() => {
    publishAssets({
      projectId: project.id,
      items,
      collections: sets,
      reload,
      go: onSwitchWorkspace,
      toggleFavourite,
      pickReference: (item, to) => setReference({ item, to }),
      pickCollection: (item) => setCollecting(item),
      pickProduction: (item) => setMoving(item)
    });
  }, [project.id, items, sets, reload, onSwitchWorkspace, toggleFavourite]);

  // Leaving Assets takes the panel with it: the body reads a store this
  // workspace owns, so a selection that outlived it would inspect nothing.
  useEffect(
    () => () => {
      publishAssets(null);
    },
    []
  );
  const selectedKind = useRef(primary?.kind);
  selectedKind.current = primary?.kind;
  useEffect(
    () => () => {
      if (selectedKind.current === "image" || selectedKind.current === "video") clear();
    },
    [clear]
  );

  const open = (item: AssetItem) => {
    if (item.kind === "image" || item.kind === "video") {
      select({ kind: item.kind, id: item.id, label: item.title, projectId: item.project_id });
    } else if (item.project_id === project.id) {
      onSwitchWorkspace("casting");
    }
  };

  // Grouping only earns its keep when the list actually spans productions.
  const groups = useMemo(() => {
    if (!global || production) return [{ id: "", title: "", items }];
    const out: Array<{ id: string; title: string; items: AssetItem[] }> = [];
    for (const item of items) {
      const at = out.find((g) => g.id === item.project_id);
      if (at) at.items.push(item);
      else out.push({ id: item.project_id, title: item.project_title, items: [item] });
    }
    return out;
  }, [items, global, production]);

  const scopeLabel = global ? "everything" : project.title;
  const filtered = kind !== "all" || !!collection || !!debounced || (global && !!production);

  return (
    <motion.div className="main-inner assets" {...pageIn}>
      <header className="assets-head">
        <div>
          <p className="assets-eyebrow">Assets</p>
          <h1 className="assets-title">
            {global ? "Everything you have made" : `Everything in ${project.title}`}
          </h1>
        </div>
        <div className="assets-scope" role="group" aria-label="Scope">
          <button
            type="button"
            className="assets-scope-tab"
            aria-pressed={!global}
            onClick={() => {
              setGlobal(false);
              setProduction("");
            }}
          >
            This production
          </button>
          <button type="button" className="assets-scope-tab" aria-pressed={global} onClick={() => setGlobal(true)}>
            All productions
          </button>
        </div>
      </header>

      <div className="assets-bar">
        <div className="assets-search">
          <Search size={14} />
          <input
            className="input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={global ? "Search every production" : `Search ${project.title}`}
            aria-label="Search assets"
          />
        </div>
        {global && (
          <label className="assets-pick">
            <span className="sr-only">Production</span>
            <select className="input" value={production} onChange={(e) => setProduction(e.target.value)}>
              <option value="">Every production</option>
              {(productions.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <nav className="assets-filters" aria-label="Filter assets">
        {KIND_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={cn("assets-chip", kind === f.id && "is-on")}
            aria-pressed={kind === f.id}
            onClick={() => setKind(f.id)}
          >
            {f.label}
          </button>
        ))}
        <span className="assets-filters-rule" aria-hidden="true" />
        {sets.map((c) => (
          <button
            key={c.id}
            type="button"
            className={cn("assets-chip", collection === c.id && "is-on")}
            aria-pressed={collection === c.id}
            onClick={() => setCollection((v) => (v === c.id ? "" : c.id))}
          >
            {c.name} <span className="assets-chip-n font-mono">{c.count}</span>
          </button>
        ))}
        <NewCollection onCreated={reload} />
      </nav>

      {status === "loading" && (
        <div className="assets-grid" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <Skeleton key={i} className="aspect-video w-full rounded-[var(--r-surface)]" />
          ))}
        </div>
      )}

      {status === "error" && (
        <InlineError message={error ?? "Assets could not be loaded."} onRetry={reload} className="assets-error" />
      )}

      {status === "empty" &&
        (debounced ? (
          <EmptyState
            title={`Nothing matching “${debounced}”`}
            why={`Search looks at the title and subtitle of everything in ${scopeLabel}.`}
            action={{ label: "Clear search", onClick: () => setQuery("") }}
            secondary={global ? undefined : { label: "Search every production", onClick: () => setGlobal(true) }}
          />
        ) : collection ? (
          <EmptyState
            title="This collection is empty here"
            why="A collection can hold work from several productions. Nothing in it matches the other filters."
            action={{ label: "Clear the collection filter", onClick: () => setCollection("") }}
          />
        ) : (
          <EmptyState
            title={EMPTY[kind].title}
            why={EMPTY[kind].why}
            action={{
              label: EMPTY[kind].action,
              onClick: () => {
                const go = EMPTY[kind].go;
                if (kind === "favourite") setKind("all");
                else if (go) onSwitchWorkspace(go);
                else document.querySelector<HTMLTextAreaElement>(".dock textarea")?.focus();
              }
            }}
            secondary={filtered ? { label: "Clear filters", onClick: () => { setKind("all"); setCollection(""); setProduction(""); setQuery(""); } } : undefined}
          />
        ))}

      {status === "ready" && (
        <>
          {groups.map((group) => (
            <section key={group.id || "one"} className="assets-group">
              {group.title && <h2 className="assets-group-name">{group.title}</h2>}
              <div className="assets-grid">
                {group.items.map((item, i) => (
                  <Tile
                    key={`${item.kind}:${item.id}`}
                    item={item}
                    index={i}
                    global={global}
                    selected={primary?.kind === item.kind && primary.id === item.id}
                    here={item.project_id === project.id}
                    onOpen={open}
                    onFavourite={toggleFavourite}
                    onCollect={setCollecting}
                    onReference={(it) => setReference({ item: it, to: "character" })}
                    onGo={onSwitchWorkspace}
                  />
                ))}
              </div>
            </section>
          ))}
          <div ref={sentinel} className="assets-sentinel">
            {more && <span className="assets-more">Loading more…</span>}
          </div>
        </>
      )}

      {reference && (
        <ReferenceDialog
          item={reference.item}
          initial={reference.to}
          onClose={() => setReference(null)}
          onDone={reload}
        />
      )}
      {collecting && (
        <CollectDialog
          item={collecting}
          collections={sets}
          onToggle={setMembership}
          onCreated={reload}
          onClose={() => setCollecting(null)}
        />
      )}
      {moving && (
        <ProductionDialog
          item={moving}
          productions={(productions.data ?? []).filter((p) => p.id !== moving.project_id)}
          onClose={() => setMoving(null)}
          onDone={reload}
        />
      )}
    </motion.div>
  );
}

/* -------------------------------------------------------------------- tile */

function Tile({
  item,
  index,
  global,
  selected,
  here,
  onOpen,
  onFavourite,
  onCollect,
  onReference,
  onGo
}: {
  item: AssetItem;
  index: number;
  global: boolean;
  selected: boolean;
  here: boolean;
  onOpen: (item: AssetItem) => void;
  onFavourite: (item: AssetItem) => void;
  onCollect: (item: AssetItem) => void;
  onReference: (item: AssetItem) => void;
  onGo: (ws: WorkspaceId) => void;
}) {
  const line = global ? item.project_title : (item.subtitle ?? KIND_WORD[item.kind]);

  return (
    <motion.article
      className={cn("asset", selected && "is-selected")}
      data-kind={item.kind}
      initial={{ y: 8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ ...SPRING_SMOOTH, delay: index < 12 ? index * 0.02 : 0 }}
    >
      <button
        type="button"
        className="asset-media"
        onClick={() => onOpen(item)}
        aria-pressed={selected}
        aria-label={item.subtitle ? `${item.title} — ${item.subtitle}` : item.title}
      >
        {item.url ? (
          <MediaTile
            url={item.url}
            kind={item.kind === "video" ? "video" : "image"}
            alt={item.title}
            className="asset-img"
          />
        ) : (
          <span className="asset-blank" aria-hidden="true">
            {item.title.trim()[0] ?? "?"}
          </span>
        )}
        {item.kind === "video" && (
          <span className="asset-play" aria-hidden="true">
            <Play size={10} />
          </span>
        )}
      </button>

      {/* Nothing sits on a tile at rest. This row exists only while the
          pointer is on the tile, something inside it has focus, or it is the
          selection (brief §35). */}
      <div className="asset-acts">
        <IconButton
          label={item.favourite ? `Unfavourite ${item.title}` : `Favourite ${item.title}`}
          size="sm"
          className={cn("asset-act", item.favourite && "is-on")}
          onClick={() => onFavourite(item)}
        >
          <Heart size={12} />
        </IconButton>
        <IconButton label={`Add ${item.title} to a collection`} size="sm" className="asset-act" onClick={() => onCollect(item)}>
          <Folder size={12} />
        </IconButton>
        {item.kind === "image" && (
          <button type="button" className="asset-act-text" onClick={() => onReference(item)}>
            Reference
          </button>
        )}
        {item.kind === "video" && here && (
          <button type="button" className="asset-act-text" onClick={() => onOpen(item)}>
            {item.source_kind === "stitch_clip" ? "In the cut" : "To the cut"}
          </button>
        )}
        {(item.kind === "character" || item.kind === "location" || item.kind === "prop") && here && (
          <button type="button" className="asset-act-text" onClick={() => onGo("casting")}>
            World
          </button>
        )}
        {item.kind === "character" && here && (
          <button type="button" className="asset-act-text" onClick={() => onGo("storyboard")}>
            Storyboard
          </button>
        )}
      </div>

      <button type="button" className="asset-name" onClick={() => onOpen(item)}>
        {item.title}
      </button>
      <p className="asset-line">{line}</p>
    </motion.article>
  );
}

/* ----------------------------------------------------------------- pickers */

/** Give a frame to a character or a place. This is the storage that makes a
 *  Soul ID or a World ID; the same array `refs` the World stage writes. */
function ReferenceDialog({
  item,
  initial,
  onClose,
  onDone
}: {
  item: AssetItem;
  initial: "character" | "location";
  onClose: () => void;
  onDone: () => void;
}) {
  const [side, setSide] = useState<"character" | "location">(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const cast = useAsync<Character[]>(`/api/projects/${item.project_id}/characters`, (b) => b.characters ?? []);
  const places = useAsync<Location[]>(`/api/projects/${item.project_id}/locations`, (b) => b.locations ?? []);
  const list = side === "character" ? cast.data ?? [] : places.data ?? [];

  async function give(id: string, name: string, refs: string[]) {
    if (busy || !item.url) return;
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/${side === "character" ? "characters" : "locations"}/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refs: refs.includes(item.url!) ? refs : [...refs, item.url] })
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "That could not be saved.");
      setDone(`Added to ${name}.`);
      onDone();
    } catch (e: any) {
      setError(e?.message || "That could not be saved.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Use as a reference</DialogTitle>
          <DialogDescription>
            The frame joins that {side === "character" ? "character's looks" : "location's plates"}, so shots
            generated from them keep it consistent.
          </DialogDescription>
        </DialogHeader>

        <div className="assets-scope assets-dlg-scope" role="group" aria-label="Reference kind">
          <button type="button" className="assets-scope-tab" aria-pressed={side === "character"} onClick={() => setSide("character")}>
            Characters
          </button>
          <button type="button" className="assets-scope-tab" aria-pressed={side === "location"} onClick={() => setSide("location")}>
            Locations
          </button>
        </div>

        <ul className="assets-picklist">
          {list.length === 0 && (
            <li className="assets-pick-none">
              {side === "character"
                ? "This production has no cast yet — World is where they are created."
                : "This production has no locations yet — World is where they are created."}
            </li>
          )}
          {list.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                className="assets-pick-row"
                disabled={busy !== null}
                onClick={() => give(row.id, row.name, row.refs)}
              >
                <span className="assets-pick-name">{row.name}</span>
                <span className="assets-pick-meta font-mono">{row.refs.length} refs</span>
              </button>
            </li>
          ))}
        </ul>

        {error && <InlineError message={error} />}
        {done && (
          <p className="assets-dlg-note" role="status">
            {done}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Which named sets this belongs to. Toggling is immediate; there is no save. */
function CollectDialog({
  item,
  collections,
  onToggle,
  onCreated,
  onClose
}: {
  item: AssetItem;
  collections: Collection[];
  onToggle: (item: AssetItem, id: string, member: boolean) => void;
  onCreated: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Collections</DialogTitle>
          <DialogDescription>
            A collection is a set you name. It can hold work from more than one production.
          </DialogDescription>
        </DialogHeader>

        <ul className="assets-picklist">
          {collections.length === 0 && <li className="assets-pick-none">No collections yet.</li>}
          {collections.map((c) => {
            const member = item.collections.includes(c.id);
            return (
              <li key={c.id}>
                <button
                  type="button"
                  className={cn("assets-pick-row", member && "is-on")}
                  aria-pressed={member}
                  onClick={() => onToggle(item, c.id, !member)}
                >
                  <span className="assets-pick-name">{c.name}</span>
                  <span className="assets-pick-meta font-mono">{member ? "in" : ""}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <NewCollection onCreated={onCreated} />
      </DialogContent>
    </Dialog>
  );
}

/** File this piece of media into another production so it shows on that
 *  production's canvas and in its @-picker. Nothing is copied on disk. */
function ProductionDialog({
  item,
  productions,
  onClose,
  onDone
}: {
  item: AssetItem;
  productions: Project[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function add(p: Project) {
    if (busy) return;
    setBusy(p.id);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${p.id}/assets`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: item.url, kind: item.kind === "video" ? "video" : "image", title: item.title })
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "That could not be added.");
      setDone(`Added to ${p.title}.`);
      onDone();
    } catch (e: any) {
      setError(e?.message || "That could not be added.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to a production</DialogTitle>
          <DialogDescription>
            The file stays where it is; the production gains a reference to it, so it can be used in a prompt
            there.
          </DialogDescription>
        </DialogHeader>

        <ul className="assets-picklist">
          {productions.length === 0 && <li className="assets-pick-none">There is nowhere else to put it yet.</li>}
          {productions.map((p) => (
            <li key={p.id}>
              <button type="button" className="assets-pick-row" disabled={busy !== null} onClick={() => add(p)}>
                <span className="assets-pick-name">{p.title}</span>
                <span className="assets-pick-meta font-mono">{p.format}</span>
              </button>
            </li>
          ))}
        </ul>

        {error && <InlineError message={error} />}
        {done && (
          <p className="assets-dlg-note" role="status">
            {done}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Making one is a name and nothing else. */
function NewCollection({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button type="button" className="assets-chip assets-chip-new" onClick={() => setOpen(true)}>
        <Plus size={11} /> New collection
      </button>
    );
  }

  return (
    <form
      className="assets-new"
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy || !name.trim()) return;
        setBusy(true);
        setError(null);
        try {
          const res = await fetch("/api/collections", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ name: name.trim() })
          });
          if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "That name did not work.");
          setName("");
          setOpen(false);
          onCreated();
        } catch (err: any) {
          setError(err?.message || "That name did not work.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <input
        className="input"
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name the collection"
        aria-label="Collection name"
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      />
      <Button size="sm" intent="primary" type="submit" disabled={busy || !name.trim()}>
        {busy ? "Making…" : "Make"}
      </Button>
      {error && <InlineError message={error} />}
    </form>
  );
}
