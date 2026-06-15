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
  const body = await req.json().catch(() => ({} as { variants?: number; prompt?: string }));
  const variantCount = Math.max(1, Math.min(8, Number(body.variants ?? 4)));
  const promptIn = typeof body.prompt === "string" ? body.prompt.trim() : "";

  const db = getDb();

  const beat = db
    .prepare(
      `SELECT b.id, b.title, b.scene_heading, p.aspect_ratio, p.premise
       FROM beats b JOIN projects p ON p.id = b.project_id WHERE b.id = ?`
    )
    .get(beatId) as
    | { id: string; title: string; scene_heading: string; aspect_ratio: AspectRatio; premise: string }
    | undefined;
  if (!beat) return NextResponse.json({ error: "Beat not found" }, { status: 404 });

  const prompt =
    promptIn || `Cinematic film frame. ${beat.scene_heading}. ${beat.title}. ${beat.premise}`;
  // Fold in the editable Cinematography skill so frames follow the house style.
  const skill = skillForPart("cinematography");
  const genPrompt = skill?.body ? `${prompt}\n\n${skill.body}` : prompt;

  const vendor = vendors.firstEnabledImage();
  const useMcp = isHiggsfieldMcpConnected();

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
        ? generateImageViaMcp({ prompt: genPrompt, aspectRatio: beat.aspect_ratio })
        : generateImage({ prompt: genPrompt, aspectRatio: beat.aspect_ratio, vendor: vendor! })
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
    note:
      failed > 0
        ? `${generated} frame(s) rolled, ${failed} failed via ${providerLabel}.`
        : `${generated} frame(s) rolled by ${providerLabel}.`
  });
}
