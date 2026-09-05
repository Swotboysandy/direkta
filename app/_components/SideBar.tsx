"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { motion } from "framer-motion";
import { SPRING_SMOOTH } from "./motion";
import { ThemeToggle } from "./ThemeToggle";
import { AccountMenu } from "./AccountMenu";
import { RenderEngineChip, type H3Status } from "./RenderEngineChip";
import { useConfirm } from "./ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Library,
  Lock,
  Film,
  Plus,
  Sparkles,
  Trash2
} from "./icons";
import { APP_MODES, PRODUCTION_STAGES, type AppMode } from "../_lib/stages";
import type { Project, WorkspaceId, WorkspaceMeta } from "../../lib/types";
import { cn } from "@/lib/utils";

const OPEN_W = 232;
const SHUT_W = 56;
const KEY = "fylmer:nav:collapsed";

const MODE_ICON: Record<AppMode, typeof LayoutDashboard> = {
  home: LayoutDashboard,
  create: Sparkles,
  productions: Film,
  assets: Library
};

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
  /** Absent outside a production — the stage list only exists with one open. */
  workspaces: WorkspaceMeta[];
  activeWorkspace: WorkspaceId;
  onSwitchWorkspace: (ws: WorkspaceId) => void;
  showStages: boolean;
}

/**
 * The shell's one piece of chrome (replaces the global bar and the stage
 * strip, brief §8–§9).
 *
 * Both used to be horizontal rows, which cost 96px of height on every screen
 * to show maybe thirty words. Down the side that same content costs nothing
 * that matters — a film tool is width-hungry at the top of a frame and
 * height-hungry everywhere else — and the stages read as the list they always
 * were rather than a row that happened to be in order.
 *
 * Collapsed it is a 56px rail of icons; every label then lives in a tooltip,
 * so nothing becomes unreachable. The choice persists.
 *
 * It publishes its own width the way the Dock publishes `--dock-h`, so the
 * shell grid sizes to it without either knowing about the other.
 */
export function SideBar({
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
  h3,
  workspaces,
  activeWorkspace,
  onSwitchWorkspace,
  showStages
}: Props) {
  const [shut, setShut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const confirmDialog = useConfirm();
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

  // Read the stored choice after mount, never during render: the server has no
  // localStorage and a mismatched first render is a hydration error.
  useEffect(() => {
    try {
      setShut(localStorage.getItem(KEY) === "1");
    } catch {
      /* private mode — the rail just starts open */
    }
  }, []);

  useLayoutEffect(() => {
    document.documentElement.style.setProperty("--sidebar-w", `${shut ? SHUT_W : OPEN_W}px`);
  }, [shut]);

  useEffect(() => {
    return () => {
      document.documentElement.style.removeProperty("--sidebar-w");
    };
  }, []);

  const toggle = () => {
    setShut((v) => {
      const next = !v;
      try {
        localStorage.setItem(KEY, next ? "1" : "0");
      } catch {
        /* the choice just will not persist */
      }
      return next;
    });
  };

  /** Collapsed, the label is the only thing identifying a control — so it
   *  moves into a tooltip rather than disappearing. */
  const withLabel = (node: React.ReactElement, label: string) =>
    shut ? (
      <Tooltip>
        <TooltipTrigger asChild>{node}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    ) : (
      node
    );

  const byId = Object.fromEntries(workspaces.map((w) => [w.id, w]));

  return (
    <aside className="nav" data-shut={shut || undefined} aria-label="Main">
      <div className="nav-head">
        <button type="button" className="nav-brand" onClick={() => onMode("home")} aria-label="Fylmer — home">
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
          <span className="nav-wordmark">Fylmer</span>
        </button>
        {withLabel(
          <button
            type="button"
            className="nav-collapse"
            onClick={toggle}
            aria-expanded={!shut}
            aria-label={shut ? "Expand the sidebar" : "Collapse the sidebar"}
            title={shut ? "Expand" : "Collapse"}
          >
            {shut ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>,
          "Expand the sidebar"
        )}
      </div>

      <nav className="nav-modes" aria-label="Destinations">
        {APP_MODES.map((m) => {
          const active = m.id === mode;
          const Icon = MODE_ICON[m.id];
          return withLabel(
            <button
              key={m.id}
              type="button"
              className={cn("nav-item", active && "is-active")}
              aria-current={active ? "page" : undefined}
              onClick={() => onMode(m.id)}
            >
              {active && <motion.span layoutId="mode-active" transition={SPRING_SMOOTH} className="nav-item-active" />}
              <Icon size={15} />
              <span className="nav-item-label">{m.label}</span>
            </button>,
            m.label
          );
        })}
      </nav>

      {mode === "home" && (
        <div className="nav-production">
          <Popover.Root open={menuOpen} onOpenChange={setMenuOpen}>
            <Popover.Trigger asChild>
              {withLabel(
                <button type="button" className="nav-project" aria-label="Switch production">
                  <Film size={15} className="nav-project-icon" />
                  <span className="nav-project-text">
                    <span className="nav-project-kicker">Production</span>
                    <span className="nav-project-title">{project?.title ?? "No production"}</span>
                  </span>
                  <ChevronDown size={13} />
                </button>,
                project?.title ?? "No production"
              )}
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content className="topbar-menu" sideOffset={8} side="right" align="start" collisionPadding={16}>
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
        </div>
      )}

      {showStages && (
        <nav className="nav-stages" aria-label="Production stages">
          {PRODUCTION_STAGES.map((id) => {
            const w = byId[id];
            if (!w) return null;
            const isActive = id === activeWorkspace;
            const locked = !w.unlocked;
            const stage = (
              <button
                type="button"
                className={cn("nav-item nav-stage", isActive && "is-active")}
                data-status={w.status}
                data-locked={locked || undefined}
                aria-current={isActive ? "page" : undefined}
                aria-disabled={locked || undefined}
                onClick={() => !locked && onSwitchWorkspace(id)}
              >
                {isActive && (
                  <motion.span layoutId="stage-active" transition={SPRING_SMOOTH} className="nav-item-active" />
                )}
                <span className="nav-stage-dot" aria-hidden="true">
                  {locked ? <Lock size={10} /> : null}
                </span>
                <span className="nav-item-label">{w.label}</span>
                {w.note && !locked && <span className="nav-stage-note">{w.note}</span>}
              </button>
            );
            // A locked stage must say what opens it; collapsed, every stage
            // needs its name. Same tooltip, different sentence.
            if (locked && w.lockReason) {
              return (
                <Tooltip key={id}>
                  <TooltipTrigger asChild>{stage}</TooltipTrigger>
                  <TooltipContent side="right">{w.lockReason}</TooltipContent>
                </Tooltip>
              );
            }
            return <div key={id}>{withLabel(stage, w.note ? `${w.label} — ${w.note}` : w.label)}</div>;
          })}
        </nav>
      )}

      <div className="nav-spacer" />

      <div className="nav-foot">
        <div className="nav-engine">
          <RenderEngineChip h3={h3} compact />
        </div>
        <div className="nav-tools">
          {withLabel(
            <button
              type="button"
              className="nav-tool nav-kbd"
              onClick={onOpenPalette}
              aria-label="Open command palette"
              title="Command palette"
            >
              <span>{isMac ? "⌘" : "Ctrl"}</span>
              <span>K</span>
            </button>,
            "Command palette"
          )}

          <ThemeToggle />

          <AccountMenu onOpenKeys={onOpenKeys} onOpenSkills={onOpenSkills} />
        </div>
      </div>
    </aside>
  );
}
