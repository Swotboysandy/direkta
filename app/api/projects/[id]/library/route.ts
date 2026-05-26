import { NextResponse } from "next/server";
import { getDb } from "../../../../../lib/db/client";
import { characters, locations } from "../../../../../lib/db/repo";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();

  const generations = db
    .prepare(
      `SELECT a.id, a.url, a.prompt, a.created_at, a.target_kind, v.beat_id, v.n as variant_n, b.n as beat_n, b.title as beat_title
       FROM assets a
       LEFT JOIN storyboard_variants v ON v.id = a.target_id AND a.target_kind = 'storyboard_variant'
       LEFT JOIN beats b ON b.id = v.beat_id
       WHERE b.project_id = ? OR (a.target_kind = 'sequence' AND a.target_id = ?)
       ORDER BY a.created_at DESC`
    )
    .all(id, id) as Array<{
    id: string;
    url: string;
    prompt: string;
    created_at: string;
    target_kind: string;
    beat_id: string | null;
    variant_n: number | null;
    beat_n: number | null;
    beat_title: string | null;
  }>;

  const sequences = generations.filter((g) => g.target_kind === "sequence");
  const frames = generations.filter((g) => g.target_kind === "storyboard_variant");

  return NextResponse.json({
    generations: frames.map((g) => ({
      id: g.id,
      url: g.url,
      prompt: g.prompt,
      created_at: g.created_at,
      beat_n: g.beat_n,
      variant_n: g.variant_n,
      beat_title: g.beat_title
    })),
    sequences: sequences.map((s) => ({
      id: s.id,
      url: s.url,
      title: s.prompt,
      created_at: s.created_at
    })),
    characters: characters.forProject(id).map((c) => ({
      id: c.id,
      name: c.name,
      role: c.role,
      state: c.soul_id_state,
      consistency: c.consistency,
      refs: c.refs
    })),
    locations: locations.forProject(id).map((l) => ({
      id: l.id,
      name: l.name,
      int_ext: l.int_ext,
      state: l.soul_id_state,
      refs: l.refs
    }))
  });
}
