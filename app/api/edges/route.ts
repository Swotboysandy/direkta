import { NextResponse } from "next/server";
import { edges, nodes } from "../../../lib/db/repo";
import { requireAccess } from "../../../lib/auth/guard";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!body.source || !body.target) {
    return NextResponse.json({ error: "source and target required" }, { status: 400 });
  }
  // The source must be in a production this user can reach; the same-project
  // check below then keeps the target inside it too.
  const access = requireAccess(req, "node", String(body.source));
  if (access instanceof Response) return access;
  const source = nodes.get(String(body.source));
  const target = nodes.get(String(body.target));
  if (!source || !target) return NextResponse.json({ error: "Node not found" }, { status: 404 });
  if (source.project_id !== target.project_id) {
    return NextResponse.json({ error: "Nodes belong to different projects" }, { status: 400 });
  }
  if (source.id === target.id) {
    return NextResponse.json({ error: "Cannot connect a node to itself" }, { status: 400 });
  }
  const edge = edges.create({
    project_id: source.project_id,
    source: source.id,
    target: target.id,
    label: typeof body.label === "string" ? body.label : undefined
  });
  return NextResponse.json({ edge }, { status: 201 });
}
