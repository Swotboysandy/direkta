import { NextResponse } from "next/server";
import { streamText } from "ai";
import { activeModel } from "../../../../../../lib/vendors/resolver";
import { projects } from "../../../../../../lib/db/repo";
import { isCodexConnected } from "../../../../../../lib/codex/token";
import { streamTextViaCodex } from "../../../../../../lib/codex/generate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = projects.get(id);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const lengthGuide =
    project.format === "Feature"
      ? "85–110 pages (full feature)"
      : project.length_estimate === "Under 1 min"
        ? "under 1 page — a 15–45 second piece (social ad / meme / micro-short): 2–5 quick scenes, minimal or no dialogue"
        : project.length_estimate === "Under 5 min"
          ? "5–8 pages"
          : project.length_estimate === "5–15 min"
            ? "12–22 pages"
            : "25–45 pages";

  const systemPrompt = `You are an expert Hollywood screenwriter. Write screenplays in strict Fountain/Final Draft format:
- Scene headings: INT./EXT. LOCATION — TIME (ALL CAPS)
- Action lines: concise, visual, present tense
- Character cue: CHARACTER NAME (ALL CAPS, on its own line)
- Dialogue: below the character cue, indented
- Parentheticals sparingly
Output only the screenplay — no preamble, no comments, no markdown fences.`;

  const userPrompt = `Write a ${project.format} screenplay.

TITLE: ${project.title}
PREMISE: ${project.premise}${project.logline ? `\nLOGLINE: ${project.logline}` : ""}${
    project.creative_brief ? `\nCREATIVE BRIEF (follow this closely): ${project.creative_brief}` : ""
  }${
    project.brand_kit
      ? `\nBRAND / PRODUCT PLACEMENT: ${project.brand_kit} — weave these products naturally into scenes and action lines.`
      : ""
  }
TARGET LENGTH: ${lengthGuide}

Write the complete screenplay now. Start with the first scene heading.`;

  // Prefer Codex (ChatGPT subscription) when the token has been imported.
  if (isCodexConnected()) {
    try {
      const stream = await streamTextViaCodex({ system: systemPrompt, prompt: userPrompt });
      return new Response(stream, {
        headers: { "content-type": "text/plain; charset=utf-8" }
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: `Codex error: ${msg}` }, { status: 502 });
    }
  }

  // Fall back to configured text vendor (OpenAI API key, Anthropic, etc.)
  let model;
  try {
    model = activeModel();
  } catch {
    return NextResponse.json(
      { error: "No text vendor configured. Import Codex token or add an API key in Key Vault." },
      { status: 503 }
    );
  }

  const result = streamText({ model, system: systemPrompt, prompt: userPrompt, maxTokens: 6000 });
  return result.toTextStreamResponse();
}
