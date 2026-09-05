"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { AssetCanvas, type CanvasItem } from "../_components/AssetCanvas";
import { MediaTile } from "../_components/ui/media-tile";
import { Button } from "../_components/ui/button";
import { pageIn } from "../_components/motion";
import { useAsync } from "../_hooks/useAsync";
import { ArrowRight } from "../_components/icons";
import type { ActivityItem, Beat, Character, Project, WorkspaceId } from "../../lib/types";

interface Props {
  project: Project;
  beats: Beat[];
  characters: Character[];
  activity: ActivityItem[];
  gate: { frames: number; stitchNodes: number; hasFinalVideo: boolean };
  assetsVersion?: number;
  onSwitchWorkspace: (ws: WorkspaceId) => void;
}

interface StitchNode {
  id: string;
  beat: { n: number; title: string } | null;
  frame_url: string | null;
  clip_url: string | null;
  clip_state: string;
  duration: number;
}

interface Decision {
  text: string;
  action: string;
  go: WorkspaceId;
  tone: "warn" | "info";
}

/**
 * Production Home (brief §20): opening a film, not a dashboard.
 *
 * Top to bottom — the production as an object (title, cut length, where it
 * stands, when it was last touched, and the one button that continues it);
 * the sequence as it exists on the board; the stages in a row; the decisions
 * waiting on a person; the recent work as media; and one suggestion from the
 * director for what to do next. No charts, because nothing here is a metric
 * — every number is a count of things you can go and look at.
 */
export function ProductionHome({ project, beats, characters, activity, gate, assetsVersion, onSwitchWorkspace }: Props) {
  const stitch = useAsync<StitchNode[]>(`/api/projects/${project.id}/stitch?v=${assetsVersion ?? 0}`, (b) => b.nodes ?? []);
  const board = useAsync<{ pending: number; total: number }>(
    `/api/projects/${project.id}/storyboard?v=${assetsVersion ?? 0}`,
    (b) => {
      const vs = (b.variants ?? []).filter((v: { asset_url: string | null }) => v.asset_url);
      return { total: vs.length, pending: vs.filter((v: { approval?: string }) => !v.approval || v.approval === "pending").length };
    }
  );
  const final = useAsync<{ attached: boolean; duration: number }>(`/api/projects/${project.id}/final-video`, (b) => b);

  const nodes = stitch.data ?? [];
  const cutSeconds = final.data?.attached ? final.data.duration : nodes.reduce((s, n) => s + (n.duration || 0), 0);
  const clipsDone = nodes.filter((n) => n.clip_url).length;
  const failed = nodes.filter((n) => n.clip_state === "error").length;

  const castable = characters.filter((c) => c.brief?.physical_form !== "abstract");
  const untrained = castable.filter((c) => c.soul_id_state !== "trained");

  // Where the production stands, as the furthest stage with something in it.
  const stage = useMemo(() => {
    if (gate.hasFinalVideo) return "Finished";
    if (nodes.length > 0) return clipsDone === nodes.length ? "Shots rendered" : "In Shots";
    if (gate.frames > 0) return "In Storyboard";
    if (characters.length > 0) return "In World";
    if (project.script_submitted) return "Script submitted";
    return "Draft";
  }, [gate.hasFinalVideo, gate.frames, nodes.length, clipsDone, characters.length, project.script_submitted]);

  // The one button: the first stage that is open and not finished.
  const next = useMemo<{ ws: WorkspaceId; label: string }>(() => {
    if (!project.script_submitted) return { ws: "screenplay", label: "Write the script" };
    if (characters.length === 0) return { ws: "casting", label: "Build the world" };
    // Shots on the board outrank frames on the storyboard: a production can
    // have shots that never passed through Storyboard, and they are the
    // furthest thing along.
    if (nodes.length > 0 && clipsDone < nodes.length) return { ws: "stitch", label: "Render the remaining shots" };
    if (nodes.length > 0 && !gate.hasFinalVideo) return { ws: "export", label: "Assemble the cut" };
    if (nodes.length > 0) return { ws: "export", label: "Open the finished cut" };
    if (gate.frames === 0) return { ws: "storyboard", label: "Storyboard the first beat" };
    return { ws: "stitch", label: "Put frames on the board" };
  }, [project.script_submitted, characters.length, gate.frames, gate.hasFinalVideo, nodes.length, clipsDone]);

  const decisions = useMemo<Decision[]>(() => {
    const out: Decision[] = [];
    if (board.data && board.data.pending > 0)
      out.push({ text: `${board.data.pending} storyboard frame${board.data.pending > 1 ? "s" : ""} awaiting approval`, action: "Review dailies", go: "storyboard", tone: "info" });
    if (untrained.length > 0)
      out.push({ text: `Soul ID missing for ${untrained.length === 1 ? untrained[0].name : `${untrained.length} characters`}`, action: "Open World", go: "casting", tone: "warn" });
    if (failed > 0) out.push({ text: `${failed} shot${failed > 1 ? "s" : ""} failed to render`, action: "Open Shots", go: "stitch", tone: "warn" });
    if (nodes.length > 0 && !gate.hasFinalVideo && clipsDone === nodes.length)
      out.push({ text: "Every shot is rendered and the cut is not assembled", action: "Assemble", go: "export", tone: "info" });
    if (project.script_submitted && beats.length === 0)
      out.push({ text: "The script is submitted but has no beats", action: "Extract beats", go: "screenplay", tone: "warn" });
    return out;
  }, [board.data, untrained, failed, nodes.length, gate.hasFinalVideo, clipsDone, project.script_submitted, beats.length]);

  // One suggestion. The most useful gap, phrased as the director would.
  const suggestion = useMemo(() => {
    const beatsWithoutShots = beats.filter((b) => !nodes.some((n) => n.beat?.n === b.n)).length;
    if (nodes.length > 0 && beatsWithoutShots > 0)
      return { text: `${beats.length - beatsWithoutShots} beats have shots; ${beatsWithoutShots} do not.`, action: "Generate the missing shots", go: "stitch" as WorkspaceId };
    if (nodes.length > 0 && clipsDone < nodes.length)
      return { text: `${nodes.length - clipsDone} of ${nodes.length} shots on the board still need a render.`, action: "Render the remaining shots", go: "stitch" as WorkspaceId };
    if (nodes.length > 0 && !gate.hasFinalVideo)
      return { text: "Every shot is rendered. The cut has not been assembled.", action: "Assemble the cut", go: "export" as WorkspaceId };
    if (characters.length > 0 && gate.frames === 0 && nodes.length === 0)
      return { text: `${castable.length - untrained.length} of ${castable.length} characters have a Soul ID and nothing is storyboarded yet.`, action: "Storyboard the whole script", go: "storyboard" as WorkspaceId };
    if (project.script_submitted && characters.length === 0)
      return { text: "The script is in and nobody has been cast.", action: "Pull the cast from the script", go: "casting" as WorkspaceId };
    if (!project.script_submitted)
      return { text: "There is no script yet. Everything downstream comes from it.", action: "Start the script", go: "screenplay" as WorkspaceId };
    return null;
  }, [beats, nodes, clipsDone, gate.frames, gate.hasFinalVideo, characters.length, castable.length, untrained.length, project.script_submitted]);

  const last = activity[0];
  const open = (item: CanvasItem) => {
    if (item.kind === "video") onSwitchWorkspace("stitch");
    else if (item.kind === "image") onSwitchWorkspace("storyboard");
    else onSwitchWorkspace("casting");
  };

  return (
    <motion.div className="main-inner phome" {...pageIn}>
      {/* ── The production as an object ─────────────────────────── */}
      <header className="phome-hero">
        <div className="phome-hero-copy">
          <p className="phome-kicker">{project.format}{project.genre ? ` · ${project.genre}` : ""} · {project.aspect_ratio}</p>
          <h1 className="phome-title">{project.title}</h1>
          {project.logline && <p className="phome-logline">{project.logline}</p>}
        </div>
        <dl className="phome-facts">
          <div><dt>Cut</dt><dd className="font-mono tabular-nums">{cutSeconds > 0 ? formatDuration(cutSeconds) : "—"}</dd></div>
          <div><dt>Stands at</dt><dd>{stage}</dd></div>
          <div><dt>Last activity</dt><dd>{last ? relativeTime(last.created_at) : "—"}</dd></div>
        </dl>
        <Button intent="primary" onClick={() => onSwitchWorkspace(next.ws)}>
          {next.label} <ArrowRight size={14} />
        </Button>
      </header>

      {/* ── The sequence as it exists ───────────────────────────── */}
      <section className="phome-section">
        <div className="phome-section-head">
          <h2>Sequence</h2>
          <span className="phome-muted">
            {nodes.length === 0 ? "No shots on the board" : `${nodes.length} shot${nodes.length > 1 ? "s" : ""} · ${clipsDone} rendered`}
          </span>
        </div>
        {stitch.status === "loading" ? (
          <div className="phome-strip" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <span key={i} className="phome-strip-skel" />)}</div>
        ) : nodes.length === 0 ? (
          <p className="phome-empty">
            The sequence is what Shots sees, in order. Nothing is on the board yet — approved storyboard frames go there.
          </p>
        ) : (
          <div className="phome-strip">
            {nodes.map((n) => {
              const url = n.clip_url ?? n.frame_url;
              return (
                <button key={n.id} type="button" className="phome-shot" onClick={() => onSwitchWorkspace("stitch")} title={n.beat?.title ?? "Composed shot"}>
                  {url ? <MediaTile url={url} kind={n.clip_url ? "video" : "image"} className="phome-shot-media" /> : <span className="phome-shot-blank" />}
                  <span className="phome-shot-label">{n.beat ? String(n.beat.n).padStart(2, "0") : "new"}</span>
                  {!n.clip_url && <span className="phome-shot-state">{url ? "frame" : "empty"}</span>}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Decisions and the director's suggestion ─────────────── */}
      {(decisions.length > 0 || suggestion) && (
        <section className="phome-section phome-two">
          {decisions.length > 0 && (
            <div>
              <div className="phome-section-head"><h2>Open decisions</h2></div>
              <ul className="phome-decisions">
                {decisions.map((d, i) => (
                  <li key={i} className="phome-decision" data-tone={d.tone}>
                    <span className="phome-decision-dot" aria-hidden="true" />
                    <span className="phome-decision-text">{d.text}</span>
                    <button type="button" className="phome-link" onClick={() => onSwitchWorkspace(d.go)}>
                      {d.action} <ArrowRight size={11} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {suggestion && (
            <div className="phome-suggest">
              <div className="phome-section-head"><h2>Director</h2></div>
              <p className="phome-suggest-text">{suggestion.text}</p>
              <Button intent="secondary" size="sm" onClick={() => onSwitchWorkspace(suggestion.go)}>
                {suggestion.action} <ArrowRight size={12} />
              </Button>
            </div>
          )}
        </section>
      )}

      {/* ── Recent work, as media ───────────────────────────────── */}
      <section className="phome-section">
        <div className="phome-section-head"><h2>Recent work</h2></div>
        <AssetCanvas projectId={project.id} assetsVersion={assetsVersion} onOpen={open} onGo={onSwitchWorkspace} />
      </section>
    </motion.div>
  );
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return m > 0 ? `${m}:${String(r).padStart(2, "0")}` : `${r}s`;
}

function relativeTime(iso: string): string {
  const t = new Date(iso + "Z").getTime();
  const diff = Math.max(0, Date.now() - t);
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h ago`;
  return new Date(iso + "Z").toLocaleDateString();
}
