import { NextResponse } from "next/server";
import { getDb } from "../../../../../lib/db/client";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({} as { prompt?: string; state?: string }));
  const db = getDb();

  const fields: string[] = [];
  const values: (string | null)[] = [];

  if (typeof body.prompt === "string") {
    fields.push("prompt = ?");
    values.push(body.prompt);
  }
  if (typeof body.state === "string") {
    fields.push("state = ?");
    values.push(body.state);
  }

  if (!fields.length) return NextResponse.json({ ok: true });

  values.push(id);
  db.prepare(`UPDATE storyboard_variants SET ${fields.join(", ")} WHERE id = ?`).run(...values);

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  db.prepare("DELETE FROM assets WHERE target_kind = 'storyboard_variant' AND target_id = ?").run(id);
  db.prepare("DELETE FROM storyboard_variants WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
