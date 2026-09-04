import { z } from "zod";

/**
 * What the Director is allowed to do (brief §63).
 *
 * The model never touches the database. It asks for a named tool with typed
 * arguments; this module validates the arguments, runs the one function that
 * tool maps to, and returns a result the interface can draw. A tool that does
 * not appear here cannot be called, and an argument that does not match its
 * schema is refused before anything runs.
 *
 * Every tool declares its own cost. `free` runs the moment it is asked for.
 * `spend` starts a GPU or bills a vendor and must be approved by a person
 * first, with the estimate in front of them (brief §13, §25). `destructive`
 * removes work that cannot be recovered and is approved the same way.
 */

export type ToolCost = "free" | "spend" | "destructive";

export interface ToolContext {
  projectId: string;
  /** What the user had selected when they spoke, so "this shot" resolves. */
  selection?: { kind: string; id: string; label: string } | null;
}

export interface ToolResult {
  /** Shown in the Dock as the tool's outcome, in plain words. */
  summary: string;
  /** Structured payload the Dock may draw instead of text (brief §62). */
  render?:
    | { as: "beats"; beats: Array<{ n: number; title: string; heading?: string; summary?: string }> }
    | { as: "shots"; shots: Array<{ id: string; label: string; url?: string | null; state?: string }> }
    | { as: "characters"; characters: Array<{ id: string; name: string; role?: string; url?: string | null; hasLook?: boolean }> }
    | { as: "assets"; assets: Array<{ id: string; title: string; url?: string | null; kind: string }> }
    | { as: "estimate"; estimate: { label: string; costUsd: number | null; minutes?: number | null; balanceUsd?: number | null; canStart?: boolean } }
    | { as: "plan"; steps: Array<{ title: string; detail?: string; cost?: ToolCost }> }
    | { as: "note"; text: string };
  /** Anything the interface should refetch: "assets" | "bundle" | "stitch" | "storyboard". */
  invalidates?: string[];
}

export interface ToolDefinition<S extends z.ZodTypeAny = z.ZodTypeAny> {
  name: string;
  /** One line, in the language of the person using it — this is what the
   *  model reads to decide, and what the Dock shows while it runs. */
  description: string;
  /** Present tense, for the activity line: "Reading the script". */
  running: string;
  cost: ToolCost;
  schema: S;
  run: (args: z.infer<S>, ctx: ToolContext) => Promise<ToolResult>;
}

/* ── The events the Dock listens for ──────────────────────────────────── */

export type DirectorEvent =
  /** The model is thinking; no tool has been chosen yet. */
  | { type: "thinking"; text?: string }
  /** Prose from the model, streamed. */
  | { type: "delta"; text: string }
  /** A tool is about to run. `cost` tells the Dock whether to draw an
   *  approval sheet instead of just an activity line. */
  | { type: "tool"; id: string; name: string; running: string; cost: ToolCost; args: unknown }
  /** A tool that needs a person. The Dock draws the estimate and waits. */
  | { type: "approval"; id: string; name: string; running: string; cost: ToolCost; args: unknown; estimate?: ToolResult["render"] }
  /** A tool finished. */
  | { type: "tool_result"; id: string; name: string; result: ToolResult }
  /** A tool refused or threw, with the reason a person can act on. */
  | { type: "tool_error"; id: string; name: string; message: string }
  /** A multi-step intention, before any of it runs. */
  | { type: "plan"; steps: Array<{ title: string; detail?: string; cost?: ToolCost }> }
  | { type: "error"; message: string }
  | { type: "done" };

/* ── Registry ─────────────────────────────────────────────────────────── */

const registry = new Map<string, ToolDefinition>();

export function defineTool<S extends z.ZodTypeAny>(def: ToolDefinition<S>): ToolDefinition<S> {
  registry.set(def.name, def as unknown as ToolDefinition);
  return def;
}

export function getTool(name: string): ToolDefinition | undefined {
  return registry.get(name);
}

export function allTools(): ToolDefinition[] {
  return [...registry.values()];
}

/** True when a person must approve before this runs. */
export function needsApproval(def: ToolDefinition): boolean {
  return def.cost !== "free";
}

/**
 * Validate and run one tool. Never throws for a bad argument — an invalid
 * call is a message the model can correct, not a crash.
 */
export async function runTool(
  name: string,
  rawArgs: unknown,
  ctx: ToolContext
): Promise<{ ok: true; result: ToolResult } | { ok: false; message: string }> {
  const def = registry.get(name);
  if (!def) return { ok: false, message: `There is no tool called "${name}".` };
  const parsed = def.schema.safeParse(rawArgs ?? {});
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, message: `${name}: ${first?.path.join(".") || "argument"} — ${first?.message ?? "invalid"}.` };
  }
  try {
    return { ok: true, result: await def.run(parsed.data, ctx) };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, message };
  }
}
