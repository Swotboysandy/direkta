import { NextResponse } from "next/server";
import { projects } from "../../../../../lib/db/repo";
import { skillForPart } from "../../../../../lib/skills/loader";
import { generateStructured } from "../../../../../lib/agents/fallback";
import { breakdownShape, BREAKDOWN_JSON_INSTRUCTION } from "../../../../../lib/agents/screenplay/schema";
import { importBreakdown } from "../../../../../lib/agents/screenplay/import";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const FALLBACK_SYSTEM =
  "You are Direkta's Screenplay Agent. Refract the script through analytical lenses, ground every " +
  "claim in the page (never invent, never import outside history), and turn it into a Movie Bible " +
  "with a dense identity descriptor per character and numbered beats minted last. Surface gaps.";

// POST /api/projects/:id/breakdown — the FALLBACK engine's equivalent of Claude's import_breakdown.
// Runs the screenplay skill through Codex (keyless ChatGPT) or the AI-SDK vendor, then persists the
// same rich Bible via importBreakdown. Same artifacts as the Claude/MCP path.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = projects.get(id);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  const script = (project.script ?? "").trim();
  if (script.length < 30) return NextResponse.json({ error: "Script is too short to analyse." }, { status: 400 });

  const skill = skillForPart("screenplay")?.body?.trim() || FALLBACK_SYSTEM;
  const system = `${skill}\n\n${BREAKDOWN_JSON_INSTRUCTION}`;
  const prompt = [
    `Project title: ${project.title}`,
    `Project premise: ${project.premise || "(none)"}`,
    `Target aspect ratio: ${project.aspect_ratio}`,
    "",
    "SCRIPT / TREATMENT / STORY:",
    script.slice(0, 40000)
  ].join("\n");

  try {
    const { data, engine } = await generateStructured({ system, prompt, shape: breakdownShape });
    const result = importBreakdown(id, data);
    return NextResponse.json({ ok: true, engine, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Breakdown failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
