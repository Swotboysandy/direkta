// Direkta MCP server.
//
// In the in-house model, the Claude chat session IS the backend pipeline: it parses the script
// (Screenplay Agent), composes look-locked coverage (Cinematographer), and drives generation
// (Higgsfield Operator) via MCP. This server is how that work lands in Direkta — Claude calls
// these tools to read project state and import the structured artifacts it produced. Direkta
// stays the interface + store; no server-side LLM calls, no API keys.
//
// Run:  npm run mcp     (tsx mcp/direkta-server.ts, from the repo root so it shares ./data)
// Wire: claude mcp add direkta -- tsx <abs>/mcp/direkta-server.ts   (cwd = repo root)

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { beats, bible, characters, clarifications, locations, projects } from "../lib/db/repo";
import { breakdownShape } from "../lib/agents/screenplay/schema";
import { importBreakdown } from "../lib/agents/screenplay/import";
import { importShotlist } from "../lib/agents/cinematographer/import";
import { buildLookLock, castIdentityLines } from "../lib/agents/cinematographer/lookLock";
import { getShotlist, importGeneration } from "../lib/agents/operator/generation";
import { writeWorklist, syncInbox } from "../lib/agents/operator/sync";
import type { AspectRatio, LengthEstimate, ProjectFormat } from "../lib/types";

const server = new McpServer({ name: "direkta", version: "1.0.0" });

const ok = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] });
const fail = (e: unknown) => ({
  content: [{ type: "text" as const, text: `Error: ${e instanceof Error ? e.message : String(e)}` }],
  isError: true
});

// ── Read: pick a project ──────────────────────────────────────────────────
server.registerTool(
  "list_projects",
  { description: "List Direkta projects (id, title, format, whether a script was submitted)." },
  async () => {
    try {
      return ok(
        projects.list().map((p) => ({
          id: p.id,
          title: p.title,
          format: p.format,
          script_submitted: p.script_submitted,
          beats: beats.count(p.id)
        }))
      );
    } catch (e) {
      return fail(e);
    }
  }
);

// ── Read: full context for acting on a project ─────────────────────────────
server.registerTool(
  "get_project",
  {
    description:
      "Full context for a project: metadata, the raw script, the Bible, beats, the computed " +
      "look-lock + cast identity (for the Cinematographer), and any pending director clarifications.",
    inputSchema: { project_id: z.string() }
  },
  async ({ project_id }) => {
    try {
      const project = projects.get(project_id);
      if (!project) return fail(`Project not found: ${project_id}`);
      const b = bible.get(project_id);
      const cast = characters.forProject(project_id);
      return ok({
        project,
        script: project.script,
        bible: b,
        look_lock: buildLookLock(b),
        cast_identity: castIdentityLines(cast),
        characters: cast.map((c) => ({ name: c.name, role: c.role, identity_descriptor: c.identity_descriptor })),
        locations: locations.forProject(project_id).map((l) => ({ name: l.name, int_ext: l.int_ext, time_of_day: l.time_of_day })),
        beats: beats.forProject(project_id).map((bt) => ({
          id: bt.id,
          n: bt.n,
          scene_heading: bt.scene_heading,
          title: bt.title,
          summary: bt.summary,
          characters: bt.characters,
          mood: bt.mood
        })),
        pending_clarifications: clarifications.pending(project_id)
      });
    } catch (e) {
      return fail(e);
    }
  }
);

// ── Write: create a film ───────────────────────────────────────────────────
server.registerTool(
  "create_project",
  {
    description: "Create a new Direkta project (film).",
    inputSchema: {
      title: z.string(),
      premise: z.string().optional(),
      script: z.string().optional().describe("Optional raw script to store now."),
      format: z.string().optional(),
      length_estimate: z.string().optional(),
      aspect_ratio: z.string().optional()
    }
  },
  async ({ title, premise, script, format, length_estimate, aspect_ratio }) => {
    try {
      const p = projects.create({
        title,
        premise,
        format: format as ProjectFormat | undefined,
        length_estimate: length_estimate as LengthEstimate | undefined,
        aspect_ratio: aspect_ratio as AspectRatio | undefined
      });
      if (typeof script === "string" && script.trim()) projects.update(p.id, { script });
      return ok({ id: p.id, title: p.title });
    } catch (e) {
      return fail(e);
    }
  }
);

// ── Write: import the Screenplay Agent's breakdown (the Movie Bible) ────────
server.registerTool(
  "import_breakdown",
  {
    description:
      "Import a screenplay breakdown produced by the Screenplay Agent: logline/synopsis/tone/themes, " +
      "world, visual language, character spreads (each with a dense identity descriptor), locations, " +
      "numbered beats, and gaps. Persists across projects/bible/characters/locations/beats; gaps become " +
      "director clarifications. Replaces any prior breakdown.",
    inputSchema: { project_id: z.string(), breakdown: z.object(breakdownShape) }
  },
  async ({ project_id, breakdown }) => {
    try {
      return ok(importBreakdown(project_id, breakdown));
    } catch (e) {
      return fail(e);
    }
  }
);

// ── Write: import the Cinematographer's look-locked coverage for a beat ─────
server.registerTool(
  "import_shotlist",
  {
    description:
      "Import a beat's look-locked coverage from the Cinematographer: the look-lock, cast identity, " +
      "dramatic point, coverage rationale, and the shots (each a 5-layer positive prompt + negative + " +
      "aspect + seed/identity). Stored as storyboard variants awaiting generation. Replaces prior variants for the beat.",
    inputSchema: {
      project_id: z.string(),
      beat_id: z.string(),
      look_lock: z.string(),
      cast_identity: z.array(z.string()),
      dramatic_point: z.string(),
      coverage_rationale: z.string(),
      shots: z.array(
        z.object({
          angle: z.string(),
          positive: z.string(),
          negative: z.string(),
          aspect: z.string(),
          seed_identity: z.string()
        })
      )
    }
  },
  async ({ project_id, beat_id, look_lock, cast_identity, dramatic_point, coverage_rationale, shots }) => {
    try {
      return ok(importShotlist(project_id, beat_id, { look_lock, cast_identity, dramatic_point, coverage_rationale, shots }));
    } catch (e) {
      return fail(e);
    }
  }
);

// ── Read: the shots to generate (the Operator's worklist) ──────────────────
server.registerTool(
  "get_shotlist",
  {
    description:
      "Read the coverage shots for a project (optionally one beat) — each shot's prompt, negative, " +
      "aspect, seed/identity, state, and any rendered asset URL. This is the Operator's worklist: " +
      "feed each prompt to a creative-generation MCP, then call import_generation with the result.",
    inputSchema: { project_id: z.string(), beat_id: z.string().optional() }
  },
  async ({ project_id, beat_id }) => {
    try {
      return ok(getShotlist(project_id, beat_id));
    } catch (e) {
      return fail(e);
    }
  }
);

// ── Write: attach a generated frame to its shot ────────────────────────────
server.registerTool(
  "import_generation",
  {
    description:
      "Attach a generated frame (a URL produced by a creative-generation MCP) to a storyboard " +
      "variant and mark it complete. Call this after rendering a shot from get_shotlist.",
    inputSchema: {
      variant_id: z.string(),
      url: z.string().describe("The generated asset URL (served by /oss or a remote host)."),
      prompt: z.string().optional(),
      model: z.string().optional()
    }
  },
  async ({ variant_id, url, prompt, model }) => {
    try {
      return ok(importGeneration(variant_id, { url, prompt, model }));
    } catch (e) {
      return fail(e);
    }
  }
);

// ── Write: the director's answer to a gap ──────────────────────────────────
server.registerTool(
  "resolve_clarification",
  {
    description: "Record a director's decision on a gap the Screenplay Agent raised.",
    inputSchema: { clarification_id: z.string(), resolution: z.string() }
  },
  async ({ clarification_id, resolution }) => {
    try {
      clarifications.resolve(clarification_id, resolution);
      return ok({ ok: true });
    } catch (e) {
      return fail(e);
    }
  }
);

// ── Codex generation worker: write the worklist of shots to generate ───────
server.registerTool(
  "write_worklist",
  {
    description:
      "Write the project's pending shots (id + prompt + negative + aspect) to worklist.json for the " +
      "Codex Record-&-Replay generation worker. Codex's recorded skill iterates the worklist, generates " +
      "each shot in a free web UI, and saves each download into the inbox folder named `frame_<id>.<ext>`.",
    inputSchema: { project_id: z.string() }
  },
  async ({ project_id }) => {
    try {
      return ok(writeWorklist(project_id));
    } catch (e) {
      return fail(e);
    }
  }
);

// ── Codex generation worker: ingest finished files from the inbox ──────────
server.registerTool(
  "sync_generations",
  {
    description:
      "Ingest generated files from the inbox folder into Direkta: each `frame_<variant_id>.<ext>` is " +
      "copied to OSS and attached to its storyboard variant; each `clip_<stitch_node_id>.<ext>` to its " +
      "stitch node. Processed files move to inbox/_done. Run after the Codex worker finishes generating.",
    inputSchema: { inbox_dir: z.string().optional() }
  },
  async ({ inbox_dir }) => {
    try {
      return ok(syncInbox(inbox_dir ? { inboxDir: inbox_dir } : undefined));
    } catch (e) {
      return fail(e);
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stdout is the JSON-RPC channel — log to stderr only.
  console.error("[direkta-mcp] ready (stdio)");
}

main().catch((e) => {
  console.error("[direkta-mcp] fatal:", e);
  process.exit(1);
});
