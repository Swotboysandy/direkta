"use client";

import { motion } from "framer-motion";
import { AssetCanvas, type CanvasItem } from "../_components/AssetCanvas";
import { pageIn, staggerContainer, staggerItem } from "../_components/motion";
import { SkeletonRows } from "../_components/AsyncStates";
import {
  type IconType,
  Boxes,
  CheckCircle,
  Clapperboard,
  Folder,
  Library,
  PenLine,
  Share2,
  Wand2,
  Image as ImageIcon
} from "../_components/icons";
import type {
  ActivityItem,
  AgentState,
  AgentStatus,
  Project,
  WorkspaceId
} from "../../lib/types";

interface DashStats {
  beats: number;
  characters: number;
  locations: number;
}

interface Props {
  project: Project;
  activity: ActivityItem[];
  agents: AgentStatus[];
  stats: DashStats;
  query: string;
  onSwitchWorkspace: (ws: WorkspaceId) => void;
}

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

/** Crew state reads as a colour on the label. A filled chip per agent put ten
 *  coloured blocks on a screen whose point is that only footage is saturated. */
const CREW_STATE_COLOR: Record<AgentState, string> = {
  idle: "var(--mute)",
  working: "var(--signal-warning)",
  done: "var(--signal-success)",
  attention: "var(--signal-danger)"
};

/**
 * Home: the project's assets, then what the crew has been doing.
 *
 * The canvas replaced the old hero frame and the five-item recent strip, which
 * were both subsets of it chosen by a rule the reader could not change — the
 * hero was the newest approved frame and the strip the newest five, and both
 * are simply the first cards now.
 *
 * The activity log and crew list are a different matter and are kept: nothing
 * else in the app reports what the agents did or which of them is running, so
 * removing them lost information rather than relocating it. They sit below the
 * canvas, because the work comes first and its history second.
 *
 * The pipeline row stays gone. It listed the same six destinations as the rail
 * beside it, so it was the one thing here that genuinely duplicated something
 * else on screen.
 */
export function Dashboard({ project, activity, agents, stats, query, onSwitchWorkspace }: Props) {
  const open = (item: CanvasItem) => {
    if (item.kind === "video") onSwitchWorkspace("stitch");
    else if (item.kind === "image") onSwitchWorkspace("storyboard");
    else onSwitchWorkspace("casting");
  };

  return (
    <motion.div className="main-inner home" {...pageIn}>
      <header className="home-head">
        <div className="home-head-copy">
          <h1 className="dash-title">{project.title}</h1>
          <div className="dash-meta">
            <span>{project.genre || project.format}</span>
            <span className="dash-meta-sep">/</span>
            <span>{project.aspect_ratio}</span>
            <span className="dash-meta-sep">/</span>
            <span>{stats.beats} beats</span>
            <span className="dash-meta-sep">/</span>
            <span>{stats.characters} characters</span>
            <span className="dash-meta-sep">/</span>
            <span>{stats.locations} locations</span>
          </div>
        </div>
      </header>

      <AssetCanvas projectId={project.id} query={query} onOpen={open} />

      <div className="home-lower">
        <section className="home-panel">
          <div className="home-panel-head">
            <span className="ws-eyebrow">Activity</span>
          </div>
          {activity.length === 0 ? (
            <p className="dash-empty">
              No activity yet. Submit your script in Screenplay to wake the crew.
            </p>
          ) : (
            <motion.div variants={staggerContainer} initial="hidden" animate="show">
              {activity.map((item) => {
                const Icn = AGENT_ICON[item.agent] ?? Wand2;
                return (
                  <motion.div key={item.id} variants={staggerItem} className="home-log-row">
                    <Icn size={13} style={{ color: KIND_COLOR[item.kind], marginTop: 3 }} />
                    <span
                      className="home-log-text"
                      dangerouslySetInnerHTML={{ __html: formatActivity(item.text) }}
                    />
                    <time className="home-log-time">{relativeTime(item.created_at)}</time>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </section>

        <section className="home-panel">
          <div className="home-panel-head">
            <span className="ws-eyebrow">Crew</span>
          </div>
          {agents.length === 0 ? (
            <SkeletonRows count={4} />
          ) : (
            <motion.div variants={staggerContainer} initial="hidden" animate="show">
              {agents.map((a) => {
                const Icn = AGENT_ICON[a.id] ?? Wand2;
                const tone = CREW_STATE_COLOR[a.state];
                return (
                  <motion.div key={a.id} variants={staggerItem} className="home-crew-row">
                    <Icn size={13} style={{ color: tone }} />
                    <span className="home-crew-name">{a.name}</span>
                    <span className="home-crew-state" style={{ color: tone }}>
                      {a.state}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </section>
      </div>
    </motion.div>
  );
}

function formatActivity(text: string): string {
  // Escape first so AI/user content cannot inject markup, then apply **bold**.
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
