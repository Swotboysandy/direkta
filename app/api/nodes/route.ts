import { NextResponse } from "next/server";
import { nodes } from "../../../lib/db/repo";
import type { NodeKind } from "../../../lib/types";

export const dynamic = "force-dynamic";

const VALID_KINDS: NodeKind[] = [
  "script",
  "character",
  "scene",
  "storyboard",
  "shot",
  "music",
  "render",
  "note"
];

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!body.project_id || !body.kind || !body.title) {
    return NextResponse.json({ error: "project_id, kind, title required" }, { status: 400 });
  }
  if (!VALID_KINDS.includes(body.kind)) {
    return NextResponse.json({ error: `kind must be one of ${VALID_KINDS.join(", ")}` }, { status: 400 });
  }
  const node = nodes.create({
    project_id: String(body.project_id),
    kind: body.kind as NodeKind,
    title: String(body.title).slice(0, 200),
    body: String(body.body ?? "").slice(0, 8000),
    x: Number(body.x ?? 0),
    y: Number(body.y ?? 0)
  });
  return NextResponse.json({ node }, { status: 201 });
}
