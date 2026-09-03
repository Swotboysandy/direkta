"use client";

import { motion } from "framer-motion";
import { SPRING_SMOOTH } from "./motion";
import {
  Boxes,
  Clapperboard,
  Folder,
  LayoutDashboard,
  Lock,
  PenLine,
  Share2,
  type IconType
} from "./icons";
import type { WorkspaceId, WorkspaceMeta } from "../../lib/types";
import { cn } from "@/lib/utils";

const ICONS: Record<WorkspaceId, IconType> = {
  dashboard: LayoutDashboard,
  screenplay: PenLine,
  casting: Folder,
  storyboard: Boxes,
  stitch: Share2,
  library: LayoutDashboard,
  export: Clapperboard
};

/** Library is gone from navigation — home is the canvas, and Library was the
 *  same canvas behind an extra click. */
const ORDER: WorkspaceId[] = ["dashboard", "screenplay", "casting", "storyboard", "stitch", "export"];

interface Props {
  workspaces: WorkspaceMeta[];
  active: WorkspaceId;
  onSwitch: (ws: WorkspaceId) => void;
}

/**
 * Navigation, as a column of glyphs.
 *
 * The previous sidebar was a 240px list of labelled pills with status notes and
 * a collapse toggle — a lot of permanent furniture for six destinations that
 * never change. At this width the labels appear on hover instead, and the
 * column stops competing with the work beside it.
 *
 * Status still reads at a glance: a stage that is finished, running or locked
 * says so through the glyph, not through a second line of text.
 */
export function Rail({ workspaces, active, onSwitch }: Props) {
  const byId = Object.fromEntries(workspaces.map((w) => [w.id, w]));

  return (
    <nav className="rail" aria-label="Workspaces">
      {ORDER.map((id) => {
        const w = byId[id];
        if (!w) return null;
        const Icon = ICONS[id];
        const isActive = id === active;
        const locked = !w.unlocked;
        return (
          <button
            key={id}
            className={cn("rail-btn", isActive && "is-active")}
            data-status={w.status}
            data-locked={locked ? "true" : undefined}
            disabled={locked}
            aria-current={isActive ? "page" : undefined}
            onClick={() => !locked && onSwitch(id)}
          >
            {isActive && (
              // One shared element that glides between destinations, rather
              // than a highlight that blinks out here and in there.
              <motion.span layoutId="rail-active" transition={SPRING_SMOOTH} className="rail-active" />
            )}
            <span className="rail-glyph">
              {locked ? <Lock size={15} /> : <Icon size={17} />}
            </span>
            <span className="rail-label">
              {w.label}
              {w.note && <em>{w.note}</em>}
            </span>
            {!locked && w.status !== "idle" && <span className="rail-pip" data-status={w.status} />}
          </button>
        );
      })}
    </nav>
  );
}
