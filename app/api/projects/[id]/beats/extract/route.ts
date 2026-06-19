import { NextResponse } from "next/server";
import { generateText } from "ai";
import { beats, projects, activity } from "../../../../../../lib/db/repo";
import { isCodexConnected } from "../../../../../../lib/codex/token";
import { generateTextViaCodex } from "../../../../../../lib/codex/generate";
import { activeModel } from "../../../../../../lib/vendors/resolver";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SYSTEM = `You are a professional script breakdown supervisor. Extract every scene beat from the screenplay.

Return ONLY a JSON array. Each element:
{
  "n": <integer, sequential from 1>,
  "scene_heading": <string: "INT./EXT. LOCATION — TIME" or closest match>,
  "title": <string: 3–6 word dramatic title for this beat>,
  "summary": <string: 1–2 sentences covering the action and dramatic stakes>,
  "characters": [<names of characters who appear or speak>],
  "mood": [<1–3 mood tags, e.g. "tense", "melancholic", "action", "comedic", "intimate", "epic">],
  "props": [<notable physical props or set pieces>],
  "notes": <string: production complexity note, or empty string>,
  "flag": <"attention" if scene requires stunts/VFX/complex logistics, else null>
}

No markdown fences. No preamble. Pure JSON array only.`;

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = projects.get(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!project.script || project.script.trim().length < 30) {
    return NextResponse.json({ error: "Script is too short" }, { status: 400 });
  }

  const prompt = `Extract all scene beats from this screenplay:\n\n${project.script.slice(0, 20000)}`;

  let raw: string;
  try {
    if (isCodexConnected()) {
      raw = await generateTextViaCodex({ system: SYSTEM, prompt });
    } else {
      const model = activeModel();
      const { text } = await generateText({ model, system: SYSTEM, prompt, maxTokens: 6000 });
      raw = text;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `AI error: ${msg}` }, { status: 502 });
  }

  let beatData: unknown[];
  try {
    const json = raw.replace(/^```(?:json)?\s*/im, "").replace(/\s*```\s*$/m, "").trim();
    beatData = JSON.parse(json);
    if (!Array.isArray(beatData)) throw new Error("not an array");
  } catch {
    return NextResponse.json({ error: "Could not parse beat data", raw: raw.slice(0, 400) }, { status: 422 });
  }

  beats.deleteForProject(id);
  const created = (beatData as Record<string, unknown>[]).map((b, i) =>
    beats.create({
      project_id: id,
      n: Number(b.n) || i + 1,
      scene_heading: String(b.scene_heading ?? ""),
      title: String(b.title ?? ""),
      summary: String(b.summary ?? ""),
      characters: Array.isArray(b.characters) ? b.characters.map(String) : [],
      mood: Array.isArray(b.mood) ? b.mood.map(String) : [],
      props: Array.isArray(b.props) ? b.props.map(String) : [],
      notes: String(b.notes ?? ""),
      flag: b.flag ? String(b.flag) : null
    })
  );

  activity.append({
    project_id: id,
    agent: "beat-writer",
    kind: "success",
    text: `**Beat Writer** extracted ${created.length} beats from ${project.script.trim().split(/\s+/).length} words.`
  });

  return NextResponse.json({ beats: created, count: created.length });
}
