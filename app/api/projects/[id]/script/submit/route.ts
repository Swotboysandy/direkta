import { NextResponse } from "next/server";
import { activity, projects } from "../../../../../../lib/db/repo";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = projects.get(id);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const script = typeof body.script === "string" ? body.script : project.script;

  if (script.trim().length < 30) {
    return NextResponse.json({ error: "Script is too short to analyse." }, { status: 400 });
  }

  projects.update(id, { script, script_submitted: true });
  activity.append({
    project_id: id,
    agent: "script-reader",
    kind: "success",
    text: `Script submitted — ${script.trim().split(/\s+/).length} words. Script Reader queued.`
  });

  return NextResponse.json({ project: projects.get(id) });
}
