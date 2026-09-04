import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getDb } from "../../../../../lib/db/client";
import { characters, locations, props } from "../../../../../lib/db/repo";

export const dynamic = "force-dynamic";

/** One list of everything in a project, in one shape.
 *
 *  The canvas, the library and (next) the composer's @-mention picker all need
 *  "the project's assets" and were each assembling it from a different pair of
 *  routes with a different row shape. This normalises generated media and named
 *  entities into a single item type so those surfaces share one fetch, one
 *  filter and one pagination cursor.
 *
 *  `ref_kind` is the field the composer needs: it says which MiniMax H3
 *  reference channel an item can feed (`ref_images` vs `ref_videos`), so a chip
 *  dropped into a prompt already knows how it should be wired. Entities carry
 *  their portrait/plate, which is why a character is `ref_kind: "image"`.
 *
 *  Scope (brief §34). The route is still addressed by one project, because
 *  every caller already has one and the favourites, the composer and the
 *  canvas all mean "this production". `?scope=all` widens it to every
 *  production without changing a single existing parameter or field: the
 *  project in the path stays the default and the fallback. Each item now
 *  names its production so a global view can label and group; that field is
 *  additive and always present, so a caller that ignores it is unaffected.
 */

export type AssetKind = "image" | "video" | "character" | "location" | "prop";

/** Where a media asset is filed. It is what decides which actions an item can
 *  offer: a storyboard frame can become a shot, a clip already is one. */
export type AssetSource = "storyboard_variant" | "stitch_clip" | "sequence" | "beat";

export interface AssetItem {
  id: string;
  kind: AssetKind;
  /** Media URL, or the entity's reference still. Null when an entity has no plate yet. */
  url: string | null;
  title: string;
  subtitle: string | null;
  created_at: string;
  /** Can be dropped into a prompt as an @-mention. */
  mentionable: boolean;
  /** Which H3 reference channel this feeds, or null if it cannot be a reference. */
  ref_kind: "image" | "video" | null;
  favourite: boolean;
  /** The production this belongs to. A global list has to be able to say. */
  project_id: string;
  project_title: string;
  /** How this media is filed, and against what. Null for entities. */
  source_kind: AssetSource | null;
  source_id: string | null;
  /** Ids of the collections this item belongs to. */
  collections: string[];
}

const KINDS: AssetKind[] = ["image", "video", "character", "location", "prop"];

interface Production {
  id: string;
  title: string;
}

const KNOWN_SOURCES = ["storyboard_variant", "stitch_clip", "sequence", "beat"] as const;

/** Generated media: storyboard frames, shot clips and rendered sequences. */
function media(p: Production): AssetItem[] {
  const rows = getDb()
    .prepare(
      // A clip made in Shots is filed against its stitch node, which is the
      // only thing that knows the project. Without that join every clip the
      // app itself generated was invisible here, while clips filed by hand
      // as sequences showed — the canvas was hiding exactly the work the
      // product exists to make.
      `SELECT a.id, a.url, a.kind, a.prompt, a.created_at, a.target_kind, a.target_id,
              b.n AS beat_n, b.title AS beat_title,
              sn.direction AS node_direction
         FROM assets a
         LEFT JOIN storyboard_variants v
           ON v.id = a.target_id AND a.target_kind = 'storyboard_variant'
         LEFT JOIN stitch_nodes sn
           ON sn.id = a.target_id AND a.target_kind = 'stitch_clip'
         LEFT JOIN beats b
           ON b.id = COALESCE(v.beat_id, sn.beat_id, CASE WHEN a.target_kind = 'beat' THEN a.target_id END)
        WHERE b.project_id = ?
           OR sn.project_id = ?
           OR (a.target_kind = 'sequence' AND a.target_id = ?)
        ORDER BY a.created_at DESC`
    )
    .all(p.id, p.id, p.id) as Array<{
    id: string;
    url: string;
    kind: string;
    prompt: string;
    created_at: string;
    target_kind: string;
    target_id: string | null;
    beat_n: number | null;
    beat_title: string | null;
    node_direction: string | null;
  }>;

  return rows.map((r) => {
    // The row's own kind decides. target_kind says where an asset is filed, not
    // what it is — treating everything filed as a sequence as video mislabels a
    // still that lives on the project rather than on a storyboard variant, and
    // puts a play badge on a photograph.
    const isVideo = r.kind === "video" || r.kind === "clip";
    return {
      id: r.id,
      kind: isVideo ? "video" : "image",
      url: r.url,
      // A beat names itself; anything else uses the prompt it was filed with,
      // falling back to the generic word only when there is nothing to say.
      // A composed shot has no beat; its direction is the closest thing to a
      // name it has. Lip-synced and uploaded clips carry no prompt at all.
      title: r.beat_n
        ? `${String(r.beat_n).padStart(2, "0")} · ${r.beat_title || "Beat"}`
        : (r.prompt?.trim() || r.node_direction?.trim())
        ? (r.prompt?.trim() || r.node_direction!.trim()).slice(0, 60)
        : isVideo
        ? "Sequence"
        : "Frame",
      subtitle: r.beat_n ? null : r.beat_title,
      created_at: r.created_at,
      mentionable: true,
      ref_kind: isVideo ? "video" : "image",
      favourite: false,
      project_id: p.id,
      project_title: p.title,
      source_kind: (KNOWN_SOURCES as readonly string[]).includes(r.target_kind)
        ? (r.target_kind as AssetSource)
        : null,
      source_id: r.target_id,
      collections: []
    } satisfies AssetItem;
  });
}

/** Named entities. These are what make @-mentions worth having. */
function entities(p: Production): AssetItem[] {
  const out: AssetItem[] = [];
  const base = {
    mentionable: true,
    ref_kind: "image" as const,
    favourite: false,
    project_id: p.id,
    project_title: p.title,
    source_kind: null,
    source_id: null
  };

  for (const c of characters.forProject(p.id)) {
    out.push({
      ...base,
      collections: [],
      id: c.id,
      kind: "character",
      url: c.refs[0] ?? null,
      title: c.name,
      subtitle: c.role,
      created_at: c.created_at
    });
  }
  for (const l of locations.forProject(p.id)) {
    out.push({
      ...base,
      collections: [],
      id: l.id,
      kind: "location",
      url: l.refs[0] ?? null,
      title: l.name,
      subtitle: l.int_ext,
      created_at: l.created_at
    });
  }
  for (const pr of props.forProject(p.id)) {
    out.push({
      ...base,
      collections: [],
      id: pr.id,
      kind: "prop",
      url: pr.refs[0] ?? null,
      title: pr.name,
      subtitle: pr.description ? pr.description.slice(0, 80) : null,
      created_at: pr.created_at
    });
  }
  return out;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);

  const kindParam = url.searchParams.get("kind");
  const kinds =
    !kindParam || kindParam === "all"
      ? KINDS
      : kindParam.split(",").filter((k): k is AssetKind => (KINDS as string[]).includes(k));
  if (kinds.length === 0) {
    return NextResponse.json({ error: `kind must be "all" or one of: ${KINDS.join(", ")}.` }, { status: 400 });
  }

  const limitRaw = Number(url.searchParams.get("limit") ?? 60);
  const limit = Number.isSafeInteger(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 60;
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const cursor = url.searchParams.get("cursor");
  const global = url.searchParams.get("scope") === "all";
  // Inside a global list, one production can still be singled out — that is a
  // filter on the same list, not a different request.
  const only = url.searchParams.get("production");
  const collection = url.searchParams.get("collection");

  const db = getDb();
  let productions: Production[];
  if (global) {
    productions = db
      .prepare("SELECT id, title FROM projects ORDER BY updated_at DESC")
      .all() as unknown as Production[];
    if (only) productions = productions.filter((p) => p.id === only);
  } else {
    const row = db.prepare("SELECT id, title FROM projects WHERE id = ?").get(id) as Production | undefined;
    // A missing project is an empty list, not an error: the old route read
    // straight through with no existence check and callers rely on that.
    productions = row ? [row] : [{ id, title: "" }];
  }

  let items: AssetItem[];
  try {
    const wantsMedia = kinds.some((k) => k === "image" || k === "video");
    const wantsEntities = kinds.some((k) => k !== "image" && k !== "video");
    items = productions
      .flatMap((p) => [...(wantsMedia ? media(p) : []), ...(wantsEntities ? entities(p) : [])])
      .filter((a) => kinds.includes(a.kind));
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Could not read this project's assets." }, { status: 500 });
  }

  const scanned = productions.map((p) => p.id);
  const holes = scanned.map(() => "?").join(", ");

  // One query for the whole page rather than a lookup per item.
  const starred = new Set(
    (
      db
        .prepare(`SELECT project_id, kind, item_id FROM asset_favourites WHERE project_id IN (${holes})`)
        .all(...scanned) as Array<{ project_id: string; kind: string; item_id: string }>
    ).map((r) => `${r.project_id}:${r.kind}:${r.item_id}`)
  );
  const sets = new Map<string, string[]>();
  for (const r of db
    .prepare(`SELECT collection_id, project_id, kind, item_id FROM asset_collection_items WHERE project_id IN (${holes})`)
    .all(...scanned) as Array<{ collection_id: string; project_id: string; kind: string; item_id: string }>) {
    const k = `${r.project_id}:${r.kind}:${r.item_id}`;
    sets.set(k, [...(sets.get(k) ?? []), r.collection_id]);
  }
  for (const a of items) {
    const k = `${a.project_id}:${a.kind}:${a.id}`;
    a.favourite = starred.has(k);
    a.collections = sets.get(k) ?? [];
  }

  if (url.searchParams.get("favourite") === "1") {
    items = items.filter((a) => a.favourite);
  }

  if (collection) {
    items = items.filter((a) => a.collections.includes(collection));
  }

  if (q) {
    items = items.filter(
      (a) => a.title.toLowerCase().includes(q) || (a.subtitle ?? "").toLowerCase().includes(q)
    );
  }

  // Media and entities come from different tables, so ordering happens here.
  // The cursor is `created_at|id` — the id breaks ties, which timestamps alone
  // cannot when rows are written in the same second.
  items.sort((a, b) =>
    a.created_at === b.created_at ? b.id.localeCompare(a.id) : a.created_at < b.created_at ? 1 : -1
  );

  if (cursor) {
    const at = items.findIndex((a) => `${a.created_at}|${a.id}` === cursor);
    if (at >= 0) items = items.slice(at + 1);
  }

  const page = items.slice(0, limit);
  const last = page[page.length - 1];

  return NextResponse.json({
    items: page,
    next_cursor: items.length > limit && last ? `${last.created_at}|${last.id}` : null,
    total: items.length
  });
}

const COMPOSED_COL_WIDTH = 280;
const COMPOSED_ROW_Y = 520;

/**
 * File an existing piece of media into this production (brief §35, "add to
 * production" / "add to the cut").
 *
 * Nothing is copied on disk: the media already lives under `/oss` and both
 * productions point at the same file. `as: "reference"` files it as one of the
 * production's own assets so it shows on this canvas and in the @-picker;
 * `as: "shot"` additionally creates a shot holding it, which is how a clip
 * made elsewhere gets into the cut — the same `clip_asset_id` / `clip_state`
 * pair the animate and upload-clip routes write.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as
    | { url?: string; kind?: string; title?: string; as?: string }
    | null;

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Expected an object request body." }, { status: 400 });
  }
  const mediaUrl = typeof body.url === "string" ? body.url.trim() : "";
  if (!mediaUrl) return NextResponse.json({ error: "url is required." }, { status: 400 });
  const kind = body.kind === "video" ? "video" : body.kind === "image" ? "image" : null;
  if (!kind) return NextResponse.json({ error: 'kind must be "image" or "video".' }, { status: 400 });
  const as = body.as === "shot" ? "shot" : "reference";
  if (as === "shot" && kind !== "video") {
    return NextResponse.json({ error: "Only a clip can be added to the cut." }, { status: 400 });
  }
  const title = (typeof body.title === "string" ? body.title.trim() : "").slice(0, 200);

  const db = getDb();
  const project = db.prepare("SELECT id FROM projects WHERE id = ?").get(id) as { id: string } | undefined;
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

  const assetId = nanoid(10);

  if (as === "reference") {
    db.prepare(
      "INSERT INTO assets (id, target_kind, target_id, kind, url, prompt) VALUES (?, 'sequence', ?, ?, ?, ?)"
    ).run(assetId, id, kind, mediaUrl, title || "Added to this production");
    return NextResponse.json({ ok: true, asset_id: assetId });
  }

  // Placed after whatever composed shots already exist, the way compose does,
  // so a run of additions reads left to right instead of stacking on one spot.
  const placed = db
    .prepare("SELECT COUNT(*) AS n FROM stitch_nodes WHERE project_id = ? AND beat_id IS NULL")
    .get(id) as { n: number };
  const nodeId = nanoid(12);
  db.prepare(
    `INSERT INTO stitch_nodes (id, project_id, beat_id, x, y, duration, direction)
     VALUES (?, ?, NULL, ?, ?, ?, ?)`
  ).run(nodeId, id, (placed.n + 1) * COMPOSED_COL_WIDTH, COMPOSED_ROW_Y, 5, title || "Added clip");
  db.prepare(
    "INSERT INTO assets (id, target_kind, target_id, kind, url, prompt) VALUES (?, 'stitch_clip', ?, 'video', ?, ?)"
  ).run(assetId, nodeId, mediaUrl, title || "Added clip");
  db.prepare("UPDATE stitch_nodes SET clip_asset_id = ?, clip_state = 'complete' WHERE id = ?").run(assetId, nodeId);

  return NextResponse.json({ ok: true, asset_id: assetId, node_id: nodeId });
}
