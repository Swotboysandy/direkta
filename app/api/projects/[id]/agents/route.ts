import { NextResponse } from "next/server";
import { beats, bible, characters, locations, projects } from "../../../../../lib/db/repo";
import type { AgentStatus } from "../../../../../lib/types";

export const dynamic = "force-dynamic";

/**
 * V1 derives agent state from project state. Once the live orchestrator wires through,
 * this returns the actual in-flight state per agent.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = projects.get(id);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const beatCount = beats.count(id);
  const charList = characters.forProject(id);
  const charsTrained = charList.filter((c) => c.soul_id_state === "trained").length;
  const charsTraining = charList.filter((c) => c.soul_id_state === "training").length;
  const charsFailed = charList.filter((c) => c.soul_id_state === "failed").length;
  const locList = locations.forProject(id);
  const built = bible.ensure(id).built;
  const submitted = project.script_submitted;

  const agents: AgentStatus[] = [
    { id: "script-reader", name: "Script Reader", state: !submitted ? "idle" : "done" },
    {
      id: "beat-writer",
      name: "Beat Writer",
      state: !submitted ? "idle" : beatCount > 0 ? "done" : "working"
    },
    {
      id: "bible-builder",
      name: "Bible Builder",
      state: !submitted ? "idle" : built ? "done" : "working"
    },
    {
      id: "casting-dir",
      name: "Casting Director",
      state:
        charList.length === 0
          ? "idle"
          : charsFailed > 0
          ? "attention"
          : charsTraining > 0
          ? "working"
          : charsTrained === charList.length
          ? "done"
          : "working"
    },
    {
      id: "cinematographer",
      name: "Cinematographer",
      state: charsTrained === 0 ? "idle" : "idle"
    },
    { id: "continuity", name: "Continuity Checker", state: "idle" },
    { id: "editor", name: "Editor", state: "idle" },
    { id: "video-director", name: "Video Director", state: "idle" },
    { id: "export-agent", name: "Export Agent", state: "idle" }
  ];

  return NextResponse.json({ agents, counts: { beats: beatCount, characters: charList.length, locations: locList.length } });
}
