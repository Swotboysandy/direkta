"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { SPRING_SMOOTH } from "./motion";
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
    <aside className="sidebar">
      <div className="sb-head">
        {!collapsed && <span className="sb-title">Workspaces</span>}
        <button
          className="sb-collapse"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <div className="sb-ws">
        {!collapsed && <div className="head">Production</div>}
        {workspaces.map((w) => {
          const Icn = ICONS[w.id] ?? FILMSTRIP;
          const active = w.id === activeWorkspace;
          return (
            <motion.div
              key={w.id}
              className="sidebar-item"
              whileTap={w.unlocked ? { scale: 0.985 } : undefined}
              transition={SPRING_SMOOTH}
              style={{ position: "relative" }}
              data-active={active}
              data-locked={!w.unlocked}
              data-just-unlocked={justUnlocked[w.id] ? "true" : undefined}
              title={collapsed ? `${w.label}${w.note ? ` · ${w.note}` : ""}` : undefined}
              onClick={() => w.unlocked && onSwitchWorkspace(w.id)}
            >
              {/* Two shared layoutIds so the faint fill and the accent rule glide
                  together between items instead of cross-fading in place. */}
              {active && (
                <>
                  <motion.span layoutId="sb-active-bg" transition={SPRING_SMOOTH} className="sb-active-bg" />
                  <motion.span layoutId="sb-active-rule" transition={SPRING_SMOOTH} className="sb-active-rule" />
                </>
              )}
              <span className="si-icon" style={{ position: "relative", zIndex: 1 }}>
                <Icn size={17} />
              </span>
              {!collapsed && (
                <>
                  <span className="si-label" style={{ position: "relative", zIndex: 1 }}>
                    <span>{w.label}</span>
                    {w.note && <span className="si-meta">{w.note}</span>}
                  </span>
                  {!w.unlocked ? (
                    <Lock size={12} className="si-status" style={{ position: "relative", zIndex: 1 }} />
                  ) : (
                    <span
                      className="si-status pip"
                      style={{ position: "relative", zIndex: 1 }}
                      data-status={
                        w.status === "complete" ? "done" : w.status === "in-progress" ? "working" : "draft"
                      }
                    />
                  )}
                </>
              )}
            </motion.div>
          );
        })}
      </div>
    </aside>
  );
}
