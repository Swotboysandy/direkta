"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { motion } from "framer-motion";
import { Button, IconButton } from "../_components/ui/button";
import { Status } from "../_components/ui/status";
import { EmptyState } from "../_components/ui/empty-state";
import { InlineError } from "../_components/ui/inline-error";
import { MediaTile } from "../_components/ui/media-tile";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../_components/ui/dialog";
import { useConfirm } from "../_components/ui/alert-dialog";
import { useSelection } from "../_state/selection";
import { registerInspector } from "../_components/Inspector";
import { ApprovalStatus, Field, FrameInspector } from "../_components/inspectors/FrameInspector";
import {
  ANGLE_OPTIONS,
  APERTURE_OPTIONS,
  ASPECT_OPTIONS,
  CAMERA_BODY_OPTIONS,
  CAMERA_OPTIONS,
  FRAMING_ANGLES,
  FRAMING_SHOTS,
  IMAGE_TOKENS,
  LENS_OPTIONS,
  LIGHT_OPTIONS,
  MOVEMENT_OPTIONS,
  SHOT_PRESETS,
  SHOT_SIZE_OPTIONS,
  TEMP_OPTIONS,
  VISUAL_OPTIONS,
  defaultPromptFor,
  pad2,
  publishFrameApi,
  type BeatStyle,
  type CastMember,
  type GlobalStyle,
  type StoryboardRow,
  type StoryboardVariant,
  type WorldPlace
} from "../_components/inspectors/storyboard-shared";
import { pageIn } from "../_components/motion";
import { ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Film, Flag, RefreshCcw, Sparkles, Stamp, Wand2, X, ZoomIn } from "../_components/icons";
import type { AspectRatio, Beat, Project, WorkspaceId } from "../../lib/types";
import { cn } from "@/lib/utils";

registerInspector("frame", FrameInspector);

interface Props {
  project: Project;
  onSwitchWorkspace: (ws: WorkspaceId) => void;
}

type Density = "overview" | "frames" | "detail";
type Toast = { kind: "success" | "info" | "error"; text: string };

const norm = (s: string) => s.trim().toLowerCase();
const costK = (takes: number) => Math.round((takes * IMAGE_TOKENS) / 1000);
const takeWord = (n: number) => (n === 1 ? "take" : "takes");

/**
 * Coverage: one beat rolled from several framings at once, the way a scene is
 * actually shot. `prompts[i]` is the full shot description for angle
 * `angles[i]`; the reference locks are composed server-side and shared across
 * the set, so it comes back as one moment seen three ways, not three scenes.
 */
type Coverage = { prompts: string[]; angles: string[] };
const angleLabel = (shot: string, angle: string) => shot + " · " + angle;

/**
 * Storyboard (brief §27–28): a filmstrip by beat.
 *
 * Each beat is a row — its number, title, heading, who is in it and where,
 * how it is framed, and whether the director has signed it off — followed by
 * its takes. A take is selectable; the inspector shows it large with the
 * prompt, the camera and the approval. Focus opens it full-size for review.
 * Three densities: Overview to scan the film, Frames to look at takes,
 * Detail to direct every beat at once.
 */
export function Storyboard({ project, onSwitchWorkspace }: Props) {
  const confirm = useConfirm();
  const { primary, select, clear } = useSelection();

  const [beats, setBeats] = useState<Beat[]>([]);
  const [rows, setRows] = useState<StoryboardRow[]>([]);
  const [variants, setVariants] = useState<StoryboardVariant[]>([]);
  const [stitched, setStitched] = useState<Set<string>>(new Set());
  const [cast, setCast] = useState<CastMember[]>([]);
  const [places, setPlaces] = useState<WorldPlace[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [density, setDensity] = useState<Density>("frames");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [batchRolling, setBatchRolling] = useState(false);
  const [batchStitching, setBatchStitching] = useState(false);
  const [rollMenuOpen, setRollMenuOpen] = useState(false);
  // Stop signal for the batch loops — halts before the NEXT item starts
  // (the item already generating finishes; its spend is already committed).
  const batchStop = useRef(false);
  const [globalStyle, setGlobalStyle] = useState<GlobalStyle>({
    visual: "Noir",
    aspect: project.aspect_ratio,
    light: "Low key",
    temp: "Cool",
    camera: "Mixed"
  });

  const reload = useCallback(async () => {
    const res = await fetch(`/api/projects/${project.id}/storyboard`);
    if (!res.ok) {
      setLoadState("error");
      return;
    }
    const data = await res.json();
    setBeats(data.beats);
    setRows((data.rows as Array<StoryboardRow & { style: BeatStyle | Record<string, unknown> }>).map((r) => ({ ...r, style: (r.style ?? {}) as BeatStyle })));
    setVariants(data.variants);
    setLoadState("ready");

    // Project cast and places — the chips on each beat and the "Cast in frame" picker.
    fetch(`/api/projects/${project.id}/characters`)
      .then((r) => (r.ok ? r.json() : { characters: [] }))
      .then((d) =>
        setCast(
          (d.characters ?? []).map((c: { name: string; refs?: string[] }) => ({
            name: c.name,
            hasLook: (c.refs ?? []).length > 0,
            portrait: c.refs?.[0] ?? null
          }))
        )
      )
      .catch(() => {});
    fetch(`/api/projects/${project.id}/locations`)
      .then((r) => (r.ok ? r.json() : { locations: [] }))
      .then((d) => setPlaces((d.locations ?? []).map((l: { id: string; name: string; refs?: string[] }) => ({ id: l.id, name: l.name, plate: l.refs?.[0] ?? null }))))
      .catch(() => {});

    // Which takes are already on the board in Shots.
    const stitch = await fetch(`/api/projects/${project.id}/stitch`);
    if (stitch.ok) {
      const sd = await stitch.json();
      setStitched(new Set<string>((sd.nodes as Array<{ variant_id: string | null }>).map((n) => n.variant_id ?? "").filter(Boolean)));
    }
  }, [project.id]);

  useEffect(() => {
    reload();
  }, [reload]);

  function flash(kind: Toast["kind"], text: string) {
    setToast({ kind, text });
    setTimeout(() => setToast((t) => (t?.text === text ? null : t)), 2800);
  }

  const rowByBeat = useMemo(() => Object.fromEntries(rows.map((r) => [r.beat_id, r])) as Record<string, StoryboardRow>, [rows]);
  const variantsByBeat = useMemo(() => {
    const map: Record<string, StoryboardVariant[]> = {};
    for (const v of variants) (map[v.beat_id] ??= []).push(v);
    for (const list of Object.values(map)) list.sort((a, b) => a.n - b.n);
    return map;
  }, [variants]);
  const sortedBeats = useMemo(() => [...beats].sort((a, b) => a.n - b.n), [beats]);

  const selectedCount = rows.filter((r) => r.selected_variant_id).length;
  const completeCount = rows.filter((r) => r.state === "complete").length;
  const approvedBeatCount = beats.filter((b) => (variantsByBeat[b.id] ?? []).some((v) => v.approval === "approved")).length;
  // Beats that don't yet have a single finished frame.
  const missingBeats = beats.filter((b) => !(variantsByBeat[b.id] ?? []).some((v) => v.state === "complete" && v.asset_url));

  /* ── selection housekeeping ─────────────────────────────────────── */

  const selectFrame = useCallback(
    (beat: Beat, v: StoryboardVariant) => select({ kind: "frame", id: v.id, label: `Beat ${pad2(beat.n)} · Take ${v.n}`, projectId: project.id }),
    [select, project.id]
  );

  // A selected take that a re-roll deleted is no longer a selection.
  useEffect(() => {
    if (primary?.kind === "frame" && loadState === "ready" && !variants.some((v) => v.id === primary.id)) clear();
  }, [variants, primary, clear, loadState]);

  // Leaving the stage takes the frame selection with it.
  const primaryRef = useRef(primary);
  primaryRef.current = primary;
  useEffect(
    () => () => {
      publishFrameApi(null);
      if (primaryRef.current?.kind === "frame") clear();
    },
    [clear]
  );

  /* ── writes ─────────────────────────────────────────────────────── */

  async function addToStitch(variant: StoryboardVariant) {
    // Optimistic — mark the take as on the board before the round-trip.
    setStitched((prev) => new Set(prev).add(variant.id));
    setRows((prev) => prev.map((r) => (r.beat_id === variant.beat_id ? { ...r, selected_variant_id: variant.id } : r)));
    fetch(`/api/storyboard/rows/${variant.beat_id}/select`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ variant_id: variant.id })
    }).catch(() => {});

    const res = await fetch(`/api/stitch/nodes`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ variant_id: variant.id })
    });
    if (!res.ok) {
      setStitched((prev) => {
        const next = new Set(prev);
        next.delete(variant.id);
        return next;
      });
      setRowErrors((e) => ({ ...e, [variant.beat_id]: "The take could not be added to the board." }));
      return;
    }
    const data = (await res.json()) as { action: string; beat_n: number; scene_number: number };
    if (data.action === "exists") flash("info", `Already on the board · Scene ${data.scene_number}`);
    else flash("success", `Added · Beat ${pad2(data.beat_n)} Take ${variant.n} → Scene ${data.scene_number}`);
  }

  async function removeFromStitch(variant: StoryboardVariant) {
    setStitched((prev) => {
      const next = new Set(prev);
      next.delete(variant.id);
      return next;
    });
    await fetch(`/api/stitch/nodes?variant_id=${encodeURIComponent(variant.id)}`, { method: "DELETE" }).catch(() => {});
    flash("info", `Removed take ${variant.n} from the board`);
  }

  async function patchRow(beatId: string, patch: { style?: BeatStyle }) {
    setRows((prev) => {
      const has = prev.some((r) => r.beat_id === beatId);
      const next = prev.map((r) => (r.beat_id === beatId ? { ...r, style: { ...r.style, ...(patch.style ?? {}) } } : r));
      return has ? next : [...next, { beat_id: beatId, state: "waiting", selected_variant_id: null, style: { ...(patch.style ?? {}) } }];
    });
    await fetch(`/api/storyboard/rows/${beatId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch)
    }).catch(() => {});
  }

  async function patchVariant(variantId: string, patch: { prompt?: string; approval?: string; note?: string }) {
    setVariants((prev) => prev.map((v) => (v.id === variantId ? { ...v, ...patch } : v)));
    await fetch(`/api/storyboard/variants/${variantId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch)
    }).catch(() => {});
  }

  /** `coverage` rolls one frame per framing instead of N takes of one framing. */
  async function generate(beatId: string, prompt: string, takes: number = 4, coverage?: Coverage) {
    setRowErrors((e) => {
      const { [beatId]: _drop, ...rest } = e;
      return rest;
    });
    // Optimistic: flip the row to "generating" and drop placeholders in
    // immediately — the POST is synchronous and can take a minute.
    setRows((prev) => {
      const has = prev.some((r) => r.beat_id === beatId);
      const next = prev.map((r) => (r.beat_id === beatId ? { ...r, state: "generating" as const } : r));
      return has ? next : [...next, { beat_id: beatId, state: "generating" as const, selected_variant_id: null, style: {} }];
    });
    setVariants((prev) => [
      ...prev.filter((v) => v.beat_id !== beatId),
      ...Array.from({ length: takes }, (_, i) => ({
        id: `pending-${beatId}-${i}`,
        beat_id: beatId,
        n: i + 1,
        prompt: coverage ? coverage.prompts[i] : prompt,
        state: "generating",
        asset_id: null,
        asset_url: null,
        approval: "pending",
        note: ""
      }))
    ]);
    try {
      const res = await fetch(`/api/storyboard/rows/${beatId}/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ variants: takes, prompt, ...(coverage ? { prompts: coverage.prompts, angles: coverage.angles } : {}) })
      });
      const data = await res.json().catch(() => null);
      // Surface exactly who/what got reference-locked — otherwise the
      // consistency system runs invisibly and there's no way to see it's
      // actually working shot to shot.
      if (data?.ok) {
        const lockedBits = [
          data.locked_cast?.length ? `cast: ${data.locked_cast.join(", ")}` : null,
          data.locked_location ? `location: ${data.locked_location}` : null,
          data.locked_props?.length ? `props: ${data.locked_props.join(", ")}` : null
        ].filter(Boolean);
        flash("success", lockedBits.length ? `${data.generated} frame(s) rolled — locked to ${lockedBits.join(" · ")}.` : data.note || `${data.generated} frame(s) rolled.`);
      } else {
        // Protected and simulated outcomes come back 200 with ok:false and a
        // note; real failures carry an error. Either way it sits on the row.
        setRowErrors((e) => ({ ...e, [beatId]: data?.error || data?.note || `The roll failed (${res.status}).` }));
      }
    } catch (e: any) {
      setRowErrors((prev) => ({ ...prev, [beatId]: e?.message ?? String(e) }));
    } finally {
      await reload();
    }
  }

  /** Rolling a beat that already has takes deletes them — say so first. */
  async function confirmedGenerate(beat: Beat, prompt: string, takes: number, coverage?: Coverage) {
    const existing = (variantsByBeat[beat.id] ?? []).filter((v) => v.asset_url && !v.id.startsWith("pending-"));
    if (existing.length > 0) {
      const approved = existing.filter((v) => v.approval === "approved").length;
      const ok = await confirm({
        title: `Roll beat ${pad2(beat.n)} again?`,
        description: `Rolling again replaces the ${existing.length} ${takeWord(existing.length)} for this beat with ${
          coverage ? `${takes} angles (${coverage.angles.join(", ")})` : `${takes} new ${takeWord(takes)}`
        }.${approved ? ` ${approved} of them ${approved === 1 ? "is" : "are"} approved; that approval is lost.` : ""} Costs about ${costK(takes)}k tokens.`,
        confirmLabel: coverage ? `Roll ${takes} angles` : `Roll ${takes} ${takeWord(takes)}`,
        destructive: true
      });
      if (!ok) return;
    }
    await generate(beat.id, prompt, takes, coverage);
  }

  /** Roll every beat that has no frame yet — N takes each, sequentially. */
  async function rollAllMissing(takesPerBeat: number) {
    if (batchRolling || missingBeats.length === 0) return;
    setBatchRolling(true);
    batchStop.current = false;
    let done = 0;
    try {
      for (let i = 0; i < missingBeats.length; i++) {
        if (batchStop.current) {
          flash("info", `Stopped — ${done} of ${missingBeats.length} beats rolled.`);
          return;
        }
        const beat = missingBeats[i];
        flash("info", `Rolling beat ${pad2(beat.n)} (${takesPerBeat} ${takeWord(takesPerBeat)}) — ${i + 1} / ${missingBeats.length}…`);
        const style = rowByBeat[beat.id]?.style ?? {};
        await generate(beat.id, style.prompt_override || defaultPromptFor(beat, style, globalStyle), takesPerBeat);
        done++;
      }
      flash("success", `Rolled ${missingBeats.length} beats — review the takes, then add the best to Shots.`);
    } finally {
      setBatchRolling(false);
      batchStop.current = false;
    }
  }

  /** Put each beat's best take (approved, else first complete) on the board. */
  async function stitchAllBest() {
    if (batchStitching) return;
    setBatchStitching(true);
    batchStop.current = false;
    try {
      let added = 0;
      for (const beat of sortedBeats) {
        if (batchStop.current) {
          flash("info", `Stopped — ${added} shots added.`);
          return;
        }
        const vs = (variantsByBeat[beat.id] ?? []).filter((v) => v.state === "complete" && v.asset_url);
        if (!vs.length) continue;
        const best = vs.find((v) => v.approval === "approved") ?? vs[0];
        if (stitched.has(best.id)) continue;
        await addToStitch(best);
        added++;
      }
      flash(added ? "success" : "info", added ? `${added} shots on the board.` : "Every beat's best take is already in Shots.");
    } finally {
      setBatchStitching(false);
      batchStop.current = false;
    }
  }

  /* ── review flow ─────────────────────────────────────────────────── */

  // The next take awaiting the director's call (a beat with frames but no approved take).
  function nextPendingTake(afterBeatN: number | null): StoryboardVariant | null {
    for (const beat of sortedBeats) {
      if (afterBeatN != null && beat.n <= afterBeatN) continue;
      const vs = (variantsByBeat[beat.id] ?? []).filter((v) => v.asset_url);
      if (vs.length === 0 || vs.some((v) => v.approval === "approved")) continue;
      return vs.find((v) => stitched.has(v.id)) || vs.find((v) => v.id === rowByBeat[beat.id]?.selected_variant_id) || vs[0];
    }
    return null;
  }

  function openFocus(variantId: string) {
    const v = variants.find((x) => x.id === variantId);
    const b = v && beats.find((x) => x.id === v.beat_id);
    if (!v || !b) return;
    selectFrame(b, v);
    setFocus(variantId);
  }

  function startReview() {
    const t = nextPendingTake(null);
    if (t) {
      setReviewMode(true);
      openFocus(t.id);
    } else flash("info", "All takes reviewed — every beat is signed off.");
  }

  function closeFocus() {
    setFocus(null);
    setReviewMode(false);
  }

  /* ── publish for the inspector ───────────────────────────────────── */

  useEffect(() => {
    publishFrameApi({
      projectId: project.id,
      aspect: project.aspect_ratio,
      beats,
      rows: rowByBeat,
      variants,
      stitched,
      patchVariant,
      patchRow,
      addToStitch,
      removeFromStitch,
      regenerateRow: async (beatId, prompt) => {
        const beat = beats.find((b) => b.id === beatId);
        if (beat) await confirmedGenerate(beat, prompt, (variantsByBeat[beatId] ?? []).length || 4);
      },
      openFocus
    });
  });

  /* ── render ──────────────────────────────────────────────────────── */

  const focusVariant = focus ? variants.find((v) => v.id === focus) ?? null : null;
  const focusBeat = focusVariant ? beats.find((b) => b.id === focusVariant.beat_id) ?? null : null;
  const stopLabel = batchRolling ? "Stop rolling" : "Stop adding";

  return (
    <motion.div className="main-inner sbd" {...pageIn}>
      <header className="sbd-head">
        <div className="sbd-head-copy">
          <p className="phome-kicker">Storyboard</p>
          <h1 className="prods-title">Storyboard</h1>
          <p className="create-lede">
            One row per beat, four takes each. Pick a take to inspect it, open Focus to review, and put the winner on the board in Shots.
          </p>
        </div>
        <div className="sbd-head-actions">
          {beats.length > 0 && (
            <>
              <div className="sbd-seg" role="radiogroup" aria-label="Density">
                {(["overview", "frames", "detail"] as Density[]).map((d) => (
                  <button key={d} type="button" role="radio" aria-checked={density === d} data-on={density === d} onClick={() => setDensity(d)}>
                    {d === "overview" ? "Overview" : d === "frames" ? "Frames" : "Detail"}
                  </button>
                ))}
              </div>
              <Status domain="creative" value={approvedBeatCount === beats.length ? "Approved" : "Draft"} detail={`${approvedBeatCount} / ${beats.length} beats`} />
            </>
          )}
          {(batchRolling || batchStitching) && (
            <Button
              onClick={() => {
                batchStop.current = true;
                flash("info", batchRolling ? "Stopping after the current beat…" : "Stopping after the current shot…");
              }}
              title="Stops before the next one starts; the one in flight finishes"
            >
              <X size={14} /> {stopLabel}
            </Button>
          )}
          {missingBeats.length > 0 && !batchRolling && (
            <Popover.Root open={rollMenuOpen} onOpenChange={setRollMenuOpen}>
              <Popover.Trigger asChild>
                <Button title="Generate frames for every beat without one">
                  <Wand2 size={14} /> Roll {missingBeats.length} {missingBeats.length === 1 ? "beat" : "beats"}
                </Button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content align="end" sideOffset={8} collisionPadding={12} className="sbd-pop ui-pop-anchor">
                  <p className="sbd-pop-title">Takes per beat · {missingBeats.length} beats without a frame</p>
                  {[1, 2, 4].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className="sbd-pop-item"
                      onClick={() => {
                        setRollMenuOpen(false);
                        rollAllMissing(n);
                      }}
                    >
                      <span>
                        {n} {takeWord(n)} each
                        {n === 1 && <span className="sbd-pop-hint">cheapest</span>}
                        {n === 4 && <span className="sbd-pop-hint">most choice</span>}
                      </span>
                      <span className="sbd-mono">≈{costK(missingBeats.length * n)}k tok</span>
                    </button>
                  ))}
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          )}
          <span title={beats.length === 0 ? "There are no beats to review" : undefined}>
            <Button disabled={beats.length === 0} onClick={startReview}>
              <Stamp size={14} /> Review dailies
            </Button>
          </span>
          {!batchStitching && (
            <span title={completeCount === 0 ? "No beat has a finished take yet" : "Each beat's best take — approved, else the first finished — goes on the board"}>
              <Button disabled={completeCount === 0} onClick={stitchAllBest}>
                <Film size={14} /> Add all best to Shots
              </Button>
            </span>
          )}
          <span title={selectedCount === 0 ? "Add at least one take to Shots first" : undefined}>
            <Button intent="primary" disabled={selectedCount === 0} onClick={() => onSwitchWorkspace("stitch")}>
              Continue to Shots <ArrowRight size={14} />
            </Button>
          </span>
        </div>
      </header>

      {loadState === "error" ? (
        <InlineError message="The storyboard could not be loaded." onRetry={reload} />
      ) : loadState === "loading" ? (
        <div className="sbd-skel" aria-hidden="true">
          {Array.from({ length: 4 }, (_, i) => (
            <span key={i} />
          ))}
        </div>
      ) : beats.length === 0 ? (
        <EmptyState
          title="Nothing to storyboard yet"
          why="Beats come from the script. Once it is submitted and broken into beats, each one gets a row here."
          action={{ label: "Open Script", onClick: () => onSwitchWorkspace("screenplay") }}
        />
      ) : (
        <>
          <StyleStrip style={globalStyle} onChange={setGlobalStyle} />

          <div className="sbd-strip" data-density={density}>
            {sortedBeats.map((beat) => (
              <BeatRow
                key={beat.id}
                beat={beat}
                row={rowByBeat[beat.id]}
                variants={variantsByBeat[beat.id] ?? []}
                stitched={stitched}
                density={density}
                expanded={density === "detail" || expanded === beat.id}
                canCollapse={density !== "detail"}
                globalStyle={globalStyle}
                cast={cast}
                places={places}
                error={rowErrors[beat.id]}
                selectedId={primary?.kind === "frame" ? primary.id : null}
                onToggleExpand={() => setExpanded((cur) => (cur === beat.id ? null : beat.id))}
                onSelect={(v) => selectFrame(beat, v)}
                onFocus={(v) => openFocus(v.id)}
                onAddToStitch={addToStitch}
                onRemoveFromStitch={removeFromStitch}
                onPatchRow={(patch) => patchRow(beat.id, patch)}
                onGenerate={(prompt, takes, coverage) => confirmedGenerate(beat, prompt, takes, coverage)}
                onClearError={() =>
                  setRowErrors((e) => {
                    const { [beat.id]: _drop, ...rest } = e;
                    return rest;
                  })
                }
              />
            ))}
          </div>
        </>
      )}

      {toast && (
        <div className="sbd-toast" data-kind={toast.kind} role="status" aria-live="polite">
          {toast.text}
        </div>
      )}

      <MediaFocus
        beat={focusBeat}
        variant={focusVariant}
        takes={focusBeat ? (variantsByBeat[focusBeat.id] ?? []).filter((v) => v.asset_url) : []}
        row={focusBeat ? rowByBeat[focusBeat.id] : undefined}
        aspect={project.aspect_ratio}
        onBoard={focusVariant ? stitched.has(focusVariant.id) : false}
        reviewMode={reviewMode}
        onClose={closeFocus}
        onMove={(v) => openFocus(v.id)}
        onPatchVariant={(p) => focusVariant && patchVariant(focusVariant.id, p)}
        onAddToStitch={() => focusVariant && addToStitch(focusVariant)}
        onRemoveFromStitch={() => focusVariant && removeFromStitch(focusVariant)}
        onRegenerate={async () => {
          if (!focusBeat || !focusVariant) return;
          closeFocus();
          await confirmedGenerate(focusBeat, focusVariant.prompt, (variantsByBeat[focusBeat.id] ?? []).length || 4);
        }}
        onNext={() => {
          if (!focusBeat) return;
          const t = nextPendingTake(focusBeat.n);
          if (t) openFocus(t.id);
          else {
            closeFocus();
            flash("success", "Dailies signed off — every take has your call.");
          }
        }}
      />
    </motion.div>
  );
}

/* ───────────────────────── Project style strip ───────────────────────── */

function StyleStrip({ style, onChange }: { style: GlobalStyle; onChange: (next: GlobalStyle) => void }) {
  return (
    <div className="sbd-style" role="group" aria-label="Style applied to every beat">
      <Field label="Visual" value={style.visual} options={VISUAL_OPTIONS} onChange={(v) => onChange({ ...style, visual: v })} />
      <Field label="Aspect" value={style.aspect} options={ASPECT_OPTIONS} onChange={(v) => onChange({ ...style, aspect: v as AspectRatio })} />
      <Field label="Light" value={style.light} options={LIGHT_OPTIONS} onChange={(v) => onChange({ ...style, light: v })} />
      <Field label="Temp" value={style.temp} options={TEMP_OPTIONS} onChange={(v) => onChange({ ...style, temp: v })} />
      <Field label="Camera" value={style.camera} options={CAMERA_OPTIONS} onChange={(v) => onChange({ ...style, camera: v })} />
      <span className="sbd-note">Applied to every beat unless the beat overrides it.</span>
    </div>
  );
}

/* ───────────────────────── Beat row ───────────────────────── */

function BeatRow({
  beat,
  row,
  variants,
  stitched,
  density,
  expanded,
  canCollapse,
  globalStyle,
  cast,
  places,
  error,
  selectedId,
  onToggleExpand,
  onSelect,
  onFocus,
  onAddToStitch,
  onRemoveFromStitch,
  onPatchRow,
  onGenerate,
  onClearError
}: {
  beat: Beat;
  row: StoryboardRow | undefined;
  variants: StoryboardVariant[];
  stitched: Set<string>;
  density: Density;
  expanded: boolean;
  canCollapse: boolean;
  globalStyle: GlobalStyle;
  cast: CastMember[];
  places: WorldPlace[];
  error: string | undefined;
  selectedId: string | null;
  onToggleExpand: () => void;
  onSelect: (v: StoryboardVariant) => void;
  onFocus: (v: StoryboardVariant) => void;
  onAddToStitch: (v: StoryboardVariant) => void;
  onRemoveFromStitch: (v: StoryboardVariant) => void;
  onPatchRow: (patch: { style?: BeatStyle }) => void;
  onGenerate: (prompt: string, takes: number, coverage?: Coverage) => void;
  onClearError: () => void;
}) {
  const state = row?.state ?? "waiting";
  const style = row?.style ?? {};
  const onBoardCount = variants.filter((v) => stitched.has(v.id)).length;
  const withFrame = variants.filter((v) => v.asset_url);
  const approved = withFrame.some((v) => v.approval === "approved");
  const allSentBack = withFrame.length > 0 && withFrame.every((v) => v.approval === "needs_work");

  // Where this beat plays: the beat's location, or the heading's best match.
  const heading = beat.scene_heading.toUpperCase();
  const place =
    (beat.location_id && places.find((p) => p.id === beat.location_id)) ||
    places.filter((p) => p.name.trim().length >= 3 && heading.includes(p.name.trim().toUpperCase())).sort((a, b) => b.name.length - a.name.length)[0];

  const framing = [style.shot_size, style.camera_angle, style.lens].filter(Boolean) as string[];

  return (
    <section className="sbd-beat" data-state={state} data-expanded={expanded} aria-label={`Beat ${pad2(beat.n)}: ${beat.title}`}>
      <div className="sbd-beat-meta">
        <div className="sbd-beat-id">
          <span className="sbd-beat-n">{pad2(beat.n)}</span>
          {state === "generating" ? (
            <Status domain="generation" value="Rendering" />
          ) : state === "error" && withFrame.length === 0 ? (
            <Status domain="generation" value="Failed" />
          ) : approved ? (
            <Status domain="creative" value="Approved" />
          ) : allSentBack ? (
            <Status domain="creative" value="Rejected" />
          ) : (
            <Status domain="creative" value="Draft" />
          )}
          {onBoardCount > 0 && <Status domain="creative" value="Locked" detail={`${onBoardCount} in Shots`} />}
        </div>
        <h2 className="sbd-beat-title">{beat.title}</h2>
        <p className="sbd-beat-heading">{beat.scene_heading}</p>
        {density !== "overview" && (
          <div className="sbd-chips">
            {beat.characters.map((name) => {
              const m = cast.find((c) => norm(c.name) === norm(name));
              return (
                <span key={name} className="sbd-chip" data-kind="soul" title={m ? (m.hasLook ? `${name} · Soul ID` : `${name} · no Soul ID yet`) : `${name} · not in World`}>
                  {m?.portrait ? <img src={m.portrait} alt="" loading="lazy" /> : <span className="sbd-chip-blank" aria-hidden="true" />}
                  <span className="sbd-chip-text">{name}</span>
                </span>
              );
            })}
            {place && (
              <span className="sbd-chip" data-kind="world" title={`${place.name} · World ID`}>
                {place.plate ? <img src={place.plate} alt="" loading="lazy" /> : <span className="sbd-chip-blank" aria-hidden="true" />}
                <span className="sbd-chip-text">{place.name}</span>
              </span>
            )}
            {framing.map((t) => (
              <span key={t} className="sbd-tag">
                {t}
              </span>
            ))}
            {beat.flag && (
              <span className="sbd-tag" data-flag title="Flagged in the script breakdown">
                <Flag size={9} /> {beat.flag}
              </span>
            )}
          </div>
        )}
        {canCollapse && (
          <button type="button" className="sbd-direct" onClick={onToggleExpand} aria-expanded={expanded}>
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />} {expanded ? "Hide direction" : "Direct"}
          </button>
        )}
      </div>

      <div className="sbd-takes" data-count={variants.length || 4}>
        {variants.length === 0 ? (
          state === "generating" ? (
            <div className="sbd-take is-pending" aria-label="Rendering">
              <Status domain="generation" value="Rendering" />
            </div>
          ) : (
            <EmptyState
              className="sbd-takes-empty"
              title="No takes yet"
              why={density === "overview" ? "Roll four takes to storyboard this beat." : "Direct the camera below or roll four takes with the defaults."}
              action={{ label: "Roll 4 takes", onClick: () => onGenerate(style.prompt_override || defaultPromptFor(beat, style, globalStyle), 4) }}
            />
          )
        ) : (
          variants.map((v) => (
            <Take key={v.id} beat={beat} variant={v} angle={style.angles?.[v.n - 1]} onBoard={stitched.has(v.id)} selected={selectedId === v.id} onSelect={() => onSelect(v)} onFocus={() => onFocus(v)} onAddToStitch={() => onAddToStitch(v)} onRemoveFromStitch={() => onRemoveFromStitch(v)} />
          ))
        )}
      </div>

      {error && (
        <div className="sbd-beat-error">
          <InlineError message="This beat did not roll." detail={error} onRetry={() => onGenerate(style.prompt_override || defaultPromptFor(beat, style, globalStyle), variants.length || 4)} />
          <Button size="sm" intent="ghost" onClick={onClearError}>
            Dismiss
          </Button>
        </div>
      )}

      {expanded && <Direction beat={beat} style={style} globalStyle={globalStyle} state={state} cast={cast} onPatchRow={onPatchRow} onGenerate={onGenerate} />}
    </section>
  );
}

/* ───────────────────────── A take ───────────────────────── */

function Take({
  beat,
  variant,
  angle,
  onBoard,
  selected,
  onSelect,
  onFocus,
  onAddToStitch,
  onRemoveFromStitch
}: {
  beat: Beat;
  variant: StoryboardVariant;
  /** Set only on a coverage roll: the framing this take was shot from. */
  angle?: string;
  onBoard: boolean;
  selected: boolean;
  onSelect: () => void;
  onFocus: () => void;
  onAddToStitch: () => void;
  onRemoveFromStitch: () => void;
}) {
  const pending = variant.id.startsWith("pending-") || variant.state === "generating";
  if (pending) {
    return (
      <div className="sbd-take is-pending" aria-label={`Take ${variant.n} rendering`}>
        <Status domain="generation" value="Rendering" />
      </div>
    );
  }
  if (!variant.asset_url) {
    return (
      <div className="sbd-take is-failed" aria-label={`Take ${variant.n} failed`}>
        <Status domain="generation" value="Failed" />
      </div>
    );
  }
  return (
    <div className={cn("sbd-take", selected && "is-selected", onBoard && "is-onboard")} data-approval={variant.approval}>
      <button type="button" className="sbd-take-hit" onClick={onSelect} onDoubleClick={onFocus} aria-pressed={selected} aria-label={`Take ${variant.n} of beat ${pad2(beat.n)}${onBoard ? ", in Shots" : ""}`}>
        <MediaTile url={variant.asset_url} kind="image" alt="" className="sbd-take-img" />
      </button>
      <span className="sbd-take-n" data-angle={angle ? "" : undefined} title={angle ? `Take ${variant.n} — ${angle}` : undefined}>
        {angle ?? `T${variant.n}`}
      </span>
      {variant.approval === "approved" && (
        <span className="sbd-take-mark" data-a="approved" title="Approved">
          <Check size={11} />
        </span>
      )}
      {variant.approval === "needs_work" && (
        <span className="sbd-take-mark" data-a="needs" title="Sent back">
          <Flag size={11} />
        </span>
      )}
      {onBoard && <span className="sbd-take-board">Scene {beat.n}</span>}
      <div className="sbd-take-actions">
        <IconButton size="sm" intent="secondary" label="Open in Focus" onClick={onFocus}>
          <ZoomIn size={13} />
        </IconButton>
        <IconButton size="sm" intent={onBoard ? "secondary" : "primary"} label={onBoard ? "Remove from Shots" : `Add to Shots as Scene ${beat.n}`} onClick={onBoard ? onRemoveFromStitch : onAddToStitch}>
          {onBoard ? <X size={13} /> : <Film size={13} />}
        </IconButton>
      </div>
    </div>
  );
}

/* ───────────────────────── Direction (the beat editor) ───────────────────────── */

function Direction({
  beat,
  style,
  globalStyle,
  state,
  cast,
  onPatchRow,
  onGenerate
}: {
  beat: Beat;
  style: BeatStyle;
  globalStyle: GlobalStyle;
  state: StoryboardRow["state"];
  cast: CastMember[];
  onPatchRow: (patch: { style?: BeatStyle }) => void;
  onGenerate: (prompt: string, takes: number, coverage?: Coverage) => void;
}) {
  const [prompt, setPrompt] = useState(style.prompt_override || defaultPromptFor(beat, style, globalStyle));
  const [takes, setTakes] = useState(4);
  const [aiWriting, setAiWriting] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  // Camera and style selects must reach the generator: recompose the prompt
  // whenever a setting changes, unless the director hand-edited it.
  const handEdited = useRef(Boolean(style.prompt_override));
  const castKey = JSON.stringify(style.cast_override ?? []);
  useEffect(() => {
    if (handEdited.current) return;
    setPrompt(defaultPromptFor(beat, style, globalStyle));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [style.shot_size, style.camera_angle, style.lens, style.movement, style.aperture, style.camera_body, style.visual, style.light, style.temp, style.aspect, castKey, globalStyle]);

  const generating = state === "generating";
  const set = (patch: BeatStyle) => onPatchRow({ style: patch });

  async function aiWritePrompt() {
    if (aiWriting) return;
    setAiWriting(true);
    setAiError(null);
    try {
      const res = await fetch(`/api/storyboard/rows/${beat.id}/prompt`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.prompt) {
        handEdited.current = true;
        setPrompt(data.prompt);
        set({ prompt_override: data.prompt });
      } else setAiError(data?.error || `No prompt came back (${res.status}). Check the text model in the Key Vault.`);
    } catch (e: any) {
      setAiError(e?.message ?? String(e));
    } finally {
      setAiWriting(false);
    }
  }

  const shot = style.shot_size ?? "Wide";
  const angle = style.camera_angle ?? "Eye level";
  // Coverage turns the framing grid into a multi-select: every cell picked is
  // one frame in the roll. Off by default, so the grid stays the plain
  // "this beat is framed like this" control it has always been.
  const [covering, setCovering] = useState(false);
  const [picked, setPicked] = useState<Array<{ shot: string; angle: string }>>([]);
  const pickedAt = (sh: string, an: string) => picked.findIndex((c) => c.shot === sh && c.angle === an);
  const togglePick = (sh: string, an: string) =>
    setPicked((cur) => {
      const i = cur.findIndex((c) => c.shot === sh && c.angle === an);
      if (i >= 0) return cur.filter((_, j) => j !== i);
      return cur.length >= 8 ? cur : [...cur, { shot: sh, angle: an }];
    });
  // One prompt per angle, each built from this beat's own style with only the
  // framing swapped, so light, lens, cast and aspect stay identical across the
  // set and only the camera moves.
  const coverage: Coverage = {
    angles: picked.map((c) => angleLabel(c.shot, c.angle)),
    prompts: picked.map((c) =>
      defaultPromptFor(beat, { ...style, shot_size: c.shot, camera_angle: c.angle }, globalStyle)
    )
  };
  const presetOn = (p: (typeof SHOT_PRESETS)[number]) => p.style.shot_size === shot && p.style.camera_angle === angle && p.style.lens === (style.lens ?? "35mm");

  return (
    <div className="sbd-direction">
      {/* Two independent columns. The camera used to span some of the left
          column's rows, and being the taller of the two it stretched them —
          which is the empty band that opened under the prompt. */}
      <div className="sbd-direction-left">
      <section className="sbd-dsec sbd-dsec-prompt">
        <div className="sbd-dsec-head">
          <h3>Prompt</h3>
          <Button size="sm" intent="ghost" onClick={aiWritePrompt} disabled={aiWriting} title="The text model writes it from the script, the beat and the camera">
            <Sparkles size={12} /> {aiWriting ? "Writing…" : "Write from script"}
          </Button>
          <Button
            size="sm"
            intent="ghost"
            onClick={() => {
              handEdited.current = false;
              setPrompt(defaultPromptFor(beat, style, globalStyle));
              set({ prompt_override: "" });
            }}
          >
            Reset
          </Button>
        </div>
        <textarea
          className="sbd-textarea"
          value={prompt}
          rows={4}
          aria-label="Image prompt"
          onChange={(e) => {
            handEdited.current = true;
            setPrompt(e.target.value);
          }}
          onBlur={() => set({ prompt_override: prompt })}
        />
        <span className="sbd-note">
          {prompt.length} characters · saves when you leave the field{handEdited.current ? " · hand-edited, camera changes no longer rewrite it" : ""}
        </span>
        {aiError && <InlineError message="The prompt could not be written." detail={aiError} onRetry={aiWritePrompt} />}
      </section>

      {cast.length > 0 && (
        <section className="sbd-dsec">
          <div className="sbd-dsec-head">
            <h3>Cast in frame</h3>
            <span className="sbd-note">Everyone here is reference-locked to their Soul ID.</span>
          </div>
          <div className="sbd-chips">
            {cast.map((m) => {
              const inBeat = beat.characters.some((n) => norm(n) === norm(m.name));
              const on = inBeat || (style.cast_override ?? []).some((n) => norm(n) === norm(m.name));
              return (
                <button
                  key={m.name}
                  type="button"
                  className="sbd-chip"
                  data-kind="soul"
                  data-on={on}
                  aria-pressed={on}
                  disabled={inBeat}
                  title={inBeat ? `${m.name} is in this beat's script — always included` : m.hasLook ? `Put ${m.name} in this frame` : `${m.name} has no Soul ID yet — the lock will be loose`}
                  onClick={() => {
                    const cur = style.cast_override ?? [];
                    set({ cast_override: on ? cur.filter((n) => norm(n) !== norm(m.name)) : [...cur, m.name] });
                  }}
                >
                  {m.portrait ? <img src={m.portrait} alt="" loading="lazy" /> : <span className="sbd-chip-blank" aria-hidden="true" />}
                  <span className="sbd-chip-text">{m.name}</span>
                  {on && <Check size={10} />}
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="sbd-dsec">
        <div className="sbd-dsec-head">
          <h3>Style · this beat only</h3>
          <span className="sbd-note">Inherits the project style until changed here.</span>
        </div>
        <div className="sbd-fields">
          <Field label="Visual" value={style.visual ?? globalStyle.visual} options={VISUAL_OPTIONS} onChange={(v) => set({ visual: v })} />
          <Field label="Light" value={style.light ?? globalStyle.light} options={LIGHT_OPTIONS} onChange={(v) => set({ light: v })} />
          <Field label="Temp" value={style.temp ?? globalStyle.temp} options={TEMP_OPTIONS} onChange={(v) => set({ temp: v })} />
          <Field label="Aspect" value={style.aspect ?? globalStyle.aspect} options={ASPECT_OPTIONS} onChange={(v) => set({ aspect: v as AspectRatio })} />
        </div>
      </section>
      </div>

      <section className="sbd-dsec sbd-dsec-camera">
        <div className="sbd-dsec-head">
          <h3>Camera</h3>
          <button
            type="button"
            className="sbd-cover-toggle"
            data-on={covering}
            aria-pressed={covering}
            onClick={() => {
              setCovering((v) => !v);
              setPicked([]);
            }}
            title="Roll this beat from several framings at once instead of repeating one"
          >
            {covering ? "Framing" : "Coverage"}
          </button>
        </div>
        {covering && (
          <p className="sbd-note sbd-cover-hint">
            Pick the framings in the grid below — one frame each, same light, lens and cast. Click a chosen cell to
            drop it.
          </p>
        )}
        <div className="sbd-camera">
          <div className="sbd-framing">
            <div className="sbd-framing-cols" aria-hidden="true">
              {FRAMING_SHOTS.map((s) => (
                <span key={s}>{s}</span>
              ))}
            </div>
            <div className="sbd-framing-rows" aria-hidden="true">
              {FRAMING_ANGLES.map((a) => (
                <span key={a}>{a === "Eye level" ? "Eye" : a}</span>
              ))}
            </div>
            <div
              className="sbd-frame"
              role={covering ? "group" : "radiogroup"}
              aria-label={covering ? "Coverage: pick the framings to roll" : "Framing: shot size by angle"}
              data-covering={covering}
            >
              {FRAMING_ANGLES.map((a) =>
                FRAMING_SHOTS.map((s) => {
                  const order = covering ? pickedAt(s, a) : -1;
                  const on = covering ? order >= 0 : shot === s && angle === a;
                  return (
                    <button
                      key={`${s}-${a}`}
                      type="button"
                      role={covering ? "checkbox" : "radio"}
                      aria-checked={on}
                      aria-label={`${s} shot, ${a.toLowerCase()} angle${covering ? (on ? `, angle ${order + 1} of the roll` : ", add to the roll") : ""}`}
                      title={covering ? (on ? `Angle ${order + 1} — click to drop it` : `Add ${angleLabel(s, a)} to the roll`) : angleLabel(s, a)}
                      className="sbd-frame-cell"
                      data-on={on}
                      onClick={() => (covering ? togglePick(s, a) : set({ shot_size: s, camera_angle: a }))}
                    >
                      <FigureGlyph shot={s} angle={a} />
                      {order >= 0 && <span className="sbd-frame-order">{order + 1}</span>}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="sbd-camera-fields">
            <div className="sbd-presets" role="group" aria-label="Shot presets">
              {SHOT_PRESETS.map((p) => (
                <button key={p.id} type="button" className="sbd-preset" data-on={presetOn(p)} title={p.hint} onClick={() => set({ ...p.style })}>
                  {p.label}
                </button>
              ))}
            </div>
            <div className="sbd-fields">
              <Field label="Shot size" value={shot} options={SHOT_SIZE_OPTIONS} onChange={(v) => set({ shot_size: v })} />
              <Field label="Angle" value={angle} options={ANGLE_OPTIONS} onChange={(v) => set({ camera_angle: v })} />
              <Field label="Lens" value={style.lens ?? "35mm"} options={LENS_OPTIONS} onChange={(v) => set({ lens: v })} />
              <Field label="Movement" value={style.movement ?? "Locked"} options={MOVEMENT_OPTIONS} onChange={(v) => set({ movement: v })} />
              <Field label="Aperture" value={style.aperture ?? "f/4 (balanced)"} options={APERTURE_OPTIONS} onChange={(v) => set({ aperture: v })} />
              <Field label="Camera" value={style.camera_body ?? "Full-frame cine digital"} options={CAMERA_BODY_OPTIONS} onChange={(v) => set({ camera_body: v })} />
            </div>
          </div>
        </div>
      </section>

      <div className="sbd-roll">
        {!covering && (
          <div className="sbd-seg" role="radiogroup" aria-label="Number of takes">
            {[1, 2, 4].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={takes === n} data-on={takes === n} onClick={() => setTakes(n)} disabled={generating}>
                {n} {takeWord(n)}
              </button>
            ))}
          </div>
        )}
        <Button
          intent="primary"
          size="sm"
          disabled={generating || (covering && picked.length === 0)}
          onClick={() => (covering ? onGenerate(prompt, picked.length, coverage) : onGenerate(prompt, takes))}
          title={
            generating
              ? "This beat is already rolling"
              : covering && picked.length === 0
              ? "Pick at least one framing in the grid"
              : undefined
          }
        >
          {generating ? (
            <>
              <RefreshCcw size={12} className="fx-rotate-load" /> Rolling…
            </>
          ) : covering ? (
            <>
              <Wand2 size={12} /> Roll {picked.length || "no"} {picked.length === 1 ? "angle" : "angles"}
            </>
          ) : (
            <>
              <Wand2 size={12} /> Roll {takes} {takeWord(takes)}
            </>
          )}
        </Button>
        <span className="sbd-mono">≈{costK(covering ? picked.length : takes)}k tokens</span>
        <span className="sbd-note">
          {generating
            ? "Frames land here as they finish."
            : covering
            ? picked.length
              ? picked.map((c) => angleLabel(c.shot, c.angle)).join(", ")
              : "Pick framings in the grid above."
            : "Seedream via your BytePlus pack, or Higgsfield when connected."}
        </span>
      </div>
    </div>
  );
}

/** A figure in the frame: bigger for a closer shot, placed for the angle. */
function FigureGlyph({ shot, angle }: { shot: string; angle: string }) {
  const r = shot === "Close" ? 11 : shot === "Medium" ? 7 : 4;
  const cy = angle === "High" ? 20 : angle === "Low" ? 14 : 17;
  return (
    <svg viewBox="0 0 48 27" className="sbd-figure" aria-hidden="true">
      <circle cx="24" cy={cy - r * 0.9} r={r * 0.45} />
      <rect x={24 - r * 0.8} y={cy - r * 0.35} width={r * 1.6} height={r * 1.2} rx={r * 0.35} />
    </svg>
  );
}

/* ───────────────────────── Media focus (review) ───────────────────────── */

function MediaFocus({
  beat,
  variant,
  takes,
  row,
  aspect,
  onBoard,
  reviewMode,
  onClose,
  onMove,
  onPatchVariant,
  onAddToStitch,
  onRemoveFromStitch,
  onRegenerate,
  onNext
}: {
  beat: Beat | null;
  variant: StoryboardVariant | null;
  takes: StoryboardVariant[];
  row: StoryboardRow | undefined;
  aspect: string;
  onBoard: boolean;
  reviewMode: boolean;
  onClose: () => void;
  onMove: (v: StoryboardVariant) => void;
  onPatchVariant: (p: { prompt?: string; approval?: string; note?: string }) => void;
  onAddToStitch: () => void;
  onRemoveFromStitch: () => void;
  onRegenerate: () => void;
  onNext: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [note, setNote] = useState("");
  useEffect(() => {
    setPrompt(variant?.prompt || row?.style.prompt_override || "");
    setNote(variant?.note || "");
    setEditing(false);
  }, [variant?.id, variant?.prompt, variant?.note, row?.style.prompt_override]);

  const idx = variant ? takes.findIndex((t) => t.id === variant.id) : -1;
  const prev = idx > 0 ? takes[idx - 1] : null;
  const next = idx >= 0 && idx < takes.length - 1 ? takes[idx + 1] : null;

  return (
    <Dialog open={Boolean(variant && beat)} onOpenChange={(o) => !o && onClose()}>
      {variant && beat && (
        <DialogContent
          className="sbd-focus"
          onKeyDown={(e) => {
            if ((e.target as HTMLElement).tagName === "TEXTAREA") return;
            if (e.key === "ArrowLeft" && prev) onMove(prev);
            if (e.key === "ArrowRight" && next) onMove(next);
          }}
        >
          <div className="sbd-focus-stage">
            <div className="sbd-focus-media" style={{ aspectRatio: aspect.replace(":", " / ") }}>
              {variant.asset_url && <img src={variant.asset_url} alt={`${beat.title}, take ${variant.n}`} />}
            </div>
            <div className="sbd-focus-nav">
              <IconButton label="Previous take (←)" size="sm" onClick={() => prev && onMove(prev)} disabled={!prev}>
                <ChevronLeft size={14} />
              </IconButton>
              <div className="sbd-focus-takes" role="list">
                {takes.map((t) => (
                  <button key={t.id} type="button" role="listitem" className="sbd-focus-thumb" data-on={t.id === variant.id} aria-current={t.id === variant.id} aria-label={`Take ${t.n}`} onClick={() => onMove(t)}>
                    {t.asset_url && <img src={t.asset_url} alt="" loading="lazy" />}
                  </button>
                ))}
              </div>
              <IconButton label="Next take (→)" size="sm" onClick={() => next && onMove(next)} disabled={!next}>
                <ChevronRight size={14} />
              </IconButton>
            </div>
          </div>

          <div className="sbd-focus-side">
            <header className="sbd-focus-head">
              <span className="sbd-mono">
                Beat {pad2(beat.n)} · Take {variant.n} · {aspect}
              </span>
              <DialogTitle className="sbd-focus-title">{beat.title}</DialogTitle>
              <DialogDescription>{beat.scene_heading}</DialogDescription>
            </header>

            <section className="sbd-insp-section" data-approval={variant.approval}>
              <div className="sbd-insp-row">
                <h3 className="sbd-insp-h">Director&apos;s call</h3>
                <ApprovalStatus approval={variant.approval} />
              </div>
              <textarea className="sbd-textarea" placeholder="Note — what works, what to change" value={note} onChange={(e) => setNote(e.target.value)} rows={3} aria-label="Director's note" />
              <div className="sbd-insp-actions">
                <Button size="sm" intent={variant.approval === "approved" ? "primary" : "secondary"} onClick={() => onPatchVariant({ approval: "approved", note })}>
                  <Check size={12} /> Approve take
                </Button>
                <Button size="sm" onClick={() => onPatchVariant({ approval: "needs_work", note })}>
                  <Flag size={12} /> Send back
                </Button>
                {reviewMode && (
                  <Button size="sm" intent="primary" className="sbd-push" onClick={onNext}>
                    Next pending <ArrowRight size={12} />
                  </Button>
                )}
              </div>
            </section>

            <section className="sbd-insp-section">
              <div className="sbd-insp-row">
                <h3 className="sbd-insp-h">Prompt used</h3>
                <Button size="sm" intent="ghost" onClick={() => setEditing((v) => !v)}>
                  {editing ? "Cancel" : "Edit"}
                </Button>
              </div>
              {editing ? (
                <>
                  <textarea className="sbd-textarea" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={6} aria-label="Prompt" />
                  <div className="sbd-insp-actions">
                    <Button
                      size="sm"
                      intent="primary"
                      onClick={() => {
                        onPatchVariant({ prompt });
                        setEditing(false);
                      }}
                    >
                      Save prompt
                    </Button>
                  </div>
                </>
              ) : (
                <p className="sbd-prompt-read">{variant.prompt || row?.style.prompt_override || "No prompt recorded. Generated from the default direction."}</p>
              )}
            </section>

            <section className="sbd-insp-section">
              <h3 className="sbd-insp-h">Camera · from the beat</h3>
              <dl className="sbd-kv">
                <dt>Shot</dt>
                <dd>{row?.style.shot_size ?? "—"}</dd>
                <dt>Angle</dt>
                <dd>{row?.style.camera_angle ?? "—"}</dd>
                <dt>Lens</dt>
                <dd>{row?.style.lens ?? "—"}</dd>
                <dt>Movement</dt>
                <dd>{row?.style.movement ?? "—"}</dd>
                <dt>Aperture</dt>
                <dd>{row?.style.aperture ?? "—"}</dd>
                <dt>Camera</dt>
                <dd>{row?.style.camera_body ?? "—"}</dd>
                <dt>Cast</dt>
                <dd>{beat.characters.join(", ") || "—"}</dd>
                <dt>Mood</dt>
                <dd>{beat.mood.join(", ") || "—"}</dd>
              </dl>
            </section>

            <footer className="sbd-focus-foot">
              <Button size="sm" onClick={onRegenerate} title="Replaces every take for this beat — you will be asked first">
                <RefreshCcw size={12} /> Regenerate row
              </Button>
              {onBoard ? (
                <Button size="sm" onClick={onRemoveFromStitch}>
                  <X size={12} /> Remove from Shots
                </Button>
              ) : (
                <Button size="sm" onClick={onAddToStitch}>
                  <Film size={12} /> Add to Shots
                </Button>
              )}
              <Button size="sm" intent="primary" className="sbd-push" onClick={onClose}>
                Done
              </Button>
            </footer>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
