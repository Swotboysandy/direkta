import { NextResponse } from "next/server";
import { pendingApprovals, prunePending } from "../../../../lib/agents/director";
import { getTool, runTool } from "../../../../lib/agents/director-tools";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * A person answering the Director (brief §13).
 *
 * The only place a spending or destructive tool can run. The Director asked
 * and stopped; this route holds the answer. An approval is single-use and
 * expires, so a stale sheet left open in another tab cannot start a render an
 * hour later.
 */
export async function POST(req: Request) {
  prunePending();
  const body = await req.json().catch(() => ({}));
  const id = String(body.approval_id ?? "");
  const approved = body.approved === true;

  if (!id) return NextResponse.json({ error: "approval_id required" }, { status: 400 });

  const pending = pendingApprovals.get(id);
  if (!pending) {
    return NextResponse.json(
      { error: "That request is no longer waiting — it was answered already, or it expired. Ask the Director again." },
      { status: 410 }
    );
  }

  // Single use, whichever way it is answered.
  pendingApprovals.delete(id);

  if (!approved) {
    return NextResponse.json({ ok: true, approved: false, summary: "Not approved. Nothing ran." });
  }

  const def = getTool(pending.name);
  if (!def) return NextResponse.json({ error: `There is no tool called "${pending.name}".` }, { status: 400 });

  const res = await runTool(pending.name, pending.args, { projectId: pending.projectId });
  if (!res.ok) return NextResponse.json({ error: res.message }, { status: 500 });

  return NextResponse.json({ ok: true, approved: true, name: pending.name, result: res.result });
}
