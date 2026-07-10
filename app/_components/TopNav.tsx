"use client";

import { useState } from "react";
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
  onSwitchWorkspace: (ws: WorkspaceId) => void;
  onOpenKeyVault: () => void;
  onOpenSkills: () => void;
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
  onSwitchWorkspace,
  onOpenKeyVault,
  onOpenSkills
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  void sidebarCollapsed; // reserved for future collapse-aware brand chrome

  return (
    <header
      className="topnav"
      style={{ padding: "0 28px", backdropFilter: "blur(18px)", position: "relative", zIndex: 60 }}
    >
      <div
        className="topnav-brand"
        onClick={() => onSwitchWorkspace("dashboard")}
        role="button"
        title="Direkta — Dashboard"
        style={{ gap: 10, color: "var(--ink)" }}
      >
        <svg width="30" height="30" viewBox="0 0 200 200" fill="none" aria-hidden="true">
          <circle cx="100" cy="100" r="92" stroke="currentColor" strokeWidth={7} />
          <g stroke="currentColor" strokeWidth={7} fill="none">
            <path d="M 100 28 L 100 60 L 138 82" />
            <path d="M 162.4 64 L 138 82 L 138 126" />
            <path d="M 162.4 136 L 138 126 L 100 148" />
            <path d="M 100 172 L 100 148 L 62 126" />
            <path d="M 37.6 136 L 62 126 L 62 82" />
            <path d="M 37.6 64 L 62 82 L 100 60" />
          </g>
          <circle cx="100" cy="104" r="10" fill="currentColor" />
        </svg>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 19,
            letterSpacing: "-0.01em",
            lineHeight: 1
          }}
        >
          Direkta
        </span>
      </div>

      <Popover.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <Popover.Trigger asChild>
          <button
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              padding: "6px 12px",
              background: "var(--accent-2)",
              color: "var(--on-accent-2)",
              border: "none",
              borderRadius: 18,
              cursor: "pointer",
              textAlign: "left"
            }}
            aria-label="Switch project"
          >
            <span style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: "-0.005em" }}>
                {project?.title ?? "No project"}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  letterSpacing: "0.02em",
                  opacity: 0.75
                }}
              >
                {project ? `${project.format} · ${project.length_estimate}` : "Start a project"}
              </span>
            </span>
            <ChevronDown size={14} />
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
              <button
                key={p.id}
                onClick={() => {
                  onSwitchProject(p.id);
                  setMenuOpen(false);
                }}
                className="project-picker-item"
                data-active={p.id === activeProjectId}
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
        aria-label="Agent status"
        style={{
          display: "flex",
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

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
        {project && (
          <span
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
