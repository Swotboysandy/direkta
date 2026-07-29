import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getDb } from "../../../../../../lib/db/client";
import { vendors } from "../../../../../../lib/db/repo";
import { generateLipsyncViaSync } from "../../../../../../lib/agents/sync-lipsync";
import { lipsyncModel } from "../../../../../../lib/lipsync/catalog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface NodeRow {
  id: string;
  dialogue_audio_url: string | null;
  frame_url: string | null;
  clip_url: string | null;
}

/**
 * Lip Sync — re-syncs a shot's mouth movement to an uploaded dialogue track.
 * Runs against the shot's existing motion clip when one exists (video+audio
 * mode), or straight off the storyboard frame otherwise (image+audio mode) —
 * mirrors Sync.so's own two input modes. Writes to lipsync_asset_id, a
 * sibling slot to clip_asset_id, so the pre-lipsync clip is never overwritten.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({} as { model?: string }));
  const chosen = lipsyncModel(typeof body.model === "string" ? body.model : undefined);
  const db = getDb();

  const node = db
    .prepare(
      `SELECT sn.id, sn.dialogue_audio_url,
              COALESCE(a_direct.url, a_selected.url) as frame_url,
              a_clip.url as clip_url
       FROM stitch_nodes sn
       LEFT JOIN storyboard_rows sr ON sr.beat_id = sn.beat_id
       LEFT JOIN assets a_direct ON a_direct.target_id = sn.variant_id AND a_direct.target_kind = 'storyboard_variant'
       LEFT JOIN assets a_selected ON a_selected.target_id = sr.selected_variant_id AND a_selected.target_kind = 'storyboard_variant'
       LEFT JOIN assets a_clip ON a_clip.id = sn.clip_asset_id
       WHERE sn.id = ?`
    )
    .get(id) as NodeRow | undefined;
  if (!node) return NextResponse.json({ error: "Shot not found" }, { status: 404 });

  if (!node.dialogue_audio_url) {
    return NextResponse.json({ error: "Upload a dialogue track for this shot first." }, { status: 400 });
  }
  if (!node.clip_url && !node.frame_url) {
    return NextResponse.json({ error: "This shot has no clip or frame yet — generate one first." }, { status: 400 });
  }

  const vendor = vendors.get("sync-lipsync-default");
  if (!vendor?.api_key) {
    return NextResponse.json(
      { error: "Add your Sync.so API key in the Key Vault (Lip Sync vendor) to use this step." },
      { status: 400 }
    );
  }

  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const origin = `${proto}://${host}`;
  const toAbs = (u: string) => (u.startsWith("http") ? u : `${origin}${u}`);

  db.prepare("UPDATE stitch_nodes SET lipsync_state = 'generating' WHERE id = ?").run(id);

  try {
    const video = await generateLipsyncViaSync({
      apiKey: vendor.api_key,
      model: chosen.model,
      videoUrl: node.clip_url ? toAbs(node.clip_url) : undefined,
      imageUrl: node.clip_url ? undefined : toAbs(node.frame_url!),
      audioUrl: toAbs(node.dialogue_audio_url)
    });
    const assetId = nanoid(10);
    db.prepare(
      "INSERT INTO assets (id, target_kind, target_id, kind, url, prompt, vendor_id) VALUES (?, 'stitch_clip', ?, 'video', ?, '', ?)"
    ).run(assetId, id, video.url, vendor.id);
    db.prepare("UPDATE stitch_nodes SET lipsync_asset_id = ?, lipsync_state = 'complete' WHERE id = ?").run(assetId, id);
    return NextResponse.json({ ok: true, url: video.url, vendor: `${vendor.label} · ${chosen.label}` });
  } catch (error: any) {
    db.prepare("UPDATE stitch_nodes SET lipsync_state = 'error' WHERE id = ?").run(id);
    return NextResponse.json({ error: error?.message ?? String(error) }, { status: 500 });
  }
}
