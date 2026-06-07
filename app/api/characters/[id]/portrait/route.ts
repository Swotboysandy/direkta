import { NextResponse } from "next/server";
import { characters, projects, vendors } from "../../../../../lib/db/repo";
import { generateImage } from "../../../../../lib/agents/image";
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

  const vendor = vendors.firstEnabledImage();

  // ── No image vendor / key → simulation ──────────────────────────────────
  if (!vendor) {
    characters.update(id, { soul_id_state: "training", soul_id_progress: 0.42, error: null });
    return NextResponse.json({
      ok: true,
      simulated: true,
      note: "No image vendor configured — Soul ID queued in simulation. Add a Fal or OpenAI image key in the Key Vault to cast a real portrait."
    });
  }

  // ── Real roll — generate a portrait and store it as a look ───────────────
  const prompt = buildPortraitPrompt(character, project.premise);
  try {
    const image = await generateImage({ prompt, aspectRatio: "4:5", vendor });
    const refs = [image.url, ...(character.refs ?? [])];
    characters.update(id, { refs, soul_id_state: "trained", error: null });
    return NextResponse.json({ ok: true, url: image.url, vendor: vendor.label });
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
