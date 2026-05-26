"use client";

import { useEffect, useRef, useState } from "react";
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
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

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

      <div className="tn-proj-wrap" ref={wrapRef} style={{ position: "relative" }}>
        <button
          className="topnav-project"
          onClick={() => setMenuOpen((v) => !v)}
          style={{ border: "none", display: "flex", gap: 4, alignItems: "center" }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span className="name">{project?.title ?? "No project"}</span>
            <span className="meta">
              {project ? `${project.format.toUpperCase()} · ${project.length_estimate.toUpperCase()}` : "START A PROJECT"}
            </span>
          </div>
          <ChevronDown size={14} />
        </button>
        {menuOpen && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              left: 0,
              width: 300,
              background: "var(--surface)",
              borderRadius: "var(--radius)",
              boxShadow: "var(--shadow-3)",
              padding: "var(--sp-2)",
              zIndex: 70
            }}
          >
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onSwitchProject(p.id);
                  setMenuOpen(false);
                }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRadius: "var(--r-sm)",
                  background:
                    p.id === activeProjectId ? "var(--accent-2)" : "transparent",
                  color: p.id === activeProjectId ? "var(--on-accent-2)" : "var(--ink)"
                }}
              >
                <span style={{ fontWeight: 700, fontSize: "var(--t-body-s)" }}>{p.title}</span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    letterSpacing: "var(--tracking-eyebrow)",
                    textTransform: "uppercase",
                    opacity: 0.75
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
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                width: "100%",
                padding: "10px 12px",
                marginTop: 4,
                borderRadius: "var(--r-sm)",
                background: "var(--accent)",
                color: "var(--on-accent)",
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: "var(--tracking-eyebrow)",
                textTransform: "uppercase",
                fontWeight: 700
              }}
            >
              <Plus size={12} /> New project
            </button>
          </div>
        )}
      </div>

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
