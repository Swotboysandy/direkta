"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Film, Trash2 } from "../icons";
import { registerInspector, type InspectorBodyProps } from "../Inspector";
import { useSelection } from "../../_state/selection";
import { Button, buttonVariants } from "../ui/button";
import { Status, type GenerationStatus } from "../ui/status";
import { EmptyState } from "../ui/empty-state";
import { InlineError } from "../ui/inline-error";
import { useConfirm } from "../ui/alert-dialog";
import { H3Controls, type H3ShotOptions } from "../H3Controls";
import { H3LiveMonitor } from "../H3LiveMonitor";
import { ClipFrameTools } from "../ClipFrameTools";
import { VIDEO_MODELS, DEFAULT_VIDEO_MODEL, videoModel, CAMERA_MOTIONS, cameraMotion } from "../../../lib/higgsfield/catalog";
import { LIPSYNC_MODELS, DEFAULT_LIPSYNC_MODEL } from "../../../lib/lipsync/catalog";
import type { Character, Location } from "../../../lib/types";

/**
 * The Shot Desk (brief §29–31): the inspector body for a selected shot.
 *
 * The desk owns no data and makes no request of its own for the shot: the
 * Shots stage keeps the node list, the balance and every API call exactly as
 * before, and publishes them here through `publishShotDesk`. The desk reads
 * that snapshot for the selected id, so the timeline, the graph and this
 * panel always describe the same shot. When the stage unmounts it publishes
 * `null` and the desk closes itself.
 */

export interface ShotBalance {
  connected: boolean;
  credits: number | null;
  plan: string | null;
}

export interface ShotClipMeta {
  provider?: string;
  continuityMode?: string;
  settings?: { width?: number; height?: number; frames?: number; steps?: number; fps?: number; seed?: number; turbo?: boolean };
  actual?: { durationSeconds?: number; frames?: number };
  [key: string]: unknown;
}

export interface ShotNode {
  id: string;
  beat_id: string | null;
  variant_id: string | null;
  variant_n: number | null;
  x: number;
  y: number;
  duration: number;
  trim_start: number;
  beat: {
    n: number;
    title: string;
    scene_heading: string;
    characters: string[];
    location_id: string | null;
  } | null;
  frame_url: string | null;
  clip_url: string | null;
  clip_state: string;
  dialogue_audio_url: string | null;
  lipsync_state: string;
  lipsync_url: string | null;
  /** Additive fields on GET stitch: the rendered clip's recipe and the shot's direction. */
  clip_meta?: ShotClipMeta | null;
  direction?: string | null;
}

export type AnimateResult = { ok?: boolean; simulated?: boolean; error?: string; note?: string; vendor?: string; warnings?: string[] } | null;

export interface ShotDesk {
  projectId: string;
  aspectRatio: string;
  nodes: ShotNode[];
  balance: ShotBalance | null;
  setSceneNumber: (node: ShotNode, scene: number) => void;
  setDuration: (node: ShotNode, duration: number) => void;
  setTrimStart: (node: ShotNode, trimStart: number) => void;
  animate: (node: ShotNode, modelId: string, motion: string, audio: boolean, h3?: H3ShotOptions) => Promise<AnimateResult>;
  uploadClip: (node: ShotNode, file: File) => Promise<{ error?: string } | null>;
  uploadDialogue: (node: ShotNode, file: File) => Promise<{ error?: string } | null>;
  lipsync: (node: ShotNode, modelId?: string) => Promise<{ ok?: boolean; error?: string; vendor?: string } | null>;
  remove: (id: string) => void;
  openStoryboard: () => void;
}

let desk: ShotDesk | null = null;
const listeners = new Set<() => void>();

/** The Shots stage calls this after every render with data, and with `null` on unmount. */
export function publishShotDesk(next: ShotDesk | null) {
  desk = next;
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
const getDesk = () => desk;
const getNoDesk = () => null;

/** "Shot 07" — the shot's label everywhere: the strip, the Dock chip, the inspector head. */
export function shotLabel(node: Pick<ShotNode, "beat">, fallbackIndex: number): string {
  return `Shot ${String(node.beat?.n ?? fallbackIndex + 1).padStart(2, "0")}`;
}

/** Render order, the same rule as the timeline: `x` (what scene_number
 *  writes and the render reads), then beat number, then `y`. */
export function orderShots<T extends Pick<ShotNode, "beat" | "x" | "y">>(nodes: T[]): T[] {
  return [...nodes].sort((a, b) => a.x - b.x || (a.beat?.n ?? 999) - (b.beat?.n ?? 999) || a.y - b.y);
}

/** Generation status for a shot, or null when nothing has been asked of it
 *  yet — a shot with a clip is never "pending". */
export function shotStatus(node: Pick<ShotNode, "clip_url" | "clip_state">): GenerationStatus | null {
  if (node.clip_state === "generating") return "Rendering";
  if (node.clip_state === "error") return "Failed";
  if (node.clip_url) return "Complete";
  return null;
}

/* References: Soul / World IDs come from the project bundle, cached per
   project so selecting the next shot does not refetch it. */
interface RefBook {
  characters: Pick<Character, "name" | "soul_id_state">[];
  locations: Pick<Location, "id" | "name" | "soul_id_state">[];
}
const refBooks = new Map<string, Promise<RefBook>>();
function loadRefBook(projectId: string): Promise<RefBook> {
  let p = refBooks.get(projectId);
  if (!p) {
    p = fetch(`/api/projects/${projectId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((b) => ({ characters: b.characters ?? [], locations: b.locations ?? [] }))
      .catch(() => {
        refBooks.delete(projectId);
        return { characters: [], locations: [] };
      });
    refBooks.set(projectId, p);
  }
  return p;
}

const SOUL_WORDS: Record<string, string> = { trained: "Soul ID", training: "training", failed: "failed", empty: "no Soul ID" };
const WORLD_WORDS: Record<string, string> = { trained: "World ID", training: "training", failed: "failed", empty: "no World ID" };

function cssAspect(ratio: string): string {
  const [w, h] = ratio.split(":").map(Number);
  return w > 0 && h > 0 ? `${w} / ${h}` : "16 / 9";
}

export function ShotInspector({ selected, close }: InspectorBodyProps) {
  const d = useSyncExternalStore(subscribe, getDesk, getNoDesk);
  const node = d?.nodes.find((n) => n.id === selected.id) ?? null;

  // The stage is gone (workspace switched) or the shot was removed: nothing
  // to inspect, so hand the width back rather than showing a stale panel.
  useEffect(() => {
    if (!node) close();
  }, [node, close]);

  if (!d || !node) return null;
  return <ShotDeskBody desk={d} node={node} close={close} />;
}

function ShotDeskBody({ desk: d, node, close }: { desk: ShotDesk; node: ShotNode; close: () => void }) {
  const { select } = useSelection();
  const confirmDialog = useConfirm();

  const [scene, setScene] = useState<number>(node.beat?.n ?? 1);
  const [duration, setDurationLocal] = useState<number>(node.duration);
  const [trimStart, setTrimStartLocal] = useState<number>(node.trim_start);
  const [animating, setAnimating] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [modelId, setModelId] = useState<string>(DEFAULT_VIDEO_MODEL);
  const [motionId, setMotionId] = useState<string>("auto");
  const [audioOn, setAudioOn] = useState<boolean>(false);
  const [h3Options, setH3Options] = useState<H3ShotOptions>({ continuityMode: "cut", endFrame: false });
  const [h3Ready, setH3Ready] = useState(false);
  const [lipsyncModelId, setLipsyncModelId] = useState<string>(DEFAULT_LIPSYNC_MODEL);
  const [uploadingClip, setUploadingClip] = useState(false);
  const [uploadClipError, setUploadClipError] = useState<string | null>(null);
  const [uploadingDialogue, setUploadingDialogue] = useState(false);
  const [lipsyncing, setLipsyncing] = useState(false);
  const [lipsyncNote, setLipsyncNote] = useState<string | null>(null);
  const [lipsyncError, setLipsyncError] = useState<string | null>(null);
  const [take, setTake] = useState<"clip" | "lipsync">("lipsync");
  const [refs, setRefs] = useState<RefBook | null>(null);

  const model = videoModel(modelId);
  const isH3 = model.provider === "minimax_h3";
  const isHiggs = model.provider !== "byteplus" && !isH3;
  const credits = d.balance?.credits ?? null;
  const tooPoor = isHiggs && credits != null && credits < model.approxCost;

  useEffect(() => {
    setScene(node.beat?.n ?? 1);
    setDurationLocal(node.duration);
    setTrimStartLocal(node.trim_start);
    setNote(null);
    setGenError(null);
  }, [node.id, node.beat?.n, node.duration, node.trim_start]);
  useEffect(() => {
    setH3Options({ continuityMode: "cut", endFrame: false });
    setTake("lipsync");
    setUploadClipError(null);
    setLipsyncNote(null);
    setLipsyncError(null);
  }, [node.id]);
  useEffect(() => {
    let live = true;
    loadRefBook(d.projectId).then((b) => live && setRefs(b));
    return () => {
      live = false;
    };
  }, [d.projectId]);

  const ordered = useMemo(() => orderShots(d.nodes), [d.nodes]);
  const index = ordered.findIndex((n) => n.id === node.id);
  const prev = index > 0 ? ordered[index - 1] : null;
  const next = index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : null;

  const takes = [
    node.clip_url ? { id: "clip" as const, label: "Clip", url: node.clip_url } : null,
    node.lipsync_url ? { id: "lipsync" as const, label: "Lip-synced", url: node.lipsync_url } : null
  ].filter((t): t is { id: "clip" | "lipsync"; label: string; url: string } => t != null);
  const activeTake = takes.find((t) => t.id === take) ?? takes[takes.length - 1] ?? null;
  const rendering = animating || node.clip_state === "generating";
  const status = rendering ? "Rendering" : shotStatus(node);

  const location = node.beat?.location_id ? refs?.locations.find((l) => l.id === node.beat!.location_id) ?? null : null;
  const cast = (node.beat?.characters ?? []).map((name) => ({
    name,
    state: refs?.characters.find((c) => c.name === name)?.soul_id_state ?? null
  }));

  const generateBlock = animating
    ? null
    : !isH3 && !node.frame_url
      ? "This shot has no storyboard frame to animate from."
      : isH3 && !h3Ready
        ? "Waiting for the RunPod balance check above to clear."
        : null;
  const canContinue = isH3 && !!prev?.clip_url;
  const continueWhy = !isH3
    ? "Only the MiniMax H3 model can continue from a rendered frame."
    : !prev
      ? "This is the first shot; there is nothing before it."
      : !prev.clip_url
        ? `${shotLabel(prev, index - 1)} has no rendered clip yet.`
        : null;

  const clipForTools = node.lipsync_url || node.clip_url;
  const canLipsync = !!node.dialogue_audio_url && !!(node.clip_url || node.frame_url);

  async function generate() {
    setNote(null);
    setGenError(null);
    setAnimating(true);
    try {
      const res = await d.animate(node, modelId, motionId, audioOn, isH3 ? h3Options : undefined);
      if (res?.simulated) setNote(res.note ?? "Simulated — connect Higgsfield or add a video key to render real motion.");
      else if (res?.error) setGenError(res.error);
      else if (res?.ok) setNote([`Clip rendered by ${res.vendor ?? "the video model"}.`, ...(res.warnings ?? [])].join(" "));
      else if (!res) setGenError("The render request did not come back. Check the connection and try again.");
    } finally {
      setAnimating(false);
    }
  }

  const selectShot = (target: ShotNode, i: number) =>
    select({ kind: "shot", id: target.id, label: shotLabel(target, i), projectId: d.projectId });

  return (
    <div className="shot-desk">
      {/* Preview */}
      <div className="shot-preview" style={{ aspectRatio: cssAspect(d.aspectRatio) }}>
        {activeTake ? (
          /* eslint-disable-next-line jsx-a11y/media-has-caption */
          <video key={activeTake.url} src={activeTake.url} poster={node.frame_url ?? undefined} controls loop muted playsInline />
        ) : node.frame_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={node.frame_url} alt={node.beat?.title ?? "Storyboard frame"} />
        ) : (
          <EmptyState
            className="px-4 py-4"
            title="No frame for this shot"
            why="It came to the board without a storyboard frame, so there is nothing to preview or animate yet."
            action={{ label: "Open Storyboard", onClick: d.openStoryboard }}
          />
        )}
        {status && <Status domain="generation" value={status} className="shot-preview-status" />}
        {rendering && !activeTake && node.frame_url && (
          <div className="shot-preview-veil">
            <Status domain="generation" value="Rendering" />
          </div>
        )}
      </div>

      <div className="shot-desk-section">
        <span className="shot-desk-eyebrow">
          Scene {String(scene).padStart(2, "0")}
          {node.variant_n ? ` · V${String(node.variant_n).padStart(2, "0")}` : ""}
          {node.beat?.scene_heading ? ` · ${node.beat.scene_heading}` : ""}
        </span>
        <h3 className="shot-desk-title">{node.beat?.title ?? "Untitled shot"}</h3>
      </div>

      {/* Takes */}
      <div className="shot-desk-section">
        <span className="shot-desk-label">
          <span>Takes</span>
          <span className="shot-desk-value">{takes.length ? `${takes.length} version${takes.length === 1 ? "" : "s"}` : "none yet"}</span>
        </span>
        {takes.length ? (
          <div className="shot-takes" role="group" aria-label="Takes">
            {takes.map((t) => (
              <button key={t.id} type="button" className="shot-take" aria-pressed={activeTake?.id === t.id} onClick={() => setTake(t.id)}>
                <span className="shot-take-thumb">
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <video src={t.url} poster={node.frame_url ?? undefined} muted playsInline preload="metadata" />
                </span>
                <span className="shot-take-label">{t.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="shot-hint">Generate renders the first take; a lip-synced or uploaded clip becomes another.</p>
        )}
      </div>

      {/* References */}
      <div className="shot-desk-section">
        <span className="shot-desk-label"><span>References</span></span>
        {cast.length || location ? (
          <div className="shot-refs">
            {cast.map((c) => (
              <span key={c.name} className="shot-chip" data-state={c.state ?? "unknown"} title={c.state ? `Soul ID: ${c.state}` : undefined}>
                <span>{c.name}</span>
                {c.state && <span className="shot-chip-detail">{SOUL_WORDS[c.state] ?? c.state}</span>}
              </span>
            ))}
            {location && (
              <span className="shot-chip" data-state={location.soul_id_state} title={`World ID: ${location.soul_id_state}`}>
                <span>{location.name}</span>
                <span className="shot-chip-detail">{WORLD_WORDS[location.soul_id_state] ?? location.soul_id_state}</span>
              </span>
            )}
          </div>
        ) : (
          <p className="shot-hint">No cast or location on this beat. Character and location references are set in World and Storyboard.</p>
        )}
      </div>

      {/* Direction */}
      <div className="shot-desk-section">
        <span className="shot-desk-label"><span>Direction</span></span>
        {node.direction ? (
          <p className="shot-direction">{node.direction}</p>
        ) : (
          <p className="shot-hint">No direction written for this shot. It is edited on the beat in Storyboard; the camera move below is added to it.</p>
        )}
      </div>

      {/* Camera, audio, model */}
      <div className="shot-desk-section">
        <span className="shot-desk-label"><span>Camera</span></span>
        <label className="shot-field">
          <span>Camera motion</span>
          <select className="shot-select" value={motionId} onChange={(e) => setMotionId(e.target.value)} title="How the video model moves the camera for this shot">
            {CAMERA_MOTIONS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </label>
        <label
          className="shot-check"
          data-disabled={isH3}
          title={isH3 ? "H3 generates audio jointly with picture; this is not a mute switch." : "Let the model generate a native audio track for this clip (off = silent, scored later in Finish)"}
        >
          <span>{isH3 ? "Joint H3 audio (always generated)" : "Native audio"}</span>
          <input type="checkbox" checked={isH3 || audioOn} disabled={isH3} onChange={(e) => setAudioOn(e.target.checked)} />
        </label>
        <label className="shot-field">
          <span>Video model</span>
          <select className="shot-select" value={modelId} onChange={(e) => setModelId(e.target.value)}>
            {VIDEO_MODELS.map((m) => (
              <option key={m.id} value={m.id}>{m.label} · {m.costText}</option>
            ))}
          </select>
        </label>
        <p className="shot-hint">{model.description}</p>
      </div>

      {/* Recipe */}
      <details className="shot-recipe">
        <summary>Recipe</summary>
        <dl>
          <dt>model</dt>
          <dd>{node.clip_meta?.provider ?? model.label}</dd>
          <dt>duration</dt>
          <dd>{(node.clip_meta?.actual?.durationSeconds ?? node.duration).toFixed(2)}s</dd>
          <dt>camera</dt>
          <dd>{cameraMotion(motionId).label}</dd>
          <dt>continuity</dt>
          <dd>{node.clip_meta?.continuityMode ?? (isH3 ? h3Options.continuityMode : "cut")}</dd>
          <dt>seed</dt>
          <dd>{node.clip_meta?.settings?.seed ?? "not recorded"}</dd>
          {node.clip_meta?.settings && (
            <>
              <dt>settings</dt>
              <dd>
                {node.clip_meta.settings.width}×{node.clip_meta.settings.height} · {node.clip_meta.settings.frames} frames ·{" "}
                {node.clip_meta.settings.steps} steps{node.clip_meta.settings.turbo ? " · turbo" : ""}
              </dd>
            </>
          )}
        </dl>
        {!node.clip_meta && <p className="shot-hint">Settings are written when a clip is rendered.</p>}
      </details>

      {/* Continuity */}
      <div className="shot-desk-section">
        <span className="shot-desk-label">
          <span>Continuity</span>
          <span className="shot-desk-value">{shotLabel(node, index)}</span>
        </span>
        <div className="shot-continuity">
          <button type="button" className="shot-neighbour" disabled={!prev} onClick={() => prev && selectShot(prev, index - 1)} aria-label={prev ? `Select ${shotLabel(prev, index - 1)}` : "No previous shot"}>
            <span className="shot-take-thumb">
              {prev?.frame_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={prev.frame_url} alt="" />
              ) : (
                <span className="shot-neighbour-empty">{prev ? "no frame" : "start"}</span>
              )}
            </span>
            <span className="shot-take-label"><ChevronLeft size={10} /> {prev ? shotLabel(prev, index - 1) : "Start of cut"}</span>
          </button>
          <span className="shot-continuity-arrow" aria-hidden="true"><ArrowRight size={14} /></span>
          <button type="button" className="shot-neighbour" disabled={!next} onClick={() => next && selectShot(next, index + 1)} aria-label={next ? `Select ${shotLabel(next, index + 1)}` : "No next shot"}>
            <span className="shot-take-thumb">
              {next?.frame_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={next.frame_url} alt="" />
              ) : (
                <span className="shot-neighbour-empty">{next ? "no frame" : "end"}</span>
              )}
            </span>
            <span className="shot-take-label">{next ? shotLabel(next, index + 1) : "End of cut"} <ChevronRight size={10} /></span>
          </button>
        </div>
        <label className="shot-check" data-disabled={!canContinue} title={continueWhy ?? undefined}>
          <span>Use previous shot&apos;s last frame</span>
          <input
            type="checkbox"
            checked={h3Options.continuityMode === "continue"}
            disabled={!canContinue}
            onChange={(e) => setH3Options({ continuityMode: e.target.checked ? "continue" : "cut", endFrame: false })}
          />
        </label>
        {continueWhy && <p className="shot-hint">{continueWhy}</p>}
      </div>

      {/* H3 gate: preflight estimate and canStart. Generate stays disabled until it says so. */}
      {isH3 && <H3Controls duration={node.duration} aspectRatio={d.aspectRatio} value={h3Options} onChange={setH3Options} onReady={setH3Ready} />}
      {isH3 && <H3LiveMonitor />}

      {/* Generate, with the estimate beside it */}
      <div className="shot-generate">
        <div className="shot-cost" data-short={tooPoor}>
          <span>
            {isH3 ? "RunPod · metered GPU time" : model.costText}
            {isH3 ? "" : isHiggs ? " credits" : " / clip"}
          </span>
          <span>
            {isH3
              ? "20-step base"
              : !isHiggs
                ? "BytePlus · free tokens"
                : credits != null
                  ? `Balance ${credits}`
                  : d.balance?.connected === false
                    ? "Higgsfield off"
                    : "—"}
          </span>
        </div>
        <Button intent="primary" className="shot-full" disabled={animating || generateBlock != null} onClick={generate}>
          <Film size={12} /> {animating ? "Rendering…" : node.clip_url ? "Re-roll clip" : "Generate clip"}
        </Button>
        {generateBlock && <p className="shot-why">{generateBlock}</p>}
        {tooPoor && <p className="shot-why">Balance is below ≈{model.approxCost} cr — top up Higgsfield or pick a cheaper model.</p>}
        {genError && <InlineError message={genError} onRetry={generate} />}
        {note && <p className="shot-hint" role="status">{note}</p>}
      </div>

      {/* Upload instead */}
      <div className="shot-desk-section">
        <label
          className={buttonVariants({ intent: "secondary", size: "md" })}
          aria-disabled={uploadingClip}
          title="Attach a clip you generated somewhere else instead of generating one here"
        >
          <input
            type="file"
            accept=".mp4,.mov,.webm"
            disabled={uploadingClip}
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              setUploadingClip(true);
              setUploadClipError(null);
              try {
                const res = await d.uploadClip(node, file);
                if (res?.error) setUploadClipError(res.error);
              } finally {
                setUploadingClip(false);
              }
            }}
          />
          {uploadingClip ? "Uploading…" : "Upload a clip instead"}
        </label>
        {uploadClipError && <InlineError message={uploadClipError} />}
      </div>

      <div className="shot-divider" />

      {/* Timing */}
      <div className="shot-desk-section">
        <span className="shot-desk-label">
          <span>Duration</span>
          <span className="shot-desk-value">{duration.toFixed(3)}s</span>
        </span>
        <input
          className="shot-range"
          aria-label="Shot duration in seconds"
          type="range"
          min={0.5}
          max={20}
          step={1 / 24}
          value={duration}
          onChange={(e) => setDurationLocal(Number(e.target.value))}
          onMouseUp={() => d.setDuration(node, duration)}
          onTouchEnd={() => d.setDuration(node, duration)}
          onKeyUp={() => d.setDuration(node, duration)}
        />
      </div>
      <div className="shot-desk-section">
        <span className="shot-desk-label">
          <span>Trim in-point</span>
          <span className="shot-desk-value">{trimStart.toFixed(3)}s into the clip</span>
        </span>
        <input
          className="shot-range"
          aria-label="Trim in-point in seconds"
          type="range"
          min={0}
          max={15}
          step={1 / 24}
          value={trimStart}
          onChange={(e) => setTrimStartLocal(Number(e.target.value))}
          onMouseUp={() => d.setTrimStart(node, trimStart)}
          onTouchEnd={() => d.setTrimStart(node, trimStart)}
          onKeyUp={() => d.setTrimStart(node, trimStart)}
          title="Which second of the generated clip to start keeping from — useful for a short beat that only needs a few seconds out of a longer take"
        />
      </div>
      <div className="shot-desk-section">
        <span className="shot-desk-label"><span>Scene number</span></span>
        <div className="shot-inline">
          <input
            className="shot-input"
            aria-label="Scene number"
            type="number"
            min={1}
            value={scene}
            onChange={(e) => setScene(Math.max(1, Number(e.target.value) || 1))}
            onBlur={() => {
              if (scene !== (node.beat?.n ?? 1)) d.setSceneNumber(node, scene);
            }}
          />
          <p className="shot-hint">Sets the shot&apos;s column on the board.</p>
        </div>
      </div>

      {clipForTools && <ClipFrameTools nodeId={node.id} clipUrl={clipForTools} />}

      <div className="shot-divider" />

      {/* Audio: dialogue and lip sync */}
      <div className="shot-desk-section">
        <span className="shot-desk-label">
          <span>Audio</span>
          <span className="shot-desk-value">{node.dialogue_audio_url ? "dialogue attached" : "no dialogue yet"}</span>
        </span>
        <label className={buttonVariants({ intent: "secondary", size: "md" })} aria-disabled={uploadingDialogue}>
          <input
            type="file"
            accept=".mp3,.m4a,.wav,.aac"
            disabled={uploadingDialogue}
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              setUploadingDialogue(true);
              setLipsyncError(null);
              try {
                const res = await d.uploadDialogue(node, file);
                if (res?.error) setLipsyncError(res.error);
              } finally {
                setUploadingDialogue(false);
              }
            }}
          />
          {uploadingDialogue ? "Uploading…" : node.dialogue_audio_url ? "Replace dialogue track" : "Upload dialogue track"}
        </label>
        <label className="shot-field">
          <span>Lip-sync model</span>
          <select
            className="shot-select"
            value={lipsyncModelId}
            onChange={(e) => setLipsyncModelId(e.target.value)}
            title="Sync.so lip-sync model — billed on your own Sync.so account, separate from the video balance above"
          >
            {LIPSYNC_MODELS.map((m) => (
              <option key={m.id} value={m.id}>{m.label} · {m.costText}</option>
            ))}
          </select>
        </label>
        <Button
          className="shot-full"
          disabled={lipsyncing || !canLipsync}
          onClick={async () => {
            setLipsyncNote(null);
            setLipsyncError(null);
            setLipsyncing(true);
            try {
              const res = await d.lipsync(node, lipsyncModelId);
              if (res?.error) setLipsyncError(res.error);
              else if (res?.ok) setLipsyncNote(`Lip-synced by ${res.vendor ?? "Sync.so"}.`);
            } finally {
              setLipsyncing(false);
            }
          }}
        >
          {lipsyncing || node.lipsync_state === "generating" ? "Syncing…" : node.lipsync_url ? "Re-sync lips" : "Sync lips to dialogue"}
        </Button>
        {!canLipsync && (
          <p className="shot-hint">
            {!node.dialogue_audio_url ? "Upload a dialogue track first." : "Needs a clip or a frame to sync to."}
          </p>
        )}
        {lipsyncError && <InlineError message={lipsyncError} />}
        {lipsyncNote && <p className="shot-hint" role="status">{lipsyncNote}</p>}
      </div>

      <div className="shot-divider" />

      <Button
        intent="ghost"
        className="shot-full"
        onClick={async () => {
          if (
            await confirmDialog({
              title: "Remove this shot from the board?",
              description: "The transition clips connected to it are removed with it. The storyboard frame it came from is kept.",
              confirmLabel: "Remove shot",
              destructive: true
            })
          ) {
            d.remove(node.id);
            close();
          }
        }}
      >
        <Trash2 size={12} /> Remove from the board
      </Button>
    </div>
  );
}

registerInspector("shot", ShotInspector);
