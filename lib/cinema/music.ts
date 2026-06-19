// Pure music-cue schema + types + reader. No DB / server imports, so this is
// safe to import from client components. The server-only composeMusicCue agent
// lives in lib/agents/music.ts and re-exports from here.

import { z } from "zod";

export const MusicCueSchema = z.object({
  title: z.string().describe("Short cue title, e.g. 'Rooftop Reckoning'."),
  mood: z.string().describe("Emotional register in 3-6 words."),
  genre: z.string().describe("Genre / style, e.g. 'orchestral hybrid', 'synthwave', 'solo piano'."),
  tempoBpm: z.number().int().min(40).max(220).describe("Approximate tempo in BPM."),
  key: z.string().describe("Musical key, e.g. 'D minor', 'C# Dorian'."),
  instrumentation: z
    .array(z.string())
    .max(12)
    .describe("Lead instruments / sound palette, most prominent first."),
  dynamicsArc: z
    .string()
    .describe("How the cue evolves over its length — intro, build, climax, resolve. 1-2 sentences."),
  referenceArtists: z
    .array(z.string())
    .max(6)
    .describe("Composers / artists whose sound this evokes (for temp-track direction)."),
  syncPoints: z
    .array(z.string())
    .max(8)
    .describe("Key moments the music should hit, tied to on-screen action."),
  durationSeconds: z.number().int().min(5).max(600).describe("Suggested cue length in seconds.")
});

export type MusicCue = z.infer<typeof MusicCueSchema>;

export function readMusicCue(meta: Record<string, unknown> | undefined): MusicCue | null {
  if (!meta || typeof meta !== "object") return null;
  const cue = (meta as Record<string, unknown>).cue;
  if (!cue || typeof cue !== "object") return null;
  const parsed = MusicCueSchema.safeParse(cue);
  return parsed.success ? parsed.data : null;
}
