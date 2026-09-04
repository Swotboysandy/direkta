"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { motion } from "framer-motion";
import { SPRING_SMOOTH } from "./motion";
import { ThemeToggle } from "./ThemeToggle";
import { RenderEngineChip, type H3Status } from "./RenderEngineChip";
import { useConfirm } from "./ui/alert-dialog";
import { BookOpen, ChevronDown, Key, Plus, Settings, Trash2 } from "./icons";
import { APP_MODES, type AppMode } from "../_lib/stages";
import type { Project } from "../../lib/types";
import { cn } from "@/lib/utils";

interface Props {
  project: Project | null;
  projects: Project[];
  activeProjectId: string | null;
  mode: AppMode;
  onMode: (m: AppMode) => void;
  onSwitchProject: (id: string) => void;
  onNewProject: () => void;
  onDeleteProject: (id: string) => void;
  onOpenKeys: () => void;
  onOpenSkills: () => void;
  onOpenPalette: () => void;
  h3: H3Status | null;
}

/**
 * The one global bar (brief §8). It carries only persistent context:
 *
 *   Fylmer · Home Create Productions Assets · [production ▾] … engine · ⌘K · account
 *
 * Nothing that belongs to a stage lives here; the stage strip beneath it
 * owns that. Search left the bar for the command palette and the canvas, so
 * there is no second search box competing with either. Keys, skills, theme
 * and settings sit behind one account button rather than four glyphs in a
 * row — none of them is used often enough to earn a permanent place.
 */
export function TopBar({
  project,
  projects,
  activeProjectId,
  mode,
  onMode,
  onSwitchProject,
  onNewProject,
  onDeleteProject,
  onOpenKeys,
  onOpenSkills,
  onOpenPalette,
  h3
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const confirmDialog = useConfirm();

  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="topbar-brand"
          onClick={() => onMode("home")}
          aria-label="Fylmer — home"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
          <span className="topbar-wordmark">Fylmer</span>
        </button>

        <nav className="mode-switch" aria-label="Destinations">
          {APP_MODES.map((m) => {
            const active = m.id === mode;
            return (
              <button
                key={m.id}
                type="button"
                className={cn("mode-btn", active && "is-active")}
                aria-current={active ? "page" : undefined}
                onClick={() => onMode(m.id)}
              >
                {active && <motion.span layoutId="mode-active" transition={SPRING_SMOOTH} className="mode-active" />}
                <span>{m.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="topbar-centre">
        {mode === "home" && (
          <Popover.Root open={menuOpen} onOpenChange={setMenuOpen}>
            <Popover.Trigger asChild>
              <button type="button" className="topbar-project" aria-label="Switch production">
                <span className="topbar-project-kicker">Production</span>
                <span className="topbar-project-title">{project?.title ?? "No production"}</span>
                <ChevronDown size={13} />
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content className="topbar-menu" sideOffset={8} align="start" collisionPadding={16}>
                {projects.map((p) => (
                  <div key={p.id} className="topbar-menu-row">
                    <button
                      type="button"
                      className={cn("topbar-menu-item", p.id === activeProjectId && "is-active")}
                      onClick={() => {
                        onSwitchProject(p.id);
                        setMenuOpen(false);
                      }}
                    >
                      <span className="topbar-menu-title">{p.title}</span>
                      <span className="topbar-menu-meta">{p.format}</span>
                    </button>
                    <button
                      type="button"
                      className="topbar-menu-del"
                      aria-label={`Delete ${p.title}`}
                      title={`Delete ${p.title}`}
                      onClick={async () => {
                        setMenuOpen(false);
                        const ok = await confirmDialog({
                          title: `Delete “${p.title}”?`,
                          description:
                            "The script, beats, cast, locations, storyboard, shots and every generated asset in this production are removed. Media files stay on disk.",
                          confirmLabel: "Delete production",
                          destructive: true
                        });
                        if (ok) onDeleteProject(p.id);
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="topbar-menu-item topbar-menu-new"
                  onClick={() => {
                    onNewProject();
                    setMenuOpen(false);
                  }}
                >
                  <Plus size={13} />
                  <span>New production</span>
                </button>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        )}
      </div>

      <div className="topbar-right">
        <RenderEngineChip h3={h3} />

        <button
          type="button"
          className="topbar-kbd"
          onClick={onOpenPalette}
          aria-label="Open command palette"
          title="Command palette"
        >
          <span>{isMac ? "⌘" : "Ctrl"}</span>
          <span>K</span>
        </button>

        <Popover.Root>
          <Popover.Trigger asChild>
            <button type="button" className="topbar-account" aria-label="Account and settings" title="Account">
              <Settings size={15} />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content className="topbar-menu topbar-menu--account" sideOffset={8} align="end" collisionPadding={16}>
              <button type="button" className="topbar-menu-item" onClick={onOpenKeys}>
                <Key size={13} />
                <span>Keys and connections</span>
              </button>
              <button type="button" className="topbar-menu-item" onClick={onOpenSkills}>
                <BookOpen size={13} />
                <span>Skills</span>
              </button>
              <a className="topbar-menu-item" href="/settings">
                <Settings size={13} />
                <span>Settings</span>
              </a>
              <div className="topbar-menu-theme">
                <span>Theme</span>
                <ThemeToggle />
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </header>
  );
}
