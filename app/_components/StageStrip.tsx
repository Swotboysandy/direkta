"use client";

import { motion } from "framer-motion";
import { SPRING_SMOOTH } from "./motion";
import { Lock } from "./icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { PRODUCTION_STAGES } from "../_lib/stages";
import type { WorkspaceId, WorkspaceMeta } from "../../lib/types";
import { cn } from "@/lib/utils";

interface Props {
  workspaces: WorkspaceMeta[];
  active: WorkspaceId;
  onSwitch: (ws: WorkspaceId) => void;
}

/**
 * The production's stages in a row (brief §9).
 *
 * Replaces the glyph rail. A stage is a word, not an icon, because the words
 * are the model the user is learning: Script → World → Storyboard → Shots →
 * Finish. A locked stage keeps its word, greys it, and on hover or focus says
 * the one sentence that opens it — the rail showed a padlock at 30% opacity
 * and nothing else, which is a locked door with no sign on it.
 *
 * The active marker is one shared element that slides between stages rather
 * than a highlight that blinks out here and in there.
 */
export function StageStrip({ workspaces, active, onSwitch }: Props) {
  const byId = Object.fromEntries(workspaces.map((w) => [w.id, w]));

  return (
    <nav className="stage-strip" aria-label="Production stages">
      {PRODUCTION_STAGES.map((id, i) => {
        const w = byId[id];
        if (!w) return null;
        const isActive = id === active;
        const locked = !w.unlocked;

        const button = (
          <button
            type="button"
            className={cn("stage", isActive && "is-active")}
            data-status={w.status}
            data-locked={locked || undefined}
            aria-current={isActive ? "page" : undefined}
            aria-disabled={locked || undefined}
            onClick={() => !locked && onSwitch(id)}
          >
            {isActive && <motion.span layoutId="stage-active" transition={SPRING_SMOOTH} className="stage-active" />}
            <span className="stage-dot" aria-hidden="true">
              {locked ? <Lock size={10} /> : null}
            </span>
            <span className="stage-label">{w.label}</span>
            {w.note && !locked && <span className="stage-note">{w.note}</span>}
          </button>
        );

        return (
          <div key={id} className="stage-slot">
            {i > 0 && <span className="stage-sep" aria-hidden="true" />}
            {locked && w.lockReason ? (
              <Tooltip>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6} className="max-w-[28ch] text-pretty">
                  {w.lockReason}
                </TooltipContent>
              </Tooltip>
            ) : (
              button
            )}
          </div>
        );
      })}
    </nav>
  );
}
