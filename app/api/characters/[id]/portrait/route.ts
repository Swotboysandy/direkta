import { NextResponse } from "next/server";
import { characters, projects, vendors } from "../../../../../lib/db/repo";
import { generateImage } from "../../../../../lib/agents/image";
import { isHiggsfieldMcpConnected, generateImageViaMcp } from "../../../../../lib/higgsfield/mcp";
import { skillForPart } from "../../../../../lib/skills/loader";
import { assertBudget, BudgetExceededError, TOKEN_COSTS } from "../../../../../lib/usage";
import type { Character } from "../../../../../lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Casting Director — generate a character portrait (a "Soul ID look").
 * With an image vendor + key it rolls a real portrait via lib/agents/image
 * and prepends it to the character's refs (never overwriting prior looks).
 * With no key it degrades to the prior simulation (flip to training), so the
 * keyless demo still does something visible.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const character = characters.get(id);
  if (!character) return NextResponse.json({ error: "Character not found" }, { status: 404 });

  const project = projects.get(character.project_id);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  // Abstract presences (pure voice-over / narration, never physically shown)
  // never get a portrait — there's nothing to draw, and a generated face
  // would contradict the script. Refuse before touching any generator.
  if (character.brief?.physical_form === "abstract") {
    return NextResponse.json({
      ok: false,
      protected: true,
      note: `${character.name} is written as a voice-only presence — no portrait is generated for characters never physically shown on screen.`
    });
  }

  // A keyed image vendor (e.g. BytePlus Seedream) takes priority; the
  // Higgsfield OAuth connection is the fallback when no vendor key is set.
  const vendor = vendors.firstEnabledImage();
  const useMcp = !vendor && isHiggsfieldMcpConnected();

  // ── No generator at all → do nothing destructive. The character's state
  //    and existing looks stay exactly as they are.
  if (!useMcp && !vendor) {
    return NextResponse.json({
      ok: false,
      simulated: true,
      protected: true,
      note: "No image generator — connect Higgsfield in the Key Vault, or add a Fal/OpenAI key, to cast a real portrait."
    });
  }

  // ── Real roll — generate a portrait and store it as a look ───────────────
  const base = buildPortraitPrompt(character, project.premise);
  const skill = skillForPart("casting");
  // The casting skill's house style assumes a human subject ("one person
  // only, calm eyeline to camera") — appending it for a creature/colossus
  // fights the very prompt that's trying to describe a non-human body.
  const isHuman = (character.brief?.physical_form ?? "human") === "human";
  const prompt = isHuman && skill?.body ? `${base}\n\n${skill.body}` : base;
  const providerLabel = useMcp ? "Higgsfield (your account)" : vendor!.label;

  if (!useMcp && vendor!.provider === "byteplus-image") {
    try {
      assertBudget(TOKEN_COSTS.image);
    } catch (e) {
      if (e instanceof BudgetExceededError) {
        // Persist onto the character so the card's existing "Training
        // failed" + error-message display picks this up without any new
        // client-side plumbing — a single click needs to be visible too,
        // not just batch runs.
        characters.update(id, { soul_id_state: "failed", error: e.message });
        return NextResponse.json({ error: e.message, budgetExceeded: true }, { status: 402 });
      }
      throw e;
    }
  }

  try {
    // Subsequent looks must keep the same face: pass the existing looks as
    // reference images so Seedream locks identity across the wardrobe change.
    const priorLooks = (character.refs ?? []).slice(0, 2);
    const consistency = priorLooks.length
      ? `${prompt}\n\nThis is the SAME person as in the attached reference image(s) — identical face, age, build and hair. One single portrait — no grid, collage or multiple panels.`
      : `${prompt}\n\nOne single portrait — no grid, collage or multiple panels.`;
    const image = useMcp
      ? await generateImageViaMcp({ prompt: consistency, aspectRatio: "4:5" })
      : await generateImage({ prompt: consistency, aspectRatio: "4:5", vendor: vendor!, referenceImages: priorLooks });
    const refs = [image.url, ...(character.refs ?? [])];
    characters.update(id, { refs, soul_id_state: "trained", error: null });
    return NextResponse.json({ ok: true, url: image.url, vendor: providerLabel });
  } catch (error: any) {
    characters.update(id, { soul_id_state: "failed", error: error?.message ?? String(error) });
    return NextResponse.json({ error: error?.message ?? String(error) }, { status: 500 });
  }
}

function buildPortraitPrompt(character: Character, premise: string): string {
  const b = character.brief ?? {};
  const traits = [
    b.age && `age ${b.age}`,
    b.ethnicity,
    b.build,
    b.features,
    b.wardrobe && `wearing ${b.wardrobe}`,
    b.personality
  ]
    .filter(Boolean)
    .join(", ");
  const form = b.physical_form ?? "human";
  if (form === "creature") {
    return `Cinematic creature design portrait of ${character.name}. ${
      traits || "a distinctive non-human being"
    }. Photographic, detailed texture and anatomy, consistent design for film continuity, dramatic motion-picture lighting, shallow depth of field, neutral backdrop. This is a creature, NOT a human in a costume. Context: ${premise}`;
  }
  if (form === "colossus") {
    return `Cinematic concept-art portrait of ${character.name}, a colossal, massive nonhuman entity. ${
      traits || "overwhelming in scale"
    }. Wide framing to convey its scale against a neutral backdrop, photographic detail, consistent design for film continuity, dramatic motion-picture lighting. Context: ${premise}`;
  }
  return `Cinematic character portrait of ${character.name}, the ${character.role.toLowerCase()}. ${
    traits || "distinctive screen presence"
  }. Photographic, detailed face, consistent appearance for film continuity, dramatic motion-picture lighting, shallow depth of field, neutral backdrop. Context: ${premise}`;
}
