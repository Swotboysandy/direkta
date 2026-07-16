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
  const prompt = skill?.body ? `${base}\n\n${skill.body}` : base;
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
  return `Cinematic character portrait of ${character.name}, the ${character.role.toLowerCase()}. ${
    traits || "distinctive screen presence"
  }. Photographic, detailed face, consistent appearance for film continuity, dramatic motion-picture lighting, shallow depth of field, neutral backdrop. Context: ${premise}`;
}
