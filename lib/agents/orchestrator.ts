import { generateText, streamText } from "ai";
import { z } from "zod";
import { skillFor } from "../skills/loader";
import { activeModel } from "../vendors/resolver";
import { edges as edgesRepo, nodes as nodesRepo, projects, messages } from "../db/repo";
import type { CanvasEdge, CanvasNode, NodeKind } from "../types";

const DecisionPlanSchema = z.object({
  intent: z.string(),
  tasks: z
    .array(
      z.object({
        kind: z.enum([
          "script",
          "character",
          "scene",
          "storyboard",
          "shot",
          "music",
          "render",
          "note"
        ]),
        title: z.string(),
        brief: z.string()
      })
    )
    .max(8)
});

export type DecisionPlan = z.infer<typeof DecisionPlanSchema>;

export type OrchestratorEvent =
  | { type: "layer"; layer: "decision" | "execution" | "supervision"; status: "start" | "end" }
  | { type: "delta"; layer: "decision" | "execution" | "supervision"; text: string }
  | { type: "plan"; plan: DecisionPlan }
  | { type: "node"; node: CanvasNode }
  | { type: "edge"; edge: CanvasEdge }
  | { type: "supervision"; text: string }
  | { type: "error"; message: string }
  | { type: "done" };

function projectContext(projectId: string): string {
  const project = projects.get(projectId);
  if (!project) return "No project loaded.";
  const projectNodes = nodesRepo.forProject(projectId);
  const summary = projectNodes
    .slice(0, 12)
    .map((node) => `- [${node.kind}] ${node.title}: ${node.body.slice(0, 140).replace(/\n/g, " ")}`)
    .join("\n");
  return [
    `Project: ${project.title}`,
    `Premise: ${project.premise}`,
    `Format: ${project.aspect_ratio} (${formatHint(project.aspect_ratio)})`,
    "",
    "Existing canvas:",
    summary || "(empty canvas)"
  ].join("\n");
}

function formatHint(aspect: string): string {
  switch (aspect) {
    case "9:16":
      return "vertical / mobile-first — frame single subjects, tight close-ups, headroom for captions";
    case "1:1":
      return "square — centered composition, social grid";
    case "4:5":
      return "portrait social — slightly taller than square, subject-led";
    case "21:9":
      return "ultrawide cinematic — wide blocking, two-shots, sweeping landscapes";
    default:
      return "16:9 cinematic — classic film framing";
  }
}

function placementFor(existing: CanvasNode[]): { x: number; y: number } {
  const count = existing.length;
  const col = count % 4;
  const row = Math.floor(count / 4);
  return { x: 80 + col * 280, y: 80 + row * 200 };
}

const PARENT_KINDS: Record<NodeKind, NodeKind[]> = {
  script: [],
  character: ["script"],
  scene: ["script"],
  storyboard: ["scene", "script"],
  shot: ["storyboard", "scene"],
  music: ["scene", "script"],
  render: ["shot", "storyboard"],
  note: []
};

function pickParents(
  node: CanvasNode,
  existing: CanvasNode[],
  createdInThisRun: CanvasNode[]
): CanvasNode[] {
  const candidates = PARENT_KINDS[node.kind] ?? [];
  if (candidates.length === 0) return [];

  // Prefer parents created in the same run; otherwise fall back to the most-recent canvas match.
  for (const parentKind of candidates) {
    const fresh = createdInThisRun.filter((parent) => parent.kind === parentKind);
    if (fresh.length) return [fresh[fresh.length - 1]];
    const fromCanvas = existing.filter((parent) => parent.kind === parentKind);
    if (fromCanvas.length) return [fromCanvas[fromCanvas.length - 1]];
  }
  return [];
}

export async function* runPipeline(input: {
  projectId: string;
  userMessage: string;
}): AsyncGenerator<OrchestratorEvent> {
  const { projectId, userMessage } = input;

  messages.append({ project_id: projectId, role: "user", content: userMessage });

  const ctx = projectContext(projectId);
  const model = activeModel();

  const decisionSkill = skillFor("decision");
  const executionSkill = skillFor("execution");
  const supervisionSkill = skillFor("supervision");

  yield { type: "layer", layer: "decision", status: "start" };

  let rawPlan = "";
  try {
    const decisionStream = streamText({
      model,
      system: decisionSkill?.body ?? "Plan tasks as a JSON object.",
      prompt: `${ctx}\n\nUser request:\n${userMessage}\n\nReturn the JSON plan.`
    });
    for await (const chunk of decisionStream.textStream) {
      rawPlan += chunk;
      yield { type: "delta", layer: "decision", text: chunk };
    }
  } catch (error: any) {
    yield { type: "error", message: `Decision layer failed: ${error.message ?? error}` };
    return;
  }
  yield { type: "layer", layer: "decision", status: "end" };

  let plan: DecisionPlan;
  try {
    const jsonMatch = rawPlan.match(/\{[\s\S]*\}/);
    plan = DecisionPlanSchema.parse(JSON.parse(jsonMatch?.[0] ?? rawPlan));
  } catch (error: any) {
    yield { type: "error", message: `Could not parse Decision plan: ${error.message ?? error}` };
    return;
  }

  yield { type: "plan", plan };
  messages.append({
    project_id: projectId,
    role: "assistant",
    layer: "decision",
    content: JSON.stringify(plan)
  });

  if (plan.tasks.length === 0) {
    yield { type: "done" };
    return;
  }

  const createdInThisRun: CanvasNode[] = [];

  for (const task of plan.tasks) {
    yield { type: "layer", layer: "execution", status: "start" };

    let body = "";
    try {
      const executionStream = streamText({
        model,
        system: executionSkill?.body ?? "Produce a tight, useful canvas node body.",
        prompt: `${ctx}\n\nDecision intent: ${plan.intent}\n\nTask:\n- kind: ${task.kind}\n- title: ${task.title}\n- brief: ${task.brief}\n\nProduce only the node body content.`
      });
      for await (const chunk of executionStream.textStream) {
        body += chunk;
        yield { type: "delta", layer: "execution", text: chunk };
      }
    } catch (error: any) {
      yield { type: "error", message: `Execution layer failed: ${error.message ?? error}` };
      return;
    }
    yield { type: "layer", layer: "execution", status: "end" };

    const existing = nodesRepo.forProject(projectId);
    const placement = placementFor(existing);
    const node = nodesRepo.create({
      project_id: projectId,
      kind: task.kind as NodeKind,
      title: task.title,
      body: body.trim(),
      x: placement.x,
      y: placement.y
    });
    yield { type: "node", node };
    messages.append({
      project_id: projectId,
      role: "assistant",
      layer: "execution",
      content: body.trim()
    });

    for (const parent of pickParents(node, existing, createdInThisRun)) {
      const edge = edgesRepo.create({
        project_id: projectId,
        source: parent.id,
        target: node.id
      });
      yield { type: "edge", edge };
    }
    createdInThisRun.push(node);

    yield { type: "layer", layer: "supervision", status: "start" };
    try {
      const review = await generateText({
        model,
        system: supervisionSkill?.body ?? "Review the execution output briefly.",
        prompt: `Decision plan:\n${JSON.stringify(plan, null, 2)}\n\nExecution output (kind=${task.kind}, title=${task.title}):\n${body}\n\nProvide the review.`
      });
      yield { type: "supervision", text: review.text };
      yield { type: "delta", layer: "supervision", text: review.text };
      messages.append({
        project_id: projectId,
        role: "assistant",
        layer: "supervision",
        content: review.text
      });
    } catch (error: any) {
      yield { type: "error", message: `Supervision layer failed: ${error.message ?? error}` };
      return;
    }
    yield { type: "layer", layer: "supervision", status: "end" };
  }

  yield { type: "done" };
}
