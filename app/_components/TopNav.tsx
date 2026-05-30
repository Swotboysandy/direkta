"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { ChevronDown, Key, Plus } from "lucide-react";
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

interface Props {
  project: Project | null;
  projects: Project[];
  activeProjectId: string | null;
  sidebarCollapsed: boolean;
  agents: AgentStatus[];
  keyVaultOpen: boolean;
  onSwitchProject: (id: string) => void;
  onNewProject: () => void;
  onSwitchWorkspace: (ws: WorkspaceId) => void;
  onOpenKeyVault: () => void;
}

export function TopNav({
  project,
  projects,
  activeProjectId,
  sidebarCollapsed,
  agents,
  keyVaultOpen,
  onSwitchProject,
  onNewProject,
  onSwitchWorkspace,
  onOpenKeyVault
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
        {agents.map((agent) => (
          <span
            key={agent.id}
            className="tn-agent-dot"
            data-state={agent.state}
            role="img"
            aria-label={`${AGENT_LABEL[agent.id] ?? agent.id} · ${agent.state}`}
          >
            <span className="tt">
              {AGENT_LABEL[agent.id] ?? agent.id} · {agent.state}
            </span>
          </span>
        ))}
      </div>

      <div className="topnav-right">
        <span className="topnav-saved">● SAVED · just now</span>
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
