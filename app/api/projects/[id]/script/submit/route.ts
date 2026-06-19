import { NextResponse } from "next/server";
import { activity, projects } from "../../../../../../lib/db/repo";

export const dynamic = "force-dynamic";

// Save the script and mark it submitted. Parsing into the Movie Bible is NOT done here — in the
// in-house model the Screenplay Agent runs in the Claude chat session and imports the breakdown
// via the Direkta MCP server (import_breakdown). This route just records the script + flags it for
// the crew, and logs that the Script Reader is queued.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = projects.get(id);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const script = typeof body.script === "string" ? body.script : project.script;
  if (!script || script.trim().length < 30) {
    return NextResponse.json({ error: "Script is too short to analyse." }, { status: 400 });
  }

  projects.update(id, { script, script_submitted: true });
  activity.append({
    project_id: id,
    agent: "script-reader",
    kind: "info",
    text: `Script submitted — ${script.trim().split(/\s+/).filter(Boolean).length} words. Script Reader queued.`
  });

  return NextResponse.json({ project: projects.get(id) });
}
