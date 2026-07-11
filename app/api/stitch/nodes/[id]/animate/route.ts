import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getDb } from "../../../../../../lib/db/client";
import { vendors } from "../../../../../../lib/db/repo";
import { generateVideo } from "../../../../../../lib/agents/video";
import { isHiggsfieldMcpConnected, generateVideoViaMcp } from "../../../../../../lib/higgsfield/mcp";
import { generateVideoViaByteplus } from "../../../../../../lib/agents/byteplus-video";
import { referenceToDataUri } from "../../../../../../lib/agents/byteplus-image";
import { videoModel } from "../../../../../../lib/higgsfield/catalog";
import { skillForPart } from "../../../../../../lib/skills/loader";
import type { AspectRatio } from "../../../../../../lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface NodeRow {
  id: string;
  duration: number;
  beat_title: string | null;
  beat_scene: string | null;
  row_style: string | null;
  aspect_ratio: AspectRatio;
  premise: string | null;
  frame_url: string | null;
}

/**
 * Video Director — animate a single shot. Takes the node's storyboard frame
 * as a reference image and rolls a short image-to-video clip via Fal (Kling).
 * Synchronous: video gen can take ~30s–2min, so the caller shows a busy state.
 * No video vendor / key → simulation note (no clip), keeping the demo working.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({} as { model?: string }));
  const chosen = videoModel(typeof body.model === "string" ? body.model : undefined);
  const db = getDb();

  const node = db
    .prepare(
      `SELECT sn.id, sn.duration,
              b.title as beat_title, b.scene_heading as beat_scene,
              sr.style as row_style,
              p.aspect_ratio, p.premise,
              COALESCE(a_direct.url, a_selected.url) as frame_url
       FROM stitch_nodes sn
       LEFT JOIN beats b ON b.id = sn.beat_id
       LEFT JOIN projects p ON p.id = sn.project_id
       LEFT JOIN storyboard_rows sr ON sr.beat_id = sn.beat_id
       LEFT JOIN assets a_direct ON a_direct.target_id = sn.variant_id AND a_direct.target_kind = 'storyboard_variant'
       LEFT JOIN assets a_selected ON a_selected.target_id = sr.selected_variant_id AND a_selected.target_kind = 'storyboard_variant'
       WHERE sn.id = ?`
    )
    .get(id) as NodeRow | undefined;

  if (!node) return NextResponse.json({ error: "Shot not found" }, { status: 404 });

  // The shot's duration slider drives the clip length. Seedance 1.5 Pro
  // accepts 5s or 10s, so snap to the nearest; other providers keep 5s.
  const clipDuration = Number(node.duration) >= 7.5 ? 10 : 5;

  const vendor = vendors.firstEnabledVideo();
  const useMcp = isHiggsfieldMcpConnected();
  const isByteplus = chosen.provider === "byteplus";

  // BytePlus path needs its own API key (separate from Higgsfield).
  const bp = isByteplus ? vendors.get("byteplus-video-default") : null;
  if (isByteplus && !bp?.api_key) {
    db.prepare("UPDATE stitch_nodes SET clip_state = 'error' WHERE id = ?").run(id);
    return NextResponse.json(
      { error: "Add your BytePlus API key in the Key Vault (Video vendors → BytePlus) to use Seedance 1.5 Pro." },
      { status: 400 }
    );
  }

  // No generator at all → simulation note (keeps the keyless demo working).
  if (!isByteplus && !useMcp && !vendor) {
    return NextResponse.json({
      ok: true,
      simulated: true,
      note: "No video generator — connect Higgsfield in the Key Vault, or add a Fal video key, to render motion clips."
    });
  }

  if (!node.frame_url) {
    return NextResponse.json(
      { error: "This shot has no frame yet — pick a storyboard frame for it first." },
      { status: 400 }
    );
  }

  // Local OSS frames are embedded as data URIs for BytePlus (its URL fetcher
  // intermittently rejects our public domain); other providers get the
  // absolute URL as before.
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const origin = `${proto}://${host}`;
  const absUrl = node.frame_url.startsWith("http") ? node.frame_url : `${origin}${node.frame_url}`;
  const refImage = isByteplus ? referenceToDataUri(node.frame_url) ?? absUrl : absUrl;

  const style = node.row_style ? JSON.parse(node.row_style) : {};
  const motion = [style.movement, style.shot_size].filter(Boolean).join(", ");
  const base = `${node.beat_title ?? "Film shot"}. ${node.beat_scene ?? ""}. ${
    motion ? `${motion} — ` : ""
  }${node.premise ?? ""}`.trim();
  // Identity hold — the character-consistency chain runs through this clip:
  // whoever is in the source frame must stay exactly themselves in motion.
  const consistency =
    "Preserve the exact appearance of every person from the first frame — identical face, hair and " +
    "wardrobe throughout the clip. Natural motion only; no morphing, no identity drift, no new characters.";
  // Fold in the editable Video Director skill so motion follows the house style.
  const skill = skillForPart("video");
  const prompt = [base, skill?.body ?? "", consistency].filter(Boolean).join("\n\n");

  const providerLabel = isByteplus
    ? "BytePlus · Seedance 1.5 Pro"
    : useMcp
      ? "Higgsfield (your account)"
      : vendor!.label;
  db.prepare("UPDATE stitch_nodes SET clip_state = 'generating' WHERE id = ?").run(id);

  try {
    const video = isByteplus
      ? await generateVideoViaByteplus({
          apiKey: bp!.api_key,
          model: chosen.byteplus!.model,
          prompt,
          referenceImageUrl: refImage,
          resolution: chosen.byteplus!.resolution,
          duration: clipDuration
        })
      : useMcp
        ? await generateVideoViaMcp({
            prompt,
            aspectRatio: node.aspect_ratio,
            referenceImageUrl: refImage,
            modelParams: chosen.params
          })
        : await generateVideo({
            prompt,
            aspectRatio: node.aspect_ratio,
            referenceImageUrl: refImage,
            vendor: vendor!
          });
    const assetId = nanoid(10);
    db.prepare(
      "INSERT INTO assets (id, target_kind, target_id, kind, url, prompt, vendor_id) VALUES (?, 'stitch_clip', ?, 'video', ?, ?, ?)"
    ).run(assetId, id, video.url, prompt, isByteplus ? bp!.id : useMcp ? null : vendor!.id);
    db.prepare("UPDATE stitch_nodes SET clip_asset_id = ?, clip_state = 'complete' WHERE id = ?").run(assetId, id);
    return NextResponse.json({ ok: true, url: video.url, vendor: providerLabel });
  } catch (error: any) {
    db.prepare("UPDATE stitch_nodes SET clip_state = 'error' WHERE id = ?").run(id);
    return NextResponse.json({ error: error?.message ?? String(error) }, { status: 500 });
  }
}
