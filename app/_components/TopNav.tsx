"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
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
    <header className="topnav">
      <div
        className="topnav-brand"
        onClick={() => onSwitchWorkspace("dashboard")}
        role="button"
        title="Direkta — Dashboard"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo/primary-lockup.svg" alt="Direkta" />
      </div>

      <Popover.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <Popover.Trigger asChild>
          <button
            className="topnav-project"
            style={{ border: "none", display: "flex", gap: 4, alignItems: "center" }}
            aria-label="Switch project"
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span className="name">{project?.title ?? "No project"}</span>
              <span className="meta">
                {project ? `${project.format.toUpperCase()} · ${project.length_estimate.toUpperCase()}` : "START A PROJECT"}
              </span>
            </div>
            <ChevronDown size={14} />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="project-picker-menu"
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
                <span className="project-picker-meta">{p.format} · {p.aspect_ratio}</span>
              </button>
            ))}
            <button
              onClick={() => {
                onNewProject();
                setMenuOpen(false);
              }}
              className="project-picker-new"
            >
              <Plus size={12} /> New project
            </button>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      <div className="topnav-agents" aria-label="Agent status">
        {agents.map((agent) => {
          const Glyph = AGENT_ICON[agent.id] ?? ScrollText;
          return (
            <span
              key={agent.id}
              className="tn-agent"
              data-state={agent.state}
              role="img"
              aria-label={`${AGENT_LABEL[agent.id] ?? agent.id} · ${agent.state}`}
            >
              <Glyph className="tn-agent-glyph" size={13} strokeWidth={2} aria-hidden="true" />
              {agent.state === "done" && (
                <Check className="tn-agent-check" size={9} strokeWidth={3} aria-hidden="true" />
              )}
              <span className="tt">
                {AGENT_LABEL[agent.id] ?? agent.id} · {agent.state}
              </span>
            </span>
          );
        })}
      </div>

      <div className="topnav-right">
        <span className="topnav-saved">● SAVED · just now</span>
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
