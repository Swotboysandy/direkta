// Structured generation for the FALLBACK engine.
//
// Primary path is Claude in the chat session producing structured output and importing it via the
// Direkta MCP server (import_breakdown / import_shotlist). This module is the server-side fallback
// that does the SAME thing without a human in a Claude session: it asks the keyless Codex bridge
// (the user's ChatGPT subscription) — or, if Codex isn't connected, the configured AI-SDK vendor —
// to return JSON, then validates it against the same Zod schema. Both engines feed the same
// import* persistence, so Claude and Codex produce equivalent artifacts.

import { generateText } from "ai";
import { z } from "zod";
import { isCodexConnected } from "../codex/token";
import { generateTextViaCodex } from "../codex/generate";
import { activeModel } from "../vendors/resolver";

/** Strip markdown fences / preamble and validate text as JSON against a Zod shape. */
export function parseStructured<Shape extends z.ZodRawShape>(
  text: string,
  shape: Shape
): z.infer<z.ZodObject<Shape>> {
  let body = text.trim();
  const fence = body.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) body = fence[1].trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    const block = body.match(/[{[][\s\S]*[}\]]/); // first {...} or [...] block
    if (!block) throw new Error("Engine did not return parseable JSON.");
    parsed = JSON.parse(block[0]);
  }
  return z.object(shape).parse(parsed);
}

export type StructuredEngine = "codex" | "vendor";

/**
 * Generate structured output from the fallback engine. Prefers the keyless Codex bridge
 * (ChatGPT subscription) when connected; otherwise the configured AI-SDK vendor (throws
 * VendorUnavailableError if none). Returns the validated object + which engine was used.
 */
export async function generateStructured<Shape extends z.ZodRawShape>(input: {
  system: string;
  prompt: string;
  shape: Shape;
  model?: string;
}): Promise<{ data: z.infer<z.ZodObject<Shape>>; engine: StructuredEngine }> {
  let raw: string;
  let engine: StructuredEngine;
  if (isCodexConnected()) {
    engine = "codex";
    raw = await generateTextViaCodex({ system: input.system, prompt: input.prompt, model: input.model });
  } else {
    engine = "vendor";
    const { text } = await generateText({
      model: activeModel(),
      system: input.system,
      prompt: input.prompt,
      maxTokens: 6000
    });
    raw = text;
  }
  return { data: parseStructured(raw, input.shape), engine };
}
