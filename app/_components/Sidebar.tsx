"use client";

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
  type LucideIcon
} from "lucide-react";
import type { WorkspaceId, WorkspaceMeta } from "../../lib/types";

const ICONS: Record<WorkspaceId, LucideIcon> = {
  dashboard: LayoutDashboard,
  screenplay: PenLine,
  casting: Folder,
  storyboard: Boxes,
  stitch: Share2,
  library: Library,
  export: Clapperboard
};

const FILMSTRIP: LucideIcon = Film;

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
  return (
    <aside className="sidebar">
      <div className="sb-head">
        <span className="sb-title">Workspaces</span>
        <button
          className="sb-collapse"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <div className="sb-ws">
        <div className="head">Production</div>
        {workspaces.map((w) => {
          const Icn = ICONS[w.id] ?? FILMSTRIP;
          return (
            <div
              key={w.id}
              className="sidebar-item"
              data-active={w.id === activeWorkspace}
              data-locked={!w.unlocked}
              title={collapsed ? `${w.label}${w.note ? ` · ${w.note}` : ""}` : undefined}
              onClick={() => w.unlocked && onSwitchWorkspace(w.id)}
            >
              <span className="si-icon">
                <Icn size={18} />
              </span>
              <div className="si-label">
                <span style={{ fontWeight: 500 }}>{w.label}</span>
                {w.note && <span className="si-meta">{w.note}</span>}
              </div>
              {!w.unlocked ? (
                <Lock size={12} className="si-status" />
              ) : (
                <span
                  className="si-status pip"
                  data-status={w.status === "complete" ? "done" : w.status === "in-progress" ? "working" : "draft"}
                />
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
