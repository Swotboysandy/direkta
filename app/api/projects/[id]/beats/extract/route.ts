import { NextResponse } from "next/server";
import { generateText } from "ai";
import { beats, projects, characters, locations, activity } from "../../../../../../lib/db/repo";
import { isCodexConnected } from "../../../../../../lib/codex/token";
import { generateTextViaCodex } from "../../../../../../lib/codex/generate";
import { activeModel } from "../../../../../../lib/vendors/resolver";
import type { Character, Location } from "../../../../../../lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SYSTEM = `You are a professional script breakdown supervisor. Break the screenplay down COMPLETELY: scene beats, the full cast, and every location.

Return ONLY a JSON object with this exact shape:
{
  "beats": [
    {
      "n": <integer, sequential from 1>,
      "scene_heading": <string: "INT./EXT. LOCATION — TIME" or closest match>,
      "title": <string: 3–6 word dramatic title for this beat>,
      "summary": <string: 1–2 sentences covering the action and dramatic stakes>,
      "characters": [<names of characters who appear or speak — use the exact names from "characters" below>],
      "mood": [<1–3 mood tags, e.g. "tense", "melancholic", "action", "comedic", "intimate", "epic">],
      "props": [<notable physical props or set pieces>],
      "notes": <string: production complexity note, or empty string>,
      "flag": <"attention" if scene requires stunts/VFX/complex logistics, else null>
    }
  ],
  "characters": [
    {
      "name": <string: character name in CAPS as the script uses it. If the script implies an unnamed person (e.g. "a girl", "the driver"), invent a short working name like "A GIRL">,
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
    {
      "name": <string: location name, e.g. "WAREHOUSE", "SUV — INTERIOR">,
      "int_ext": <"INT" | "EXT" | "INT/EXT">,
      "time_of_day": <string like "NIGHT", "DAY", "DAWN", or "">
    }
  ]
}

Even a commercial or montage script with no named characters usually implies people (a driver, a family, a kid) — list them as characters with invented working names so they can be cast. No markdown fences. No preamble. Pure JSON only.`;

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = projects.get(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!project.script || project.script.trim().length < 30) {
    return NextResponse.json({ error: "Script is too short" }, { status: 400 });
  }

  const prompt = `Break down this screenplay:\n\n${project.script.slice(0, 20000)}`;

  let raw: string;
  try {
    if (isCodexConnected()) {
      raw = await generateTextViaCodex({ system: SYSTEM, prompt });
    } else {
      const model = activeModel();
      const { text } = await generateText({ model, system: SYSTEM, prompt, maxTokens: 8000 });
      raw = text;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `AI error: ${msg}` }, { status: 502 });
  }

  let parsed: Record<string, unknown>;
  let beatData: Record<string, unknown>[];
  try {
    const json = raw.replace(/^```(?:json)?\s*/im, "").replace(/\s*```\s*$/m, "").trim();
    const val = JSON.parse(json);
    if (Array.isArray(val)) {
      // Legacy shape (bare beats array) — still accepted.
      parsed = { beats: val };
    } else {
      parsed = val as Record<string, unknown>;
    }
    if (!Array.isArray(parsed.beats)) throw new Error("no beats array");
    beatData = parsed.beats as Record<string, unknown>[];
  } catch {
    return NextResponse.json({ error: "Could not parse breakdown", raw: raw.slice(0, 400) }, { status: 422 });
  }

  beats.deleteForProject(id);
  const created = beatData.map((b, i) =>
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

  // ── Auto-populate Casting: upsert characters found in the breakdown ──────
  // Existing characters (by name, case-insensitive) are left untouched so
  // trained Soul IDs and portraits survive re-extraction.
  const existingChars = characters.forProject(id);
  const hasChar = (name: string) =>
    existingChars.some((c) => c.name.trim().toLowerCase() === name.trim().toLowerCase());
  const charData = Array.isArray(parsed.characters) ? (parsed.characters as Record<string, unknown>[]) : [];
  const sceneCountFor = (name: string) =>
    created.filter((b) => b.characters.some((n) => n.trim().toLowerCase() === name.trim().toLowerCase())).length;

  // Fall back to beat character names when the model returned no cast list.
  const fallbackNames = [...new Set(created.flatMap((b) => b.characters.map((n) => n.trim())))].map((name) => ({
    name,
    role: "Supporting",
    dialogue: true,
    brief: {}
  }));
  const castList = charData.length ? charData : fallbackNames;

  let charsAdded = 0;
  for (const c of castList) {
    const name = String((c as Record<string, unknown>).name ?? "").trim();
    if (!name || hasChar(name)) continue;
    const roleRaw = String((c as Record<string, unknown>).role ?? "Supporting");
    const role = (["Lead", "Supporting", "Featured"].includes(roleRaw) ? roleRaw : "Supporting") as Character["role"];
    const briefRaw = (c as Record<string, unknown>).brief;
    characters.create({
      project_id: id,
      name: name.slice(0, 80),
      role,
      scene_count: sceneCountFor(name),
      dialogue: Boolean((c as Record<string, unknown>).dialogue ?? true),
      brief: typeof briefRaw === "object" && briefRaw ? (briefRaw as Character["brief"]) : {}
    });
    charsAdded++;
  }

  // ── Auto-populate Locations from the breakdown ───────────────────────────
  const existingLocs = locations.forProject(id);
  const hasLoc = (name: string) =>
    existingLocs.some((l) => l.name.trim().toLowerCase() === name.trim().toLowerCase());
  const locData = Array.isArray(parsed.locations) ? (parsed.locations as Record<string, unknown>[]) : [];
  let locsAdded = 0;
  for (const l of locData) {
    const name = String((l as Record<string, unknown>).name ?? "").trim();
    if (!name || hasLoc(name)) continue;
    const ie = String((l as Record<string, unknown>).int_ext ?? "INT");
    locations.create({
      project_id: id,
      name: name.slice(0, 80),
      int_ext: (["INT", "EXT", "INT/EXT"].includes(ie) ? ie : "INT") as Location["int_ext"],
      time_of_day: String((l as Record<string, unknown>).time_of_day ?? "") || undefined,
      scene_count: created.filter((b) => b.scene_heading.toLowerCase().includes(name.toLowerCase())).length
    });
    locsAdded++;
  }

  activity.append({
    project_id: id,
    agent: "beat-writer",
    kind: "success",
    text: `**Beat Writer** extracted ${created.length} beats from ${project.script.trim().split(/\s+/).length} words.`
  });
  if (charsAdded || locsAdded) {
    activity.append({
      project_id: id,
      agent: "casting-dir",
      kind: "success",
      text: `**Casting Director** pulled ${charsAdded} character(s) and ${locsAdded} location(s) from the script — cast their looks in Casting.`
    });
  }

  return NextResponse.json({
    beats: created,
    count: created.length,
    characters_added: charsAdded,
    locations_added: locsAdded
  });
}
