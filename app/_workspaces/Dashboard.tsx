"use client";

import { motion } from "framer-motion";
import { AssetCanvas, type CanvasItem } from "../_components/AssetCanvas";
import { pageIn } from "../_components/motion";
import type { Project, WorkspaceId, WorkspaceMeta } from "../../lib/types";

interface DashStats {
  beats: number;
  characters: number;
  locations: number;
}

interface Props {
  project: Project;
  workspaces: WorkspaceMeta[];
  stats: DashStats;
  query: string;
  onSwitchWorkspace: (ws: WorkspaceId) => void;
}

const PIPELINE: WorkspaceId[] = ["screenplay", "casting", "storyboard", "stitch", "export"];

const STATUS_TONE: Record<string, string> = {
  complete: "var(--signal-success)",
  "in-progress": "var(--signal-warning)"
};

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
 * is, and how far through the pipeline it has got.
 */
export function Dashboard({ project, workspaces, stats, query, onSwitchWorkspace }: Props) {
  const wsMap = Object.fromEntries(workspaces.map((w) => [w.id, w]));

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

        {/* The pipeline as a single measured row rather than five cards: it is
            progress through a fixed sequence, which is a reading, not a menu. */}
        <div className="home-pipeline">
          {PIPELINE.map((wsId, i) => {
            const w = wsMap[wsId];
            const status = w?.status ?? "idle";
            const locked = w?.unlocked === false;
            const tone = STATUS_TONE[status] ?? "var(--cream-deep)";
            return (
              <button
                key={wsId}
                className="home-stage"
                data-locked={locked ? "true" : undefined}
                disabled={locked}
                onClick={() => w?.unlocked && onSwitchWorkspace(wsId)}
                title={w?.note ? `${w.label} · ${w.note}` : w?.label}
              >
                <span className="home-stage-rule" style={{ background: tone }} />
                <span className="home-stage-name">{w?.label ?? wsId}</span>
                <span className="home-stage-n">{String(i + 1).padStart(2, "0")}</span>
              </button>
            );
          })}
        </div>
      </header>

      <AssetCanvas projectId={project.id} query={query} onOpen={open} />
    </motion.div>
  );
}
