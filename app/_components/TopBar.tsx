"use client";

import { useEffect, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { ThemeToggle } from "./ThemeToggle";
import { BookOpen, ChevronDown, Key, Plus, Search, Sparkles, Trash2 } from "./icons";
import type { Project } from "../../lib/types";
import { cn } from "@/lib/utils";

interface H3Status {
  ok: boolean;
  reason?: string;
  podStatus: string;
  warm: boolean;
  balanceUsd: number | null;
  hourlyRateUsd?: number;
  canStart?: boolean;
  estimatedCostUsd?: number;
}

interface Props {
  project: Project | null;
  projects: Project[];
  activeProjectId: string | null;
  query: string;
  onQuery: (q: string) => void;
  onSwitchProject: (id: string) => void;
  onNewProject: () => void;
  onDeleteProject: (id: string) => void;
  onOpenKeys: () => void;
  onOpenSkills: () => void;
  onOpenAgent: () => void;
  agentOpen: boolean;
}

/**
 * The one bar across the top.
 *
 * It carries exactly four things: which project you are in, a search over it,
 * whether the generator can run, and the way into keys and the agent. The
 * previous bar also showed nine undifferentiated crew glyphs and a BytePlus
 * token count — one was decoration at a glance, and the other described a
 * system that no longer generates anything here.
 *
 * The generator chip is the important one. H3 runs on a rented GPU that bills
 * by the hour and can run out of credit mid-project, so "can I generate right
 * now" is a fact worth having permanently on screen. It polls slowly, and
 * degrades to "unknown" rather than disappearing.
 */
export function TopBar({
  project,
  projects,
  activeProjectId,
  query,
  onQuery,
  onSwitchProject,
  onNewProject,
  onDeleteProject,
  onOpenKeys,
  onOpenSkills,
  onOpenAgent,
  agentOpen
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [h3, setH3] = useState<H3Status | null>(null);

  useEffect(() => {
    let live = true;
    const read = async () => {
      try {
        const res = await fetch("/api/minimax-h3/status");
        const body = await res.json();
        if (live) setH3(body);
      } catch {
        if (live) setH3({ ok: false, podStatus: "UNKNOWN", warm: false, balanceUsd: null });
      }
    };
    void read();
    // The pod's state changes on the order of minutes, and each read costs two
    // RunPod API calls, so this stays deliberately slow.
    const timer = setInterval(read, 60_000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, []);

  const tone = !h3
    ? "idle"
    : !h3.ok
    ? "down"
    : h3.warm
    ? "warm"
    : h3.podStatus === "RUNNING"
    ? "waking"
    : "asleep";

  const label = !h3
    ? "Checking…"
    : !h3.ok
    ? "Generator offline"
    : h3.warm
    ? "Ready"
    : h3.podStatus === "RUNNING"
    ? "Waking"
    : "Asleep";

  return (
    <header className="topbar">
      <div className="topbar-brand" onClick={() => onSwitchProject(activeProjectId ?? "")} role="presentation">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
      </div>

      <Popover.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <Popover.Trigger asChild>
          <button className="topbar-project" aria-label="Switch project">
            <span className="topbar-project-title">{project?.title ?? "No project"}</span>
            <ChevronDown size={13} />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content className="topbar-menu" sideOffset={8} align="start" collisionPadding={16}>
            {projects.map((p) => (
              <div key={p.id} className="topbar-menu-row">
                <button
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
                  className="topbar-menu-del"
                  aria-label={`Delete ${p.title}`}
                  title={`Delete ${p.title}`}
                  onClick={() => onDeleteProject(p.id)}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <button
              className="topbar-menu-item topbar-menu-new"
              onClick={() => {
                onNewProject();
                setMenuOpen(false);
              }}
            >
              <Plus size={13} />
              <span>New project</span>
            </button>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      <div className="topbar-search">
        <Search size={14} />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search this project"
          aria-label="Search this project"
        />
      </div>

      <div className="topbar-right">
        <span className="topbar-gen" data-tone={tone} title={h3?.reason ?? `MiniMax H3 · ${label}`}>
          <span className="topbar-gen-pip" />
          <span>{label}</span>
          {typeof h3?.balanceUsd === "number" && (
            <span className="topbar-gen-balance">${h3.balanceUsd.toFixed(2)}</span>
          )}
        </span>

        <span className="topbar-sep" aria-hidden="true" />

        <button
          className={cn("topbar-icon", agentOpen && "is-active")}
          onClick={onOpenAgent}
          aria-label="Agent"
          aria-pressed={agentOpen}
          title="Agent"
        >
          <Sparkles size={15} />
        </button>
        <button className="topbar-icon" onClick={onOpenSkills} aria-label="Skills" title="Skills">
          <BookOpen size={15} />
        </button>
        <button className="topbar-icon" onClick={onOpenKeys} aria-label="Keys and connections" title="Keys">
          <Key size={15} />
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}
