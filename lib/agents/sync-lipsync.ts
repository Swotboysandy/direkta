import fs from "node:fs";
import path from "node:path";
import { nanoid } from "nanoid";

/**
 * Sync.so (api.sync.so/v2) — audio-driven lip sync.
 *
 * Contract (verified against Sync.so's live OpenAPI spec):
 *   POST {BASE}/generate  { model, input: [{type,url}, ...], options }  → { id, status }
 *   GET  {BASE}/generate/{id}                                          → { status, outputUrl }
 * Auth: `x-api-key: <api_key>` (NOT Bearer). Status terminal values:
 * COMPLETED | FAILED | REJECTED.
 *
 * Billed on the user's own Sync.so account (per-second, tiered by model) —
 * deliberately NOT wired into lib/usage.ts's BytePlus token ledger, which
 * tracks a completely different vendor's token pack. Mixing the two would
 * silently corrupt that budget the same way this session's earlier BytePlus
 * budget-guard fix was written to prevent.
 */

const OSS_DIR =
  process.env.OSS_DIR ||
  (process.env.VERCEL ? "/tmp/zinema-data/oss" : path.join(process.cwd(), "data", "oss"));

const BASE = process.env.SYNC_SO_BASE || "https://api.sync.so/v2";

export async function generateLipsyncViaSync(input: {
  apiKey: string;
  model: string; // e.g. lipsync-2, lipsync-2-pro, sync-3
  /** Publicly reachable URL of the existing clip to re-sync, if one exists. */
  videoUrl?: string;
  /** Publicly reachable URL of a still frame — used when no clip exists yet. */
  imageUrl?: string;
  audioUrl: string; // publicly reachable URL of the dialogue track
}): Promise<{ url: string; relPath: string }> {
  if (!input.videoUrl && !input.imageUrl) {
    throw new Error("Sync.so lip sync needs either an existing clip or a storyboard frame");
  }
  const headers = { "content-type": "application/json", "x-api-key": input.apiKey };

  const create = await fetch(`${BASE}/generate`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: input.model,
      input: [
        input.videoUrl ? { type: "video", url: input.videoUrl } : { type: "image", url: input.imageUrl },
        { type: "audio", url: input.audioUrl }
      ],
      options: { sync_mode: "bounce" }
    })
  });
  if (!create.ok) {
    throw new Error(`Sync.so submit failed (${create.status}): ${(await create.text()).slice(0, 280)}`);
  }
  const created = (await create.json()) as Record<string, any>;
  const id = created.id;
  if (!id) throw new Error(`Sync.so returned no generation id: ${JSON.stringify(created).slice(0, 200)}`);

  let outputUrl: string | undefined;
  for (let i = 0; i < 120 && !outputUrl; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const poll = await fetch(`${BASE}/generate/${id}`, { headers });
    if (!poll.ok) continue;
    const data = (await poll.json()) as Record<string, any>;
    const status = String(data.status ?? "");
    if (status === "COMPLETED") {
      outputUrl = data.outputUrl;
      if (!outputUrl) throw new Error("Sync.so completed but returned no outputUrl");
      break;
    }
    if (status === "FAILED" || status === "REJECTED") {
      throw new Error(`Sync.so lip sync ${status}: ${data.error ?? data.errorCode ?? "unknown error"}`);
    }
  }
  if (!outputUrl) throw new Error("Sync.so lip sync timed out");

  const dl = await fetch(outputUrl);
  if (!dl.ok) throw new Error(`Failed to download Sync.so output: ${dl.status}`);
  fs.mkdirSync(OSS_DIR, { recursive: true });
  const filename = `${Date.now()}-${nanoid(8)}.mp4`;
  fs.writeFileSync(path.join(OSS_DIR, filename), Buffer.from(await dl.arrayBuffer()));
  return { url: `/oss/${filename}`, relPath: `data/oss/${filename}` };
}
