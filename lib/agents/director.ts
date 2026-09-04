import { streamText, tool as aiTool, type CoreTool } from "ai";
import { z } from "zod";
import { activeModel } from "../vendors/resolver";
import { isCodexConnected } from "../codex/token";
import { streamTextViaCodex } from "../codex/generate";
import { projects } from "../db/repo";
import { skillFor } from "../skills/loader";
import { allTools, getTool, needsApproval, runTool, type DirectorEvent, type ToolContext, type ToolResult } from "./director-tools";
import "./director-toolset";

/**
 * The Director (brief §10–13, §62–65).
 *
 * A model with a fixed set of tools and a person holding the money. It reads
 * the production through the tools rather than through a prompt stuffed with
 * everything, so what it knows is current and what it does is auditable.
 *
 * Two rules the loop enforces regardless of what the model asks for:
 *
 *  - A tool that spends or destroys never runs inside the loop. The loop
 *    emits an `approval` with the estimate and stops. A person answers
 *    through /api/chat/approve, and that route runs the tool.
 *  - The model cannot reach anything not in the registry, and cannot pass an
 *    argument the tool's schema rejects.
 *
 * When no text model is configured the Director still answers: it says what
 * it cannot do and why, rather than failing silently. That is the state the
 * app is in while the Codex quota is spent.
 */

const MAX_STEPS = 6;

/**
 * A vendor's failure, said in words the director can act on (brief §41).
 *
 * A model provider answers a refusal with its own JSON, and pasting that into
 * a conversation tells a filmmaker nothing about what to do next. The three
 * cases worth naming are the ones a person can actually resolve.
 */
function humanise(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e);
  if (/usage_limit_reached|429/.test(raw)) {
    const seconds = Number(/resets_in_seconds\D+(\d+)/.exec(raw)?.[1] ?? 0);
    const when = seconds > 0 ? ` It comes back in about ${Math.round(seconds / 3600)} hours.` : "";
    return `The connected text model has no quota left, so I cannot think right now.${when} Adding a key in the Key Vault would let me answer immediately.`;
  }
  if (/401|403|invalid[_ ]api[_ ]key|unauthor/i.test(raw)) {
    return "The text model refused the key it was given. Check it in the Key Vault.";
  }
  if (/ENOTFOUND|ECONNREFUSED|fetch failed|network/i.test(raw)) {
    return "I could not reach the text model. It may be the network, or the service being down.";
  }
  return raw;
}

function systemPrompt(projectId: string): string {
  const p = projects.get(projectId);
  const skill = skillFor("decision")?.body ?? "";
  return [
    "You are the director's assistant inside Fylmer, a film production tool.",
    "You are talking to the director of the production named below.",
    "",
    p ? `Production: ${p.title} — ${p.format}, ${p.aspect_ratio}.` : "No production is open.",
    p?.logline ? `Logline: ${p.logline}` : "",
    "",
    "Use the tools to find out what is true about this production. Do not guess",
    "at beats, cast, shots or costs — read them. Prefer one good tool call over",
    "a paragraph of caveats.",
    "",
    "When you propose several steps, say them as a short numbered plan first.",
    "Never claim to have generated, rendered or deleted anything: those need the",
    "director's approval and happen outside this conversation.",
    "",
    "Write like a working colleague. Short sentences. No headings, no bullet",
    "lists of options the director did not ask for, no restating the question.",
    skill ? `\nHouse style for decisions:\n${skill}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

/** The registry, in the shape the AI SDK wants. Spending tools are described
 *  to the model but their execute is withheld, so a request to spend comes
 *  back as a call the loop turns into an approval. */
function toolsForModel(ctx: ToolContext, emit: (e: DirectorEvent) => void, pending: Map<string, { name: string; args: unknown }>) {
  // CoreTool, not the inferred return of tool(): each definition returns a
  // type parameterised on its own execute result, and a map of them is not
  // assignable to a map of one of them.
  const out: Record<string, CoreTool> = {};
  for (const def of allTools()) {
    out[def.name] = aiTool({
      description: def.description,
      parameters: def.schema as z.ZodTypeAny,
      execute: async (args: unknown) => {
        const id = `${def.name}-${pending.size + 1}`;
        if (needsApproval(def)) {
          // Price it first so the person sees the cost with the request.
          let estimate: ToolResult["render"] | undefined;
          try {
            const priced = await runTool("estimate_generation_cost", { shots: 1 }, ctx);
            if (priced.ok) estimate = priced.result.render;
          } catch {
            /* an estimate is a courtesy; its absence must not block the ask */
          }
          pending.set(id, { name: def.name, args });
          emit({ type: "approval", id, name: def.name, running: def.running, cost: def.cost, args, estimate });
          return { status: "waiting_for_approval", note: "The director has been asked to approve this. Do not assume it happened." };
        }
        emit({ type: "tool", id, name: def.name, running: def.running, cost: def.cost, args });
        const res = await runTool(def.name, args, ctx);
        if (!res.ok) {
          emit({ type: "tool_error", id, name: def.name, message: res.message });
          return { error: res.message };
        }
        emit({ type: "tool_result", id, name: def.name, result: res.result });
        // The model gets the summary and the data, not the rendering hints.
        return { summary: res.result.summary, data: res.result.render ?? null };
      }
    });
  }
  return out;
}

/** What the Director says when it has no model to think with. */
async function* withoutAModel(): AsyncGenerator<DirectorEvent> {
  const tools = allTools();
  yield {
    type: "delta",
    text:
      "I have no text model connected, so I cannot answer in words right now. " +
      `Everything I can do is still here — ${tools.length} tools over this production — and the Key Vault is where a model gets connected.`
  };
  yield {
    type: "plan",
    steps: [
      { title: "Connect a text model", detail: "Key Vault → a text vendor key, or wait for the Codex quota to reset.", cost: "free" },
      { title: "Then ask again", detail: "The tools below run the moment a model can call them.", cost: "free" }
    ]
  };
  yield { type: "done" };
}

/**
 * Run one exchange. Yields events as they happen; the caller writes them to
 * the browser as SSE. `pending` is the caller's map of approvals awaiting a
 * person — it survives past this generator so /api/chat/approve can find them.
 */
export async function* runDirector(input: {
  projectId: string;
  message: string;
  selection?: ToolContext["selection"];
  pending: Map<string, { name: string; args: unknown }>;
}): AsyncGenerator<DirectorEvent> {
  const ctx: ToolContext = { projectId: input.projectId, selection: input.selection ?? null };
  const queue: DirectorEvent[] = [];
  const emit = (e: DirectorEvent) => queue.push(e);

  // Codex has no tool-calling in this integration, so with only Codex the
  // Director can talk but not act; say so rather than pretending.
  let model;
  try {
    model = activeModel();
  } catch {
    model = null;
  }

  if (!model) {
    if (isCodexConnected()) {
      yield { type: "thinking", text: "Thinking" };
      try {
        const stream = await streamTextViaCodex({
          system: systemPrompt(input.projectId),
          prompt: input.message
        });
        const reader = stream.getReader();
        const dec = new TextDecoder();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          yield { type: "delta", text: typeof value === "string" ? value : dec.decode(value) };
        }
        yield { type: "done" };
        return;
      } catch (e: unknown) {
        yield { type: "error", message: humanise(e) };
        yield { type: "done" };
        return;
      }
    }
    yield* withoutAModel();
    return;
  }

  yield { type: "thinking", text: "Thinking" };

  try {
    const result = streamText({
      model,
      system: systemPrompt(input.projectId),
      prompt: input.selection
        ? `${input.message}\n\n(The director currently has ${input.selection.label} selected.)`
        : input.message,
      tools: toolsForModel(ctx, emit, input.pending),
      // The loop may read several things before it answers, but it cannot
      // run away: six steps, then it must speak.
      maxSteps: MAX_STEPS
    });

    for await (const part of result.fullStream) {
      // Anything a tool emitted since the last chunk goes out first, so the
      // activity line appears before the sentence that follows it.
      while (queue.length) yield queue.shift()!;
      if (part.type === "text-delta") {
        const text = (part as { textDelta?: string }).textDelta ?? "";
        if (text) yield { type: "delta", text };
      } else if (part.type === "error") {
        const err = (part as { error?: unknown }).error;
        yield { type: "error", message: err instanceof Error ? err.message : String(err) };
      }
    }
    while (queue.length) yield queue.shift()!;
    yield { type: "done" };
  } catch (e: unknown) {
    while (queue.length) yield queue.shift()!;
    yield { type: "error", message: humanise(e) };
    yield { type: "done" };
  }
}

/** Approvals waiting on a person, keyed by the id sent to the browser.
 *  In memory on purpose: an approval that did not survive a restart should
 *  be asked for again rather than run against a stale intention. */
export const pendingApprovals = new Map<string, { name: string; args: unknown; projectId: string; at: number }>();

/** Drop anything a person never answered, so the map cannot grow forever. */
export function prunePending(maxAgeMs = 30 * 60_000) {
  const now = Date.now();
  for (const [id, v] of pendingApprovals) if (now - v.at > maxAgeMs) pendingApprovals.delete(id);
}

