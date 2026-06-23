// Coverage contract for the Cinematographer's per-beat shotlist — the creative part the engine
// produces (Claude via MCP, or Codex/vendor via the fallback route). The look-lock and cast
// identity are computed deterministically from the Bible, not generated, so they are not here.

import { z } from "zod";

export const coverageShape = {
  dramatic_point: z.string().describe("One line: what this moment is for."),
  coverage_rationale: z.string().describe("One line: the chosen angles and why, sized to the beat."),
  shots: z
    .array(
      z.object({
        angle: z.string(),
        positive: z.string().describe("Full 5-layer positive prompt with the look-lock + identity verbatim."),
        negative: z.string(),
        aspect: z.string(),
        seed_identity: z.string()
      })
    )
    .describe("Coverage set, sized to the beat — same instant, only the camera changes.")
};

export type Coverage = z.infer<z.ZodObject<typeof coverageShape>>;

export const COVERAGE_JSON_INSTRUCTION = `Return ONLY a JSON object (no markdown, no preamble):
{
  "dramatic_point": string,
  "coverage_rationale": string,
  "shots": [{ "angle": string, "positive": string, "negative": string, "aspect": string, "seed_identity": string }]
}`;
