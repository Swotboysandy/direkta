import { z } from "zod";
import { defineTool, type ToolResult } from "./director-tools";
import { getDb } from "../db/client";
import { beats, characters, locations, projects } from "../db/repo";
import { getH3Preflight } from "./minimax-h3";

/**
 * The Director's tools (brief §63).
 *
 * Every one wraps something the application already does through its own
 * routes and repository, so a tool cannot reach past what a person could do
 * in the interface. Reading is free. Anything that starts a GPU or removes
 * work declares itself and waits for a person.
 *
 * Deliberately absent for now: the tools that generate. The executor refuses
 * to run a `spend` tool without an approval, and generation also needs the
 * queue from a later phase; adding a `generate_video` that cannot be
 * approved yet would be a control that does nothing.
 */

const pad2 = (n: number) => String(n).padStart(2, "0");

/* ── Reading the production ───────────────────────────────────────────── */

defineTool({
  name: "read_project",
  description: "The production's title, format, logline and how far it has got.",
  running: "Reading the production",
  cost: "free",
  schema: z.object({}),
  async run(_args, ctx) {
    const p = projects.get(ctx.projectId);
    if (!p) throw new Error("That production no longer exists.");
    const db = getDb();
    const counts = db
      .prepare(
        `SELECT (SELECT COUNT(*) FROM beats WHERE project_id = ?) AS beats,
                (SELECT COUNT(*) FROM characters WHERE project_id = ?) AS cast,
                (SELECT COUNT(*) FROM locations WHERE project_id = ?) AS places,
                (SELECT COUNT(*) FROM stitch_nodes WHERE project_id = ?) AS shots`
      )
      .get(ctx.projectId, ctx.projectId, ctx.projectId, ctx.projectId) as {
      beats: number;
      cast: number;
      places: number;
      shots: number;
    };
    return {
      summary: `${p.title} — ${p.format}, ${p.aspect_ratio}. ${counts.beats} beats, ${counts.cast} cast, ${counts.places} places, ${counts.shots} shots on the board.`,
      render: {
        as: "note",
        text: [p.logline, p.premise].filter(Boolean).join("\n\n") || "No logline written yet."
      }
    } satisfies ToolResult;
  }
});

defineTool({
  name: "read_script",
  description: "The screenplay as written, or the part of it asked for.",
  running: "Reading the script",
  cost: "free",
  schema: z.object({
    /** Characters to return, from the start. The whole script can be long. */
    limit: z.number().int().min(200).max(20000).optional()
  }),
  async run(args, ctx) {
    const p = projects.get(ctx.projectId);
    if (!p) throw new Error("That production no longer exists.");
    const script = (p.script ?? "").trim();
    if (!script) {
      return { summary: "There is no script yet.", render: { as: "note", text: "Nothing has been written in Script." } };
    }
    const limit = args.limit ?? 6000;
    const text = script.length > limit ? `${script.slice(0, limit)}\n\n[…${script.length - limit} more characters]` : script;
    return {
      summary: `${script.split(/\s+/).length} words${p.script_submitted ? ", submitted" : ", still a draft"}.`,
      render: { as: "note", text }
    } satisfies ToolResult;
  }
});

defineTool({
  name: "read_beats",
  description: "The beats the script was broken into, in order.",
  running: "Reading the beats",
  cost: "free",
  schema: z.object({}),
  async run(_args, ctx) {
    const list = beats.forProject(ctx.projectId);
    if (!list.length) return { summary: "No beats have been extracted yet.", render: { as: "note", text: "Submit the script in Script to break it into beats." } };
    return {
      summary: `${list.length} beats.`,
      render: {
        as: "beats",
        beats: list.map((b) => ({ n: b.n, title: b.title, heading: b.scene_heading, summary: b.summary }))
      }
    } satisfies ToolResult;
  }
});

defineTool({
  name: "list_characters",
  description: "The cast, and which of them have a locked Soul ID reference.",
  running: "Reading the cast",
  cost: "free",
  schema: z.object({}),
  async run(_args, ctx) {
    const list = characters.forProject(ctx.projectId);
    if (!list.length) return { summary: "Nobody has been cast yet.", render: { as: "note", text: "Add characters in World, or pull them from the script." } };
    const withLook = list.filter((c) => (c.refs ?? []).length > 0).length;
    return {
      summary: `${list.length} characters, ${withLook} with a Soul ID.`,
      render: {
        as: "characters",
        characters: list.map((c) => ({ id: c.id, name: c.name, role: c.role, url: c.refs?.[0] ?? null, hasLook: (c.refs ?? []).length > 0 }))
      }
    } satisfies ToolResult;
  }
});

defineTool({
  name: "list_locations",
  description: "The places, and which have a locked World ID plate.",
  running: "Reading the places",
  cost: "free",
  schema: z.object({}),
  async run(_args, ctx) {
    const list = locations.forProject(ctx.projectId);
    if (!list.length) return { summary: "No places yet.", render: { as: "note", text: "Add locations in World, or pull them from the script." } };
    return {
      summary: `${list.length} places, ${list.filter((l) => (l.refs ?? []).length > 0).length} with a World ID.`,
      render: {
        as: "characters",
        characters: list.map((l) => ({ id: l.id, name: l.name, role: l.int_ext, url: l.refs?.[0] ?? null, hasLook: (l.refs ?? []).length > 0 }))
      }
    } satisfies ToolResult;
  }
});

defineTool({
  name: "read_shots",
  description: "The shots on the board, in order, and whether each has rendered.",
  running: "Reading the board",
  cost: "free",
  schema: z.object({}),
  async run(_args, ctx) {
    const rows = getDb()
      .prepare(
        `SELECT sn.id, sn.duration, b.n AS beat_n, b.title AS beat_title, sn.direction,
                sn.clip_state, a.url AS clip_url
           FROM stitch_nodes sn
           LEFT JOIN beats b ON b.id = sn.beat_id
           LEFT JOIN assets a ON a.id = sn.clip_asset_id
          WHERE sn.project_id = ?
          ORDER BY sn.x ASC, sn.y ASC`
      )
      .all(ctx.projectId) as Array<{
      id: string;
      duration: number;
      beat_n: number | null;
      beat_title: string | null;
      direction: string | null;
      clip_state: string | null;
      clip_url: string | null;
    }>;
    if (!rows.length) return { summary: "The board is empty.", render: { as: "note", text: "Shots come from approved storyboard frames, or from a description in this bar." } };
    const done = rows.filter((r) => r.clip_url).length;
    return {
      summary: `${rows.length} shots, ${done} rendered, ${rows.reduce((s, r) => s + (r.duration || 0), 0).toFixed(1)}s in total.`,
      render: {
        as: "shots",
        shots: rows.map((r) => ({
          id: r.id,
          label: r.beat_n ? `${pad2(r.beat_n)} · ${r.beat_title ?? "Beat"}` : (r.direction ?? "Composed shot").slice(0, 40),
          url: r.clip_url,
          state: r.clip_url ? "Complete" : r.clip_state === "error" ? "Failed" : r.clip_state === "generating" ? "Rendering" : "Queued"
        }))
      }
    } satisfies ToolResult;
  }
});

defineTool({
  name: "search_assets",
  description: "Find frames, clips, cast or places in this production by name.",
  running: "Searching the assets",
  cost: "free",
  schema: z.object({
    query: z.string().min(1).max(120).describe("Words to look for in an asset's title."),
    kind: z.enum(["image", "video", "character", "location", "prop", "all"]).optional()
  }),
  async run(args, ctx) {
    const kind = args.kind ?? "all";
    const like = `%${args.query.toLowerCase()}%`;
    const out: Array<{ id: string; title: string; url: string | null; kind: string }> = [];

    // Generated media reaches a production three ways — through a storyboard
    // variant's beat, through a shot on the board, or filed against the
    // production itself. Same reach as the canvas.
    if (kind === "all" || kind === "image" || kind === "video") {
      const rows = getDb()
        .prepare(
          `SELECT a.id, a.kind, a.url, a.prompt, b.n AS beat_n, b.title AS beat_title, sn.direction
             FROM assets a
             LEFT JOIN storyboard_variants v ON v.id = a.target_id AND a.target_kind = 'storyboard_variant'
             LEFT JOIN stitch_nodes sn ON sn.id = a.target_id AND a.target_kind = 'stitch_clip'
             LEFT JOIN beats b ON b.id = COALESCE(v.beat_id, sn.beat_id)
            WHERE (b.project_id = ? OR sn.project_id = ? OR (a.target_kind = 'sequence' AND a.target_id = ?))
              AND a.kind IN ('image', 'video')
            ORDER BY a.created_at DESC
            LIMIT 200`
        )
        .all(ctx.projectId, ctx.projectId, ctx.projectId) as Array<{
        id: string;
        kind: string;
        url: string;
        prompt: string | null;
        beat_n: number | null;
        beat_title: string | null;
        direction: string | null;
      }>;
      for (const r of rows) {
        const title = r.beat_n ? `${pad2(r.beat_n)} · ${r.beat_title ?? "Beat"}` : (r.prompt || r.direction || "").trim().slice(0, 60) || (r.kind === "video" ? "Sequence" : "Frame");
        const isVideo = r.kind === "video";
        if ((kind === "image" && isVideo) || (kind === "video" && !isVideo)) continue;
        if (title.toLowerCase().includes(args.query.toLowerCase())) out.push({ id: r.id, title, url: r.url, kind: isVideo ? "video" : "image" });
      }
    }
    if (kind === "all" || kind === "character") {
      for (const c of characters.forProject(ctx.projectId)) {
        if (c.name.toLowerCase().includes(args.query.toLowerCase())) out.push({ id: c.id, title: c.name, url: c.refs?.[0] ?? null, kind: "character" });
      }
    }
    if (kind === "all" || kind === "location") {
      for (const l of locations.forProject(ctx.projectId)) {
        if (l.name.toLowerCase().includes(args.query.toLowerCase())) out.push({ id: l.id, title: l.name, url: l.refs?.[0] ?? null, kind: "location" });
      }
    }
    const body = { items: out.slice(0, 24) };
    if (!body.items.length) return { summary: `Nothing matching "${args.query}".` };
    return {
      summary: `${body.items.length} matching "${args.query}".`,
      render: { as: "assets", assets: body.items.map((i) => ({ id: i.id, title: i.title, url: i.url, kind: i.kind })) }
    } satisfies ToolResult;
  }
});

/* ── The render engine ────────────────────────────────────────────────── */

defineTool({
  name: "read_gpu_status",
  description: "Whether the render engine can run a shot right now, and what one costs.",
  running: "Checking the render engine",
  cost: "free",
  schema: z.object({
    shots: z.number().int().min(1).max(50).optional().describe("How many shots to price. Defaults to one.")
  }),
  async run(args) {
    const count = args.shots ?? 1;
    const pre = await getH3Preflight(Array.from({ length: count }, () => ({})));
    const state = pre.warm ? "ready" : pre.podStatus === "RUNNING" ? "starting" : "offline";
    return {
      summary: pre.canStart
        ? `The engine is ${state}. ${count === 1 ? "One shot" : `${count} shots`} costs about $${pre.estimatedCostUsd.toFixed(2)}; the balance is $${pre.balanceUsd.toFixed(2)}.`
        : `The engine is ${state} and cannot finish a render: ${count === 1 ? "one shot" : `${count} shots`} needs $${pre.requiredBalanceUsd.toFixed(2)} and the balance is $${pre.balanceUsd.toFixed(2)}.`,
      render: {
        as: "estimate",
        estimate: {
          label: count === 1 ? "One 5-second shot" : `${count} shots`,
          costUsd: pre.estimatedCostUsd,
          minutes: Math.round(pre.estimatedMinutes),
          balanceUsd: pre.balanceUsd,
          canStart: pre.canStart
        }
      }
    } satisfies ToolResult;
  }
});

defineTool({
  name: "estimate_generation_cost",
  description: "What a number of shots would cost before committing to them.",
  running: "Pricing the work",
  cost: "free",
  schema: z.object({ shots: z.number().int().min(1).max(50) }),
  async run(args) {
    const pre = await getH3Preflight(Array.from({ length: args.shots }, () => ({})));
    return {
      summary: `${args.shots} shots: about $${pre.estimatedCostUsd.toFixed(2)} and ${Math.round(pre.estimatedMinutes)} minutes. The balance is $${pre.balanceUsd.toFixed(2)}.`,
      render: {
        as: "estimate",
        estimate: {
          label: `${args.shots} shot${args.shots === 1 ? "" : "s"}`,
          costUsd: pre.estimatedCostUsd,
          minutes: Math.round(pre.estimatedMinutes),
          balanceUsd: pre.balanceUsd,
          canStart: pre.canStart
        }
      }
    } satisfies ToolResult;
  }
});

/* ── Writing ──────────────────────────────────────────────────────────── */

defineTool({
  name: "update_beat",
  description: "Change one beat's title, summary or continuity note.",
  running: "Rewriting the beat",
  cost: "free",
  schema: z.object({
    beat_number: z.number().int().min(1).describe("The beat's number as shown, not its id."),
    title: z.string().min(1).max(120).optional(),
    summary: z.string().max(2000).optional(),
    notes: z.string().max(2000).optional()
  }),
  async run(args, ctx) {
    const beat = beats.forProject(ctx.projectId).find((b) => b.n === args.beat_number);
    if (!beat) throw new Error(`This production has no beat ${args.beat_number}.`);
    const patch: Record<string, string> = {};
    if (args.title !== undefined) patch.title = args.title;
    if (args.summary !== undefined) patch.summary = args.summary;
    if (args.notes !== undefined) patch.notes = args.notes;
    if (!Object.keys(patch).length) throw new Error("Nothing to change: give a title, a summary or a note.");
    const sets = Object.keys(patch).map((k) => `${k} = ?`).join(", ");
    getDb()
      .prepare(`UPDATE beats SET ${sets}, updated_at = datetime('now') WHERE id = ?`)
      .run(...Object.values(patch), beat.id);
    return {
      summary: `Beat ${pad2(args.beat_number)} updated.`,
      invalidates: ["bundle"]
    } satisfies ToolResult;
  }
});

defineTool({
  name: "set_production_rule",
  description: "Set the production's style, continuity, set or avoid rules — the text folded into every prompt.",
  running: "Setting the production rule",
  cost: "free",
  schema: z.object({
    rule: z.enum(["style_template", "continuity_lock", "set_lock", "avoid_prompt", "creative_brief", "brand_kit"]),
    text: z.string().max(4000)
  }),
  async run(args, ctx) {
    const p = projects.get(ctx.projectId);
    if (!p) throw new Error("That production no longer exists.");
    projects.update(ctx.projectId, { [args.rule]: args.text } as Parameters<typeof projects.update>[1]);
    const label: Record<string, string> = {
      style_template: "the style rule",
      continuity_lock: "the continuity rule",
      set_lock: "the set rule",
      avoid_prompt: "the avoid list",
      creative_brief: "the creative brief",
      brand_kit: "the brand kit"
    };
    return { summary: `Set ${label[args.rule]}.`, invalidates: ["bundle"] } satisfies ToolResult;
  }
});
