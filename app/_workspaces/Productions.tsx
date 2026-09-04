"use client";

import { motion } from "framer-motion";
import { MediaTile } from "../_components/ui/media-tile";
import { Button, IconButton } from "../_components/ui/button";
import { EmptyState } from "../_components/ui/empty-state";
import { SkeletonFrames } from "../_components/AsyncStates";
import { useConfirm } from "../_components/ui/alert-dialog";
import { useAsync } from "../_hooks/useAsync";
import { pageIn } from "../_components/motion";
import { Plus, Trash2 } from "../_components/icons";
import type { Project } from "../../lib/types";

type Row = Project & {
  beats: number;
  characters: number;
  shots: number;
  updated_at: string;
  poster_url: string | null;
  poster_kind: string | null;
};

interface Props {
  activeId: string | null;
  /** The scratch production that Create draws into; not a film, not listed. */
  hideId: string | null;
  onOpen: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => Promise<void> | void;
  version: number;
}

/**
 * Every production, as a poster wall (brief §8).
 *
 * Each one is its newest frame or clip with the facts that say how far it has
 * got — beats, cast, shots — and when it was last touched. No charts, no
 * cards with four buttons; a poster you open, and a quiet way to remove one
 * that explains what goes with it.
 */
export function Productions({ activeId, hideId, onOpen, onNew, onDelete, version }: Props) {
  const list = useAsync<Row[]>(`/api/projects?withCounts=1&v=${version}`, (b) => b.projects ?? []);
  const confirmDialog = useConfirm();
  const rows = (list.data ?? []).filter((p) => p.id !== hideId);

  return (
    <motion.div className="main-inner prods" {...pageIn}>
      <header className="prods-head">
        <div>
          <p className="phome-kicker">Productions</p>
          <h1 className="prods-title">{rows.length === 1 ? "One production" : `${rows.length} productions`}</h1>
        </div>
        <Button intent="primary" onClick={onNew}>
          <Plus size={14} /> New production
        </Button>
      </header>

      {list.status === "loading" ? (
        <SkeletonFrames count={6} className="prods-grid" />
      ) : list.status === "error" ? (
        <EmptyState
          title="The productions could not be loaded."
          why={list.error ?? "The server did not answer."}
          action={{ label: "Try again", onClick: () => window.location.reload() }}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No productions yet."
          why="A production holds a script and everything made from it — cast, storyboard, shots, the cut."
          action={{ label: "Start a production", onClick: onNew }}
        />
      ) : (
        <div className="prods-grid">
          {rows.map((p) => (
            <article key={p.id} className="prod" data-active={p.id === activeId || undefined}>
              <button type="button" className="prod-poster" onClick={() => onOpen(p.id)} aria-label={`Open ${p.title}`}>
                {p.poster_url ? (
                  <MediaTile url={p.poster_url} kind={p.poster_kind === "video" ? "video" : "image"} className="prod-poster-media" />
                ) : (
                  <span className="prod-poster-blank" aria-hidden="true">
                    {p.title.slice(0, 1)}
                  </span>
                )}
              </button>
              <div className="prod-meta">
                <div className="prod-meta-top">
                  <button type="button" className="prod-name" onClick={() => onOpen(p.id)}>
                    {p.title}
                  </button>
                  <IconButton
                    label={`Delete ${p.title}`}
                    size="sm"
                    className="prod-del"
                    onClick={async () => {
                      const ok = await confirmDialog({
                        title: `Delete “${p.title}”?`,
                        description: `${p.beats} beats, ${p.characters} characters and ${p.shots} shots go with it, along with every generated asset. Media files stay on disk.`,
                        confirmLabel: "Delete production",
                        destructive: true
                      });
                      if (ok) await onDelete(p.id);
                    }}
                  >
                    <Trash2 size={13} />
                  </IconButton>
                </div>
                <p className="prod-line">
                  <span>{p.format}</span>
                  <span className="prod-sep">·</span>
                  <span className="font-mono">{p.aspect_ratio}</span>
                  <span className="prod-sep">·</span>
                  <span>{relative(p.updated_at)}</span>
                </p>
                <p className="prod-counts font-mono">
                  {p.beats} beats · {p.characters} cast · {p.shots} shots
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function relative(iso: string): string {
  const t = new Date(iso.includes("Z") ? iso : iso + "Z").getTime();
  if (!Number.isFinite(t)) return "—";
  const min = Math.round((Date.now() - t) / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d < 30 ? `${d} d ago` : new Date(t).toLocaleDateString();
}
