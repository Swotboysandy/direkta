import { NextResponse } from "next/server";
import { beats, bible, characters, projects } from "../../../../../../lib/db/repo";
import { skillForPart } from "../../../../../../lib/skills/loader";
import { generateStructured } from "../../../../../../lib/agents/fallback";
import { buildLookLock, castIdentityLines } from "../../../../../../lib/agents/cinematographer/lookLock";
import { coverageShape, COVERAGE_JSON_INSTRUCTION } from "../../../../../../lib/agents/cinematographer/shotlistSchema";
import { importShotlist } from "../../../../../../lib/agents/cinematographer/import";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

// POST /api/storyboard/rows/:beatId/shotlist — the FALLBACK engine's equivalent of Claude composing
// coverage and calling import_shotlist. Builds the look-lock + cast-identity deterministically from
// the Bible, has Codex (or the vendor) compose the coverage, then persists via importShotlist.
export async function POST(_req: Request, { params }: { params: Promise<{ beatId: string }> }) {
  const { beatId } = await params;
  const beat = beats.get(beatId);
  if (!beat) return NextResponse.json({ error: "Beat not found" }, { status: 404 });
  const project = projects.get(beat.project_id);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const lookLock = buildLookLock(bible.get(project.id));
  const castIdentity = castIdentityLines(characters.forProject(project.id), beat.characters);
  const skill = skillForPart("cinematography")?.body?.trim() ?? "";

  const system = [
    skill,
    lookLock ? `LOOK-LOCK (compose this block verbatim into every prompt):\n${lookLock}` : "",
    castIdentity.length ? `CAST IDENTITY (use each descriptor verbatim):\n${castIdentity.map((l) => `- ${l}`).join("\n")}` : "",
    COVERAGE_JSON_INSTRUCTION
  ]
    .filter(Boolean)
    .join("\n\n");

  const prompt = [
    `BEAT S${beat.n} — ${beat.scene_heading} — "${beat.title}"`,
    beat.summary,
    beat.mood.length ? `Mood: ${beat.mood.join(", ")}` : "",
    `Aspect ratio: ${project.aspect_ratio}`
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const { data, engine } = await generateStructured({ system, prompt, shape: coverageShape });
    const res = importShotlist(project.id, beat.id, {
      look_lock: lookLock,
      cast_identity: castIdentity,
      dramatic_point: data.dramatic_point,
      coverage_rationale: data.coverage_rationale,
      shots: data.shots
    });
    return NextResponse.json({ ok: true, engine, ...res });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cinematographer failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
