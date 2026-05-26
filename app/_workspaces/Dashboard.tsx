"use client";

import { ArrowRight, type LucideIcon } from "lucide-react";
import {
  Boxes,
  Clapperboard,
  Folder,
  Library,
  PenLine,
  Share2,
  CheckCircle,
  Wand2,
  Image as ImageIcon
} from "lucide-react";
import type {
  ActivityItem,
  Project,
  WorkspaceId,
  WorkspaceMeta
} from "../../lib/types";

interface Props {
  project: Project;
  workspaces: WorkspaceMeta[];
  activity: ActivityItem[];
  onSwitchWorkspace: (ws: WorkspaceId) => void;
}

const PIPELINE: WorkspaceId[] = ["screenplay", "casting", "storyboard", "stitch", "export"];

const ICONS: Record<WorkspaceId, LucideIcon> = {
  dashboard: PenLine,
  screenplay: PenLine,
  casting: Folder,
  storyboard: Boxes,
  stitch: Share2,
  library: Library,
  export: Clapperboard
};

const TILTS = ["card-tilt-a", "card-tilt-b", "card-tilt-c", "card-tilt-a", "card-tilt-b"];

const QUICK_CARDS: Array<{
  ws: WorkspaceId;
  title: string;
  ctaEmpty: string;
  ctaActive: string;
  emptyStatus: string;
  accent: "accent" | "accent-2" | "accent-3";
}> = [
  { ws: "screenplay", title: "Screenplay", ctaEmpty: "Write script", ctaActive: "Review beats", emptyStatus: "Ready for script", accent: "accent-2" },
  { ws: "casting", title: "Casting", ctaEmpty: "Add characters", ctaActive: "Manage Soul IDs", emptyStatus: "Waiting on script", accent: "accent-2" },
  { ws: "storyboard", title: "Storyboard", ctaEmpty: "Generate frames", ctaActive: "Review board", emptyStatus: "Waiting on Soul ID", accent: "accent" },
  { ws: "stitch", title: "Stitch", ctaEmpty: "Build animatic", ctaActive: "Review canvas", emptyStatus: "Waiting on frames", accent: "accent" },
  { ws: "library", title: "Library", ctaEmpty: "Browse outputs", ctaActive: "Browse outputs", emptyStatus: "Saved outputs", accent: "accent-3" },
  { ws: "export", title: "Export", ctaEmpty: "Export project", ctaActive: "Export project", emptyStatus: "Waiting on animatic", accent: "accent-3" }
];

const AGENT_ICON: Record<string, LucideIcon> = {
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

export function Dashboard({ project, workspaces, activity, onSwitchWorkspace }: Props) {
  const wsMap = Object.fromEntries(workspaces.map((w) => [w.id, w]));
  const hasScript = project.script_submitted;

  return (
    <div className="main-inner dashboard">
      <header className="page-head">
        <div>
          <span className="t-eyebrow crumb">DASHBOARD · {project.title.toUpperCase()}</span>
          <h1 className="t-display-m" style={{ marginTop: "var(--sp-2)" }}>{project.title}</h1>
          {project.logline && (
            <p className="lead" style={{ marginTop: "var(--sp-3)", maxWidth: "64ch" }}>
              {project.logline}
            </p>
          )}
          <div className="tag-strip" style={{ marginTop: "var(--sp-4)" }}>
            <span className="tag">{project.format}</span>
            <span className="tag tag-2">{project.length_estimate}</span>
            <span className="tag tag-3">{project.aspect_ratio}</span>
          </div>
        </div>
        <div className="page-head-actions">
          <button className="btn btn-secondary">Edit project</button>
          <button
            className="btn btn-primary"
            onClick={() => onSwitchWorkspace(hasScript ? "casting" : "screenplay")}
          >
            Continue working <ArrowRight size={14} />
          </button>
        </div>
      </header>

      <div className="page-body">
        <div className="eyebrow-row">
          <span className="t-eyebrow">PRODUCTION PIPELINE · 5 STAGES</span>
        </div>
        <div className="pipeline">
          {PIPELINE.map((wsId, i) => {
            const w = wsMap[wsId];
            const Icn = ICONS[wsId];
            const status = w?.status ?? "idle";
            const dataStatus =
              status === "complete"
                ? "done"
                : status === "in-progress"
                ? "working"
                : status === "locked"
                ? "locked"
                : "idle";
            const progressPct = status === "complete" ? 100 : status === "in-progress" ? 55 : 0;
            const pipState =
              status === "complete"
                ? "done"
                : status === "in-progress"
                ? "working"
                : "draft";
            const pipLabel =
              status === "complete"
                ? "DONE"
                : status === "in-progress"
                ? "WORKING"
                : "NOT STARTED";

            return (
              <article
                key={wsId}
                className={`stage-card ${TILTS[i]}`}
                data-status={dataStatus}
                onClick={() => w?.unlocked && onSwitchWorkspace(wsId)}
              >
                <header>
                  <span className="t-eyebrow">0{i + 1} / 05</span>
                  <span className={`pip ${status === "in-progress" ? "fx-pulse-pip" : ""}`} data-status={pipState} />
                </header>
                <h3 className="t-h3" style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                  <Icn size={18} />
                  {w?.label ?? wsId}
                </h3>
                <p className="t-body-s t-mute">{w?.note ?? "—"}</p>
                <div className="progress">
                  <div className="progress-bar" style={{ width: `${progressPct}%` }} />
                </div>
                <span className="pip-state" data-status={pipState}>{pipLabel}</span>
              </article>
            );
          })}
        </div>

        {!hasScript && (
          <div className="banner" style={{ marginTop: "var(--sp-6)" }}>
            <div style={{ flex: 1 }}>
              <span className="t-eyebrow">PRODUCER</span>
              <div className="t-h2" style={{ marginTop: "var(--sp-2)" }}>
                Your crew is ready. Where&apos;s the script?
              </div>
              <p className="t-mute" style={{ marginTop: "var(--sp-2)", fontSize: "var(--t-body-s)" }}>
                Open Screenplay to bring the production pipeline online.
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => onSwitchWorkspace("screenplay")}>
              Open Screenplay <ArrowRight size={14} />
            </button>
          </div>
        )}

        <div style={{ marginTop: "var(--sp-7)" }}>
          <div className="eyebrow-row">
            <span className="t-eyebrow">QUICK ACCESS · CREW STATIONS</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--sp-4)" }}>
            {QUICK_CARDS.map((card, i) => {
              const w = wsMap[card.ws];
              const inProgress = w?.status === "in-progress" || w?.status === "complete";
              const Icn = ICONS[card.ws];
              return (
                <a
                  key={card.ws}
                  href="#"
                  className={`quick-card ${TILTS[i % TILTS.length]}`}
                  data-accent={card.accent}
                  onClick={(e) => {
                    e.preventDefault();
                    if (w?.unlocked) onSwitchWorkspace(card.ws);
                  }}
                  style={{
                    opacity: w?.unlocked ? 1 : 0.5,
                    cursor: w?.unlocked ? "pointer" : "not-allowed"
                  }}
                >
                  <div className="qc-icon">
                    <Icn size={20} />
                  </div>
                  <h3 className="t-h3">{card.title}</h3>
                  <p className="t-body-s t-mute">{w?.note || (inProgress ? "in progress" : card.emptyStatus)}</p>
                  <span
                    className="pip-state"
                    data-status={inProgress ? "working" : "draft"}
                    style={{ alignSelf: "flex-start" }}
                  >
                    {inProgress ? "WORKING" : "IDLE"}
                  </span>
                </a>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: "var(--sp-7)" }}>
          <div className="eyebrow-row">
            <span className="t-eyebrow">ACTIVITY FEED · CREW LOG</span>
          </div>
          <div className="card" style={{ padding: 0 }}>
            {activity.length === 0 && (
              <div
                style={{
                  padding: "var(--sp-4) var(--sp-5)",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--sp-3)"
                }}
              >
                <Wand2 size={16} className="t-mute" />
                <span className="t-mute">
                  No activity yet. Submit your script in Screenplay to wake the crew.
                </span>
              </div>
            )}
            {activity.map((item, idx) => {
              const Icn = AGENT_ICON[item.agent] ?? Wand2;
              return (
                <div
                  key={item.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "28px 1fr auto",
                    gap: "var(--sp-3)",
                    alignItems: "start",
                    padding: "var(--sp-3) var(--sp-5)",
                    borderTop: idx === 0 ? "none" : "1px solid var(--cream-deep)"
                  }}
                >
                  <Icn size={14} style={{ color: "var(--mute)", marginTop: 2 }} />
                  <span
                    style={{ fontSize: "var(--t-body-s)" }}
                    dangerouslySetInnerHTML={{ __html: formatActivity(item.text) }}
                  />
                  <time
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      letterSpacing: "var(--tracking-eyebrow)",
                      textTransform: "uppercase",
                      color: "var(--mute)",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {relativeTime(item.created_at)}
                  </time>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatActivity(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
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
