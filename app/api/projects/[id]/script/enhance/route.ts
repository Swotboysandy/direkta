import { NextResponse } from "next/server";
import { streamText } from "ai";
import { activeModel } from "../../../../../../lib/vendors/resolver";
import { projects } from "../../../../../../lib/db/repo";
import { isCodexConnected } from "../../../../../../lib/codex/token";
import { streamTextViaCodex } from "../../../../../../lib/codex/generate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Rewrite an existing (usually thin) script into a director's draft.
 *
 * The generate route turns a premise into a screenplay; this one takes whatever
 * is already there — a few lines, an outline, a first pass — and deepens it,
 * then attaches per-shot direction so each beat is directly filmable frame by
 * frame. Same Codex-first path as generate.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = projects.get(id);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const source = typeof body.script === "string" && body.script.trim() ? body.script : project.script;
  if (!source.trim()) {
    return NextResponse.json({ error: "Nothing to enhance — write or generate a script first." }, { status: 400 });
  }

  const systemPrompt = `You are a director-screenwriter preparing a shooting draft for an AI film pipeline that renders one image per beat and animates it.

Rewrite the script you are given. Keep the writer's story, characters and intent — deepen the execution:
- Raise the subtext. Let characters want something they don't say outright.
- Escalate: every scene should turn, and end somewhere different from where it started.
- Cut anything unfilmable (interior thought, backstory told not shown) and replace it with an image that carries the same meaning.
- Keep dialogue lean and spoken-sounding. Trim any line an actor would fight you over.

Then make it shootable. After each scene's action and dialogue, append a DIRECTION block:

DIRECTION
> SHOT: the frame — size (WIDE/MEDIUM/CLOSE/INSERT), angle, and what is composed where
> MOVE: camera motion, or LOCKED if none
> LIGHT: source, direction, time of day, quality
> SOUND: ambience, and any specific effect the cut needs
> CONTINUITY: exactly what carries in from the previous scene — wardrobe, vehicle, props, light level, who is where

Rules for DIRECTION:
- One block per scene. Never merge scenes.
- CONTINUITY must name concrete objects, never "as before".
- Describe only what a camera can see.

Format: strict Fountain — INT./EXT. LOCATION — TIME in caps, present-tense action, CHARACTER cues in caps.
Output only the rewritten screenplay with its DIRECTION blocks. No preamble, no commentary, no markdown fences.`;

  const userPrompt = `Rewrite and deepen this ${project.format} script into a shooting draft.

TITLE: ${project.title}${project.genre ? `\nGENRE: ${project.genre}` : ""}${
    project.logline ? `\nLOGLINE: ${project.logline}` : ""
  }${project.premise ? `\nPREMISE: ${project.premise}` : ""}${
    project.creative_brief ? `\nCREATIVE BRIEF (follow closely): ${project.creative_brief}` : ""
  }${
    project.style_template
      ? `\nSTYLE LOCK (these hold in every shot — reflect them in DIRECTION, never contradict them): ${project.style_template}`
      : ""
  }${
    project.brand_kit
      ? `\nBRAND / PRODUCT PLACEMENT: ${project.brand_kit} — present naturally, never as an ad.`
      : ""
  }
ASPECT RATIO: ${project.aspect_ratio}

--- SCRIPT TO REWRITE ---
${source}
--- END ---

Write the full rewritten draft now, starting at the first scene heading.`;

  if (isCodexConnected()) {
    try {
      const stream = await streamTextViaCodex({ system: systemPrompt, prompt: userPrompt });
      return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8" } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: `Codex error: ${msg}` }, { status: 502 });
    }
  }

  let model;
  try {
    model = activeModel();
  } catch {
    return NextResponse.json(
      { error: "No text vendor configured. Import Codex token or add an API key in Key Vault." },
      { status: 503 }
    );
  }
  const result = streamText({ model, system: systemPrompt, prompt: userPrompt, maxTokens: 12000 });
  return result.toTextStreamResponse();
}
