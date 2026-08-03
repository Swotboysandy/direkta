import { NextResponse } from "next/server";
import { generateText } from "ai";
import { beats, projects, characters, locations, props, activity } from "../../../../../../lib/db/repo";
import { isCodexConnected } from "../../../../../../lib/codex/token";
import { generateTextViaCodex } from "../../../../../../lib/codex/generate";
import { activeModel } from "../../../../../../lib/vendors/resolver";
import type { Character, Location } from "../../../../../../lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SYSTEM = `You are a professional script breakdown supervisor. Break the screenplay down COMPLETELY: scene beats, the full cast, every location, and every recurring named prop.

BREAK SCENES INTO SHOTS, NOT ONE BEAT PER SCENE.
Each beat becomes ONE generated frame that is then animated into a clip of a few
seconds, so a beat is a SHOT, not a scene. A scene almost always contains several.
Cut a new beat every time any of these changes:
  - the camera (a new size or angle — wide to medium, medium to close, a reverse)
  - who is on screen, or where they are standing
  - the location or the time of day
  - the dramatic turn (a reveal, a decision, an interruption, an arrival)
  - a significant action beat inside a continuous move
A one-page scene typically yields 3 to 6 beats. A long or eventful scene yields more.
Never merge two camera set-ups into a single beat, and never let one beat cover more
than a few seconds of screen time — long beats are where generated shots drift.
Keep beats in strict story order and number them sequentially across the whole script,
continuing the count from scene to scene rather than restarting.

Return ONLY a JSON object with this exact shape:
{
  "beats": [
    {
      "n": <integer, sequential from 1>,
      "scene_heading": <string: "INT./EXT. LOCATION — TIME" or closest match>,
      "title": <string: 3–6 word dramatic title for this beat>,
      "summary": <string: 1–2 sentences covering the action and dramatic stakes>,
      "characters": [<names of characters who appear or speak — use the exact names from "characters" below>],
      "location": <string: exact name of the matching entry in "locations" below this beat takes place in, or "" if none apply>,
      "mood": [<1–3 mood tags, e.g. "tense", "melancholic", "action", "comedic", "intimate", "epic">],
      "props": [<notable physical props or set pieces visible or used in this beat>],
      "notes": <string: production complexity note, or empty string>,
      "direction": <string: if the script has a DIRECTION block for this scene, copy its SHOT / MOVE / LIGHT / SOUND / CONTINUITY lines here verbatim as one string. If it has none, write the shot yourself in the same form: "SHOT: … MOVE: … LIGHT: … SOUND: … CONTINUITY: …">,
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
        "personality": <string: one line, or "">,
        "physical_form": <"human" for an ordinary person; "creature" for a non-human being with a physical body (animal, monster, cosmic being); "colossus" for a giant/massive nonhuman entity; "abstract" for a presence that is NEVER physically shown on screen and exists only as voice-over, narration or an implied wrongness (no face, no body, no portrait is ever drawn of them) — default "human">
      }
    }
  ],
  "locations": [
    {
      "name": <string: location name, e.g. "WAREHOUSE", "SUV — INTERIOR">,
      "int_ext": <"INT" | "EXT" | "INT/EXT" | "ABSTRACT" — use "ABSTRACT" only for a non-physical space with no real interior or exterior, e.g. a dream realm, a void, a memory-space>,
      "time_of_day": <string like "NIGHT", "DAY", "DAWN", or "">
    }
  ],
  "props": [
    {
      "name": <string: a NAMED, recurring artifact or object that reappears across multiple scenes and needs a consistent visual design (a specific weapon, a signature vehicle, a magical item) — do NOT list generic one-off set dressing>,
      "description": <string: material, shape, distinguishing detail implied by the script, or "">
    }
  ]
}

Even a commercial or montage script with no named characters usually implies people (a driver, a family, a kid) — list them as characters with invented working names so they can be cast. Do not invent a "locations" entry for non-spatial slugs like "BLACK SCREEN", "TITLE CARD" or "SUPER:" — only real places (or the special "ABSTRACT" non-physical spaces described above). No markdown fences. No preamble. Pure JSON only.`;

const VALID_PHYSICAL_FORMS = ["human", "creature", "colossus", "abstract"];
const VALID_INT_EXT = ["INT", "EXT", "INT/EXT", "ABSTRACT"];
// Non-spatial slugs the AI sometimes reads as a "location" — these aren't
// real places and would otherwise become fake Location rows that self-match
// against the heading substring in the storyboard generate route.
const NON_LOCATION_NAME = /^(BLACK|WHITE|BLANK)\s*(SCREEN)?$|^TITLE\s*(CARD)?$|^SUPER:?$|^CREDITS?$|^END$|^FADE\s*(IN|OUT)$|^MONTAGE$/i;

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
      const { text } = await generateText({ model, system: SYSTEM, prompt, maxTokens: 24000 });
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

  // ── Auto-populate Locations from the breakdown FIRST — beats need each
  //    location's id to populate beats.location_id below (a real per-beat
  //    link, not just a heading-substring guess made later at frame time).
  const existingLocs = locations.forProject(id);
  const hasLoc = (name: string) =>
    existingLocs.some((l) => l.name.trim().toLowerCase() === name.trim().toLowerCase());
  const locData = Array.isArray(parsed.locations) ? (parsed.locations as Record<string, unknown>[]) : [];
  const locNameToId = new Map<string, string>(
    existingLocs.map((l) => [l.name.trim().toUpperCase(), l.id])
  );
  let locsAdded = 0;
  for (const l of locData) {
    const name = String((l as Record<string, unknown>).name ?? "").trim();
    if (!name || NON_LOCATION_NAME.test(name)) continue;
    const key = name.toUpperCase();
    if (hasLoc(name)) continue;
    const ie = String((l as Record<string, unknown>).int_ext ?? "INT");
    const created = locations.create({
      project_id: id,
      name: name.slice(0, 80),
      int_ext: (VALID_INT_EXT.includes(ie) ? ie : "INT") as Location["int_ext"],
      time_of_day: String((l as Record<string, unknown>).time_of_day ?? "") || undefined,
      scene_count: beatData.filter((b) => String(b.location ?? "").trim().toLowerCase() === name.toLowerCase()).length
    });
    locNameToId.set(key, created.id);
    locsAdded++;
  }

  beats.deleteForProject(id);
  const created = beatData.map((b, i) => {
    const beatLocationName = String(b.location ?? "").trim().toUpperCase();
    return beats.create({
      project_id: id,
      n: Number(b.n) || i + 1,
      scene_heading: String(b.scene_heading ?? ""),
      title: String(b.title ?? ""),
      summary: String(b.summary ?? ""),
      characters: Array.isArray(b.characters) ? b.characters.map(String) : [],
      location_id: beatLocationName ? locNameToId.get(beatLocationName) ?? null : null,
      mood: Array.isArray(b.mood) ? b.mood.map(String) : [],
      props: Array.isArray(b.props) ? b.props.map(String) : [],
      notes: String(b.notes ?? ""),
      direction: String(b.direction ?? ""),
      flag: b.flag ? String(b.flag) : null
    });
  });

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
    const brief: Character["brief"] = typeof briefRaw === "object" && briefRaw ? { ...(briefRaw as Character["brief"]) } : {};
    if (!VALID_PHYSICAL_FORMS.includes(brief.physical_form ?? "")) brief.physical_form = "human";
    characters.create({
      project_id: id,
      name: name.slice(0, 80),
      role,
      scene_count: sceneCountFor(name),
      dialogue: Boolean((c as Record<string, unknown>).dialogue ?? true),
      brief
    });
    charsAdded++;
  }

  // ── Auto-populate recurring props from the breakdown ─────────────────────
  const existingProps = props.forProject(id);
  const hasProp = (name: string) =>
    existingProps.some((p) => p.name.trim().toLowerCase() === name.trim().toLowerCase());
  const propData = Array.isArray(parsed.props) ? (parsed.props as Record<string, unknown>[]) : [];
  let propsAdded = 0;
  for (const p of propData) {
    const name = String((p as Record<string, unknown>).name ?? "").trim();
    if (!name || hasProp(name)) continue;
    props.create({
      project_id: id,
      name: name.slice(0, 120),
      description: String((p as Record<string, unknown>).description ?? "").slice(0, 500),
      scene_count: created.filter((b) => b.props.some((n) => n.trim().toLowerCase().includes(name.toLowerCase()))).length
    });
    propsAdded++;
  }

  activity.append({
    project_id: id,
    agent: "beat-writer",
    kind: "success",
    text: `**Beat Writer** extracted ${created.length} beats from ${project.script.trim().split(/\s+/).length} words.`
  });
  if (charsAdded || locsAdded || propsAdded) {
    activity.append({
      project_id: id,
      agent: "casting-dir",
      kind: "success",
      text: `**Casting Director** pulled ${charsAdded} character(s), ${locsAdded} location(s) and ${propsAdded} prop(s) from the script — cast their looks in Casting.`
    });
  }

  return NextResponse.json({
    beats: created,
    count: created.length,
    characters_added: charsAdded,
    locations_added: locsAdded,
    props_added: propsAdded
  });
}
