"use client";

import { useEffect, useMemo, useState } from "react";
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

const CREW_STATE_COLOR: Record<AgentState, { bg: string; fg: string }> = {
  idle: { bg: "var(--surface-2)", fg: "var(--mute)" },
  working: { bg: "color-mix(in srgb, var(--mustard-deep) 18%, transparent)", fg: "var(--mustard-deep)" },
  done: { bg: "color-mix(in srgb, var(--accent-3) 18%, transparent)", fg: "var(--accent-3)" },
  attention: { bg: "color-mix(in srgb, var(--tomato) 16%, transparent)", fg: "var(--tomato)" }
};

const TAG_STYLE: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "5px 12px",
  fontWeight: 500,
  fontSize: 13,
  borderRadius: 999,
  background: "var(--cream-deep)",
  color: "var(--ink)"
};

const EYEBROW_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.02em",
  color: "var(--mute)"
};

/** Mirrors the mockup's `style-hover="..."` — a plain DOM mutation on enter/leave
    is simpler and safer here than animating raw CSS strings through framer-motion. */
function hoverFx(prop: "background" | "filter", hoverValue: string, restValue = "") {
  return {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style[prop] = hoverValue;
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style[prop] = restValue;
    }
  };
}

function ghostPillStyle(padding: string, fontSize: number, gap: number): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap,
    padding,
    fontWeight: 600,
    fontSize,
    color: "var(--ink)",
    backdropFilter: "blur(10px)",
    background: "color-mix(in srgb, var(--ink) 5%, transparent)",
    border: 0,
    boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--ink) 22%, transparent)",
    borderRadius: 999,
    cursor: "pointer"
  };
}

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

  const [frames, setFrames] = useState<LibraryFrame[] | null>(null);
  const [board, setBoard] = useState<BoardData | null>(null);

  // Real storyboard imagery — no fabricated placeholders. The library route gives
  // true recency order for "latest frames"; the storyboard route carries director
  // approval state for the hero's "latest approved frame."
  useEffect(() => {
    fetch(`/api/projects/${project.id}/library`)
      .then((r) => r.json())
      .then((data) => setFrames(data.generations ?? []))
      .catch(() => setFrames([]));
    fetch(`/api/projects/${project.id}/storyboard`)
      .then((r) => r.json())
      .then((data) => setBoard({ beats: data.beats ?? [], variants: data.variants ?? [] }))
      .catch(() => setBoard({ beats: [], variants: [] }));
  }, [project.id]);

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
    <motion.div className="main-inner" {...pageIn}>
      {/* HERO */}
      <section
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "minmax(0,1.15fr) minmax(300px,0.85fr)",
          gap: 36,
          alignItems: "center",
          background:
            "linear-gradient(115deg, color-mix(in srgb, var(--accent) 18%, transparent), rgba(64,170,182,0.10) 55%, rgba(255,255,255,0.02)), var(--surface)",
          backdropFilter: "blur(20px)",
          borderRadius: 24,
          boxShadow: "var(--shadow-2)",
          padding: "36px 40px",
          marginTop: 28,
          overflow: "hidden"
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: "38%",
            background: "linear-gradient(100deg, transparent, rgba(255,255,255,0.055), transparent)",
            transform: "translateX(-140%) skewX(-18deg)",
            animation: "fxSheen 6s ease-in-out infinite",
            pointerEvents: "none"
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, letterSpacing: "0.02em", color: "var(--accent)" }}>
            Dashboard · {project.format} · {project.aspect_ratio}
          </span>
          <h1
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: "clamp(30px,3.2vw,42px)",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "var(--ink)"
            }}
          >
            {project.title}
          </h1>
          {project.logline && (
            <p style={{ margin: 0, fontWeight: 500, fontSize: 16, lineHeight: 1.55, color: "var(--ink-soft)", maxWidth: "52ch" }}>
              {project.logline}
            </p>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <span style={TAG_STYLE}>{project.genre || project.format}</span>
            <span style={TAG_STYLE}>{project.length_estimate}</span>
            <span style={TAG_STYLE}>
              {stats.beats} beats · {stats.characters} characters · {stats.locations} locations
            </span>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <motion.button
              {...tap}
              onClick={() => onSwitchWorkspace(hasScript ? "casting" : "screenplay")}
              {...hoverFx("background", "var(--accent-hover)", "var(--accent)")}
              style={{
                position: "relative",
                overflow: "hidden",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "11px 20px",
                fontWeight: 600,
                fontSize: 14,
                color: "var(--on-accent)",
                background: "var(--accent)",
                border: "none",
                borderRadius: 999,
                boxShadow: "var(--shadow-1)",
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: 0,
                  width: "55%",
                  background: "linear-gradient(100deg, transparent, rgba(255,255,255,0.28), transparent)",
                  transform: "translateX(-140%) skewX(-18deg)",
                  animation: "fxSheen 3.6s ease-in-out infinite",
                  pointerEvents: "none"
                }}
              />
              {hasScript ? "Continue working" : "Start with the script"}
              <ArrowRight size={14} />
            </motion.button>
            <motion.button
              {...tap}
              onClick={onOpenBible}
              {...hoverFx("background", "color-mix(in srgb, var(--ink) 14%, transparent)", "color-mix(in srgb, var(--ink) 5%, transparent)")}
              style={ghostPillStyle("11px 20px", 14, 8)}
            >
              Open Movie Bible
            </motion.button>
          </div>
        </div>
        <div style={{ position: "relative", aspectRatio: "16/9", borderRadius: 16, overflow: "hidden", boxShadow: "var(--shadow-2)", background: "var(--cream-deep)" }}>
          {heroFrame ? (
            <>
              <span
                role="img"
                aria-label="Latest approved frame"
                style={{ position: "absolute", inset: 0, backgroundImage: `url("${heroFrame.url}")`, backgroundSize: "cover", backgroundPosition: "center" }}
              />
              <span style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(6,6,10,0.55), transparent 45%)" }} />
              <span
                style={{
                  position: "absolute",
                  bottom: 12,
                  left: 14,
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  color: "color-mix(in srgb, var(--ink) 90%, transparent)"
                }}
              >
                Beat {String(heroFrame.beatN).padStart(2, "0")} · latest approved frame
              </span>
              <span
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  fontWeight: 600,
                  borderRadius: 999,
                  background: "color-mix(in srgb, var(--accent-3) 90%, transparent)",
                  color: "var(--on-accent-3)"
                }}
              >
                Approved
              </span>
            </>
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <ImageIcon size={22} style={{ color: "var(--mute)" }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--mute)" }}>No approved frames yet</span>
            </div>
          )}
        </div>
      </section>

      {/* PIPELINE STRIP — one unified card, 5 columns */}
      <section style={{ marginTop: 16, background: "var(--surface)", backdropFilter: "blur(18px)", borderRadius: 18, boxShadow: "var(--shadow-1)", overflow: "hidden" }}>
        <motion.div variants={staggerContainer} initial="hidden" animate="show" style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)" }}>
          {PIPELINE.map((wsId, i) => {
            const w = wsMap[wsId];
            const status = w?.status ?? "idle";
            const isDone = status === "complete";
            const isWorking = status === "in-progress";
            const progressPct = isDone ? 100 : isWorking ? 55 : 0;
            const dotColor = isDone ? "var(--accent-3)" : isWorking ? "var(--mustard-deep)" : "var(--mute)";
            const locked = w?.unlocked === false;
            return (
              <motion.button
                key={wsId}
                variants={staggerItem}
                onClick={() => w?.unlocked && onSwitchWorkspace(wsId)}
                {...hoverFx("background", "color-mix(in srgb, var(--ink) 6%, transparent)")}
                style={{
                  textAlign: "left",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  padding: "18px 20px",
                  background: "transparent",
                  border: 0,
                  borderRight: "1px solid var(--cream-deep)",
                  cursor: locked ? "not-allowed" : "pointer",
                  opacity: locked ? 0.5 : 1,
                  fontFamily: "var(--font-ui)"
                }}
              >
                <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, letterSpacing: "0.02em", color: "var(--mute)" }}>
                    0{i + 1} / 05
                  </span>
                  <span
                    style={{
                      display: "inline-block",
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: dotColor,
                      animation: isWorking ? "fx-pulse-pip 1.6s var(--ease-out) infinite" : undefined
                    }}
                  />
                </span>
                <span style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>{w?.label ?? wsId}</span>
                <span style={{ fontSize: 12, color: "var(--mute)" }}>{w?.note ?? "—"}</span>
                <span style={{ display: "block", height: 4, background: "var(--surface-2)", borderRadius: 999, overflow: "hidden", marginTop: 2 }}>
                  <span style={{ display: "block", height: "100%", width: `${progressPct}%`, background: dotColor, borderRadius: 999 }} />
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      </section>

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

      {/* LATEST FRAMES STRIP */}
      <section style={{ marginTop: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <span style={EYEBROW_STYLE}>Latest frames · storyboard</span>
          <motion.button
            {...tap}
            onClick={() => onSwitchWorkspace("storyboard")}
            {...hoverFx("background", "color-mix(in srgb, var(--ink) 14%, transparent)", "color-mix(in srgb, var(--ink) 5%, transparent)")}
            style={ghostPillStyle("7px 14px", 12, 6)}
          >
            Open storyboard
          </motion.button>
        </div>
        {frames === null ? null : frames.length === 0 ? (
          <p style={{ marginTop: 12, fontSize: 13, color: "var(--mute)" }}>
            No frames generated yet. Open Storyboard to start generating.
          </p>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginTop: 12 }}
          >
            {frames.slice(0, 5).map((f) => (
              <motion.button
                key={f.id}
                variants={staggerItem}
                title={frameTitle(f)}
                onClick={() => onSwitchWorkspace("storyboard")}
                {...hoverFx("filter", "brightness(1.12)")}
                style={{ position: "relative", aspectRatio: "16/9", border: 0, borderRadius: 14, overflow: "hidden", background: "var(--cream-deep)", boxShadow: "var(--shadow-1)", cursor: "pointer", padding: 0 }}
              >
                <span
                  role="img"
                  aria-label={frameTitle(f)}
                  style={{ position: "absolute", inset: 0, backgroundImage: `url("${f.url}")`, backgroundSize: "cover", backgroundPosition: "center" }}
                />
                <span style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(6,6,10,0.6), transparent 40%)" }} />
                <span
                  style={{
                    position: "absolute",
                    bottom: 8,
                    left: 10,
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    fontWeight: 600,
                    color: "color-mix(in srgb, var(--ink) 90%, transparent)"
                  }}
                >
                  {frameLabel(f)}
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </section>

      {/* ACTIVITY + CREW STATUS */}
      <section style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16, marginTop: 28, alignItems: "start" }}>
        <div>
          <span style={EYEBROW_STYLE}>Activity · crew log</span>
          <motion.div
            {...fadeUp}
            style={{ background: "var(--surface)", backdropFilter: "blur(18px)", borderRadius: 18, boxShadow: "var(--shadow-1)", overflow: "hidden", marginTop: 12 }}
          >
            {activity.length === 0 && (
              <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
                <Wand2 size={16} style={{ color: "var(--mute)" }} />
                <span style={{ color: "var(--mute)" }}>No activity yet. Submit your script in Screenplay to wake the crew.</span>
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
                    gap: 12,
                    alignItems: "start",
                    padding: "12px 24px",
                    borderTop: idx === 0 ? "none" : "1px solid var(--cream-deep)"
                  }}
                >
                  <Icn size={14} style={{ color: KIND_COLOR[item.kind], marginTop: 3 }} />
                  <span style={{ fontSize: 13, color: "var(--ink)" }} dangerouslySetInnerHTML={{ __html: formatActivity(item.text) }} />
                  <time style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 500, color: "var(--mute)", whiteSpace: "nowrap" }}>
                    {relativeTime(item.created_at)}
                  </time>
                </div>
              );
            })}
          </motion.div>
        </div>
        <div>
          <span style={EYEBROW_STYLE}>Crew status</span>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            style={{ background: "var(--surface)", backdropFilter: "blur(18px)", borderRadius: 18, boxShadow: "var(--shadow-1)", padding: 8, marginTop: 12, display: "flex", flexDirection: "column", gap: 2 }}
          >
            {agents.map((a) => {
              const Icn = AGENT_ICON[a.id] ?? Wand2;
              const c = CREW_STATE_COLOR[a.state];
              return (
                <motion.div
                  key={a.id}
                  variants={staggerItem}
                  style={{ display: "grid", gridTemplateColumns: "26px 1fr auto", gap: 10, alignItems: "center", padding: "9px 12px", borderRadius: 12 }}
                >
                  <span style={{ width: 26, height: 26, display: "grid", placeItems: "center", borderRadius: 999, background: c.bg, color: c.fg }}>
                    <Icn size={13} />
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{a.name}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, color: c.fg }}>{a.state.toUpperCase()}</span>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>
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
