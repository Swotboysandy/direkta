"use client";

import { motion } from "framer-motion";
import { AssetCanvas, type CanvasItem } from "../_components/AssetCanvas";
import { pageIn } from "../_components/motion";
import type { Project, WorkspaceId } from "../../lib/types";

interface DashStats {
  beats: number;
  characters: number;
  locations: number;
}

interface Props {
  project: Project;
  stats: DashStats;
  query: string;
  onSwitchWorkspace: (ws: WorkspaceId) => void;
}



/**
 * Home is the project's assets.
 *
 * This screen used to be a summary of the project: one approved frame blown up
 * large, a five-item strip of recent frames, an activity log and a crew list.
 * Every one of those was a subset of what the canvas now shows in full, chosen
 * by a rule the user could not change. The canvas replaces all of it — the
 * hero was the newest approved frame, and the strip was the newest five, both
 * of which are simply the first cards here.
 *
 * What remains above it is what a summary is actually for: what this project
 * is. The pipeline row that sat here was removed too — it listed the same six
 * destinations as the rail immediately to its left, so the screen carried two
 * navigations to the same places.
 */
export function Dashboard({ project, stats, query, onSwitchWorkspace }: Props) {

  const open = (item: CanvasItem) => {
    if (item.kind === "video") onSwitchWorkspace("stitch");
    else if (item.kind === "image") onSwitchWorkspace("storyboard");
    else onSwitchWorkspace("casting");
  };

  return (
    <motion.div className="main-inner home" {...pageIn}>
      <header className="home-head">
        <div className="home-head-copy">
          <h1 className="dash-title">{project.title}</h1>
          <div className="dash-meta">
            <span>{project.genre || project.format}</span>
            <span className="dash-meta-sep">/</span>
            <span>{project.aspect_ratio}</span>
            <span className="dash-meta-sep">/</span>
            <span>{stats.beats} beats</span>
            <span className="dash-meta-sep">/</span>
            <span>{stats.characters} characters</span>
            <span className="dash-meta-sep">/</span>
            <span>{stats.locations} locations</span>
          </div>
        </div>

      </header>

      <AssetCanvas projectId={project.id} query={query} onOpen={open} />
    </motion.div>
  );
}
