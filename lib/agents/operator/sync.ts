// Library sync — the bridge between the free Codex Record-&-Replay generation worker and Direkta.
//
// Flow (no MCP credits — generation happens in a free web UI driven by Codex R&R):
//   1. writeWorklist(project): dump the pending shots (id + prompt + negative + aspect) to
//      worklist.json. Codex's recorded skill iterates it: generate each, download, and save the
//      file into the inbox folder named  frame_<variant_id>.<ext>  (or clip_<stitch_node_id>.<ext>).
//   2. syncInbox(): scan the inbox, copy each matched file into Direkta's OSS dir, and attach it to
//      its storyboard variant (image) or stitch node (video). Processed files move to inbox/_done.
//
// Directories share the app's resolution so `next dev` serves what we write under /oss.

import fs from "node:fs";
import path from "node:path";
import { nanoid } from "nanoid";
import { getShotlist, importGeneration, importStitchClip } from "./generation";

function dataDir(): string {
  return process.env.DATA_DIR || (process.env.VERCEL ? "/tmp/zinema-data" : path.join(process.cwd(), "data"));
}
const ossDir = () => process.env.OSS_DIR || path.join(dataDir(), "oss");
const inboxDirDefault = () => process.env.GEN_INBOX || path.join(dataDir(), "inbox");
const worklistPath = () => path.join(dataDir(), "worklist.json");

const IMG = new Set(["png", "jpg", "jpeg", "webp"]);
const VID = new Set(["mp4", "mov", "webm", "m4v"]);

export interface WorklistResult {
  count: number;
  path: string;
}

/** Write the pending shots to worklist.json for the Codex generation worker. */
export function writeWorklist(projectId: string): WorklistResult {
  const items = getShotlist(projectId)
    .filter((s) => s.state !== "complete")
    .map((s) => ({
      id: s.variant_id,
      kind: "image" as const,
      beat: s.beat_n,
      prompt: s.prompt,
      negative: s.negative,
      aspect: s.aspect,
      save_as: `frame_${s.variant_id}.png`
    }));
  const p = worklistPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(
    p,
    JSON.stringify(
      {
        project_id: projectId,
        count: items.length,
        inbox: inboxDirDefault(),
        instructions:
          "For each item: generate an image from `prompt` (use `negative` as the negative prompt and `aspect` as the aspect ratio), download it, and save it into `inbox` named exactly `save_as`. Then tell the operator to run sync_generations.",
        items
      },
      null,
      2
    )
  );
  return { count: items.length, path: p };
}

export interface SyncResult {
  inbox: string;
  imported: Array<{ name: string; variant_id?: string; node_id?: string; url: string }>;
  skipped: string[];
  errors: Array<{ name: string; error: string }>;
}

/** Ingest generated files from the inbox: copy to OSS and attach to the variant / stitch node. */
export function syncInbox(opts?: { inboxDir?: string }): SyncResult {
  const inbox = opts?.inboxDir || inboxDirDefault();
  const oss = ossDir();
  const result: SyncResult = { inbox, imported: [], skipped: [], errors: [] };
  if (!fs.existsSync(inbox)) return result;

  fs.mkdirSync(oss, { recursive: true });
  const doneDir = path.join(inbox, "_done");
  fs.mkdirSync(doneDir, { recursive: true });

  for (const name of fs.readdirSync(inbox)) {
    const full = path.join(inbox, name);
    if (!fs.statSync(full).isFile()) continue;
    const m = name.match(/^(frame|clip)_([A-Za-z0-9_-]{6,})\.([A-Za-z0-9]+)$/);
    if (!m) {
      result.skipped.push(name);
      continue;
    }
    const [, role, targetId, extRaw] = m;
    const ext = extRaw.toLowerCase();
    try {
      if (role === "frame" && !IMG.has(ext)) throw new Error(`unsupported image extension .${ext}`);
      if (role === "clip" && !VID.has(ext)) throw new Error(`unsupported video extension .${ext}`);

      const outName = `${Date.now()}-${nanoid(8)}.${ext}`;
      fs.copyFileSync(full, path.join(oss, outName));
      const url = `/oss/${outName}`;

      if (role === "frame") {
        const r = importGeneration(targetId, { url, model: "codex-replay" });
        result.imported.push({ name, variant_id: r.variant_id, url });
      } else {
        const r = importStitchClip(targetId, { url, model: "codex-replay" });
        result.imported.push({ name, node_id: r.node_id, url });
      }
      fs.renameSync(full, path.join(doneDir, name));
    } catch (e) {
      result.errors.push({ name, error: e instanceof Error ? e.message : String(e) });
    }
  }
  return result;
}
