import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getDb } from "../../../../../../lib/db/client";
import { vendors } from "../../../../../../lib/db/repo";
import { generateVideo } from "../../../../../../lib/agents/video";
import { skillForPart } from "../../../../../../lib/skills/loader";
import type { AspectRatio } from "../../../../../../lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface NodeRow {
  id: string;
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
  const db = getDb();

  const node = db
    .prepare(
      `SELECT sn.id,
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

  const vendor = vendors.firstEnabledVideo();
  if (!vendor) {
    return NextResponse.json({
      ok: true,
      simulated: true,
      note: "No video vendor configured — add a Fal video key in the Key Vault to render motion clips."
    });
  }

  if (!node.frame_url) {
    return NextResponse.json(
      { error: "This shot has no frame yet — pick a storyboard frame for it first." },
      { status: 400 }
    );
  }

  // The video model fetches the reference image by URL, so it must be absolute
  // and publicly reachable (works on the deployed domain via Caddy headers).
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const origin = `${proto}://${host}`;
  const refImage = node.frame_url.startsWith("http") ? node.frame_url : `${origin}${node.frame_url}`;

  const style = node.row_style ? JSON.parse(node.row_style) : {};
  const motion = [style.movement, style.shot_size].filter(Boolean).join(", ");
  const base = `${node.beat_title ?? "Film shot"}. ${node.beat_scene ?? ""}. ${
    motion ? `${motion} — ` : ""
  }${node.premise ?? ""}`.trim();
  // Fold in the editable Video Director skill so motion follows the house style.
  const skill = skillForPart("video");
  const prompt = skill?.body ? `${base}\n\n${skill.body}` : base;

  db.prepare("UPDATE stitch_nodes SET clip_state = 'generating' WHERE id = ?").run(id);

  try {
    const video = await generateVideo({
      prompt,
      aspectRatio: node.aspect_ratio,
      referenceImageUrl: refImage,
      vendor
    });
    const assetId = nanoid(10);
    db.prepare(
      "INSERT INTO assets (id, target_kind, target_id, kind, url, prompt, vendor_id) VALUES (?, 'stitch_clip', ?, 'video', ?, ?, ?)"
    ).run(assetId, id, video.url, prompt, vendor.id);
    db.prepare("UPDATE stitch_nodes SET clip_asset_id = ?, clip_state = 'complete' WHERE id = ?").run(assetId, id);
    return NextResponse.json({ ok: true, url: video.url, vendor: vendor.label });
  } catch (error: any) {
    db.prepare("UPDATE stitch_nodes SET clip_state = 'error' WHERE id = ?").run(id);
    return NextResponse.json({ error: error?.message ?? String(error) }, { status: 500 });
  }
}
