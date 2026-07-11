import { NextResponse } from "next/server";
import { generateText } from "ai";
import { getDb } from "../../../../../../lib/db/client";
import { activeModel } from "../../../../../../lib/vendors/resolver";
import { isCodexConnected } from "../../../../../../lib/codex/token";
import { generateTextViaCodex } from "../../../../../../lib/codex/generate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SYSTEM = `You are a feature-film cinematographer writing an image-generation prompt for ONE storyboard frame.
Rules:
- Describe ONE single cinematic moment — one frame, one scene. Never a montage, grid, collage, or multiple panels.
- Concrete and visual: subject, action, setting, light, atmosphere, color.
- Honor the requested shot size, camera angle, lens and movement exactly.
- Name the characters present so reference-image locking can match them.
- 60-110 words, one paragraph. Output ONLY the prompt text — no preamble, no quotes, no markdown.`;

/** Directs the text model to write the frame prompt from the script context. */
export async function POST(_req: Request, { params }: { params: Promise<{ beatId: string }> }) {
  const { beatId } = await params;
  const db = getDb();

  const beat = db
    .prepare(
      `SELECT b.n, b.title, b.scene_heading, b.summary, b.characters, b.mood,
              p.title AS project_title, p.premise, p.genre, p.aspect_ratio
       FROM beats b JOIN projects p ON p.id = b.project_id WHERE b.id = ?`
    )
    .get(beatId) as
    | {
        n: number;
        title: string;
        scene_heading: string;
        summary: string;
        characters: string;
        mood: string;
        project_title: string;
        premise: string;
        genre: string;
        aspect_ratio: string;
      }
    | undefined;
  if (!beat) return NextResponse.json({ error: "Beat not found" }, { status: 404 });

  const row = db.prepare("SELECT style FROM storyboard_rows WHERE beat_id = ?").get(beatId) as
    | { style: string }
    | undefined;
  const style = row?.style ? JSON.parse(row.style) : {};

  const chars = safeList(beat.characters);
  const mood = safeList(beat.mood);
  const userPrompt = `FILM: ${beat.project_title} (${beat.genre || "drama"}) — ${beat.premise}
BEAT ${beat.n}: ${beat.title}
SCENE: ${beat.scene_heading}
WHAT HAPPENS: ${beat.summary || beat.title}
CHARACTERS IN FRAME: ${chars.join(", ") || "none named"}
MOOD: ${mood.join(", ") || "—"}
CAMERA: ${style.shot_size ?? "Wide"} shot · ${style.camera_angle ?? "Eye level"} angle · ${style.lens ?? "35mm"} · ${style.movement ?? "Locked"}
LOOK: ${style.visual ?? "Naturalistic"} · ${style.light ?? "Natural"} light · ${style.temp ?? "Neutral"} palette · aspect ${style.aspect ?? beat.aspect_ratio}

Write the single-frame image prompt now.`;

  try {
    let text: string;
    if (isCodexConnected()) {
      text = await generateTextViaCodex({ system: SYSTEM, prompt: userPrompt });
    } else {
      const model = activeModel();
      const res = await generateText({ model, system: SYSTEM, prompt: userPrompt, maxTokens: 400 });
      text = res.text;
    }
    const prompt = text.trim().replace(/^["'`]+|["'`]+$/g, "");
    if (!prompt) throw new Error("Empty prompt returned");
    return NextResponse.json({ prompt });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Prompt generation failed — connect Codex or add a text API key in Key Vault." },
      { status: 502 }
    );
  }
}

function safeList(raw: string | null | undefined): string[] {
  try {
    const parsed = JSON.parse(raw ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
