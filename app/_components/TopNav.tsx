"use client";

import { useEffect, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { ThemeToggle } from "./ThemeToggle";
import {
  ChevronDown,
  Key,
  Plus,
  ScrollText,
  PenLine,
  BookOpen,
  Users,
  Aperture,
  Eye,
  Scissors,
  Clapperboard,
  Upload,
  Check,
  Sparkles,
  Trash2,
  type IconType
} from "./icons";
import type { AgentStatus, Project, WorkspaceId } from "../../lib/types";

const AGENT_LABEL: Record<string, string> = {
  "script-reader": "Script Reader",
  "beat-writer": "Beat Writer",
  "bible-builder": "Bible Builder",
  "casting-dir": "Casting Director",
  "cinematographer": "Cinematographer",
  "continuity": "Continuity Checker",
  "editor": "Editor",
  "video-director": "Video Director",
  "export-agent": "Export Agent"
};

const AGENT_ICON: Record<string, IconType> = {
  "script-reader": ScrollText,
  "beat-writer": PenLine,
  "bible-builder": BookOpen,
  "casting-dir": Users,
  "cinematographer": Aperture,
  "continuity": Eye,
  "editor": Scissors,
  "video-director": Clapperboard,
  "export-agent": Upload
};

interface Props {
  project: Project | null;
  projects: Project[];
  activeProjectId: string | null;
  sidebarCollapsed: boolean;
  agents: AgentStatus[];
  keyVaultOpen: boolean;
  skillsOpen: boolean;
  onSwitchProject: (id: string) => void;
  onNewProject: () => void;
  onDeleteProject: (id: string) => void;
  onSwitchWorkspace: (ws: WorkspaceId) => void;
  onOpenKeyVault: () => void;
  onOpenSkills: () => void;
}

interface UsageSummary {
  pack_total: number;
  spent: number;
  remaining: number;
  estimates: { frames: number; clips_720p: number; clips_1080p: number };
  costs?: { image: number; clip720: number; clip1080: number };
}

/** 3_161_000 → "3.2M", 245_000 → "245k". */
function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

/** BytePlus pack balance — a live chip with a capacity breakdown on click. */
function UsageChip() {
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/usage")
        .then((r) => r.json())
        .then((d) => alive && setUsage(d))
        .catch(() => {});
    load();
    const timer = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  if (!usage) return null;
  const pct = usage.pack_total > 0 ? usage.remaining / usage.pack_total : 0;
  const color = pct > 0.35 ? "var(--viridian)" : pct > 0.12 ? "var(--mustard)" : "var(--tomato)";

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          aria-label="Generation credits"
          title="Generation credits — what's left on the BytePlus pack"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 12px",
            background: "var(--accent-2)",
            color: "var(--ink)",
            border: 0,
            borderRadius: 999,
            cursor: "pointer",
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.02em"
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />
          {fmtTokens(usage.remaining)} left
          <span className="usage-chip-detail" style={{ color: "var(--mute)", fontWeight: 500 }}>
            ≈{usage.estimates.frames} frames · {usage.estimates.clips_1080p} clips
          </span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          style={{
            width: 280,
            background: "var(--surface)",
            backdropFilter: "blur(20px)",
            borderRadius: 18,
            boxShadow: "var(--shadow-3)",
            padding: 18,
            zIndex: 90,
            display: "flex",
            flexDirection: "column",
            gap: 12
          }}
        >
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, letterSpacing: "0.02em", color: "var(--accent)" }}>
            Generation credits · BytePlus
          </span>
          <span style={{ display: "block", height: 6, background: "var(--surface-2)", borderRadius: 999, overflow: "hidden" }}>
            <span style={{ display: "block", height: "100%", width: `${Math.round(pct * 100)}%`, background: color, borderRadius: 999 }} />
          </span>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--mute)" }}>
            <span>{fmtTokens(usage.spent)} used</span>
            <span style={{ color: "var(--ink)" }}>{fmtTokens(usage.remaining)} / {fmtTokens(usage.pack_total)}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              { n: usage.estimates.frames, label: "frames" },
              { n: usage.estimates.clips_720p, label: "clips 720p" },
              { n: usage.estimates.clips_1080p, label: "clips 1080p" }
            ].map((e) => (
              <div key={e.label} style={{ background: "var(--bg)", borderRadius: 12, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, color: "var(--ink)", lineHeight: 1 }}>
                  ≈{e.n}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.02em", color: "var(--mute)" }}>{e.label}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 4, borderTop: "1px solid var(--cream-deep)" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 600, letterSpacing: "0.02em", color: "var(--mute)" }}>
              Cost per action
            </span>
            {[
              { label: "Portrait / storyboard frame", cost: usage.costs?.image ?? 14_400 },
              { label: "Storyboard roll (4 frames)", cost: (usage.costs?.image ?? 14_400) * 4 },
              { label: "Clip · 5s · 720p", cost: usage.costs?.clip720 ?? 108_900 },
              { label: "Clip · 5s · 1080p", cost: usage.costs?.clip1080 ?? 245_025 },
              { label: "Script, beats, final render", cost: 0 }
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 11 }}>
                <span style={{ color: "var(--ink-soft)" }}>{row.label}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: row.cost === 0 ? "var(--viridian)" : "var(--ink)" }}>
                  {row.cost === 0 ? "free" : `≈${fmtTokens(row.cost)} tok`}
                </span>
              </div>
            ))}
          </div>
          <span style={{ fontSize: 11, color: "var(--mute)", lineHeight: 1.5 }}>
            Storyboard frames run on Seedream; clips on Seedance (5s). Counts are estimates from the spend ledger.
          </span>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/** Small presentational "relative time" formatter — mirrors the one used on
 * the Dashboard activity feed, kept local since it's not shared elsewhere. */
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

export function TopNav({
  project,
  projects,
  activeProjectId,
  sidebarCollapsed,
  agents,
  keyVaultOpen,
  skillsOpen,
  onSwitchProject,
  onNewProject,
  onDeleteProject,
  onSwitchWorkspace,
  onOpenKeyVault,
  onOpenSkills
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  void sidebarCollapsed; // reserved for future collapse-aware brand chrome

  return (
    <header
      className="topnav"
      style={{ backdropFilter: "blur(18px)", position: "relative", zIndex: 60 }}
    >
      <div
        className="topnav-brand"
        onClick={() => onSwitchWorkspace("dashboard")}
        role="button"
        title="Fylmer — Dashboard"
        style={{ gap: 9, color: "var(--ink)" }}
      >
        {/* Aperture: one ring, one iris opening. The previous mark drew six
            blades plus a pupil at 30px, where the strokes collapsed into a
            smudge. Two shapes survive at favicon size. */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M12 6.4 L17.2 15.1 L6.8 15.1 Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
            fill="none"
            transform="rotate(-18 12 12)"
          />
        </svg>
        <span className="topnav-wordmark">Fylmer</span>
      </div>

      <Popover.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <Popover.Trigger asChild>
          <button
            className="topnav-project-switch"
            aria-label="Switch project"
          >
            <span className="topnav-project-copy">
              <span className="topnav-project-title">{project?.title ?? "No project"}</span>
              <span className="topnav-project-meta">
                {project ? `${project.format} · ${project.length_estimate}` : "Start a project"}
              </span>
            </span>
            <ChevronDown size={13} style={{ flex: "0 0 auto", color: "var(--mute)" }} />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="project-picker-menu"
            style={{ backdropFilter: "blur(20px)", borderRadius: 18 }}
            sideOffset={8}
            align="start"
            collisionPadding={16}
          >
            {projects.map((p) => (
              <div key={p.id} style={{ position: "relative" }}>
                <button
                  onClick={() => {
                    onSwitchProject(p.id);
                    setMenuOpen(false);
                  }}
                  className="project-picker-item"
                  data-active={p.id === activeProjectId}
                  style={{ paddingRight: 40 }}
                >
                  <span className="project-picker-title">{p.title}</span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      letterSpacing: "0.02em",
                      textTransform: "none",
                      opacity: 0.7
                    }}
                  >
                    {p.format} · {p.aspect_ratio}
                  </span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      confirm(
                        `Delete "${p.title}"?\n\nThis permanently removes its script, beats, characters, storyboard frames and clips.`
                      )
                    ) {
                      onDeleteProject(p.id);
                    }
                  }}
                  aria-label={`Delete ${p.title}`}
                  title={`Delete ${p.title}`}
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: 8,
                    transform: "translateY(-50%)",
                    width: 26,
                    height: 26,
                    display: "grid",
                    placeItems: "center",
                    background: "transparent",
                    color: "var(--mute)",
                    borderRadius: 999,
                    cursor: "pointer"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--tomato)";
                    e.currentTarget.style.background = "color-mix(in srgb, var(--tomato) 12%, transparent)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--mute)";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                onNewProject();
                setMenuOpen(false);
              }}
              className="project-picker-new"
              style={{ letterSpacing: "0.02em", textTransform: "none" }}
            >
              <Plus size={11} strokeWidth={2.4} /> New project
            </button>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      <div
        className="topnav-agent-status"
        aria-label="Agent status"
        style={{
          alignItems: "center",
          gap: 8,
          marginLeft: 16,
          paddingLeft: 16,
          borderLeft: "1px solid var(--cream-deep)"
        }}
      >
        {agents.map((agent) => {
          const Glyph = AGENT_ICON[agent.id] ?? ScrollText;
          return (
            <span
              key={agent.id}
              className="tn-agent"
              data-state={agent.state}
              style={{ width: 22, height: 22 }}
              role="img"
              title={`${AGENT_LABEL[agent.id] ?? agent.id} · ${agent.state}`}
              aria-label={`${AGENT_LABEL[agent.id] ?? agent.id} · ${agent.state}`}
            >
              <Glyph className="tn-agent-glyph" size={13} strokeWidth={1.9} aria-hidden="true" />
              {agent.state === "done" && (
                <Check className="tn-agent-check" size={9} strokeWidth={3} aria-hidden="true" />
              )}
            </span>
          );
        })}
      </div>

      <div className="topnav-right" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
        <UsageChip />
        {project && (
          <span
            className="topnav-saved-stamp"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.02em",
              color: "var(--viridian-deep)"
            }}
          >
            Saved · {relativeTime(project.updated_at)}
          </span>
        )}
        <ThemeToggle />
        <button
          className="tn-icon-btn"
          data-active={skillsOpen}
          onClick={onOpenSkills}
          aria-label="Skills — how your crew generates"
          title="Skills — how your crew generates"
        >
          <Sparkles size={16} />
        </button>
        <button
          className="tn-icon-btn"
          data-active={keyVaultOpen}
          onClick={onOpenKeyVault}
          aria-label="Key Vault — API keys"
          title="Key Vault — API keys"
        >
          <Key size={16} />
        </button>
        <div className="topnav-avatar" title="Account">MD</div>
      </div>
    </header>
  );
}
