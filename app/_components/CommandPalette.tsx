"use client";

import { Command } from "cmdk";
import { useEffect, useState } from "react";
import {
  Aperture,
  Boxes,
  Camera,
  Clapperboard,
  Film,
  Folder,
  KeyRound,
  LayoutDashboard,
  Library as LibraryIcon,
  PenLine,
  Settings,
  Sparkles,
  type LucideIcon
} from "lucide-react";
import type { Project, WorkspaceId } from "../../lib/types";

interface Props {
  project: Project | null;
  projects: Project[];
  activeProjectId: string | null;
  onSwitchWorkspace: (ws: WorkspaceId) => void;
  onSwitchProject: (id: string) => void;
  onNewProject: () => void;
  onOpenKeyVault: () => void;
  onOpenBible?: () => void;
}

export function CommandPalette({
  project,
  projects,
  activeProjectId,
  onSwitchWorkspace,
  onSwitchProject,
  onNewProject,
  onOpenKeyVault,
  onOpenBible
}: Props) {
  const [open, setOpen] = useState(false);

  // ⌘K / Ctrl+K to toggle.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  const run = (fn: () => void) => () => {
    fn();
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="cmd-overlay" onClick={() => setOpen(false)}>
      <Command
        className="cmd-root"
        onClick={(e) => e.stopPropagation()}
        loop
        label="Direkta command palette"
      >
        <div className="cmd-search-wrap">
          <Sparkles size={16} style={{ color: "var(--accent)" }} />
          <Command.Input
            className="cmd-input"
            placeholder="Director's command bar — search workspaces, projects, the bible…"
            autoFocus
          />
          <kbd className="cmd-kbd">ESC</kbd>
        </div>

        <Command.List className="cmd-list">
          <Command.Empty className="cmd-empty">No commands match.</Command.Empty>

          <Command.Group heading="Workspaces" className="cmd-group">
            <CmdItem icon={LayoutDashboard} label="Dashboard" onSelect={run(() => onSwitchWorkspace("dashboard"))} hint="Project overview" />
            <CmdItem icon={PenLine} label="Screenplay" onSelect={run(() => onSwitchWorkspace("screenplay"))} hint="Script + beats" />
            <CmdItem icon={Folder} label="Casting" onSelect={run(() => onSwitchWorkspace("casting"))} hint="Characters · Soul IDs" />
            <CmdItem icon={Boxes} label="Storyboard" onSelect={run(() => onSwitchWorkspace("storyboard"))} hint="4 variants per beat" />
            <CmdItem icon={Film} label="Stitch" onSelect={run(() => onSwitchWorkspace("stitch"))} hint="Assembly board" />
            <CmdItem icon={LibraryIcon} label="Library" onSelect={run(() => onSwitchWorkspace("library"))} hint="Every generated asset" />
            <CmdItem icon={Clapperboard} label="Export" onSelect={run(() => onSwitchWorkspace("export"))} hint="Deliverables" />
          </Command.Group>

          <Command.Group heading="Project" className="cmd-group">
            {project && onOpenBible && (
              <CmdItem icon={Camera} label="Open Movie Bible" onSelect={run(onOpenBible)} hint={project.title} />
            )}
            <CmdItem icon={KeyRound} label="Open Key Vault" onSelect={run(onOpenKeyVault)} hint="API keys" />
            <CmdItem icon={Settings} label="Settings page" onSelect={run(() => (window.location.href = "/settings"))} hint="Legacy fallback" />
          </Command.Group>

          {projects.length > 1 && (
            <Command.Group heading="Switch project" className="cmd-group">
              {projects.map((p) => (
                <CmdItem
                  key={p.id}
                  icon={Aperture}
                  label={p.title}
                  onSelect={run(() => onSwitchProject(p.id))}
                  hint={p.id === activeProjectId ? "active" : `${p.format} · ${p.aspect_ratio}`}
                />
              ))}
              <CmdItem icon={Sparkles} label="New project…" onSelect={run(onNewProject)} hint="Create" />
            </Command.Group>
          )}

          <Command.Group heading="Quick actions" className="cmd-group">
            <CmdItem
              icon={PenLine}
              label="Edit script"
              onSelect={run(() => onSwitchWorkspace("screenplay"))}
              hint="Jump to Screenplay"
            />
            <CmdItem
              icon={Boxes}
              label="Generate next beat variants"
              onSelect={run(() => onSwitchWorkspace("storyboard"))}
              hint="Jump to Storyboard"
            />
            <CmdItem
              icon={Film}
              label="Preview animatic"
              onSelect={run(() => onSwitchWorkspace("stitch"))}
              hint="Jump to Stitch"
            />
          </Command.Group>
        </Command.List>

        <footer className="cmd-footer">
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <kbd className="cmd-kbd">↑↓</kbd> navigate
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <kbd className="cmd-kbd">↵</kbd> run
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
            <kbd className="cmd-kbd">⌘K</kbd> toggle
          </div>
        </footer>
      </Command>
    </div>
  );
}

function CmdItem({
  icon: Icn,
  label,
  hint,
  onSelect
}: {
  icon: LucideIcon;
  label: string;
  hint?: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item className="cmd-item" onSelect={onSelect}>
      <Icn size={14} style={{ color: "var(--mute)", flexShrink: 0 }} />
      <span style={{ flex: 1, color: "var(--ink)" }}>{label}</span>
      {hint && (
        <span
          className="t-eyebrow"
          style={{ color: "var(--mute)", fontSize: 10, letterSpacing: "0.12em", whiteSpace: "nowrap" }}
        >
          {hint}
        </span>
      )}
    </Command.Item>
  );
}
