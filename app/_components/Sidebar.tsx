"use client";

import { useEffect, useRef, useState } from "react";
import {
  Boxes,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Film,
  Folder,
  LayoutDashboard,
  Library,
  Lock,
  PenLine,
  Share2,
  type IconType
} from "./icons";
import type { WorkspaceId, WorkspaceMeta } from "../../lib/types";

const ICONS: Record<WorkspaceId, IconType> = {
  dashboard: LayoutDashboard,
  screenplay: PenLine,
  casting: Folder,
  storyboard: Boxes,
  stitch: Share2,
  library: Library,
  export: Clapperboard
};

const FILMSTRIP: IconType = Film;

interface Props {
  workspaces: WorkspaceMeta[];
  activeWorkspace: WorkspaceId;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onSwitchWorkspace: (ws: WorkspaceId) => void;
}

export function Sidebar({
  workspaces,
  activeWorkspace,
  collapsed,
  onToggleCollapsed,
  onSwitchWorkspace
}: Props) {
  const prevUnlocked = useRef<Record<string, boolean>>({});
  const [justUnlocked, setJustUnlocked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const newly: string[] = [];
    for (const w of workspaces) {
      if (prevUnlocked.current[w.id] === false && w.unlocked) newly.push(w.id);
      prevUnlocked.current[w.id] = w.unlocked;
    }
    if (newly.length === 0) return;
    setJustUnlocked((prev) => {
      const next = { ...prev };
      for (const id of newly) next[id] = true;
      return next;
    });
    const timer = setTimeout(() => {
      setJustUnlocked((prev) => {
        const next = { ...prev };
        for (const id of newly) delete next[id];
        return next;
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [workspaces]);

  return (
    <aside className="sidebar" style={{ backdropFilter: "blur(18px)" }}>
      <div className="sb-head" style={{ justifyContent: collapsed ? "center" : "space-between" }}>
        {!collapsed && (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.02em",
              color: "var(--mute)"
            }}
          >
            Workspaces
          </span>
        )}
        <button
          className="sb-collapse"
          style={{ borderRadius: 12 }}
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <div className="sb-ws">
        {!collapsed && (
          <div
            style={{
              padding: "8px 12px",
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.02em",
              color: "var(--mute)"
            }}
          >
            Production
          </div>
        )}
        {workspaces.map((w) => {
          const Icn = ICONS[w.id] ?? FILMSTRIP;
          const noteColor =
            w.status === "complete"
              ? "var(--viridian-deep)"
              : w.status === "in-progress"
              ? "var(--mustard-deep)"
              : "var(--mute)";
          return (
            <div
              key={w.id}
              className="sidebar-item"
              style={{
                borderRadius: "var(--r-pill)",
                gridTemplateColumns: collapsed ? "1fr" : "22px 1fr auto",
                justifyItems: collapsed ? "center" : undefined,
                padding: collapsed ? "10px" : undefined
              }}
              data-active={w.id === activeWorkspace}
              data-locked={!w.unlocked}
              data-just-unlocked={justUnlocked[w.id] ? "true" : undefined}
              title={collapsed ? `${w.label}${w.note ? ` · ${w.note}` : ""}` : undefined}
              onClick={() => w.unlocked && onSwitchWorkspace(w.id)}
            >
              <span className="si-icon">
                <Icn size={18} />
              </span>
              {!collapsed && (
                <>
                  <span
                    style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, lineHeight: 1.25 }}
                  >
                    <span style={{ fontWeight: 500 }}>{w.label}</span>
                    {w.note && (
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 9,
                          letterSpacing: "0.02em",
                          color: noteColor
                        }}
                      >
                        {w.note}
                      </span>
                    )}
                  </span>
                  {!w.unlocked ? (
                    <Lock size={12} className="si-status" />
                  ) : (
                    <span
                      className="si-status pip"
                      data-status={w.status === "complete" ? "done" : w.status === "in-progress" ? "working" : "draft"}
                    />
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
