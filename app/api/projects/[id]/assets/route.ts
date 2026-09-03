import { NextResponse } from "next/server";
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
 */

export type AssetKind = "image" | "video" | "character" | "location" | "prop";

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
}

const KINDS: AssetKind[] = ["image", "video", "character", "location", "prop"];

/** Generated media: storyboard frames and rendered sequences. */
function media(projectId: string): AssetItem[] {
  const rows = getDb()
    .prepare(
      `SELECT a.id, a.url, a.kind, a.prompt, a.created_at, a.target_kind,
              b.n AS beat_n, b.title AS beat_title
         FROM assets a
         LEFT JOIN storyboard_variants v
           ON v.id = a.target_id AND a.target_kind = 'storyboard_variant'
         LEFT JOIN beats b ON b.id = v.beat_id
        WHERE b.project_id = ?
           OR (a.target_kind = 'sequence' AND a.target_id = ?)
        ORDER BY a.created_at DESC`
    )
    .all(projectId, projectId) as Array<{
    id: string;
    url: string;
    kind: string;
    prompt: string;
    created_at: string;
    target_kind: string;
    beat_n: number | null;
    beat_title: string | null;
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
      title: r.beat_n ? `Beat ${String(r.beat_n).padStart(2, "0")}` : isVideo ? "Sequence" : "Frame",
      subtitle: r.beat_title ?? (r.prompt ? r.prompt.slice(0, 80) : null),
      created_at: r.created_at,
      mentionable: true,
      ref_kind: isVideo ? "video" : "image",
      favourite: false
    } satisfies AssetItem;
  });
}

/** Named entities. These are what make @-mentions worth having. */
function entities(projectId: string): AssetItem[] {
  const out: AssetItem[] = [];

  for (const c of characters.forProject(projectId)) {
    out.push({
      id: c.id,
      kind: "character",
      url: c.refs[0] ?? null,
      title: c.name,
      subtitle: c.role,
      created_at: c.created_at,
      mentionable: true,
      ref_kind: "image",
      favourite: false
    });
  }
  for (const l of locations.forProject(projectId)) {
    out.push({
      id: l.id,
      kind: "location",
      url: l.refs[0] ?? null,
      title: l.name,
      subtitle: l.int_ext,
      created_at: l.created_at,
      mentionable: true,
      ref_kind: "image",
      favourite: false
    });
  }
  for (const p of props.forProject(projectId)) {
    out.push({
      id: p.id,
      kind: "prop",
      url: p.refs[0] ?? null,
      title: p.name,
      subtitle: p.description ? p.description.slice(0, 80) : null,
      created_at: p.created_at,
      mentionable: true,
      ref_kind: "image",
      favourite: false
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

  let items: AssetItem[];
  try {
    const wantsMedia = kinds.some((k) => k === "image" || k === "video");
    const wantsEntities = kinds.some((k) => k !== "image" && k !== "video");
    items = [
      ...(wantsMedia ? media(id) : []),
      ...(wantsEntities ? entities(id) : [])
    ].filter((a) => kinds.includes(a.kind));
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Could not read this project's assets." }, { status: 500 });
  }

  // One query for the whole page rather than a lookup per item.
  const starred = new Set(
    (
      getDb()
        .prepare("SELECT kind, item_id FROM asset_favourites WHERE project_id = ?")
        .all(id) as Array<{ kind: string; item_id: string }>
    ).map((r) => `${r.kind}:${r.item_id}`)
  );
  for (const a of items) a.favourite = starred.has(`${a.kind}:${a.id}`);

  if (url.searchParams.get("favourite") === "1") {
    items = items.filter((a) => a.favourite);
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
