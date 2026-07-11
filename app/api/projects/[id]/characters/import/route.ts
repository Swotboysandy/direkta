import { NextResponse } from "next/server";
import { generateText } from "ai";
import { beats, projects, characters, locations, activity } from "../../../../../../lib/db/repo";
import { isCodexConnected } from "../../../../../../lib/codex/token";
import { generateTextViaCodex } from "../../../../../../lib/codex/generate";
import { activeModel } from "../../../../../../lib/vendors/resolver";
import type { Character, Location } from "../../../../../../lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SYSTEM = `You are a casting director breaking down a screenplay. List EVERY character and EVERY location.

Return ONLY a JSON object:
{
  "characters": [
    {
      "name": <string: character name in CAPS as the script uses it. If the script implies an unnamed person (e.g. "a girl", "the driver", "a family"), invent a short working name like "A GIRL" or "THE DRIVER">,
      "role": <"Lead" | "Supporting" | "Featured">,
      "dialogue": <true if they speak>,
      "brief": {
        "age": <string like "30s", or "">,
        "build": <string, or "">,
        "features": <string: distinctive physical description implied by the script, or "">,
        "wardrobe": <string, or "">,
        "personality": <string: one line, or "">
      }
    }
  ],
  "locations": [
    { "name": <string, e.g. "WAREHOUSE">, "int_ext": <"INT" | "EXT" | "INT/EXT">, "time_of_day": <string or ""> }
  ]
}

Even a commercial/montage script with no named characters usually implies people — list them with invented working names so they can be cast. No markdown fences. Pure JSON only.`;

/** Import the cast + locations from the project's script WITHOUT touching
 *  beats — safe to run on projects that already have storyboard work. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = projects.get(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!project.script || project.script.trim().length < 30) {
    return NextResponse.json({ error: "No script yet — write or generate one in Screenplay first." }, { status: 400 });
  }

  const prompt = `Break down the cast and locations of this screenplay:\n\n${project.script.slice(0, 20000)}`;

  let raw: string;
  try {
    if (isCodexConnected()) {
      raw = await generateTextViaCodex({ system: SYSTEM, prompt });
    } else {
      const model = activeModel();
      const { text } = await generateText({ model, system: SYSTEM, prompt, maxTokens: 4000 });
      raw = text;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `AI error: ${msg}` }, { status: 502 });
  }

  let parsed: Record<string, unknown>;
  try {
    const json = raw.replace(/^```(?:json)?\s*/im, "").replace(/\s*```\s*$/m, "").trim();
    parsed = JSON.parse(json) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Could not parse the breakdown", raw: raw.slice(0, 300) }, { status: 422 });
  }

  const projectBeats = beats.forProject(id);
  const sceneCountFor = (name: string) =>
    projectBeats.filter((b) => b.characters.some((n) => n.trim().toLowerCase() === name.trim().toLowerCase())).length;

  const existingChars = characters.forProject(id);
  const hasChar = (name: string) =>
    existingChars.some((c) => c.name.trim().toLowerCase() === name.trim().toLowerCase());
  const charData = Array.isArray(parsed.characters) ? (parsed.characters as Record<string, unknown>[]) : [];
  let charsAdded = 0;
  const addedNames: string[] = [];
  for (const c of charData) {
    const name = String(c.name ?? "").trim();
    if (!name || hasChar(name)) continue;
    const roleRaw = String(c.role ?? "Supporting");
    characters.create({
      project_id: id,
      name: name.slice(0, 80),
      role: (["Lead", "Supporting", "Featured"].includes(roleRaw) ? roleRaw : "Supporting") as Character["role"],
      scene_count: sceneCountFor(name),
      dialogue: Boolean(c.dialogue ?? true),
      brief: typeof c.brief === "object" && c.brief ? (c.brief as Character["brief"]) : {}
    });
    charsAdded++;
    addedNames.push(name);
  }

  const existingLocs = locations.forProject(id);
  const hasLoc = (name: string) =>
    existingLocs.some((l) => l.name.trim().toLowerCase() === name.trim().toLowerCase());
  const locData = Array.isArray(parsed.locations) ? (parsed.locations as Record<string, unknown>[]) : [];
  let locsAdded = 0;
  for (const l of locData) {
    const name = String(l.name ?? "").trim();
    if (!name || hasLoc(name)) continue;
    const ie = String(l.int_ext ?? "INT");
    locations.create({
      project_id: id,
      name: name.slice(0, 80),
      int_ext: (["INT", "EXT", "INT/EXT"].includes(ie) ? ie : "INT") as Location["int_ext"],
      time_of_day: String(l.time_of_day ?? "") || undefined,
      scene_count: projectBeats.filter((b) => b.scene_heading.toLowerCase().includes(name.toLowerCase())).length
    });
    locsAdded++;
  }

  if (charsAdded || locsAdded) {
    activity.append({
      project_id: id,
      agent: "casting-dir",
      kind: "success",
      text: `**Casting Director** imported ${charsAdded} character(s) and ${locsAdded} location(s) from the script.`
    });
  }

  return NextResponse.json({
    ok: true,
    characters_added: charsAdded,
    locations_added: locsAdded,
    added: addedNames
  });
}
