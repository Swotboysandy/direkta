import { generateText } from "ai";
import { activeModel } from "../vendors/resolver";

/**
 * Expands a short beat direction into the structured, timeline-shaped prompt
 * MiniMax H3 responds best to — the same job lightx2v's Prompt-Rewriter LoRA
 * does, but using the LLM Fylmer already has configured instead of standing up
 * a separate 27B model next to H3 on the GPU.
 *
 * The rules below are the accumulated fixes from real generations: garbled
 * on-screen text, disconnected shots, spoken dialogue leaking in, and stretched
 * reference art. Encoding them here means a short direction like "the girl
 * catches a spirit" produces a prompt that already respects all of them.
 */

// Structure follows the six-block shape reverse-engineered from MiniMax's own
// 45 published example prompts: style contract, timeline, camera, audio (with
// entry times), verbatim text, negative list. H3 reads a prompt like production
// paperwork, not prose.
const SYSTEM = `You rewrite short shot directions into structured prompts for MiniMax H3, a video model that generates picture and native stereo audio together in one pass.

Output ONLY the rewritten prompt. No preamble, no explanation, no markdown.

Use exactly these blocks, in order:

1. STYLE CONTRACT — one sentence fixing medium, texture, palette and era (e.g. "glossy stylised 3D, soft rim light, warm amber and teal, storybook").
2. Subject and setting — one vivid sentence.
3. "Timeline:" — 3 to 4 slices with explicit second ranges covering the FULL duration, e.g. "[0.0s-1.5s] ...". Each slice describes concrete physical motion and what the camera does.
4. "Camera:" — the move, or an explicit refusal ("locked off, static wide, no push-in"). One continuous take.
5. "Audio:" — name every sound and WHEN it enters ("low cello from 0s; a single door creak at 2.5s"). Audio is generated jointly with picture, so silence here means the model guesses.
6. "Avoid:" — a short negative list of clichés to refuse (e.g. "no lens flare, no slow-motion, no crossfade, no cutaways").

Hard rules — these come from real failures, never violate them:
- Never leave text to chance, and actively REWRITE it out of the source direction. Keep signage, posters, labels, screens and number plates outside the frame, or restate them as plain unlettered shapes. A negative prompt cannot guarantee clean text. Always prohibit written characters, including reflections. Even quoted titles and exact lettering belong in post-production, not in the generated picture. Do not silently relocate a story to solve signage; instead use tighter framing.
- NO spoken dialogue, narration or voice of any kind, unless the direction explicitly asks for a line. Music and sound design only.
- One continuous take. No hard cuts, no scene changes, no montage inside a shot.
- Repeat the subject's identity anchors (face, hair, build, wardrobe) compactly rather than rewriting a long description. Never invent new characters or relocate the scene.
- Prefer specific physical motion ("she steps forward, staff lowering") over abstract mood words.
- If the direction says the shot CONTINUES FROM a previous one, open on that exact ending state — same pose, position and lighting.`;

export type ExpandInput = {
  direction: string;
  durationSeconds?: number;
  /** Project-level look lock, applied to every shot for consistency. */
  styleTemplate?: string | null;
  /** Project-level continuity lock. */
  continuityLock?: string | null;
  /** True when a reference image is driving the first frame — the prompt should
   *  then describe motion away from that frame, not re-describe the subject. */
  hasReferenceImage?: boolean;
  /** True when the shot's final frame is pinned too, so the motion has to land
   *  on a known end state rather than free-running. */
  hasEndFrame?: boolean;
};

export async function expandH3Prompt(input: ExpandInput): Promise<string> {
  const duration = input.durationSeconds ?? 5;
  const parts = [
    `Shot direction: ${input.direction}`,
    `Duration: ${duration} seconds.`
  ];
  if (input.styleTemplate) parts.push(`Style lock (apply to this shot): ${input.styleTemplate}`);
  if (input.continuityLock) parts.push(`Continuity lock: ${input.continuityLock}`);
  // "Give every reference a job" — MiniMax's own guidance is that the reference
  // carries identity and style while the text carries the scene. Stating the
  // role explicitly in the prompt body measurably improves subject consistency.
  if (input.hasReferenceImage) {
    parts.push(
      "A reference image is supplied as the first frame. State near the top of the prompt that it is the character and art-style reference and that its subject's face, build and wardrobe are locked to it. Open exactly on that frame and describe how the scene MOVES from there — do not re-describe the subject's appearance from scratch."
    );
  }
  if (input.hasEndFrame) {
    parts.push(
      "A final frame is also pinned. The motion must arrive naturally at that exact end state by the last second — do not overshoot it or introduce anything that could not resolve into it."
    );
  }

  const { text } = await generateText({
    model: activeModel(),
    system: SYSTEM,
    prompt: parts.join("\n\n"),
    abortSignal: AbortSignal.timeout(45_000),
    maxRetries: 0
  });
  if (!text.trim()) throw new Error("The prompt expander returned an empty prompt.");
  return text.trim();
}

export async function prepareH3Prompt(input: ExpandInput, expand = expandH3Prompt) {
  try {
    const prompt = (await expand(input)).trim();
    if (!prompt) throw new Error("Empty expansion");
    return { prompt, status: "expanded" as const, warnings: [] as string[] };
  } catch {
    // Do not leak raw vendor errors, credentials or prompts into UI warnings.
    return {
      prompt: input.direction,
      status: "fallback" as const,
      warnings: ["H3 prompt expansion was unavailable. This shot uses the original direction; check the text-model key in Key Vault. Structured direction was not generated."]
    };
  }
}
