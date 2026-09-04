import { NextResponse } from "next/server";
import { projects } from "../../../lib/db/repo";
import { getDb } from "../../../lib/db/client";
import type { AspectRatio, LengthEstimate, ProjectFormat } from "../../../lib/types";

export const dynamic = "force-dynamic";

const VALID_ASPECTS: AspectRatio[] = ["16:9", "9:16", "1:1", "4:5", "21:9"];
const VALID_FORMATS: ProjectFormat[] = ["Short Film", "Music Video", "Ad", "Series", "Feature", "Other"];
const VALID_LENGTHS: LengthEstimate[] = ["Under 1 min", "Under 5 min", "5–15 min", "15–30 min", "30+ min"];

/** What a production looks like from outside: the counts that say how far it
 *  has got, when it was last touched, and one image to stand for it. */
function summary(id: string) {
  const db = getDb();
  const counts = db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM beats WHERE project_id = ?) AS beats,
         (SELECT COUNT(*) FROM characters WHERE project_id = ?) AS characters,
         (SELECT COUNT(*) FROM stitch_nodes WHERE project_id = ?) AS shots,
         (SELECT updated_at FROM projects WHERE id = ?) AS updated_at`
    )
    .get(id, id, id, id) as { beats: number; characters: number; shots: number; updated_at: string };
  // The newest frame or clip in the production, by the same reach as the
  // assets canvas: storyboard frames, clips on the board, filed sequences.
  const poster = db
    .prepare(
      `SELECT a.url, a.kind
         FROM assets a
         LEFT JOIN storyboard_variants v ON v.id = a.target_id AND a.target_kind = 'storyboard_variant'
         LEFT JOIN stitch_nodes sn ON sn.id = a.target_id AND a.target_kind = 'stitch_clip'
         LEFT JOIN beats b ON b.id = COALESCE(v.beat_id, sn.beat_id)
        WHERE (b.project_id = ? OR sn.project_id = ? OR (a.target_kind = 'sequence' AND a.target_id = ?))
          AND a.kind IN ('image', 'video')
        ORDER BY a.created_at DESC
        LIMIT 1`
    )
    .get(id, id, id) as { url: string; kind: string } | undefined;
  return { ...counts, poster_url: poster?.url ?? null, poster_kind: poster?.kind ?? null };
}

export async function GET(req: Request) {
  const list = projects.list();
  if (new URL(req.url).searchParams.get("withCounts") === "1") {
    return NextResponse.json({ projects: list.map((p) => ({ ...p, ...summary(p.id) })) });
  }
  return NextResponse.json({ projects: list });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const title = String(body.title ?? "Untitled").slice(0, 200);
  const premise = String(body.premise ?? "").slice(0, 2000);
  const logline = String(body.logline ?? body.premise ?? "").slice(0, 280);
  const requestedAspect = String(body.aspect_ratio ?? "16:9") as AspectRatio;
  const aspect_ratio: AspectRatio = VALID_ASPECTS.includes(requestedAspect) ? requestedAspect : "16:9";
  const requestedFormat = String(body.format ?? "Short Film") as ProjectFormat;
  const format: ProjectFormat = VALID_FORMATS.includes(requestedFormat) ? requestedFormat : "Short Film";
  const requestedLength = String(body.length_estimate ?? "Under 5 min") as LengthEstimate;
  const length_estimate: LengthEstimate = VALID_LENGTHS.includes(requestedLength)
    ? requestedLength
    : "Under 5 min";

  const project = projects.create({ title, premise, logline, aspect_ratio, format, length_estimate });

  // Optional creative direction, set at birth so the very first script
  // generation already follows it.
  const creative_brief = typeof body.creative_brief === "string" ? body.creative_brief.slice(0, 8000) : "";
  const brand_kit = typeof body.brand_kit === "string" ? body.brand_kit.slice(0, 4000) : "";
  if (creative_brief || brand_kit) {
    projects.update(project.id, {
      creative_brief: creative_brief || undefined,
      brand_kit: brand_kit || undefined
    });
  }

  return NextResponse.json({ project: projects.get(project.id) }, { status: 201 });
}
