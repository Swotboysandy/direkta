"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  Film,
  Flag,
  Layers,
  LayoutGrid,
  Play,
  RefreshCcw,
  Stamp,
  Sparkles,
  Wand2,
  X,
  ZoomIn
} from "../_components/icons";
import { fadeUp, staggerContainer, staggerItem } from "../_components/motion";
import type { AspectRatio, Beat, Project, WorkspaceId } from "../../lib/types";

interface StoryboardRow {
  beat_id: string;
  state: "waiting" | "generating" | "complete" | "error";
  selected_variant_id: string | null;
  style: BeatStyle;
}

interface StoryboardVariant {
  id: string;
  beat_id: string;
  n: number;
  prompt: string;
  state: string;
  asset_id: string | null;
  asset_url: string | null;
  approval: string;
  note: string;
}

interface BeatStyle {
  visual?: string;
  aspect?: AspectRatio;
  light?: string;
  temp?: string;
  camera?: string;
  prompt_override?: string;
  camera_angle?: string;
  lens?: string;
  movement?: string;
  shot_size?: string;
  /** Cast members explicitly placed in this frame (reference-locked). */
  cast_override?: string[];
}

interface CastMember {
  name: string;
  hasLook: boolean;
}

interface GlobalStyle {
  visual: string;
  aspect: AspectRatio;
  light: string;
  temp: string;
  camera: string;
}

interface Props {
  project: Project;
  onSwitchWorkspace: (ws: WorkspaceId) => void;
}

const VISUAL_OPTIONS = ["Naturalistic", "Noir", "High contrast", "Documentary", "Stylised", "Hyperreal"];
const ASPECT_OPTIONS: AspectRatio[] = ["16:9", "9:16", "1:1", "4:5", "21:9"];
const LIGHT_OPTIONS = ["Natural", "Golden hour", "Overcast", "Hard shadows", "Low key", "High key", "Dawn", "Dusk"];
const TEMP_OPTIONS = ["Cool", "Neutral", "Warm"];
const CAMERA_OPTIONS = ["Wide", "Medium", "Close", "Extreme close", "Mixed"];
const SHOT_SIZE_OPTIONS = ["Wide", "Medium", "Close", "Extreme close", "Two-shot", "Over-shoulder", "Insert", "Establishing"];
const LENS_OPTIONS = ["24mm", "35mm", "50mm", "85mm", "135mm"];
const MOVEMENT_OPTIONS = ["Locked", "Pan", "Tilt", "Dolly", "Handheld", "Push in", "Pull out", "Whip"];
const ANGLE_OPTIONS = ["Eye level", "Low", "High", "Dutch", "Bird's eye", "Worm's eye"];

const FRAMINGS: Array<{ shot: string; angle: string; label: string }> = [
  { shot: "Wide", angle: "High", label: "Wide · High" },
  { shot: "Wide", angle: "Eye level", label: "Wide · Eye" },
  { shot: "Wide", angle: "Low", label: "Wide · Low" },
  { shot: "Medium", angle: "High", label: "Med · High" },
  { shot: "Medium", angle: "Eye level", label: "Med · Eye" },
  { shot: "Medium", angle: "Low", label: "Med · Low" },
  { shot: "Close", angle: "Eye level", label: "Close · Eye" },
  { shot: "Close", angle: "Low", label: "Close · Low" },
  { shot: "Close", angle: "Dutch", label: "Close · Dutch" }
];

export function Storyboard({ project, onSwitchWorkspace }: Props) {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [rows, setRows] = useState<StoryboardRow[]>([]);
  const [variants, setVariants] = useState<StoryboardVariant[]>([]);
  const [stitchedVariantIds, setStitchedVariantIds] = useState<Set<string>>(new Set());
  const [lightbox, setLightbox] = useState<{ beat: Beat; variant: StoryboardVariant } | null>(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [expandedBeat, setExpandedBeat] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "grid">("list");
  const [toast, setToast] = useState<{ kind: "success" | "info" | "error"; text: string } | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
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
    if (!res.ok) return;
    const data = await res.json();
    setBeats(data.beats);

    // Project cast — powers the "Cast in frame" chips in each beat editor.
    fetch(`/api/projects/${project.id}/characters`)
      .then((r) => (r.ok ? r.json() : { characters: [] }))
      .then((d) =>
        setCast(
          (d.characters ?? []).map((c: { name: string; refs?: string[] }) => ({
            name: c.name,
            hasLook: (c.refs ?? []).length > 0
          }))
        )
      )
      .catch(() => {});
    setRows(
      (data.rows as Array<{ beat_id: string; state: StoryboardRow["state"]; selected_variant_id: string | null; style: BeatStyle | Record<string, unknown> }>).map(
        (r) => ({ ...r, style: (r.style ?? {}) as BeatStyle })
      )
    );
    setVariants(data.variants);

    // Track which variants are already on the stitch board so the UI can flag them.
    const stitch = await fetch(`/api/projects/${project.id}/stitch`);
    if (stitch.ok) {
      const sd = await stitch.json();
      const ids = new Set<string>(
        (sd.nodes as Array<{ variant_id: string | null }>).map((n) => n.variant_id ?? "").filter(Boolean)
      );
      setStitchedVariantIds(ids);
    }
  }, [project.id]);

  function flashToast(kind: "success" | "info" | "error", text: string) {
    setToast({ kind, text });
    setTimeout(() => setToast((t) => (t?.text === text ? null : t)), 2800);
  }

  useEffect(() => {
    reload();
  }, [reload]);

  const rowByBeat = useMemo(() => Object.fromEntries(rows.map((r) => [r.beat_id, r])), [rows]);
  const variantsByBeat = useMemo(() => {
    const map: Record<string, StoryboardVariant[]> = {};
    for (const v of variants) {
      if (!map[v.beat_id]) map[v.beat_id] = [];
      map[v.beat_id].push(v);
    }
    for (const list of Object.values(map)) list.sort((a, b) => a.n - b.n);
    return map;
  }, [variants]);

  const selectedCount = rows.filter((r) => r.selected_variant_id).length;
  const completeCount = rows.filter((r) => r.state === "complete").length;
  const approvedBeatCount = beats.filter((b) =>
    (variantsByBeat[b.id] ?? []).some((v) => v.approval === "approved")
  ).length;

  // The next take awaiting the director's call (a beat with frames but no approved take).
  function nextPendingTake(afterBeatN: number | null): { beat: Beat; variant: StoryboardVariant } | null {
    for (const beat of [...beats].sort((a, b) => a.n - b.n)) {
      if (afterBeatN != null && beat.n <= afterBeatN) continue;
      const vs = (variantsByBeat[beat.id] ?? []).filter((v) => v.asset_url);
      if (vs.length === 0 || vs.some((v) => v.approval === "approved")) continue;
      const take =
        vs.find((v) => stitchedVariantIds.has(v.id)) ||
        vs.find((v) => v.id === rowByBeat[beat.id]?.selected_variant_id) ||
        vs[0];
      return { beat, variant: take };
    }
    return null;
  }

  function startReview() {
    const t = nextPendingTake(null);
    if (t) {
      setReviewMode(true);
      setLightbox(t);
    } else {
      flashToast("info", "All takes reviewed — every beat is signed off.");
    }
  }

  async function addVariantToStitch(variant: StoryboardVariant) {
    // Optimistic update — mark the variant as stitched before the network round-trip.
    setStitchedVariantIds((prev) => new Set(prev).add(variant.id));
    // Mirror the "selected" concept for any downstream code that still reads it.
    setRows((prev) =>
      prev.map((r) => (r.beat_id === variant.beat_id ? { ...r, selected_variant_id: variant.id } : r))
    );
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
      flashToast("error", "Failed to add to Stitch.");
      return;
    }
    const data = (await res.json()) as { action: string; beat_n: number; scene_number: number };
    if (data.action === "exists") {
      flashToast("info", `Already on Stitch · Scene ${data.scene_number}`);
    } else {
      flashToast("success", `Added · Beat ${String(data.beat_n).padStart(2, "0")} V${String(variant.n).padStart(2, "0")} → Scene ${data.scene_number}`);
    }
  }

  async function removeVariantFromStitch(variant: StoryboardVariant) {
    setStitchedVariantIds((prev) => {
      const next = new Set(prev);
      next.delete(variant.id);
      return next;
    });
    await fetch(`/api/stitch/nodes?variant_id=${encodeURIComponent(variant.id)}`, {
      method: "DELETE"
    }).catch(() => {});
    flashToast("info", `Removed V${String(variant.n).padStart(2, "0")} from Stitch`);
  }

  async function patchRow(beatId: string, patch: { style?: BeatStyle }) {
    setRows((prev) =>
      prev.map((r) =>
        r.beat_id === beatId ? { ...r, style: { ...r.style, ...(patch.style ?? {}) } } : r
      )
    );
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

  // Beats that don't yet have a single finished frame.
  const missingBeats = beats.filter(
    (b) => !(variantsByBeat[b.id] ?? []).some((v) => v.state === "complete" && v.asset_url)
  );

  /** Roll every beat that has no frame yet — N takes each, sequentially. */
  async function rollAllMissing(takesPerBeat: number) {
    if (batchRolling || missingBeats.length === 0) return;
    setBatchRolling(true);
    batchStop.current = false;
    let done = 0;
    try {
      for (let i = 0; i < missingBeats.length; i++) {
        if (batchStop.current) {
          flashToast("info", `Stopped — ${done} of ${missingBeats.length} beats rolled.`);
          return;
        }
        const beat = missingBeats[i];
        flashToast(
          "info",
          `Rolling beat ${String(beat.n).padStart(2, "0")} (${takesPerBeat} ${takesPerBeat === 1 ? "take" : "takes"}) — ${i + 1} / ${missingBeats.length}…`
        );
        const row = rowByBeat[beat.id];
        const style = row?.style ?? {};
        const prompt = style.prompt_override || defaultPromptFor(beat, style, globalStyle);
        await generate(beat.id, prompt, takesPerBeat);
        done++;
      }
      flashToast("success", `Rolled ${missingBeats.length} beats — review the takes, then Stitch all.`);
    } finally {
      setBatchRolling(false);
      batchStop.current = false;
    }
  }

  /** Put each beat's best take (approved, else first complete) on the Stitch board. */
  async function stitchAllBest() {
    if (batchStitching) return;
    setBatchStitching(true);
    batchStop.current = false;
    try {
      let added = 0;
      for (const beat of [...beats].sort((a, b) => a.n - b.n)) {
        if (batchStop.current) {
          flashToast("info", `Stopped — ${added} shots added.`);
          return;
        }
        const vs = (variantsByBeat[beat.id] ?? []).filter((v) => v.state === "complete" && v.asset_url);
        if (!vs.length) continue;
        const best = vs.find((v) => v.approval === "approved") ?? vs[0];
        if (stitchedVariantIds.has(best.id)) continue;
        await addVariantToStitch(best);
        added++;
      }
      flashToast(added ? "success" : "info", added ? `${added} shots on the Stitch board.` : "Every beat's best take is already on Stitch.");
    } finally {
      setBatchStitching(false);
      batchStop.current = false;
    }
  }

  async function generate(beatId: string, prompt: string, takes: number = 4) {
    // Optimistic: flip the row to "generating" and drop shimmer placeholders
    // in immediately — the POST is synchronous and can take a minute.
    setRows((prev) => {
      const has = prev.some((r) => r.beat_id === beatId);
      const next = prev.map((r) => (r.beat_id === beatId ? { ...r, state: "generating" as const } : r));
      return has
        ? next
        : [...next, { beat_id: beatId, state: "generating" as const, selected_variant_id: null, style: {} }];
    });
    setVariants((prev) => [
      ...prev.filter((v) => v.beat_id !== beatId),
      ...Array.from({ length: takes }, (_, i) => ({
        id: `pending-${beatId}-${i}`,
        beat_id: beatId,
        n: i + 1,
        prompt,
        state: "generating",
        asset_id: null,
        asset_url: null,
        approval: "pending",
        note: ""
      }))
    ]);
    try {
      await fetch(`/api/storyboard/rows/${beatId}/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ variants: takes, prompt })
      });
    } finally {
      await reload();
    }
  }


  return (
    <div className="main-inner storyboard">
      <motion.header className="page-head" {...fadeUp}>
        <div>
          <span className="t-eyebrow crumb">04 / WORKSPACE · STORYBOARD</span>
          <h1 className="t-display-m" style={{ marginTop: "var(--sp-2)" }}>Storyboard</h1>
          <p className="lead" style={{ marginTop: "var(--sp-3)", maxWidth: "64ch" }}>
            The Cinematographer rolls 4 variants per beat. Pick a winner. Click a beat to edit its
            prompt and camera direction, or open any frame to review a single take.
          </p>
        </div>
        <div className="actions">
          {beats.length > 0 && (
            <div className="view-toggle" role="tablist" aria-label="Storyboard view">
              <button
                role="tab"
                aria-selected={view === "list"}
                data-active={view === "list"}
                onClick={() => setView("list")}
              >
                List
              </button>
              <button
                role="tab"
                aria-selected={view === "grid"}
                data-active={view === "grid"}
                onClick={() => setView("grid")}
              >
                Grid
              </button>
            </div>
          )}
          <span className="pip-state" data-status={approvedBeatCount === beats.length && beats.length > 0 ? "done" : "working"}>
            {approvedBeatCount} / {beats.length || "—"} APPROVED
          </span>
          {batchRolling && (
            <button
              className="btn"
              onClick={() => {
                batchStop.current = true;
                flashToast("info", "Stopping after the current beat…");
              }}
              title="Stop after the beat currently generating (its cost is already committed)"
              style={{ color: "var(--tomato)", background: "color-mix(in srgb, var(--tomato) 12%, transparent)" }}
            >
              <X size={14} /> Stop rolling
            </button>
          )}
          {missingBeats.length > 0 && !batchRolling && (
            <Popover.Root open={rollMenuOpen} onOpenChange={setRollMenuOpen}>
              <Popover.Trigger asChild>
                <button
                  className="btn"
                  title={`Generate frames for every beat without one — pick how many takes per scene`}
                >
                  <Wand2 size={14} /> Roll all {missingBeats.length} beats
                </button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  align="end"
                  sideOffset={8}
                  style={{
                    width: 260,
                    background: "var(--surface)",
                    backdropFilter: "blur(20px)",
                    borderRadius: 18,
                    boxShadow: "var(--shadow-3)",
                    padding: 10,
                    zIndex: 90,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4
                  }}
                >
                  <span
                    style={{
                      padding: "6px 10px 8px",
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "0.02em",
                      color: "var(--mute)"
                    }}
                  >
                    Takes per scene · {missingBeats.length} beats to roll
                  </span>
                  {[1, 2, 4].map((n) => {
                    const costK = Math.round((missingBeats.length * n * 14_400) / 1000);
                    return (
                      <button
                        key={n}
                        onClick={() => {
                          setRollMenuOpen(false);
                          rollAllMissing(n);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                          width: "100%",
                          textAlign: "left",
                          padding: "10px 12px",
                          borderRadius: 12,
                          background: "transparent",
                          color: "var(--ink)",
                          cursor: "pointer",
                          fontFamily: "var(--font-ui)",
                          fontSize: 14,
                          fontWeight: 500
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "color-mix(in srgb, var(--ink) 8%, transparent)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <span>
                          {n} {n === 1 ? "take" : "takes"} each
                          {n === 1 ? (
                            <span style={{ marginLeft: 6, fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--viridian)" }}>
                              cheapest
                            </span>
                          ) : n === 4 ? (
                            <span style={{ marginLeft: 6, fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--mute)" }}>
                              most choice
                            </span>
                          ) : null}
                        </span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, color: "var(--mute)", whiteSpace: "nowrap" }}>
                          ≈{costK}k tok
                        </span>
                      </button>
                    );
                  })}
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          )}
          <button className="btn" disabled={beats.length === 0} onClick={startReview}>
            <Stamp size={14} /> Review dailies
          </button>
          <button
            className="btn"
            disabled={!batchStitching && completeCount === 0}
            onClick={batchStitching ? () => (batchStop.current = true) : stitchAllBest}
            title={
              batchStitching
                ? "Stop adding shots"
                : "Put each beat's best take (approved, else first finished) on the Stitch board"
            }
            style={batchStitching ? { color: "var(--tomato)", background: "color-mix(in srgb, var(--tomato) 12%, transparent)" } : undefined}
          >
            {batchStitching ? (
              <>
                <X size={14} /> Stop stitching
              </>
            ) : (
              <>
                <Film size={14} /> Stitch all best
              </>
            )}
          </button>
          <button
            className="btn btn-primary"
            disabled={selectedCount === 0}
            onClick={() => onSwitchWorkspace("stitch")}
          >
            Continue to Stitch <ArrowRight size={14} />
          </button>
        </div>
      </motion.header>

      <div className="page-body" style={{ paddingBottom: 200 }}>
        <GlobalStyleStrip style={globalStyle} onChange={setGlobalStyle} />

        <div className="storyboard-section-head">
          <span className="t-eyebrow">BEATS · 1 — {beats.length}</span>
          <span className="t-mute" style={{ fontSize: "var(--t-body-s)" }}>
            {view === "grid"
              ? "Click any frame to open it"
              : "Hover a frame for actions · click a beat row to expand prompt + camera direction"}
          </span>
        </div>

        {view === "grid" ? (
          <motion.div className="sb-grid" variants={staggerContainer} initial="hidden" animate="show">
            {beats.map((beat) => (
              <motion.div key={beat.id} variants={staggerItem}>
                <StoryboardCard
                  beat={beat}
                  row={rowByBeat[beat.id]}
                  variants={variantsByBeat[beat.id] ?? []}
                  stitchedVariantIds={stitchedVariantIds}
                  onOpen={(variant) => setLightbox({ beat, variant })}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div className="storyboard-beats" variants={staggerContainer} initial="hidden" animate="show">
            {beats.map((beat) => {
              const row = rowByBeat[beat.id];
              const v = variantsByBeat[beat.id] ?? [];
              const expanded = expandedBeat === beat.id;
              return (
                <motion.div key={beat.id} variants={staggerItem}>
                  <BeatRow
                    beat={beat}
                    row={row}
                    variants={v}
                    stitchedVariantIds={stitchedVariantIds}
                    expanded={expanded}
                    globalStyle={globalStyle}
                    cast={cast}
                    onToggleExpand={() => setExpandedBeat(expanded ? null : beat.id)}
                    onAddToStitch={(variant) => addVariantToStitch(variant)}
                    onRemoveFromStitch={(variant) => removeVariantFromStitch(variant)}
                    onLightbox={(variant) => setLightbox({ beat, variant })}
                    onPatchRow={(patch) => patchRow(beat.id, patch)}
                    onGenerate={(prompt, takes) => generate(beat.id, prompt, takes)}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      <BottomStrip
        beats={beats}
        variants={variants}
        stitchedVariantIds={stitchedVariantIds}
      />

      {toast && (
        <div
          className="storyboard-toast"
          data-kind={toast.kind}
          role="status"
          aria-live="polite"
        >
          {toast.text}
        </div>
      )}

      {lightbox && (
        <FrameLightbox
          beat={lightbox.beat}
          variant={variants.find((v) => v.id === lightbox.variant.id) ?? lightbox.variant}
          aspect={project.aspect_ratio}
          row={rowByBeat[lightbox.beat.id]}
          reviewMode={reviewMode}
          onClose={() => {
            setLightbox(null);
            setReviewMode(false);
          }}
          onPatchVariant={(p) => patchVariant(lightbox.variant.id, p)}
          onRegenerate={() => generate(lightbox.beat.id, lightbox.variant.prompt)}
          onNext={() => {
            const t = nextPendingTake(lightbox.beat.n);
            if (t) {
              setLightbox(t);
            } else {
              setLightbox(null);
              setReviewMode(false);
              flashToast("success", "Dailies signed off — every take has your call.");
            }
          }}
        />
      )}
    </div>
  );
}

/* ───────────────────────── Global Style Strip ───────────────────────── */

function GlobalStyleStrip({
  style,
  onChange
}: {
  style: GlobalStyle;
  onChange: (next: GlobalStyle) => void;
}) {
  return (
    <div className="storyboard-style-strip">
      <StyleCell label="Visual" value={style.visual} options={VISUAL_OPTIONS} onChange={(v) => onChange({ ...style, visual: v })} />
      <StyleCell label="Aspect" value={style.aspect} options={ASPECT_OPTIONS} onChange={(v) => onChange({ ...style, aspect: v as AspectRatio })} />
      <StyleCell label="Light" value={style.light} options={LIGHT_OPTIONS} onChange={(v) => onChange({ ...style, light: v })} />
      <StyleCell label="Temp" value={style.temp} options={TEMP_OPTIONS} onChange={(v) => onChange({ ...style, temp: v })} />
      <StyleCell label="Camera" value={style.camera} options={CAMERA_OPTIONS} onChange={(v) => onChange({ ...style, camera: v })} />
      <div style={{ padding: "12px 18px", display: "flex", alignItems: "center" }}>
        <span className="pip-state" data-status="working">
          APPLIED TO ALL
        </span>
      </div>
    </div>
  );
}

function StyleCell({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (next: string) => void;
}) {
  return (
    <div className="storyboard-style-cell">
      <span className="t-eyebrow">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: "transparent",
          fontFamily: "var(--font-ui)",
          fontWeight: 600,
          fontSize: "var(--t-body)",
          color: "var(--ink)",
          border: "none",
          padding: 0,
          boxShadow: "none",
          cursor: "pointer",
          letterSpacing: "-0.005em"
        }}
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

/* ───────────────────────── Beat Row ───────────────────────── */

function BeatRow({
  beat,
  row,
  variants,
  stitchedVariantIds,
  expanded,
  globalStyle,
  cast,
  onToggleExpand,
  onAddToStitch,
  onRemoveFromStitch,
  onLightbox,
  onPatchRow,
  onGenerate
}: {
  beat: Beat;
  row: StoryboardRow | undefined;
  variants: StoryboardVariant[];
  stitchedVariantIds: Set<string>;
  expanded: boolean;
  globalStyle: GlobalStyle;
  cast: CastMember[];
  onToggleExpand: () => void;
  onAddToStitch: (variant: StoryboardVariant) => Promise<void> | void;
  onRemoveFromStitch: (variant: StoryboardVariant) => Promise<void> | void;
  onLightbox: (variant: StoryboardVariant) => void;
  onPatchRow: (patch: { style?: BeatStyle }) => void;
  onGenerate: (prompt: string, takes?: number) => void;
}) {
  const state = row?.state ?? "waiting";
  const beatStyle = row?.style ?? {};
  const stitchedCount = variants.filter((v) => stitchedVariantIds.has(v.id)).length;

  return (
    <div className="storyboard-beat-row" data-state={state} data-expanded={expanded}>
      <div className="storyboard-beat-label">
        <span className="t-eyebrow">BEAT {String(beat.n).padStart(2, "0")}</span>
        <div className="storyboard-beat-title">{beat.title}</div>
        <div className="storyboard-beat-scene">{beat.scene_heading}</div>
        <div className="tag-strip" style={{ marginTop: "var(--sp-2)" }}>
          {beat.characters.map((c) => (
            <span key={c} className="tag">{c}</span>
          ))}
        </div>
        {beat.flag && (
          <span className="pip-state" data-status="error" style={{ alignSelf: "flex-start" }}>
            <Flag size={10} /> {beat.flag.toUpperCase()}
          </span>
        )}
        <div style={{ display: "flex", gap: "var(--sp-2)", marginTop: "auto", flexWrap: "wrap" }}>
          {stitchedCount > 0 && (
            <span className="pip-state" data-status="done" title="Variants from this beat that are on the Stitch board">
              <Play size={10} /> {stitchedCount} ON STITCH
            </span>
          )}
          <button
            className="sb-ghost-btn"
            onClick={onToggleExpand}
            style={{ marginLeft: stitchedCount > 0 ? 0 : "auto" }}
          >
            {expanded ? (
              <>
                <ChevronUp size={12} /> Collapse
              </>
            ) : (
              <>
                <ChevronDown size={12} /> Edit
              </>
            )}
          </button>
        </div>
        <p className="t-mute" style={{ fontSize: 11, lineHeight: 1.4 }}>
          Click <strong>Add to Stitch</strong> on any frame below to push it as <strong>Scene {beat.n}</strong>. Multiple cuts of the same beat allowed.
        </p>
      </div>

      <div className="storyboard-frames">
        {[0, 1, 2, 3].map((idx) => {
          const variant = variants[idx];
          if (!variant || state === "waiting") {
            return (
              <div key={idx} className="storyboard-frame storyboard-frame-empty">
                <span className="t-eyebrow">{state === "waiting" ? "WAITING" : "—"}</span>
              </div>
            );
          }
          if (state === "generating") {
            return (
              <div key={variant.id} className="storyboard-frame storyboard-frame-generating shimmer">
                <span className="t-eyebrow">COMPOSING…</span>
              </div>
            );
          }
          if (state === "error") {
            return (
              <div key={variant.id} className="storyboard-frame storyboard-frame-error">
                <span className="t-eyebrow">ERROR</span>
              </div>
            );
          }
          const onStitch = stitchedVariantIds.has(variant.id);
          return (
            <div
              key={variant.id}
              className="storyboard-frame"
              data-selected={onStitch}
              data-flagged={beat.flag === "continuity" && variant.n - 1 === 3}
            >
              {variant.asset_url && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={variant.asset_url} alt={`${beat.title} variant ${variant.n}`} />
              )}
              {variant.approval === "approved" && (
                <span className="frame-approval" data-a="approved" title="Approved by director">
                  <Check size={11} />
                </span>
              )}
              {variant.approval === "needs_work" && (
                <span className="frame-approval" data-a="needs" title="Sent back — needs another take">
                  <Flag size={11} />
                </span>
              )}
              <div className="storyboard-frame-actions">
                <button
                  className="storyboard-frame-btn"
                  data-primary={!onStitch}
                  title={onStitch ? "Remove from Stitch" : `Add to Stitch as Scene ${beat.n}`}
                  onClick={() => (onStitch ? onRemoveFromStitch(variant) : onAddToStitch(variant))}
                >
                  {onStitch ? <X size={14} /> : <Film size={14} />}
                </button>
                <button
                  className="storyboard-frame-btn"
                  title="Open detail"
                  onClick={() => onLightbox(variant)}
                >
                  <ZoomIn size={14} />
                </button>
                <button
                  className="storyboard-frame-btn"
                  title="Open to refine & regenerate"
                  onClick={() => onLightbox(variant)}
                >
                  <RefreshCcw size={14} />
                </button>
              </div>
              <span className="storyboard-frame-label" data-selected={onStitch}>
                V{String(variant.n).padStart(2, "0")}
                {onStitch ? ` · ON STITCH · SCENE ${beat.n}` : ""}
              </span>
            </div>
          );
        })}
      </div>

      {expanded && (
        <BeatEditor
          beat={beat}
          beatStyle={beatStyle}
          globalStyle={globalStyle}
          state={state}
          cast={cast}
          onPatchRow={onPatchRow}
          onGenerate={onGenerate}
        />
      )}
    </div>
  );
}

/* ───────────────────────── Beat Editor ───────────────────────── */

function BeatEditor({
  beat,
  beatStyle,
  globalStyle,
  state,
  cast,
  onPatchRow,
  onGenerate
}: {
  beat: Beat;
  beatStyle: BeatStyle;
  globalStyle: GlobalStyle;
  state: StoryboardRow["state"];
  cast: CastMember[];
  onPatchRow: (patch: { style?: BeatStyle }) => void;
  onGenerate: (prompt: string, takes?: number) => void;
}) {
  const [prompt, setPrompt] = useState(
    beatStyle.prompt_override || defaultPromptFor(beat, beatStyle, globalStyle)
  );
  const [framingOpen, setFramingOpen] = useState(false);
  // Camera/style selects must actually reach the generator: recompose the
  // prompt whenever a setting changes, unless the director hand-edited it.
  const handEdited = useRef(Boolean(beatStyle.prompt_override));
  useEffect(() => {
    if (handEdited.current) return;
    setPrompt(defaultPromptFor(beat, beatStyle, globalStyle));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    beatStyle.shot_size,
    beatStyle.camera_angle,
    beatStyle.lens,
    beatStyle.movement,
    beatStyle.visual,
    beatStyle.light,
    beatStyle.temp,
    beatStyle.aspect,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(beatStyle.cast_override ?? [])
  ]);

  const isGenerating = state === "generating";
  const [takes, setTakes] = useState<number>(4);
  const [aiWriting, setAiWriting] = useState(false);
  const takeCostK = Math.round((takes * 14_400) / 1000);

  async function aiWritePrompt() {
    if (aiWriting) return;
    setAiWriting(true);
    try {
      const res = await fetch(`/api/storyboard/rows/${beat.id}/prompt`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.prompt) {
        handEdited.current = true;
        setPrompt(data.prompt);
        onPatchRow({ style: { prompt_override: data.prompt } });
      }
    } finally {
      setAiWriting(false);
    }
  }

  return (
    <div className="beat-editor">
      <div className="beat-editor-section">
        <div className="beat-editor-section-head">
          <Sparkles size={14} />
          <span className="t-eyebrow">IMAGE PROMPT</span>
          <button
            className="sb-ghost-btn"
            onClick={aiWritePrompt}
            disabled={aiWriting}
            title="Have the AI cinematographer write this prompt from the script, beat and camera settings"
            style={{ marginLeft: "auto", color: aiWriting ? "var(--mute)" : "var(--accent)" }}
          >
            {aiWriting ? (
              <>
                <RefreshCcw size={11} className="fx-rotate-load" /> Writing…
              </>
            ) : (
              <>
                <Sparkles size={11} /> AI prompt from script
              </>
            )}
          </button>
          <button
            className="sb-ghost-btn"
            onClick={() => {
              handEdited.current = false;
              setPrompt(defaultPromptFor(beat, beatStyle, globalStyle));
              onPatchRow({ style: { prompt_override: "" } });
            }}
          >
            Reset to default
          </button>
        </div>
        <textarea
          className="beat-editor-prompt"
          value={prompt}
          onChange={(e) => {
            handEdited.current = true;
            setPrompt(e.target.value);
          }}
          onBlur={() => onPatchRow({ style: { prompt_override: prompt } })}
          rows={4}
          placeholder="Cinematographer prompt — what should the model compose?"
        />
        <span className="t-mute" style={{ fontSize: 11 }}>
          {prompt.length} chars · auto-saves on blur
        </span>
      </div>

      {cast.length > 0 && (
        <div className="beat-editor-section">
          <div className="beat-editor-section-head">
            <Sparkles size={14} />
            <span className="t-eyebrow">CAST IN FRAME</span>
            <span className="t-mute" style={{ marginLeft: "auto", fontSize: 11 }}>
              Selected cast are reference-locked to their portraits
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {cast.map((m) => {
              const inBeat = beat.characters.some((n) => n.trim().toLowerCase() === m.name.trim().toLowerCase());
              const selected =
                inBeat || (beatStyle.cast_override ?? []).some((n) => n.toLowerCase() === m.name.toLowerCase());
              return (
                <button
                  key={m.name}
                  onClick={() => {
                    if (inBeat) return; // from the script itself — always locked in
                    const cur = beatStyle.cast_override ?? [];
                    const next = selected
                      ? cur.filter((n) => n.toLowerCase() !== m.name.toLowerCase())
                      : [...cur, m.name];
                    onPatchRow({ style: { cast_override: next } });
                  }}
                  title={
                    inBeat
                      ? `${m.name} is in this beat's script — always included`
                      : m.hasLook
                        ? `Toggle ${m.name} into this frame (portrait reference-locked)`
                        : `Toggle ${m.name} — cast a portrait in Casting first for a tighter lock`
                  }
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 13px",
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: inBeat ? "default" : "pointer",
                    background: selected ? "var(--accent)" : "var(--surface-2)",
                    color: selected ? "var(--on-accent)" : "var(--ink-soft)",
                    opacity: inBeat ? 0.85 : 1
                  }}
                >
                  {selected && <Check size={11} />}
                  {m.name}
                  {!m.hasLook && (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, opacity: 0.7 }}>no look</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="beat-editor-section">
        <div className="beat-editor-section-head">
          <Eye size={14} />
          <span className="t-eyebrow">CAMERA DIRECTION</span>
          <button
            className="sb-ghost-btn"
            style={{ marginLeft: "auto" }}
            onClick={() => setFramingOpen(true)}
          >
            <LayoutGrid size={11} /> 3×3 framing
          </button>
        </div>
        <div className="beat-editor-grid">
          <EditorSelect
            label="Shot size"
            value={beatStyle.shot_size ?? "Wide"}
            options={SHOT_SIZE_OPTIONS}
            onChange={(v) => onPatchRow({ style: { shot_size: v } })}
          />
          <EditorSelect
            label="Angle"
            value={beatStyle.camera_angle ?? "Eye level"}
            options={ANGLE_OPTIONS}
            onChange={(v) => onPatchRow({ style: { camera_angle: v } })}
          />
          <EditorSelect
            label="Lens"
            value={beatStyle.lens ?? "35mm"}
            options={LENS_OPTIONS}
            onChange={(v) => onPatchRow({ style: { lens: v } })}
          />
          <EditorSelect
            label="Movement"
            value={beatStyle.movement ?? "Locked"}
            options={MOVEMENT_OPTIONS}
            onChange={(v) => onPatchRow({ style: { movement: v } })}
          />
        </div>
      </div>

      <div className="beat-editor-section">
        <div className="beat-editor-section-head">
          <Layers size={14} />
          <span className="t-eyebrow">STYLE OVERRIDE · THIS BEAT ONLY</span>
          <span className="t-mute" style={{ marginLeft: "auto", fontSize: 11 }}>
            Leave blank to inherit project style
          </span>
        </div>
        <div className="beat-editor-grid">
          <EditorSelect
            label="Visual"
            value={beatStyle.visual ?? globalStyle.visual}
            options={VISUAL_OPTIONS}
            onChange={(v) => onPatchRow({ style: { visual: v } })}
          />
          <EditorSelect
            label="Light"
            value={beatStyle.light ?? globalStyle.light}
            options={LIGHT_OPTIONS}
            onChange={(v) => onPatchRow({ style: { light: v } })}
          />
          <EditorSelect
            label="Temp"
            value={beatStyle.temp ?? globalStyle.temp}
            options={TEMP_OPTIONS}
            onChange={(v) => onPatchRow({ style: { temp: v } })}
          />
          <EditorSelect
            label="Aspect"
            value={beatStyle.aspect ?? globalStyle.aspect}
            options={ASPECT_OPTIONS}
            onChange={(v) => onPatchRow({ style: { aspect: v as AspectRatio } })}
          />
        </div>
      </div>

      <div className="beat-editor-actions">
        <span className="t-mute" style={{ fontSize: "var(--t-body-s)" }}>
          {isGenerating
            ? `Cinematographer is rolling ${takes} ${takes === 1 ? "take" : "takes"} — frames land here as they finish…`
            : "Frames roll on Seedream via your BytePlus pack (or Higgsfield when connected)."}
        </span>
        {!isGenerating && (
          <div
            role="radiogroup"
            aria-label="Number of takes"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 2,
              padding: 3,
              background: "var(--surface-2)",
              borderRadius: 999
            }}
          >
            {[1, 2, 4].map((n) => (
              <button
                key={n}
                role="radio"
                aria-checked={takes === n}
                onClick={() => setTakes(n)}
                title={`${n} ${n === 1 ? "take" : "takes"} · ≈${Math.round((n * 14_400) / 1000)}k tokens`}
                style={{
                  padding: "5px 12px",
                  borderRadius: 999,
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  cursor: "pointer",
                  color: takes === n ? "var(--ink)" : "var(--mute)",
                  background: takes === n ? "var(--surface)" : "transparent",
                  boxShadow: takes === n ? "var(--shadow-1)" : "none"
                }}
              >
                {n} {n === 1 ? "take" : "takes"}
              </button>
            ))}
          </div>
        )}
        <button
          className="btn btn-sm btn-primary"
          disabled={isGenerating}
          onClick={() => onGenerate(prompt, takes)}
          title={`${takes} Seedream ${takes === 1 ? "frame" : "frames"} · ≈${takeCostK}k tokens`}
        >
          {isGenerating ? (
            <>
              <RefreshCcw size={12} className="fx-rotate-load" /> Rolling {takes}…
            </>
          ) : (
            <>
              <Wand2 size={12} /> Generate {takes} {takes === 1 ? "take" : "takes"} · ≈{takeCostK}k tok
            </>
          )}
        </button>
      </div>

      {framingOpen && (
        <FramingPicker
          current={{ shot: beatStyle.shot_size, angle: beatStyle.camera_angle }}
          onPick={(shot, angle) => {
            onPatchRow({ style: { shot_size: shot, camera_angle: angle } });
            setFramingOpen(false);
          }}
          onClose={() => setFramingOpen(false)}
        />
      )}
    </div>
  );
}

function EditorSelect({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (next: string) => void;
}) {
  return (
    <label className="beat-editor-field">
      <span className="t-eyebrow">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function defaultPromptFor(beat: Beat, beatStyle: BeatStyle, globalStyle: GlobalStyle): string {
  const visual = beatStyle.visual ?? globalStyle.visual;
  const light = beatStyle.light ?? globalStyle.light;
  const temp = beatStyle.temp ?? globalStyle.temp;
  const aspect = beatStyle.aspect ?? globalStyle.aspect;
  const shot = beatStyle.shot_size ?? "Wide";
  const angle = beatStyle.camera_angle ?? "Eye level";
  const lens = beatStyle.lens ?? "35mm";
  const movement = beatStyle.movement ?? "Locked";
  // Script cast ∪ hand-picked cast — everyone named here gets reference-locked.
  const names = [...beat.characters];
  for (const n of beatStyle.cast_override ?? []) {
    if (!names.some((x) => x.trim().toLowerCase() === n.trim().toLowerCase())) names.push(n);
  }
  return `${shot} shot, ${angle.toLowerCase()} angle, ${lens}, ${movement.toLowerCase()} camera. ${beat.scene_heading}. ${beat.title}. ${names.length ? `Featuring ${names.join(", ")}. ` : ""}${beat.mood.length ? `Mood: ${beat.mood.join(", ")}. ` : ""}${visual} aesthetic, ${light.toLowerCase()} lighting, ${temp.toLowerCase()} palette. Aspect ${aspect}.`;
}

/* ───────────────────────── Bottom Strip ───────────────────────── */

function BottomStrip({
  beats,
  variants,
  stitchedVariantIds
}: {
  beats: Beat[];
  variants: StoryboardVariant[];
  stitchedVariantIds: Set<string>;
}) {
  const beatsByN = useMemo(() => Object.fromEntries(beats.map((b) => [b.id, b])), [beats]);
  // The sequence on Stitch — every stitched variant in beat-number order.
  const stitched = useMemo(() => {
    const list = variants.filter((v) => stitchedVariantIds.has(v.id));
    return list
      .map((v) => ({ variant: v, beat: beatsByN[v.beat_id] }))
      .filter((row) => row.beat)
      .sort((a, b) => (a.beat!.n - b.beat!.n) || (a.variant.n - b.variant.n));
  }, [variants, stitchedVariantIds, beatsByN]);

  return (
    <div className="storyboard-bottom-strip">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="t-eyebrow">SEQUENCE · {stitched.length} ON STITCH</span>
        <span className="t-mute" style={{ fontSize: 11 }}>
          Frames pushed to Stitch, in scene order. This is what Stitch sees.
        </span>
      </div>
      <div className="storyboard-strip-row">
        {stitched.length === 0 && (
          <div className="storyboard-strip-slot" data-empty="true">
            <span className="t-eyebrow">EMPTY</span>
          </div>
        )}
        {stitched.map(({ variant, beat }) => (
          <div key={variant.id} className="storyboard-strip-slot">
            {variant.asset_url && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={variant.asset_url} alt={beat!.title} />
            )}
            <span
              className="storyboard-frame-label"
              style={{ bottom: 4, left: 4, fontSize: 9, padding: "2px 6px", background: "rgba(8,8,10,0.74)", color: "#F5EDDC" }}
            >
              S{String(beat!.n).padStart(2, "0")}·V{String(variant.n).padStart(2, "0")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── Variant Lightbox ───────────────────────── */

function FrameLightbox({
  beat,
  variant,
  aspect,
  row,
  reviewMode,
  onClose,
  onPatchVariant,
  onRegenerate,
  onNext
}: {
  beat: Beat;
  variant: StoryboardVariant;
  aspect: string;
  row: StoryboardRow | undefined;
  reviewMode: boolean;
  onClose: () => void;
  onPatchVariant: (p: { prompt?: string; approval?: string; note?: string }) => void;
  onRegenerate: () => void;
  onNext: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [prompt, setPrompt] = useState(variant.prompt || row?.style.prompt_override || "");
  const [reviewNote, setReviewNote] = useState(variant.note || "");

  useEffect(() => {
    setReviewNote(variant.note || "");
  }, [variant.id, variant.note]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 1100,
          width: "calc(100% - var(--sp-7))",
          maxHeight: "calc(100vh - var(--sp-7))",
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          padding: 0,
          overflow: "hidden"
        }}
      >
        <div style={{ background: "#14100c", display: "grid", placeItems: "center", padding: "var(--sp-5)" }}>
          {variant.asset_url && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={variant.asset_url}
              alt={beat.title}
              style={{ maxWidth: "100%", maxHeight: "70vh", display: "block" }}
            />
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            background: "var(--surface)",
            borderLeft: "1px solid var(--cream-deep)",
            overflow: "auto"
          }}
        >
          <header
            style={{
              padding: "var(--sp-4) var(--sp-5)",
              borderBottom: "1px solid var(--cream-deep)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "var(--sp-3)"
            }}
          >
            <div>
              <span className="t-eyebrow">
                BEAT {String(beat.n).padStart(2, "0")} · V{String(variant.n).padStart(2, "0")} · {aspect}
              </span>
              <h2 className="t-h3" style={{ marginTop: "var(--sp-2)" }}>{beat.title}</h2>
              <p className="t-mute" style={{ marginTop: "var(--sp-1)", fontSize: 12 }}>
                {beat.scene_heading}
              </p>
            </div>
            <button className="btn btn-sm btn-ghost" onClick={onClose} aria-label="Close">
              <X size={14} />
            </button>
          </header>

          <div style={{ padding: "var(--sp-5)", display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
            <section className="lb-review" data-approval={variant.approval}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="t-eyebrow">DIRECTOR&apos;S REVIEW</span>
                <span className="lb-review-status" data-a={variant.approval}>
                  {variant.approval === "approved" ? (
                    <>
                      <Check size={12} /> Approved
                    </>
                  ) : variant.approval === "needs_work" ? (
                    <>
                      <Flag size={12} /> Needs another take
                    </>
                  ) : (
                    "Awaiting your call"
                  )}
                </span>
              </div>
              <textarea
                className="lb-review-note"
                placeholder="Director's note — what works, what to change…"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows={3}
              />
              <div className="lb-review-actions">
                <button
                  className="btn btn-sm"
                  data-review="approve"
                  onClick={() => onPatchVariant({ approval: "approved", note: reviewNote })}
                >
                  <Check size={12} /> Approve take
                </button>
                <button
                  className="btn btn-sm"
                  data-review="reject"
                  onClick={() => onPatchVariant({ approval: "needs_work", note: reviewNote })}
                >
                  <Flag size={12} /> Send back
                </button>
                {reviewMode && (
                  <button className="btn btn-sm btn-primary" style={{ marginLeft: "auto" }} onClick={onNext}>
                    Next pending <ArrowRight size={12} />
                  </button>
                )}
              </div>
            </section>

            <section>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="t-eyebrow">PROMPT USED</span>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => setEditing((v) => !v)}
                >
                  {editing ? "Cancel" : "Edit"}
                </button>
              </div>
              {editing ? (
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={6}
                  style={{ marginTop: "var(--sp-2)", width: "100%" }}
                />
              ) : (
                <div
                  style={{
                    marginTop: "var(--sp-2)",
                    padding: "var(--sp-3)",
                    background: "var(--bg)",
                    borderRadius: "var(--radius)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    lineHeight: 1.55,
                    whiteSpace: "pre-wrap",
                    color: "var(--ink-soft)"
                  }}
                >
                  {variant.prompt || row?.style.prompt_override || <span style={{ color: "var(--mute)" }}>No prompt recorded. Generated from default direction.</span>}
                </div>
              )}
            </section>

            <section>
              <span className="t-eyebrow">CAMERA · INHERITED FROM BEAT</span>
              <div
                style={{
                  marginTop: "var(--sp-2)",
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "var(--sp-2)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12
                }}
              >
                <LightboxKV k="Shot" v={row?.style.shot_size ?? "—"} />
                <LightboxKV k="Angle" v={row?.style.camera_angle ?? "—"} />
                <LightboxKV k="Lens" v={row?.style.lens ?? "—"} />
                <LightboxKV k="Movement" v={row?.style.movement ?? "—"} />
              </div>
            </section>

            <section>
              <span className="t-eyebrow">VARIANT META</span>
              <div
                style={{
                  marginTop: "var(--sp-2)",
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "var(--sp-2)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12
                }}
              >
                <LightboxKV k="State" v={variant.state} />
                <LightboxKV k="Asset" v={variant.asset_url ? "Stored" : "—"} />
                <LightboxKV k="Beat chars" v={beat.characters.join(" · ") || "—"} />
                <LightboxKV k="Beat mood" v={beat.mood.join(" · ") || "—"} />
              </div>
            </section>
          </div>

          <footer
            style={{
              marginTop: "auto",
              padding: "var(--sp-3) var(--sp-5)",
              borderTop: "1px solid var(--cream-deep)",
              background: "var(--bg)",
              display: "flex",
              gap: "var(--sp-2)",
              justifyContent: "flex-end"
            }}
          >
            {editing && (
              <button
                className="btn btn-sm"
                onClick={() => {
                  onPatchVariant({ prompt });
                  setEditing(false);
                }}
              >
                Save prompt
              </button>
            )}
            <button className="btn btn-sm btn-secondary" onClick={onRegenerate}>
              <RefreshCcw size={12} /> Regenerate row
            </button>
            <button className="btn btn-sm btn-primary" onClick={onClose}>
              Done
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}

function LightboxKV({ k, v }: { k: string; v: string }) {
  return (
    <div className="card" style={{ padding: "var(--sp-2) var(--sp-3)" }}>
      <span
        className="t-eyebrow"
        style={{ fontSize: 9, color: "var(--mute)", display: "block", marginBottom: 2 }}
      >
        {k}
      </span>
      <span style={{ color: "var(--ink)" }}>{v}</span>
    </div>
  );
}

/* ───────────────────────── Storyboard Card (grid / contact sheet) ───────────────────────── */

function StoryboardCard({
  beat,
  row,
  variants,
  stitchedVariantIds,
  onOpen
}: {
  beat: Beat;
  row: StoryboardRow | undefined;
  variants: StoryboardVariant[];
  stitchedVariantIds: Set<string>;
  onOpen: (variant: StoryboardVariant) => void;
}) {
  const state = row?.state ?? "waiting";
  const stitched = variants.filter((v) => stitchedVariantIds.has(v.id));
  const chosen =
    stitched[0] ||
    variants.find((v) => v.id === row?.selected_variant_id) ||
    variants.find((v) => v.asset_url) ||
    variants[0];
  const s = row?.style ?? {};
  const tags = [s.shot_size, s.camera_angle, s.lens].filter(Boolean) as string[];

  return (
    <article className="sb-card">
      <button
        className="sb-card-frame"
        data-empty={!chosen?.asset_url}
        disabled={!chosen?.asset_url}
        onClick={() => chosen && onOpen(chosen)}
        title={chosen?.asset_url ? "Open frame" : undefined}
      >
        {chosen?.asset_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={chosen.asset_url} alt={beat.title} />
        ) : (
          <span className="t-eyebrow">
            {state === "generating" ? "COMPOSING…" : state === "waiting" ? "NO FRAME YET" : "—"}
          </span>
        )}
        <span className="sb-card-no">BEAT {String(beat.n).padStart(2, "0")}</span>
        {stitched.length > 0 && (
          <span className="sb-card-stitch" title="On the Stitch board">
            <Play size={10} /> {stitched.length}
          </span>
        )}
        {beat.flag && (
          <span className="sb-card-flag" title={beat.flag}>
            <Flag size={10} />
          </span>
        )}
        {chosen?.approval === "approved" && (
          <span className="sb-card-approval" data-a="approved" title="Approved by director">
            <Check size={10} />
          </span>
        )}
        {chosen?.approval === "needs_work" && (
          <span className="sb-card-approval" data-a="needs" title="Needs another take">
            <Flag size={10} />
          </span>
        )}
      </button>
      <div className="sb-card-body">
        <div className="sb-card-title">{beat.title}</div>
        <div className="sb-card-scene">{beat.scene_heading}</div>
        {tags.length > 0 && (
          <div className="sb-card-tags">
            {tags.map((t) => (
              <span key={t} className="tag">{t}</span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

/* ───────────────────────── 3×3 Framing Picker (九宫格) ───────────────────────── */

function FramingPicker({
  current,
  onPick,
  onClose
}: {
  current: { shot?: string; angle?: string };
  onPick: (shot: string, angle: string) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal sb-framing" onClick={(e) => e.stopPropagation()}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <span className="t-eyebrow">CINEMATOGRAPHER</span>
            <h2 className="t-h3" style={{ marginTop: "var(--sp-2)" }}>Pick a framing</h2>
            <p className="t-mute" style={{ fontSize: 12, marginTop: 4, maxWidth: "44ch" }}>
              Nine camera setups. Choose one to set this beat&apos;s shot size and angle.
            </p>
          </div>
          <button className="btn btn-sm btn-ghost" onClick={onClose} aria-label="Close">
            <X size={14} />
          </button>
        </header>
        <div className="sb-framing-grid">
          {FRAMINGS.map((f) => {
            const active = current.shot === f.shot && current.angle === f.angle;
            return (
              <button
                key={f.label}
                className="sb-framing-cell"
                data-active={active}
                onClick={() => onPick(f.shot, f.angle)}
              >
                <FramingGlyph shot={f.shot} angle={f.angle} />
                <span className="sb-framing-label">{f.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FramingGlyph({ shot, angle }: { shot: string; angle: string }) {
  const r = shot === "Close" ? 24 : shot === "Medium" ? 15 : 8;
  const cy = angle === "High" ? 40 : angle === "Low" ? 30 : 35;
  const rot = angle === "Dutch" ? -8 : 0;
  return (
    <svg viewBox="0 0 96 60" className="sb-framing-glyph" aria-hidden="true">
      <g transform={`rotate(${rot} 48 30)`}>
        <rect x="6" y="6" width="84" height="48" rx="4" fill="var(--bg)" stroke="var(--ink)" strokeWidth="1.5" />
        <circle cx="48" cy={cy - r * 0.5} r={r * 0.5} fill="var(--accent)" />
        <rect x={48 - r} y={cy} width={r * 2} height={r * 1.1} rx={r * 0.4} fill="var(--accent)" />
      </g>
    </svg>
  );
}
