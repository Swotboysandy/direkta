"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  type IconType,
  Boxes,
  Clapperboard,
  Folder,
  Library,
  PenLine,
  Share2,
  CheckCircle,
  Wand2,
  Image as ImageIcon
} from "../_components/icons";
import { fadeUp, pageIn, staggerContainer, staggerItem, tap } from "../_components/motion";
import { useAsync } from "../_hooks/useAsync";
import {
  EmptyState,
  ErrorState,
  SkeletonFrames,
  SkeletonHeroFrame,
  SkeletonRows
} from "../_components/AsyncStates";
import type {
  ActivityItem,
  AgentState,
  AgentStatus,
  Project,
  WorkspaceId,
  WorkspaceMeta
} from "../../lib/types";

interface DashStats {
  beats: number;
  characters: number;
  locations: number;
}

interface Props {
  project: Project;
  workspaces: WorkspaceMeta[];
  activity: ActivityItem[];
  stats: DashStats;
  agents: AgentStatus[];
  onSwitchWorkspace: (ws: WorkspaceId) => void;
  onOpenBible: () => void;
}

/** Latest generated storyboard frames — from GET /api/projects/:id/library (real, recency-ordered). */
interface LibraryFrame {
  id: string;
  url: string;
  beat_n: number | null;
  beat_title: string | null;
}

/** Just enough of GET /api/projects/:id/storyboard to find the latest approved take. */
interface BoardBeat {
  id: string;
  n: number;
}
interface BoardVariant {
  beat_id: string;
  approval: string;
  asset_url: string | null;
}
interface BoardData {
  beats: BoardBeat[];
  variants: BoardVariant[];
}

const PIPELINE: WorkspaceId[] = ["screenplay", "casting", "storyboard", "stitch", "export"];

const AGENT_ICON: Record<string, IconType> = {
  "script-reader": PenLine,
  "beat-writer": PenLine,
  "bible-builder": Library,
  "casting-dir": Folder,
  "cinematographer": Boxes,
  "continuity": CheckCircle,
  "editor": Share2,
  "video-director": Wand2,
  "export-agent": Clapperboard,
  "producer": ImageIcon
};

const KIND_COLOR: Record<ActivityItem["kind"], string> = {
  info: "var(--mute)",
  success: "var(--signal-success)",
  error: "var(--signal-danger)",
  warning: "var(--signal-warning)"
};

/** Crew state reads as a colour on the label alone. A filled chip per agent put
 *  ten coloured blocks on a screen whose whole point is that only footage is
 *  saturated. */
const CREW_STATE_COLOR: Record<AgentState, string> = {
  idle: "var(--mute)",
  working: "var(--signal-warning)",
  done: "var(--signal-success)",
  attention: "var(--signal-danger)"
};

const STATUS_COLOR: Record<string, string> = {
  complete: "var(--signal-success)",
  "in-progress": "var(--signal-warning)"
};

function frameLabel(f: LibraryFrame): string {
  return f.beat_n ? `Beat ${String(f.beat_n).padStart(2, "0")}` : "Frame";
}

function frameTitle(f: LibraryFrame): string {
  const base = frameLabel(f);
  return f.beat_title ? `${base} — ${f.beat_title}` : base;
}

export function Dashboard({ project, workspaces, activity, stats, agents, onSwitchWorkspace, onOpenBible }: Props) {
  const wsMap = Object.fromEntries(workspaces.map((w) => [w.id, w]));
  const hasScript = project.script_submitted;

  // Real storyboard imagery — no fabricated placeholders. The assets route gives
  // true recency order for "latest frames"; the storyboard route carries director
  // approval state for the hero's "latest approved frame."
  //
  // Both go through useAsync so loading, empty and failed stay distinguishable.
  // Previously a slow fetch and an empty project rendered the same nothing, and
  // a failed one was swallowed into an empty array.
  const framesReq = useAsync<LibraryFrame[]>(
    `/api/projects/${project.id}/assets?kind=image&limit=5`,
    (body) =>
      (body.items ?? []).map((a: any) => ({
        id: a.id,
        url: a.url,
        beat_n: typeof a.title === "string" && a.title.startsWith("Beat ") ? Number(a.title.slice(5)) : null,
        beat_title: a.subtitle ?? null
      }))
  );
  const boardReq = useAsync<BoardData>(
    `/api/projects/${project.id}/storyboard`,
    (body) => ({ beats: body.beats ?? [], variants: body.variants ?? [] }),
    { isEmpty: (d) => d.beats.length === 0 }
  );

  const frames = framesReq.data;
  const board = boardReq.data;

  const heroFrame = useMemo(() => {
    if (!board) return null;
    const byBeatDesc = [...board.beats].sort((a, b) => b.n - a.n);
    for (const beat of byBeatDesc) {
      const approved = board.variants.find(
        (v) => v.beat_id === beat.id && v.approval === "approved" && v.asset_url
      );
      if (approved) return { url: approved.asset_url as string, beatN: beat.n };
    }
    return null;
  }, [board]);

  return (
    <motion.div className="main-inner dash" {...pageIn}>
      {/* TITLE BLOCK — the project stated once, at full size. */}
      <header className="dash-head">
        <div className="dash-head-copy">
          <span className="dash-eyebrow">
            {project.format} · {project.aspect_ratio}
          </span>
          <h1 className="dash-title">{project.title}</h1>
          {project.logline && <p className="dash-logline">{project.logline}</p>}
          <div className="dash-meta">
            <span>{project.genre || project.format}</span>
            <span className="dash-meta-sep">/</span>
            <span>{project.length_estimate}</span>
            <span className="dash-meta-sep">/</span>
            <span>{stats.beats} beats</span>
            <span className="dash-meta-sep">/</span>
            <span>{stats.characters} characters</span>
            <span className="dash-meta-sep">/</span>
            <span>{stats.locations} locations</span>
          </div>
        </div>
        <div className="dash-actions">
          <motion.button
            {...tap}
            className="btn btn-primary"
            onClick={() => onSwitchWorkspace(hasScript ? "casting" : "screenplay")}
          >
            {hasScript ? "Continue working" : "Start with the script"}
            <ArrowRight size={14} />
          </motion.button>
          <motion.button {...tap} className="btn btn-secondary" onClick={onOpenBible}>
            Movie Bible
          </motion.button>
        </div>
      </header>

      {/* HERO FRAME — the largest thing on the page, and the only saturated one. */}
      {boardReq.status === "loading" ? (
        <SkeletonHeroFrame />
      ) : boardReq.status === "error" ? (
        <ErrorState message={boardReq.error} onRetry={boardReq.reload} />
      ) : (
      <motion.section className="dash-frame" {...fadeUp}>
        {heroFrame ? (
          <>
            <span
              role="img"
              aria-label="Latest approved frame"
              className="dash-frame-img"
              style={{ backgroundImage: `url("${heroFrame.url}")` }}
            />
            <span className="dash-frame-scrim" />
            <span className="dash-frame-cap">
              Beat {String(heroFrame.beatN).padStart(2, "0")} · latest approved frame
            </span>
            <span className="dash-frame-flag">Approved</span>
          </>
        ) : (
          <div className="dash-frame-empty">
            <ImageIcon size={20} />
            <span>No approved frames yet</span>
          </div>
        )}
      </motion.section>
      )}

      {/* PIPELINE — five stages divided by hairlines, progress as a measured rule. */}
      <section className="dash-section">
        <div className="dash-section-head">
          <span className="dash-eyebrow">Pipeline</span>
        </div>
        <motion.div className="dash-pipeline" variants={staggerContainer} initial="hidden" animate="show">
          {PIPELINE.map((wsId, i) => {
            const w = wsMap[wsId];
            const status = w?.status ?? "idle";
            const locked = w?.unlocked === false;
            const tone = STATUS_COLOR[status] ?? "var(--mute)";
            const pct = status === "complete" ? 100 : status === "in-progress" ? 55 : 0;
            return (
              <motion.button
                key={wsId}
                variants={staggerItem}
                className="dash-stage"
                data-locked={locked ? "true" : undefined}
                disabled={locked}
                onClick={() => w?.unlocked && onSwitchWorkspace(wsId)}
              >
                <span className="dash-stage-no">
                  <span>
                    {String(i + 1).padStart(2, "0")} / {String(PIPELINE.length).padStart(2, "0")}
                  </span>
                  <span
                    className="pip"
                    data-status={
                      status === "complete" ? "done" : status === "in-progress" ? "working" : "draft"
                    }
                  />
                </span>
                <span className="dash-stage-name">{w?.label ?? wsId}</span>
                <span className="dash-stage-note">{w?.note ?? "—"}</span>
                <span className="dash-stage-rule">
                  <span style={{ width: `${pct}%`, background: tone }} />
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      </section>

      {/* LATEST FRAMES */}
      <section className="dash-section">
        <div className="dash-section-head">
          <span className="dash-eyebrow">Latest frames</span>
          <button className="dash-link" onClick={() => onSwitchWorkspace("storyboard")}>
            Open storyboard →
          </button>
        </div>
        {framesReq.status === "loading" ? (
          <SkeletonFrames />
        ) : framesReq.status === "error" ? (
          <ErrorState message={framesReq.error} onRetry={framesReq.reload} />
        ) : framesReq.status === "empty" || !frames ? (
          <EmptyState>No frames generated yet. Open Storyboard to start generating.</EmptyState>
        ) : (
          <motion.div className="dash-frames" variants={staggerContainer} initial="hidden" animate="show">
            {frames.slice(0, 5).map((f) => (
              <motion.button
                key={f.id}
                variants={staggerItem}
                className="dash-thumb"
                title={frameTitle(f)}
                onClick={() => onSwitchWorkspace("storyboard")}
              >
                <span
                  role="img"
                  aria-label={frameTitle(f)}
                  className="dash-frame-img"
                  style={{ backgroundImage: `url("${f.url}")` }}
                />
                <span className="dash-frame-scrim" />
                <span className="dash-thumb-cap">{frameLabel(f)}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </section>

      {/* ACTIVITY + CREW */}
      <div className="dash-lower">
        <section className="dash-section">
          <div className="dash-section-head">
            <span className="dash-eyebrow">Activity</span>
          </div>
          <motion.div {...fadeUp}>
            {activity.length === 0 && (
              <EmptyState>No activity yet. Submit your script in Screenplay to wake the crew.</EmptyState>
            )}
            {activity.map((item) => {
              const Icn = AGENT_ICON[item.agent] ?? Wand2;
              return (
                <div key={item.id} className="dash-log-row">
                  <Icn size={14} style={{ color: KIND_COLOR[item.kind], marginTop: 2 }} />
                  <span
                    className="dash-log-text"
                    dangerouslySetInnerHTML={{ __html: formatActivity(item.text) }}
                  />
                  <time className="dash-log-time">{relativeTime(item.created_at)}</time>
                </div>
              );
            })}
          </motion.div>
        </section>

        <section className="dash-section">
          <div className="dash-section-head">
            <span className="dash-eyebrow">Crew</span>
          </div>
          <motion.div variants={staggerContainer} initial="hidden" animate="show">
            {agents.length === 0 && <SkeletonRows count={4} />}
            {agents.map((a) => {
              const Icn = AGENT_ICON[a.id] ?? Wand2;
              const tone = CREW_STATE_COLOR[a.state];
              return (
                <motion.div key={a.id} variants={staggerItem} className="dash-crew-row">
                  <Icn size={14} style={{ color: tone }} />
                  <span className="dash-crew-name">{a.name}</span>
                  <span className="dash-crew-state" style={{ color: tone }}>
                    {a.state}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>
        </section>
      </div>
    </motion.div>
  );
}

function formatActivity(text: string): string {
  // Escape HTML first so AI/user content can't inject markup, then apply **bold**.
  const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
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
