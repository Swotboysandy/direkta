import type { WorkspaceId } from "../../lib/types";

/**
 * The production's stages, as the interface names them (brief §9).
 *
 * The internal `WorkspaceId` values stay what they are: they are the `?ws=`
 * URL contract, the localStorage key's value, and string literals inside six
 * workspaces. Renaming them buys nothing a label map does not, and costs a
 * six-file blast radius. So the ids are implementation; these are the words.
 */
export const STAGE_LABELS: Record<WorkspaceId, string> = {
  dashboard: "Home",
  screenplay: "Script",
  casting: "World",
  storyboard: "Storyboard",
  stitch: "Shots",
  library: "Assets",
  export: "Finish"
};

/** The five gated stages, in pipeline order — what the stage strip shows.
 *  Home is the production's front door and Assets is global; neither is a
 *  step you complete. */
export const PRODUCTION_STAGES: WorkspaceId[] = ["screenplay", "casting", "storyboard", "stitch", "export"];

/**
 * Why a stage is locked and what opens it, in one sentence that names the
 * next stage by the word on screen. The old strings said "Submit a script in
 * Screenplay first" and were computed but never displayed; a lock the user
 * cannot read is the brief's definition of a broken lock.
 */
export const LOCK_REASONS: Partial<Record<WorkspaceId, string>> = {
  casting: "World unlocks after a script is submitted.",
  storyboard: "Storyboard unlocks after at least one character is cast.",
  stitch: "Shots unlock after at least one storyboard frame exists.",
  export: "Finish unlocks after shots are on the board."
};

/** Top-level destinations (brief §8). `home` is the current production's
 *  front door; `create` is generation with no production; `productions` lists
 *  them; `assets` is the global library. */
export type AppMode = "home" | "create" | "productions" | "assets";

export const APP_MODES: { id: AppMode; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "create", label: "Create" },
  { id: "productions", label: "Productions" },
  { id: "assets", label: "Assets" }
];

export function isAppMode(v: string | null): v is AppMode {
  return v === "home" || v === "create" || v === "productions" || v === "assets";
}
