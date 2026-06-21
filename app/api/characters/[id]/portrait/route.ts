import { NextResponse } from "next/server";
import { characters, projects, vendors } from "../../../../../lib/db/repo";
import { generateImage } from "../../../../../lib/agents/image";
import { isHiggsfieldMcpConnected, generateImageViaMcp } from "../../../../../lib/higgsfield/mcp";
import { skillForPart } from "../../../../../lib/skills/loader";
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
  const useMcp = isHiggsfieldMcpConnected();

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
  try {
    const image = useMcp
      ? await generateImageViaMcp({ prompt, aspectRatio: "4:5" })
      : await generateImage({ prompt, aspectRatio: "4:5", vendor: vendor! });
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
