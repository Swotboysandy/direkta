import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getDb } from "../../../../../../lib/db/client";
import { vendors } from "../../../../../../lib/db/repo";
import { generateImage } from "../../../../../../lib/agents/image";
import { isHiggsfieldMcpConnected, generateImageViaMcp } from "../../../../../../lib/higgsfield/mcp";
import { skillForPart } from "../../../../../../lib/skills/loader";
import type { AspectRatio } from "../../../../../../lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Cinematographer pass. If an image vendor (Fal / OpenAI image) is enabled
 * with an API key, this rolls real frames via lib/agents/image.ts. With no
 * key configured it degrades to a simulation: placeholder variants the UI
 * paints as loading shimmers, so the demo still works key-free.
 */
export async function POST(req: Request, { params }: { params: Promise<{ beatId: string }> }) {
  const { beatId } = await params;
  const body = await req
    .json()
    .catch(() => ({} as { variants?: number; prompt?: string; model?: string; resolution?: string }));
  const variantCount = Math.max(1, Math.min(8, Number(body.variants ?? 4)));
  const promptIn = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const modelIn = typeof body.model === "string" ? body.model : undefined;
  const resolutionIn = typeof body.resolution === "string" ? body.resolution : undefined;

  const db = getDb();

  const beat = db
    .prepare(
      `SELECT b.id, b.title, b.scene_heading, b.characters, b.project_id, p.aspect_ratio, p.premise, p.brand_kit
       FROM beats b JOIN projects p ON p.id = b.project_id WHERE b.id = ?`
    )
    .get(beatId) as
    | { id: string; title: string; scene_heading: string; characters: string; project_id: string; aspect_ratio: AspectRatio; premise: string; brand_kit: string }
    | undefined;
  if (!beat) return NextResponse.json({ error: "Beat not found" }, { status: 404 });

  // ── Location reference lock — beats.location_id is never populated by the
  //    extractor, so match the scene heading against a location's name (the
  //    slugline embeds it, e.g. "INT. MORNRISE COFFEE SHOP — GOLDEN HOUR").
  //    Without this, only faces were locked — the set itself could drift
  //    shot-to-shot even with the same characters in every frame.
  const projectLocations = db
    .prepare("SELECT name, refs FROM locations WHERE project_id = ?")
    .all(beat.project_id) as Array<{ name: string; refs: string }>;
  const headingUpper = beat.scene_heading.toUpperCase();
  const matchedLocation = projectLocations
    .filter((l) => l.name.trim().length >= 3 && headingUpper.includes(l.name.trim().toUpperCase()))
    .sort((a, b) => b.name.length - a.name.length)[0];
  const locationRefs = matchedLocation ? safeJsonArray(matchedLocation.refs).slice(0, 2) : [];

  const prompt =
    promptIn || `Cinematic film frame. ${beat.scene_heading}. ${beat.title}. ${beat.premise}`;

  // ── Cast reference lock: pull cast portraits (the "Soul ID" looks from
  //    Casting) so every frame keeps the same faces. A character qualifies
  //    when they're on the beat's cast list OR named in the prompt itself —
  //    typed or AI-written prompts lock too.
  const beatCharNames: string[] = safeJsonArray(beat.characters);
  // Hand-picked "Cast in frame" chips are stored on the row style.
  const existingRow = db.prepare("SELECT style FROM storyboard_rows WHERE beat_id = ?").get(beatId) as
    | { style: string }
    | undefined;
  const rowStyle = existingRow?.style ? JSON.parse(existingRow.style) : {};
  const overrideNames: string[] = Array.isArray(rowStyle.cast_override)
    ? rowStyle.cast_override.filter((x: unknown) => typeof x === "string")
    : [];
  const castRows = db
    .prepare("SELECT name, refs, brief FROM characters WHERE project_id = ?")
    .all(beat.project_id) as Array<{ name: string; refs: string; brief: string }>;
  const promptLower = prompt.toLowerCase();
  const referenceImages: string[] = [];
  const referencedNames: string[] = [];
  const referencedDescs: string[] = [];
  for (const c of castRows) {
    const name = c.name.trim();
    const onBeat = beatCharNames.some((n) => n.trim().toLowerCase() === name.toLowerCase());
    const picked = overrideNames.some((n) => n.trim().toLowerCase() === name.toLowerCase());
    const inPrompt = name.length >= 3 && promptLower.includes(name.toLowerCase());
    if (!onBeat && !picked && !inPrompt) continue;
    const refs = safeJsonArray(c.refs);
    if (refs.length) {
      // Two looks per character when available — extra references tighten
      // the identity lock considerably.
      referenceImages.push(...refs.slice(0, 2));
      referencedNames.push(c.name);
      // Physical anchor from the casting brief, folded into the lock preamble.
      let brief: Record<string, unknown> = {};
      try {
        brief = JSON.parse(c.brief ?? "{}");
      } catch {
        /* brief stays empty */
      }
      const traits = [brief.features, brief.wardrobe].filter(Boolean).join("; ");
      referencedDescs.push(traits ? `${c.name} (${traits})` : c.name);
    }
    if (referenceImages.length >= 6) break;
  }
  // The matched location's plate rides alongside the cast references — same
  // reference-lock mechanism, just for the set instead of a face.
  if (locationRefs.length) referenceImages.push(...locationRefs);

  // Fold in the editable Cinematography skill so frames follow the house style.
  const skill = skillForPart("cinematography");
  // The cast lock LEADS the prompt — Seedream weighs early instructions far
  // more heavily, so burying the reference note after the style block lets
  // identity drift (verified A/B). Language is deliberately forceful: a soft
  // "the same person" produces a loose look-alike with drifting skin tone and
  // wardrobe (and sometimes a duplicate of the subject); this locks all of it.
  const castLock = referencedNames.length
    ? [
        `IDENTITY LOCK — the ${referencedNames.length === 1 ? "person" : "people"} in this frame MUST be the exact same ${
          referencedNames.length === 1 ? "individual" : "individuals"
        } shown in the attached reference image(s): ${referencedDescs.join(" · ")}.`,
        "Match the reference precisely: same face and facial structure, same skin tone, same hair, same wardrobe. This is the same person, NOT a look-alike or a different actor.",
        referencedNames.length === 1
          ? `Exactly ONE person in the entire frame — ${referencedNames[0]}. Never duplicate them, no twins, no clone, no second copy of the same person.`
          : `Exactly ${referencedNames.length} distinct people (${referencedNames.join(", ")}), each matching their own reference — do not merge or blend their faces.`
      ].join(" ")
    : "";
  // Same mechanism as the cast lock, for the location — otherwise the room
  // itself (counter, window, décor, machine) can drift between shots even
  // when every character stays locked.
  const locationLock = locationRefs.length
    ? `LOCATION LOCK — this is the SAME location shown in the attached reference image(s) (${matchedLocation!.name}): same room, same counter/fixtures, same window and light direction, same décor. Do not redesign the space.`
    : "";
  // Brand/product placement rides on every frame when the project defines it.
  const brandLine = beat.brand_kit
    ? `Product placement, shown naturally where it fits the scene: ${beat.brand_kit}. Brand items look real and unobtrusive — no oversized logos, no text overlays.`
    : "";
  const antiGrid =
    "One single cinematic frame depicting ONE moment — never a grid, collage, contact sheet, storyboard, split screen, or multiple panels.";
  const genPrompt = [castLock, locationLock, prompt, brandLine, skill?.body ?? "", antiGrid].filter(Boolean).join("\n\n");

  // A keyed image vendor (e.g. BytePlus Seedream) takes priority; the
  // Higgsfield OAuth connection is the fallback when no vendor key is set.
  const vendor = vendors.firstEnabledImage();
  const useMcp = !vendor && isHiggsfieldMcpConnected();

  // ── No generator at all → simulation. NEVER destroy completed takes:
  //    a fresh roll only happens when a real generator will actually replace them.
  if (!useMcp && !vendor) {
    const done = db
      .prepare("SELECT COUNT(*) as c FROM storyboard_variants WHERE beat_id = ? AND state = 'complete'")
      .get(beatId) as { c: number };
    if (done.c > 0) {
      return NextResponse.json({
        ok: false,
        simulated: true,
        protected: true,
        note: "No image vendor key — kept your existing takes untouched. Add a Fal/OpenAI key in the Key Vault to re-roll real frames."
      });
    }
    const insert = db.prepare(
      "INSERT INTO storyboard_variants (id, beat_id, n, prompt, state, asset_id) VALUES (?, ?, ?, ?, 'waiting', NULL)"
    );
    db.prepare("DELETE FROM storyboard_variants WHERE beat_id = ?").run(beatId);
    for (let n = 1; n <= variantCount; n++) insert.run(nanoid(10), beatId, n, prompt);
    db.prepare(
      "INSERT INTO storyboard_rows (beat_id, state, selected_variant_id, style) VALUES (?, 'generating', NULL, '{}') " +
        "ON CONFLICT(beat_id) DO UPDATE SET state = 'generating', updated_at = datetime('now')"
    ).run(beatId);
    return NextResponse.json({
      ok: true,
      simulated: true,
      note: "No image vendor configured — queued in simulation. Add a Fal or OpenAI image key in the Key Vault to roll real frames."
    });
  }

  const providerLabel = useMcp ? "Higgsfield (your account)" : vendor!.label;

  // ── Real generator — persist the prompt onto the row and flip it to generating.
  const existing = db.prepare("SELECT style FROM storyboard_rows WHERE beat_id = ?").get(beatId) as
    | { style: string }
    | undefined;
  const style = existing?.style ? JSON.parse(existing.style) : {};
  style.prompt_override = prompt;

  // Per-beat aspect override (Style override → Aspect) wins over the project default.
  const VALID_ASPECTS: AspectRatio[] = ["16:9", "9:16", "1:1", "4:5", "21:9"];
  const aspect: AspectRatio = VALID_ASPECTS.includes(style.aspect) ? style.aspect : beat.aspect_ratio;
  if (existing) {
    db.prepare(
      "UPDATE storyboard_rows SET state = 'generating', style = ?, updated_at = datetime('now') WHERE beat_id = ?"
    ).run(JSON.stringify(style), beatId);
  } else {
    db.prepare(
      "INSERT INTO storyboard_rows (beat_id, state, selected_variant_id, style) VALUES (?, 'generating', NULL, ?)"
    ).run(beatId, JSON.stringify(style));
  }

  // Fresh roll — clear prior variants and their assets (a real vendor will replace them).
  db.prepare(
    "DELETE FROM assets WHERE target_kind = 'storyboard_variant' AND target_id IN (SELECT id FROM storyboard_variants WHERE beat_id = ?)"
  ).run(beatId);
  db.prepare("DELETE FROM storyboard_variants WHERE beat_id = ?").run(beatId);

  // ── Real roll — create variant rows, then generate in parallel ──────────
  const insertVariant = db.prepare(
    "INSERT INTO storyboard_variants (id, beat_id, n, prompt, state, asset_id) VALUES (?, ?, ?, ?, 'generating', NULL)"
  );
  const ids: string[] = [];
  for (let n = 1; n <= variantCount; n++) {
    const vid = nanoid(10);
    insertVariant.run(vid, beatId, n, genPrompt);
    ids.push(vid);
  }

  const insertAsset = db.prepare(
    "INSERT INTO assets (id, target_kind, target_id, kind, url, prompt, vendor_id) VALUES (?, 'storyboard_variant', ?, 'image', ?, ?, ?)"
  );
  const markComplete = db.prepare("UPDATE storyboard_variants SET state = 'complete', asset_id = ? WHERE id = ?");
  const markError = db.prepare("UPDATE storyboard_variants SET state = 'error' WHERE id = ?");

  const results = await Promise.allSettled(
    ids.map(() =>
      useMcp
        ? generateImageViaMcp({
            prompt: genPrompt,
            aspectRatio: aspect,
            model: modelIn,
            resolution: resolutionIn
          })
        : generateImage({ prompt: genPrompt, aspectRatio: aspect, vendor: vendor!, referenceImages })
    )
  );

  let generated = 0;
  let failed = 0;
  const errors: string[] = [];
  results.forEach((res, i) => {
    const vid = ids[i];
    if (res.status === "fulfilled") {
      const assetId = nanoid(10);
      insertAsset.run(assetId, vid, res.value.url, genPrompt, vendor ? vendor.id : null);
      markComplete.run(assetId, vid);
      generated++;
    } else {
      const msg = res.reason?.message ?? String(res.reason);
      console.error(`[storyboard.generate] variant ${i} failed via ${providerLabel}: ${msg}`);
      errors.push(msg);
      markError.run(vid);
      failed++;
    }
  });

  db.prepare("UPDATE storyboard_rows SET state = ?, updated_at = datetime('now') WHERE beat_id = ?").run(
    generated > 0 ? "complete" : "error",
    beatId
  );

  return NextResponse.json({
    ok: generated > 0,
    generated,
    failed,
    vendor: providerLabel,
    error: errors[0],
    locked_cast: referencedNames,
    locked_location: matchedLocation?.name ?? null,
    note:
      failed > 0
        ? `${generated} frame(s) rolled, ${failed} failed via ${providerLabel}.`
        : `${generated} frame(s) rolled by ${providerLabel}${
            referencedNames.length ? ` — locked to ${referencedNames.join(", ")}` : ""
          }${matchedLocation ? ` @ ${matchedLocation.name}` : ""}.`
  });
}

function safeJsonArray(raw: string | null | undefined): string[] {
  try {
    const parsed = JSON.parse(raw ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
