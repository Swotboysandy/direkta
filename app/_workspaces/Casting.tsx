"use client";

import { useEffect, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { motion } from "framer-motion";
import { ArrowRight, Check, Plus, RefreshCcw, Sparkles, X } from "../_components/icons";
import { pageIn } from "../_components/motion";
import { Button } from "../_components/ui/button";
import { EmptyState } from "../_components/ui/empty-state";
import { InlineError } from "../_components/ui/inline-error";
import { MediaTile } from "../_components/ui/media-tile";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../_components/ui/dialog";
import { useConfirm } from "../_components/ui/alert-dialog";
import { useSelection } from "../_state/selection";
import { STAGE_LABELS } from "../_lib/stages";
import { IMAGE_TOKENS, tokensLabel } from "../_lib/costs";
import { registerWorldInspectors, usePublishWorld, SoulStatus, UploadLook } from "../_components/inspectors/world";
import type { Character, Location, Project, Prop, WorkspaceId } from "../../lib/types";
import { cn } from "@/lib/utils";

registerWorldInspectors();

interface Props {
  project: Project;
  characters: Character[];
  locations: Location[];
  props: Prop[];
  onSwitchWorkspace: (ws: WorkspaceId) => void;
  onReload: () => Promise<void> | void;
}

type Section = "characters" | "locations" | "props";
type Kind = "character" | "location" | "prop";

/**
 * World (brief §23–26): the identities every frame is built from.
 *
 * Four sections down one column — Characters, Locations, Props, Style DNA.
 * The first three are image-led tiles: the reference is the object, the
 * metadata sits under it, and selecting a tile opens the inspector where the
 * identity is edited in place. Storage is one shape for all three
 * (`refs`, `soul_id_state`); only the name changes: Soul ID, World ID,
 * Object ID.
 *
 * This component stays mounted across stage switches (page.tsx hides it with
 * `display: none`), so a batch that is casting twelve portraits keeps going
 * while the user reads the script.
 */
export function Casting({ project, characters, locations, props: propList, onSwitchWorkspace, onReload }: Props) {
  const confirm = useConfirm();
  const [adding, setAdding] = useState<Kind | null>(null);
  const [importing, setImporting] = useState(false);
  const [importNote, setImportNote] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  // One line of progress per section, under its own header — a batch
  // reports where its button is, not at the top of the page.
  const [notes, setNotes] = useState<Record<Section, string | null>>({ characters: null, locations: null, props: null });
  // Ids mid-generation in a batch; the tile shows Processing while its id is here.
  const [genIds, setGenIds] = useState<Set<string>>(new Set());

  usePublishWorld({ projectId: project.id, characters, locations, props: propList, reload: onReload });

  const note = (s: Section, msg: string | null, clearAfter?: number) => {
    setNotes((n) => ({ ...n, [s]: msg }));
    if (msg && clearAfter) setTimeout(() => setNotes((n) => (n[s] === msg ? { ...n, [s]: null } : n)), clearAfter);
  };
  const markGenerating = (id: string, on: boolean) =>
    setGenIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  // Voice-only presences never get a portrait — they are not counted, so a
  // project with one does not sit at "in progress" forever.
  const castable = characters.filter((c) => c.brief?.physical_form !== "abstract");
  const trained = castable.filter((c) => c.soul_id_state === "trained").length;
  const total = castable.length;

  /** Wipe every character's generated looks. Files stay on disk; frames
   *  already generated keep them. Characters revert to Draft. */
  async function clearAllLooks() {
    const withLooks = characters.filter((c) => (c.refs ?? []).length > 0);
    if (withLooks.length === 0) return;
    const totalImages = withLooks.reduce((n, c) => n + (c.refs?.length ?? 0), 0);
    if (
      !(await confirm({
        title: "Delete all cast images?",
        description: `${totalImages} look(s) across ${withLooks.length} character(s) will be removed. Frames already generated keep their picture, but new frames won't be reference-locked until you cast new looks.`,
        confirmLabel: "Delete images",
        destructive: true
      }))
    )
      return;
    note("characters", `Clearing looks for ${withLooks.length} character(s)…`);
    for (const c of withLooks) {
      await fetch(`/api/characters/${c.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refs: [], soul_id_state: "empty" })
      }).catch(() => {});
    }
    await onReload();
    note("characters", `Cleared ${totalImages} cast image(s).`, 6000);
  }

  /** The casting director reads the script and adds anyone missing. Never
   *  touches beats or existing characters. */
  async function importFromScript() {
    if (importing) return;
    setImporting(true);
    setImportNote(null);
    setImportError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/characters/import`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setImportError(data.error ?? "Import failed");
        return;
      }
      await onReload();
      setImportNote(
        data.characters_added || data.locations_added
          ? `Imported ${data.characters_added} character(s) + ${data.locations_added} location(s)${
              data.added?.length ? ` — ${data.added.join(", ")}` : ""
            }`
          : "Everyone in the script is already cast."
      );
      setTimeout(() => setImportNote(null), 6000);
    } catch (e) {
      setImportError(String(e));
    } finally {
      setImporting(false);
    }
  }

  const canImport = project.script_submitted && !importing;

  return (
    <motion.div className="main-inner world" {...pageIn}>
      <header className="page-head">
        <div className="world-head-copy">
          <span className="ws-eyebrow">{STAGE_LABELS.casting}</span>
          <h1 className="ws-title">{STAGE_LABELS.casting}</h1>
          <p className="ws-lead">
            A <strong>Soul ID</strong> for every character, a <strong>World ID</strong> for every place, an{" "}
            <strong>Object ID</strong> for anything that must not drift. Consistency across every frame starts here.
          </p>
        </div>
        <div className="world-head-actions">
          <span className="world-count" title="Characters with a locked Soul ID (voice-only presences are not counted)">
            {trained} / {total || "—"} Soul IDs
          </span>
          <div className="world-action">
            <Button onClick={importFromScript} disabled={!canImport} title="Reads the script and adds every character and location it finds; existing cast untouched">
              {importing ? (
                <>
                  <RefreshCcw size={12} className="fx-rotate-load" /> Reading script…
                </>
              ) : (
                <>
                  <Sparkles size={12} /> Import from script
                </>
              )}
            </Button>
            {!project.script_submitted && <span className="world-why">Submit the script first</span>}
          </div>
          <div className="world-action">
            <Button intent="primary" disabled={total === 0} onClick={() => onSwitchWorkspace("storyboard")}>
              Continue to {STAGE_LABELS.storyboard} <ArrowRight size={14} />
            </Button>
            {total === 0 && <span className="world-why">Cast at least one character first</span>}
          </div>
        </div>
      </header>

      {importError && <InlineError className="world-notice" message={importError} onRetry={importFromScript} />}
      {importNote && (
        <p className="world-notice world-note" role="status">
          {importNote}
        </p>
      )}

      <div className="page-body">
        {/* ── Characters ─────────────────────────────────────────── */}
        <section className="world-section">
          <div className="world-section-head">
            <h2 className="world-h2">
              Characters <span className="world-h2-count">{characters.length}</span>
            </h2>
            <div className="world-section-actions">
              {characters.some((c) => (c.refs ?? []).length > 0) && (
                <Button size="sm" intent="ghost" onClick={clearAllLooks} title="Delete every generated cast image; characters stay, frames already generated keep their picture">
                  Clear all looks
                </Button>
              )}
              <Button size="sm" onClick={() => setAdding("character")}>
                <Plus size={12} /> Add character
              </Button>
              <BatchGenerate
                label="Cast all"
                verb="portrait"
                items={castable.map((c) => ({ id: c.id, name: c.name, hasLook: (c.refs ?? []).length > 0 }))}
                endpoint={(cid) => `/api/characters/${cid}/portrait`}
                onProgress={(msg) => note("characters", msg)}
                onItemStart={(id) => markGenerating(id, true)}
                onItemDone={(id) => markGenerating(id, false)}
                onDone={async (n) => {
                  await onReload();
                  if (n) note("characters", `Cast ${n} portrait(s) — they're now reference-locked for the storyboard.`, 6000);
                }}
              />
            </div>
          </div>
          {notes.characters && (
            <p className="world-note" role="status" aria-live="polite">
              {notes.characters}
            </p>
          )}

          {characters.length === 0 ? (
            <EmptyState
              title="Nobody is cast yet"
              why={
                project.script_submitted
                  ? "Characters carry a Soul ID — the locked reference every frame of them is built from. The script is in, so the casting director can pull the cast from it."
                  : "Characters carry a Soul ID — the locked reference every frame of them is built from. Submit the script and the casting director imports the cast, or add one by hand now."
              }
              action={project.script_submitted ? { label: "Import from script", onClick: importFromScript, disabled: importing } : { label: "Add character", onClick: () => setAdding("character") }}
              secondary={project.script_submitted ? { label: "Add character", onClick: () => setAdding("character") } : undefined}
            />
          ) : (
            <div className="world-grid" data-shape="portrait">
              {characters.map((c) => (
                <CharacterTile key={c.id} character={c} projectId={project.id} generating={genIds.has(c.id)} onChange={onReload} />
              ))}
            </div>
          )}
        </section>

        {/* ── Locations ──────────────────────────────────────────── */}
        <section className="world-section">
          <div className="world-section-head">
            <h2 className="world-h2">
              Locations <span className="world-h2-count">{locations.length}</span>
            </h2>
            <div className="world-section-actions">
              <Button size="sm" onClick={() => setAdding("location")}>
                <Plus size={12} /> Add location
              </Button>
              <BatchGenerate
                label="Scout all"
                verb="plate"
                items={locations.map((l) => ({ id: l.id, name: l.name, hasLook: (l.refs ?? []).length > 0 }))}
                endpoint={(lid) => `/api/locations/${lid}/plate`}
                onProgress={(msg) => note("locations", msg)}
                onItemStart={(id) => markGenerating(id, true)}
                onItemDone={(id) => markGenerating(id, false)}
                onDone={async (n) => {
                  await onReload();
                  if (n) note("locations", `Scouted ${n} location plate(s).`, 6000);
                }}
              />
            </div>
          </div>
          {notes.locations && (
            <p className="world-note" role="status" aria-live="polite">
              {notes.locations}
            </p>
          )}

          {locations.length === 0 ? (
            <EmptyState
              title="No locations yet"
              why="A location carries a World ID: an establishing plate that keeps the same room the same room in every shot. Importing from the script finds the scene headings; or add one by hand."
              action={{ label: "Add location", onClick: () => setAdding("location") }}
              secondary={project.script_submitted ? { label: "Import from script", onClick: importFromScript } : undefined}
            />
          ) : (
            <div className="world-grid" data-shape="wide">
              {locations.map((l) => (
                <PlateTile
                  key={l.id}
                  kind="location"
                  id={l.id}
                  projectId={project.id}
                  name={l.name}
                  meta={`${l.int_ext} · ${l.scene_count} scene${l.scene_count === 1 ? "" : "s"}`}
                  refs={l.refs ?? []}
                  state={l.soul_id_state}
                  progress={l.soul_id_progress}
                  generating={genIds.has(l.id)}
                  onChange={onReload}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Props ──────────────────────────────────────────────── */}
        <section className="world-section">
          <div className="world-section-head">
            <h2 className="world-h2">
              Props <span className="world-h2-count">{propList.length}</span>
            </h2>
            <div className="world-section-actions">
              <Button size="sm" onClick={() => setAdding("prop")}>
                <Plus size={12} /> Add prop
              </Button>
              <BatchGenerate
                label="Scout all"
                verb="plate"
                items={propList.map((p) => ({ id: p.id, name: p.name, hasLook: (p.refs ?? []).length > 0 }))}
                endpoint={(pid) => `/api/props/${pid}/plate`}
                onProgress={(msg) => note("props", msg)}
                onItemStart={(id) => markGenerating(id, true)}
                onItemDone={(id) => markGenerating(id, false)}
                onDone={async (n) => {
                  await onReload();
                  if (n) note("props", `Scouted ${n} prop plate(s).`, 6000);
                }}
              />
            </div>
          </div>
          {notes.props && (
            <p className="world-note" role="status" aria-live="polite">
              {notes.props}
            </p>
          )}

          {propList.length === 0 ? (
            <EmptyState
              title="No props yet"
              why="A prop carries an Object ID: a named object — a weapon, an artifact, a set piece — that must look identical in every shot it appears in. Props are not read from the script; add the ones that matter."
              action={{ label: "Add prop", onClick: () => setAdding("prop") }}
            />
          ) : (
            <div className="world-grid" data-shape="wide">
              {propList.map((p) => (
                <PlateTile
                  key={p.id}
                  kind="prop"
                  id={p.id}
                  projectId={project.id}
                  name={p.name}
                  meta={p.description || `${p.scene_count} scene${p.scene_count === 1 ? "" : "s"}`}
                  refs={p.refs ?? []}
                  state={p.soul_id_state}
                  progress={p.soul_id_progress}
                  generating={genIds.has(p.id)}
                  onChange={onReload}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Style DNA ──────────────────────────────────────────── */}
        <StyleDna key={project.id} project={project} />
      </div>

      {adding && (
        <AddModal
          kind={adding}
          projectId={project.id}
          onClose={() => setAdding(null)}
          onCreated={async () => {
            setAdding(null);
            await onReload();
          }}
        />
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ tiles */

function CharacterTile({
  character: c,
  projectId,
  generating = false,
  onChange
}: {
  character: Character;
  projectId: string;
  generating?: boolean;
  onChange: () => Promise<void> | void;
}) {
  const { primary, select } = useSelection();
  const selected = primary?.kind === "character" && primary.id === c.id;
  const abstract = c.brief?.physical_form === "abstract";
  const refs = c.refs ?? [];
  const [casting, setCasting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = generating || casting;
  const state = c.soul_id_state;

  async function castLook() {
    if (casting) return;
    setCasting(true);
    setError(null);
    try {
      const res = await fetch(`/api/characters/${c.id}/portrait`, { method: "POST" });
      if (!res.ok) setError((await res.json().catch(() => null))?.error || "Casting failed.");
      await onChange();
    } finally {
      setCasting(false);
    }
  }

  async function retry() {
    await fetch(`/api/characters/${c.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ soul_id_state: "empty", error: null })
    });
    await onChange();
  }

  const pick = () => select({ kind: "character", id: c.id, label: `${c.name} · Soul ID`, projectId });

  return (
    <article className={cn("world-tile", selected && "is-selected", busy && "is-busy")} data-shape="portrait">
      <button type="button" className="world-tile-media" onClick={pick} aria-pressed={selected} aria-label={`Inspect ${c.name}`}>
        {refs[0] ? (
          <MediaTile url={refs[0]} kind="image" alt={c.name} className="world-tile-img" />
        ) : (
          <span className="world-tile-blank" aria-hidden="true">
            {abstract ? "voice" : c.name.trim()[0] ?? "?"}
          </span>
        )}
        {busy && (
          <span className="world-tile-busy">
            <RefreshCcw size={12} className="fx-rotate-load" /> Casting
          </span>
        )}
        {refs.length > 1 && <span className="world-tile-more">+{refs.length - 1}</span>}
      </button>
      <div className="world-tile-body">
        <button type="button" className="world-tile-name" onClick={pick}>
          {c.name}
        </button>
        <span className="world-tile-meta">
          {c.role} · {c.scene_count} scene{c.scene_count === 1 ? "" : "s"}
          {c.dialogue ? " · speaking" : ""}
        </span>
        {/* The tile is the image, the name and one line. Casting a look,
            uploading one and the Soul ID's state live in the inspector, and
            appear here only while something is actually happening or has
            gone wrong — a grid of twenty-four tiles should read as faces,
            not as twenty-four toolbars. */}
        {abstract ? (
          <span className="world-tile-meta">Voice-only — no portrait needed</span>
        ) : busy || state === "training" ? (
          <SoulStatus state={state} progress={c.soul_id_progress} consistency={c.consistency} busy={busy} />
        ) : state === "failed" ? (
          <div className="world-tile-actions">
            <Button size="sm" onClick={retry} disabled={busy}>
              <RefreshCcw size={12} /> Retry
            </Button>
          </div>
        ) : refs.length === 0 ? (
          <span className="world-tile-meta" data-warn>
            No Soul ID yet
          </span>
        ) : null}
        {state === "failed" && c.error && <InlineError message="The last cast failed." detail={c.error} onRetry={retry} />}
        {error && <InlineError message={error} onRetry={castLook} />}
      </div>
    </article>
  );
}

/** A location or a prop: same storage, a wide plate, one verb. */
function PlateTile({
  kind,
  id,
  projectId,
  name,
  meta,
  refs,
  state,
  progress,
  generating = false,
  onChange
}: {
  kind: "location" | "prop";
  id: string;
  projectId: string;
  name: string;
  meta: string;
  refs: string[];
  state: Character["soul_id_state"];
  progress: number;
  generating?: boolean;
  onChange: () => Promise<void> | void;
}) {
  const { primary, select } = useSelection();
  const selected = primary?.kind === kind && primary.id === id;
  const [scouting, setScouting] = useState(false);
  // Locations and props have no stored error column, so a blocked single
  // attempt needs its own message or a budget stop would fail silently.
  const [error, setError] = useState<string | null>(null);
  const busy = generating || scouting;
  const base = kind === "location" ? `/api/locations/${id}` : `/api/props/${id}`;
  const idName = kind === "location" ? "World ID" : "Object ID";

  async function scout() {
    if (scouting) return;
    setScouting(true);
    setError(null);
    try {
      const res = await fetch(`${base}/plate`, { method: "POST" });
      if (!res.ok) setError((await res.json().catch(() => null))?.error || "Scout failed.");
      await onChange();
    } finally {
      setScouting(false);
    }
  }

  const pick = () => select({ kind, id, label: `${name} · ${idName}`, projectId });

  return (
    <article className={cn("world-tile", selected && "is-selected", busy && "is-busy")} data-shape="wide">
      <button type="button" className="world-tile-media" onClick={pick} aria-pressed={selected} aria-label={`Inspect ${name}`}>
        {refs[0] ? (
          <MediaTile url={refs[0]} kind="image" alt={name} className="world-tile-img" />
        ) : (
          <span className="world-tile-blank" aria-hidden="true">
            {name.trim()[0] ?? "?"}
          </span>
        )}
        {busy && (
          <span className="world-tile-busy">
            <RefreshCcw size={12} className="fx-rotate-load" /> Scouting
          </span>
        )}
        {refs.length > 1 && <span className="world-tile-more">+{refs.length - 1}</span>}
      </button>
      <div className="world-tile-body">
        <button type="button" className="world-tile-name" onClick={pick}>
          {name}
        </button>
        <span className="world-tile-meta">{meta}</span>
        {/* Same rule as the cast: the plate, the name, one line. Scouting a
            plate and uploading one are inspector work. */}
        {busy || state === "training" ? (
          <SoulStatus state={state} progress={progress} busy={busy} />
        ) : refs.length === 0 ? (
          <span className="world-tile-meta" data-warn>
            No {kind === "location" ? "World" : "Object"} ID yet
          </span>
        ) : null}
        {error && <InlineError message={error} onRetry={scout} />}
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ batch */

/** Batch generation with selection and a cost preview: pick who is included,
 *  see the total, then run one at a time. Stop halts before the next item;
 *  a budget stop (402) halts the whole run, because every remaining item
 *  would fail the same way. */
function BatchGenerate({
  label,
  verb,
  items,
  endpoint,
  onProgress,
  onItemStart,
  onItemDone,
  onDone
}: {
  label: string;
  verb: string;
  items: Array<{ id: string; name: string; hasLook: boolean }>;
  endpoint: (id: string) => string;
  onProgress: (msg: string) => void;
  onItemStart?: (id: string) => void;
  onItemDone?: (id: string) => void;
  onDone: (generated: number) => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const stopRef = useRef(false);

  const missing = items.filter((i) => !i.hasLook);
  useEffect(() => {
    if (!open) return;
    setPicked(new Set(missing.map((i) => i.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (items.length === 0) return null;

  async function run() {
    if (running || picked.size === 0) return;
    setOpen(false);
    setRunning(true);
    stopRef.current = false;
    const ids = items.filter((i) => picked.has(i.id));
    let done = 0;
    try {
      for (const item of ids) {
        if (stopRef.current) {
          onProgress(`Stopped — ${done} of ${ids.length} generated.`);
          return;
        }
        onProgress(`Generating ${verb} for ${item.name} — ${done + 1} / ${ids.length}…`);
        onItemStart?.(item.id);
        try {
          const res = await fetch(endpoint(item.id), { method: "POST" });
          if (res.ok) {
            done++;
          } else {
            const data = await res.json().catch(() => null);
            onProgress(data?.error || `Stopped — ${done} of ${ids.length} generated (request failed).`);
            if (data?.budgetExceeded || res.status === 402) return;
          }
        } finally {
          onItemDone?.(item.id);
        }
      }
    } finally {
      setRunning(false);
      stopRef.current = false;
      await onDone(done);
    }
  }

  if (running) {
    return (
      <Button
        size="sm"
        intent="ghost"
        className="world-stop"
        onClick={() => {
          stopRef.current = true;
          onProgress("Stopping after the current one…");
        }}
        title={`Stop after the ${verb} currently generating (its cost is already committed)`}
      >
        <X size={12} /> Stop
      </Button>
    );
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button size="sm" title={`Generate ${verb}s in batch — pick who is included and see the cost first`}>
          <Sparkles size={12} /> {label}
          {missing.length > 0 && <span className="world-cost">{missing.length} missing</span>}
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="end" sideOffset={6} className="world-pop">
          <span className="ws-meta">{label} · pick who to generate</span>
          <div className="world-pop-list">
            {items.map((i) => {
              const on = picked.has(i.id);
              return (
                <button
                  key={i.id}
                  type="button"
                  className="world-pop-row"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() =>
                    setPicked((prev) => {
                      const next = new Set(prev);
                      if (next.has(i.id)) next.delete(i.id);
                      else next.add(i.id);
                      return next;
                    })
                  }
                >
                  <span className="world-check" data-on={on || undefined}>
                    {on && <Check size={10} strokeWidth={3} />}
                  </span>
                  <span className="world-pop-name">{i.name}</span>
                  {i.hasLook && <span className="ws-meta">has look</span>}
                </button>
              );
            })}
          </div>
          <Button intent="primary" size="sm" onClick={run} disabled={picked.size === 0} className="world-pop-go">
            Generate {picked.size} · {tokensLabel(picked.size * IMAGE_TOKENS)}
          </Button>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/* -------------------------------------------------------------- Style DNA */

const DNA_FIELDS: Array<{ key: "style_template" | "continuity_lock" | "set_lock" | "avoid_prompt"; label: string; hint: string; placeholder: string }> = [
  {
    key: "style_template",
    label: "Visual references",
    hint: "Applied to every frame and clip — medium, lens, light, film stock, camera behaviour.",
    placeholder: "35mm anamorphic, golden dusk light, shallow depth of field, feature-film 3D animation"
  },
  {
    key: "continuity_lock",
    label: "Continuity rules",
    hint: "Who and what must stay identical in every shot — designs, wardrobe, vehicles, palette.",
    placeholder: "Kalki: early twenties, scar through the left eyebrow, indigo armour"
  },
  {
    key: "set_lock",
    label: "Set rules",
    hint: "The geography of each recurring space, and an instruction not to invent beyond it.",
    placeholder: "Bedroom: bed left, window right, one desk. Never widen the room"
  },
  {
    key: "avoid_prompt",
    label: "Avoid",
    hint: "Negatives appended to every frame and clip.",
    placeholder: "No text, no watermark, no extra furniture"
  }
];

/** The project's Style DNA (brief §26): what influences every generation
 *  unless a shot overrides it — visible and editable, not a hidden prompt. */
function StyleDna({ project }: { project: Project }) {
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(DNA_FIELDS.map((f) => [f.key, project[f.key] ?? ""])));
  const [saved, setSaved] = useState<Record<string, string>>(values);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(null);

  async function save(key: string) {
    const value = values[key] ?? "";
    if (value === saved[key]) return;
    setSaving(key);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ [key]: value })
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "Save failed.");
      setSaved((s) => ({ ...s, [key]: value }));
    } catch (e) {
      setError({ key, message: e instanceof Error ? e.message : String(e) });
    } finally {
      setSaving(null);
    }
  }

  const setCount = DNA_FIELDS.filter((f) => (saved[f.key] ?? "").trim()).length;

  return (
    <section className="world-section">
      <div className="world-section-head">
        <h2 className="world-h2">
          Style DNA <span className="world-h2-count">{setCount} of {DNA_FIELDS.length} set</span>
        </h2>
        <span className="world-tile-meta">Influences every generation unless a shot overrides it</span>
      </div>
      <div className="world-dna">
        {DNA_FIELDS.map((f) => (
          <div key={f.key} className="world-field" data-set={(saved[f.key] ?? "").trim() ? "true" : undefined}>
            <label htmlFor={`dna-${f.key}`} className="world-field-label">
              <span className="world-field-name">{f.label}</span>
              <span className="world-field-hint">{f.hint}</span>
            </label>
            <div className="world-field-input">
              <textarea
                id={`dna-${f.key}`}
                className="world-input world-textarea"
                rows={3}
                maxLength={f.key === "avoid_prompt" ? 2000 : 4000}
                placeholder={f.placeholder}
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                onBlur={() => save(f.key)}
              />
              <span className="world-saving" aria-live="polite">
                {saving === f.key ? "Saving…" : ""}
              </span>
              {error?.key === f.key && <InlineError message={error.message} onRetry={() => save(f.key)} />}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- add modal */

function AddModal({
  kind,
  projectId,
  onClose,
  onCreated
}: {
  kind: Kind;
  projectId: string;
  onClose: () => void;
  onCreated: () => Promise<void> | void;
}) {
  const [name, setName] = useState("");
  const [intExt, setIntExt] = useState<"INT" | "EXT">("INT");
  const [role, setRole] = useState<Character["role"]>("Supporting");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      let res: Response;
      if (kind === "character") {
        res = await fetch(`/api/projects/${projectId}/characters`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: name.trim().toUpperCase(), role })
        });
      } else if (kind === "location") {
        res = await fetch(`/api/projects/${projectId}/locations`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: name.trim().toUpperCase(), int_ext: intExt })
        });
      } else {
        res = await fetch(`/api/projects/${projectId}/props`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: name.trim(), description: description.trim() })
        });
      }
      if (!res.ok) {
        setError((await res.json().catch(() => null))?.error || "Could not add it.");
        return;
      }
      await onCreated();
    } finally {
      setBusy(false);
    }
  }

  const idName = kind === "character" ? "Soul ID" : kind === "location" ? "World ID" : "Object ID";

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <form onSubmit={submit} className="world-form">
          <DialogHeader>
            <DialogTitle>Add {kind}</DialogTitle>
            <DialogDescription>It starts as a Draft; cast or upload a reference to lock its {idName}.</DialogDescription>
          </DialogHeader>
          <label className="insp-field">
            <span>Name</span>
            <input
              className="world-input"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={kind === "character" ? "MARCUS" : kind === "location" ? "INT. WAREHOUSE" : "PINAKA — THE BOW"}
              required
            />
          </label>
          {kind === "character" && (
            <div className="insp-field">
              <span>Role</span>
              <div className="world-chips">
                {(["Lead", "Supporting", "Featured", "Background"] as Character["role"][]).map((r) => (
                  <button key={r} type="button" className={cn("btn btn-sm chip-select", role === r && "is-active")} aria-pressed={role === r} onClick={() => setRole(r)}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
          {kind === "location" && (
            <div className="insp-field">
              <span>Type</span>
              <div className="world-chips">
                {(["INT", "EXT"] as const).map((t) => (
                  <button key={t} type="button" className={cn("btn btn-sm chip-select", intExt === t && "is-active")} aria-pressed={intExt === t} onClick={() => setIntExt(t)}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
          {kind === "prop" && (
            <label className="insp-field">
              <span>Description (optional)</span>
              <input className="world-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. a curved bow of dark wood, never metal" />
            </label>
          )}
          {error && <InlineError message={error} />}
          <DialogFooter>
            <Button intent="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" intent="primary" disabled={!name.trim() || busy}>
              {busy ? "Adding…" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
