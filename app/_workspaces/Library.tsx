"use client";

import { motion } from "framer-motion";
import { pageIn } from "../_components/motion";
import { AssetCanvas, type CanvasItem } from "../_components/AssetCanvas";
import type { Project, WorkspaceId } from "../../lib/types";

interface Props {
  project: Project;
  assetsVersion?: number;
  onSwitchWorkspace: (ws: WorkspaceId) => void;
}

/**
 * The project's assets, on one canvas.
 *
 * This used to be four tabs — Frames, Sequences, Soul IDs, Locations — each
 * with its own card, its own empty state and its own idea of what an asset
 * was, over a route that returned four separate arrays. They were four views
 * of one thing: everything the project has made or been given. The canvas is
 * that one thing, with the tabs demoted to filters on a rail.
 */
export function Library({ project, assetsVersion, onSwitchWorkspace }: Props) {
  const open = (item: CanvasItem) => {
    // Frames belong to the board; clips belong to the timeline. Entities are
    // cast, so they open where they are managed.
    if (item.kind === "video") onSwitchWorkspace("stitch");
    else if (item.kind === "image") onSwitchWorkspace("storyboard");
    else onSwitchWorkspace("casting");
  };

  return (
    <motion.div className="main-inner dash" {...pageIn}>
      <header className="dash-head">
        <div className="dash-head-copy">
          <span className="dash-eyebrow">Assets</span>
          <h1 className="dash-title">Everything in {project.title}</h1>
          <p className="dash-logline">
            Frames, clips and cast. Star what you want to keep close, or reference any of it
            from a prompt with <strong>@</strong>.
          </p>
        </div>
      </header>

      <AssetCanvas projectId={project.id} assetsVersion={assetsVersion} onOpen={open} />
    </motion.div>
  );
}
