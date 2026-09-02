import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs";
import { nanoid } from "nanoid";
import { getDb } from "../../../../../../lib/db/client";
import { vendors } from "../../../../../../lib/db/repo";
import { generateVideo } from "../../../../../../lib/agents/video";
import { isHiggsfieldMcpConnected, generateVideoViaMcp } from "../../../../../../lib/higgsfield/mcp";
import { isBrowserSessionSaved, generateVideoViaBrowser } from "../../../../../../lib/higgsfield/browser";
import { getFlag } from "../../../../../../lib/settings";
import { generateVideoViaByteplus } from "../../../../../../lib/agents/byteplus-video";
import { generateVideoViaMiniMaxH3, H3BudgetError } from "../../../../../../lib/agents/minimax-h3";
import { h3References, h3Settings, H3_CANVAS, type H3ContinuityMode } from "../../../../../../lib/agents/h3-settings";
import { h3GenerationPrompt } from "../../../../../../lib/agents/h3-workflow";
import { extractLastVideoFrame, ossFile } from "../../../../../../lib/media/video-frames";
import { prepareH3Prompt } from "../../../../../../lib/agents/h3-prompt-expander";
import { referenceToDataUri } from "../../../../../../lib/agents/byteplus-image";
import { videoModel, cameraMotion } from "../../../../../../lib/higgsfield/catalog";
import { skillForPart } from "../../../../../../lib/skills/loader";
import { assertBudget, BudgetExceededError, TOKEN_COSTS } from "../../../../../../lib/usage";
import type { AspectRatio } from "../../../../../../lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface NodeRow {
  id: string;
  project_id: string;
  x: number;
  y: number;
  duration: number;
  beat_title: string | null;
  beat_scene: string | null;
  beat_direction: string | null;
  row_style: string | null;
  aspect_ratio: AspectRatio;
  premise: string | null;
  style_template: string | null;
  continuity_lock: string | null;
  set_lock: string | null;
  avoid_prompt: string | null;
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
  const body = await req
    .json()
    .catch(
      () =>
        ({} as {
          model?: string;
          motion?: string;
          audio?: boolean;
          endFrame?: boolean;
          useBrowser?: boolean;
          keepWarm?: boolean;
          referenceImageUrl?: string;
          lastFrameImageUrl?: string;
        })
    );
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Expected an object request body." }, { status: 400 });
  const chosen = videoModel(typeof body.model === "string" ? body.model : undefined);
  const cameraMove = cameraMotion(typeof body.motion === "string" ? body.motion : undefined);
  const wantAudio = body.audio === true;
  const db = getDb();

  const node = db
    .prepare(
      `SELECT sn.id, sn.project_id, sn.x, sn.y, sn.duration,
              b.title as beat_title, b.scene_heading as beat_scene, b.direction as beat_direction,
              sr.style as row_style,
              p.aspect_ratio, p.premise, p.style_template, p.continuity_lock, p.set_lock, p.avoid_prompt,
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

  // The shot's duration slider drives the clip length. BytePlus accepts any
  // integer within the model's real range (verified against BytePlus's own
  // ModelArk docs: Seedance 1.5 Pro is [4,12]s, the 2.0 series is [4,15]s —
  // they differ, so this clamps per the chosen model rather than a single
  // hardcoded 5/10 snap that under-used both). Other providers keep 5s.
  const [minDur, maxDur] = chosen.byteplus?.durationRange ?? [5, 5];
  const isMinimaxH3 = chosen.provider === "minimax_h3";
  const clipDuration = isMinimaxH3 ? (body.durationSeconds ?? node.duration ?? 5) : Math.min(maxDur, Math.max(minDur, Math.round(Number(node.duration) || minDur)));
  const continuityMode: H3ContinuityMode = body.continuityMode ?? "cut";
  const [h3Width, h3Height] = H3_CANVAS[node.aspect_ratio] ?? H3_CANVAS["16:9"];
  if (isMinimaxH3) {
    try {
      h3Settings({ durationSeconds: clipDuration, width: h3Width, height: h3Height });
      if (!["cut", "continue"].includes(continuityMode)) throw new Error("continuityMode must be cut or continue.");
      for (const key of ["endFrame", "keepWarm", "dryRun"]) {
        if (body[key] !== undefined && typeof body[key] !== "boolean") throw new Error(`${key} must be a boolean.`);
      }
      for (const key of ["referenceImageUrl", "lastFrameImageUrl"]) {
        if (body[key] !== undefined && (typeof body[key] !== "string" || !body[key].trim())) throw new Error(`${key} must be a non-empty image URL.`);
      }
    } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 400 }); }
  }

  const vendor = vendors.firstEnabledVideo();
  const useMcp = isHiggsfieldMcpConnected();
  const isByteplus = chosen.provider === "byteplus";
  // Unlimited mode only exists in Higgsfield's signed-in web UI, so a saved
  // browser session is the ONLY zero-credit path. Prefer it over the MCP
  // whenever one is stored — the MCP spends credits for the same clip.
  // { useBrowser: false } forces the API path.
  const useBrowser = body.useBrowser !== false && getFlag("browser_video") && !isByteplus && !isMinimaxH3 && isBrowserSessionSaved();
  // Unlimited-only policy: once a browser session is connected, the credit-
  // spending providers (BytePlus, MCP-on-credits) are refused outright — a
  // stray model pick or a transient browser failure must never silently bill.
  if (isBrowserSessionSaved() && body.useBrowser !== false && isByteplus) {
    db.prepare("UPDATE stitch_nodes SET clip_state = 'error' WHERE id = ?").run(id);
    return NextResponse.json(
      { error: "Unlimited-only mode is on (Higgsfield browser session connected). BytePlus would spend credits — pick a Higgsfield model, or POST { useBrowser: false } to override." },
      { status: 400 }
    );
  }

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
  if (!isByteplus && !isMinimaxH3 && !useBrowser && !useMcp && !vendor) {
    return NextResponse.json({
      ok: true,
      simulated: true,
      note: "No video generator — connect Higgsfield in the Key Vault, or add a Fal video key, to render motion clips."
    });
  }

  // MiniMax H3 can run off a single fixed character-reference image shared
  // across every shot (passed in the request body) instead of a per-shot
  // storyboard frame — that's how character-lock across a whole short works.
  if (!node.frame_url && !isMinimaxH3) {
    return NextResponse.json(
      { error: "This shot has no frame yet — pick a storyboard frame for it first." },
      { status: 400 }
    );
  }

  // Hard budget stop — verified live that BytePlus's free packs silently
  // fall through to pay-as-you-go once exhausted rather than erroring, so
  // Fylmer now refuses the call itself instead of letting that happen again.
  if (isByteplus) {
    const perClip = chosen.byteplus!.resolution === "1080p" ? TOKEN_COSTS.clip1080 : TOKEN_COSTS.clip720;
    const estimate = perClip * (clipDuration / 5);
    try {
      assertBudget(estimate);
    } catch (e) {
      if (e instanceof BudgetExceededError) {
        db.prepare("UPDATE stitch_nodes SET clip_state = 'error' WHERE id = ?").run(id);
        return NextResponse.json({ error: e.message, budgetExceeded: true }, { status: 402 });
      }
      throw e;
    }
  }

  // Local OSS frames are embedded as data URIs for BytePlus (its URL fetcher
  // intermittently rejects our public domain); other providers get the
  // absolute URL as before.
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const origin = `${proto}://${host}`;
  const absUrl = node.frame_url ? (node.frame_url.startsWith("http") ? node.frame_url : `${origin}${node.frame_url}`) : "";
  const refImage = isByteplus && node.frame_url ? referenceToDataUri(node.frame_url) ?? absUrl : absUrl;

  const style = node.row_style ? JSON.parse(node.row_style) : {};
  const motion = [style.movement, style.shot_size].filter(Boolean).join(", ");
  // The lens/aperture/camera-body chosen in Storyboard describe the shot's
  // optical look (depth of field, stock character) — without folding them in
  // here too, a clip could animate with a different depth of field than the
  // frame it started from.
  const lensLine = [style.lens, style.aperture, style.camera_body].filter(Boolean).join(", ");
  const base = `${node.beat_title ?? "Film shot"}. ${node.beat_scene ?? ""}. ${
    motion ? `${motion} — ` : ""
  }${lensLine ? `Shot on ${lensLine}. ` : ""}${node.premise ?? ""}`.trim();
  // Identity hold — the character-consistency chain runs through this clip:
  // whoever is in the source frame must stay exactly themselves in motion.
  const consistency =
    "Preserve the exact appearance of every person from the first frame — identical face, hair and " +
    "wardrobe throughout the clip. Natural motion only; no morphing, no identity drift, no new characters.";
  // Fold in the editable Video Director skill so motion follows the house style.
  const skill = skillForPart("video");
  // The chosen camera move (Stitch inspector → Motion) leads the direction line
  // so Seedance animates the shot the way the user picked, not at random.
  const cameraLine = cameraMove.phrase ? `Camera: ${cameraMove.phrase}` : "";
  // Project-wide style template — the look/wardrobe/vehicle locks. Placed last
  // so it overrides anything earlier in the prompt: animation is where a clip
  // most often re-costumes a character or swaps a vehicle mid-shot.
  const styleLine = node.style_template ? `STYLE LOCK\n${node.style_template}` : "";
  // CONTINUITY is deliberately separate from STYLE — the medium and the cast
  // are different constraints, and Higgsfield's own reference projects keep
  // them as distinct immutable blocks (STYLE LOCK / CONTINUITY / DIRECTION /
  // SHOT, where only SHOT varies per beat).
  const continuityLine = node.continuity_lock ? `CONTINUITY\n${node.continuity_lock}` : "";
  // The beat's own direction — the move and sound it was written for, plus the
  // continuity it inherits from the previous shot.
  const directionLine = node.beat_direction ? `DIRECTION\n${node.beat_direction}` : "";
  // Block order matches the reference architecture: the three immutable blocks
  // (STYLE LOCK, CONTINUITY, DIRECTION) frame the one variable block (SHOT),
  // and sit last so they win against anything descriptive earlier.
  // What the previous beat left on screen. Higgsfield's own Seedance workflow
  // chains every clip off the one before it ("continue exactly from the last
  // frame") — without that handoff each shot restarts the world and the cuts
  // stop reading as one continuous film.
  const prevBeat = db
    .prepare(
      `SELECT b.direction FROM stitch_nodes sn
       JOIN beats b ON b.id = sn.beat_id
       WHERE sn.project_id = (SELECT project_id FROM stitch_nodes WHERE id = ?)
         AND b.n = (SELECT b2.n - 1 FROM stitch_nodes sn2 JOIN beats b2 ON b2.id = sn2.beat_id WHERE sn2.id = ?)
       LIMIT 1`
    )
    .get(id, id) as { direction: string } | undefined;
  const handoff = (!isMinimaxH3 || continuityMode === "continue") && prevBeat?.direction
    ? `CONTINUES FROM — the previous shot ended here; pick the action up mid-motion rather than restarting it: ${prevBeat.direction}`
    : "";
  // SET lock. Reference teams report the model widening rooms and adding furniture it
  // was never shown as the worst source of drift between clips — worse than character
  // drift — so the geography is restated and expanding it is explicitly forbidden.
  const setLine = node.set_lock
    ? `SET
${node.set_lock}
Do not invent furniture, walls, windows, doors or layout beyond what is described or shown in the source frame.`
    : "Do not invent furniture, walls, windows, doors or layout beyond what is shown in the source frame.";
  // Conditioning both ends can reduce drift; it does not guarantee matching
  // output pixels. H3 only pins the next storyboard frame when explicitly asked.
  const wantEndFrame = isMinimaxH3 ? body.endFrame === true && !body.lastFrameImageUrl : body.endFrame !== false;
  const nextFrame = wantEndFrame
    ? (db
        .prepare(
          `SELECT COALESCE(a_direct.url, a_selected.url) as url
             FROM stitch_nodes sn
             JOIN beats b ON b.id = sn.beat_id
             LEFT JOIN storyboard_rows sr ON sr.beat_id = sn.beat_id
             LEFT JOIN assets a_direct ON a_direct.target_id = sn.variant_id AND a_direct.target_kind = 'storyboard_variant'
             LEFT JOIN assets a_selected ON a_selected.target_id = sr.selected_variant_id AND a_selected.target_kind = 'storyboard_variant'
            WHERE sn.project_id = (SELECT project_id FROM stitch_nodes WHERE id = ?)
              AND b.n = (SELECT b2.n + 1 FROM stitch_nodes sn2 JOIN beats b2 ON b2.id = sn2.beat_id WHERE sn2.id = ?)
            LIMIT 1`
        )
        .get(id, id) as { url: string | null } | undefined)
    : undefined;
  const endImageUrl = nextFrame?.url
    ? (nextFrame.url.startsWith("http") ? nextFrame.url : `${origin}${nextFrame.url}`)
    : undefined;
  let h3Refs: { first?: string; last?: string } = {};
  let h3Handoff = "";
  if (isMinimaxH3) {
    try {
      const ossRoot = process.env.OSS_DIR || (process.env.VERCEL ? "/tmp/zinema-data/oss" : path.join(process.cwd(), "data", "oss"));
      const checkedReference = (ref?: string | null) => {
        if (!ref) return undefined;
        if (ref.startsWith("/oss/")) { ossFile(ref, ossRoot); return ref; }
        const url = new URL(ref);
        if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("Use an HTTP(S) image URL or a local /oss/ image.");
        return url.href;
      };
      let previousLastFrame: string | undefined;
      let nextStoryboard: string | undefined;
      if (body.endFrame === true && !body.lastFrameImageUrl) {
        const next = db.prepare(`SELECT COALESCE(ad.url, ase.url) AS url
          FROM stitch_nodes sn LEFT JOIN storyboard_rows sr ON sr.beat_id = sn.beat_id
          LEFT JOIN assets ad ON ad.target_id = sn.variant_id AND ad.target_kind = 'storyboard_variant'
          LEFT JOIN assets ase ON ase.target_id = sr.selected_variant_id AND ase.target_kind = 'storyboard_variant'
          WHERE sn.project_id = ? AND (sn.x > ? OR (sn.x = ? AND sn.y > ?) OR (sn.x = ? AND sn.y = ? AND sn.id > ?))
          ORDER BY sn.x ASC, sn.y ASC, sn.id ASC LIMIT 1`)
          .get(node.project_id, node.x, node.x, node.y, node.x, node.y, node.id) as { url: string | null } | undefined;
        nextStoryboard = next?.url ? checkedReference(next.url.startsWith("/") && !next.url.startsWith("/oss/") ? `${origin}${next.url}` : next.url) : undefined;
      }
      if (continuityMode === "continue" && !body.referenceImageUrl) {
        const previous = db.prepare(`SELECT COALESCE(al.url, ac.url) AS clip_url, b.direction
          FROM stitch_nodes sn LEFT JOIN assets ac ON ac.id = sn.clip_asset_id
          LEFT JOIN assets al ON al.id = sn.lipsync_asset_id LEFT JOIN beats b ON b.id = sn.beat_id
          WHERE sn.project_id = ? AND (sn.x < ? OR (sn.x = ? AND sn.y < ?) OR (sn.x = ? AND sn.y = ? AND sn.id < ?))
          ORDER BY sn.x DESC, sn.y DESC, sn.id DESC LIMIT 1`)
          .get(node.project_id, node.x, node.x, node.y, node.x, node.y, node.id) as { clip_url: string | null; direction: string | null } | undefined;
        if (previous?.clip_url) {
          fs.mkdirSync(ossRoot, { recursive: true });
          const filename = `h3-handoff-${nanoid(10)}.png`;
          extractLastVideoFrame(ossFile(previous.clip_url, ossRoot), path.join(ossRoot, filename));
          previousLastFrame = `/oss/${filename}`;
          h3Handoff = previous.direction ? `CONTINUES FROM: ${previous.direction}. Start from the supplied actual final frame; do not restart the action.` : "";
        }
      }
      h3Refs = h3References({
        mode: continuityMode,
        storyboard: node.frame_url?.startsWith("/oss/") ? checkedReference(node.frame_url) : checkedReference(absUrl || undefined),
        previousLastFrame,
        explicitFirst: checkedReference(body.referenceImageUrl),
        explicitLast: checkedReference(body.lastFrameImageUrl),
        nextStoryboard,
        endFrame: body.endFrame
      });
    } catch (error: any) {
      return NextResponse.json({ error: error.message || "Could not prepare H3 reference frames." }, { status: 400 });
    }
  }
  const shotBlock = [cameraLine, base].filter(Boolean).join(" ");
  const avoidLine = node.avoid_prompt ? `AVOID
${node.avoid_prompt}` : "";
  const prompt = [
    styleLine,
    continuityLine,
    setLine,
    directionLine,
    isMinimaxH3 ? h3Handoff : handoff,
    avoidLine,
    `SHOT\n${shotBlock}`,
    skill?.body ?? "",
    consistency
  ]
    .filter(Boolean)
    .join("\n\n");

  // Was hardcoded to "Seedance 1.5 Pro" regardless of which BytePlus model
  // actually ran — harmless while there was only one BytePlus video model,
  // but now that Dreamina 2.0 and 1.5 Pro draw from separate billing pools,
  // a wrong label hides which pool a clip actually spent from.
  const providerLabel = isByteplus || isMinimaxH3
    ? chosen.label
    : useBrowser
      ? "Higgsfield Unlimited (browser)"
      : useMcp
      ? "Higgsfield (your account)"
      : vendor!.label;
  if (isMinimaxH3 && body.dryRun === true) {
    return NextResponse.json({
      ok: true, dryRun: true, prompt: h3GenerationPrompt(prompt),
      settings: h3Settings({ durationSeconds: clipDuration, width: h3Width, height: h3Height }),
      references: h3Refs, continuityMode,
      warnings: ["Preview only: no LLM call, GPU startup or generation. Endpoint conditioning still needs a paid visual test."]
    });
  }
  db.prepare("UPDATE stitch_nodes SET clip_state = 'generating' WHERE id = ?").run(id);

  // H3 responds far better to a structured, timeline-shaped prompt than to the
  // block format the other providers take. Expanding it here (via the LLM
  // already configured for the project) also bakes in the hard-won rules —
  // no generated lettering, explicit audio direction, one continuous shot —
  // so a short beat direction is enough to get a usable shot.
  let h3Prompt = prompt;
  let expansionStatus: "expanded" | "fallback" | undefined;
  const warnings: string[] = [];
  if (isMinimaxH3) {
    const prepared = await prepareH3Prompt({
      direction: prompt,
      durationSeconds: h3Settings({ durationSeconds: clipDuration }).durationSeconds,
      styleTemplate: node.style_template,
      continuityLock: node.continuity_lock,
      hasReferenceImage: Boolean(h3Refs.first),
      hasEndFrame: Boolean(h3Refs.last)
    });
    h3Prompt = prepared.prompt;
    expansionStatus = prepared.status;
    warnings.push(...prepared.warnings);
  }

  try {
    const video = isMinimaxH3
      ? await generateVideoViaMiniMaxH3({
          prompt: h3Prompt,
          durationSeconds: clipDuration,
          width: h3Width,
          height: h3Height,
          referenceImageUrl: h3Refs.first,
          lastFrameImageUrl: h3Refs.last,
          keepWarm: body.keepWarm === true
        })
      : useBrowser
      ? await generateVideoViaBrowser({
          prompt,
          frameUrl: node.frame_url!,
          endFrameUrl: nextFrame?.url ?? undefined,
          durationSeconds: clipDuration
        })
      : isByteplus
      ? await generateVideoViaByteplus({
          apiKey: bp!.api_key,
          model: chosen.byteplus!.model,
          prompt,
          referenceImageUrl: refImage,
          resolution: chosen.byteplus!.resolution,
          duration: clipDuration,
          cameraFixed: cameraMove.cameraFixed,
          audio: wantAudio
        })
      : useMcp
        ? await generateVideoViaMcp({
            prompt,
            aspectRatio: node.aspect_ratio,
            referenceImageUrl: refImage,
            endImageUrl,
            modelParams: chosen.params
          })
        : await generateVideo({
            prompt,
            aspectRatio: node.aspect_ratio,
            referenceImageUrl: refImage,
            vendor: vendor!
          });
    const h3Video = isMinimaxH3 ? video as Awaited<ReturnType<typeof generateVideoViaMiniMaxH3>> : undefined;
    warnings.push(...(h3Video?.warnings ?? []));
    const metadata = h3Video ? {
      provider: "minimax_h3", settings: h3Video.settings, actual: h3Video.actual,
      firstFrameUrl: h3Video.firstFrameUrl, lastFrameUrl: h3Video.lastFrameUrl,
      continuityMode, references: h3Refs, promptExpansion: expansionStatus, warnings
    } : {};
    const assetId = nanoid(10);
    db.prepare(
      "INSERT INTO assets (id, target_kind, target_id, kind, url, prompt, vendor_id, meta) VALUES (?, 'stitch_clip', ?, 'video', ?, ?, ?, ?)"
    ).run(assetId, id, video.url, h3Video?.prompt ?? prompt, isByteplus ? bp!.id : isMinimaxH3 || useMcp ? null : vendor!.id, JSON.stringify(metadata));
    db.prepare("UPDATE stitch_nodes SET clip_asset_id = ?, clip_state = 'complete' WHERE id = ?").run(assetId, id);
    return NextResponse.json({
      ok: true,
      url: video.url,
      vendor: providerLabel,
      lastFrameUrl: (video as { lastFrameUrl?: string }).lastFrameUrl,
      warnings,
      promptExpansion: expansionStatus,
      settings: h3Video?.settings,
      actual: h3Video?.actual
    });
  } catch (error: any) {
    db.prepare("UPDATE stitch_nodes SET clip_state = 'error' WHERE id = ?").run(id);
    return NextResponse.json({ error: error?.message ?? String(error), warnings, ...(error instanceof H3BudgetError ? { budget: error.preflight } : {}) }, { status: error instanceof H3BudgetError ? 402 : 500 });
  }
}
