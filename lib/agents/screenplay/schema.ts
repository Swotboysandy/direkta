// Structured-output contract for the Screenplay Agent.
//
// Mirrors the Movie Bible the screenplay-agent.md rule file produces (9 sections + dense
// per-character identity descriptors + gaps), mapped onto the existing nishkarsh tables:
// projects (synopsis/genre/tagline/period), bible (tone/themes/world/visual language),
// characters (spread + identity_descriptor), locations, beats, and clarifications (gaps).

import { z } from "zod";

export const CHARACTER_ROLES = ["Lead", "Supporting", "Featured", "Background"] as const;

export const breakdownShape = {
  // --- Spine (→ project + bible) ---
  logline: z.string().describe("Protagonist + conflict + stakes, one sentence."),
  tagline: z.string().describe("A short marketing tagline, or empty string."),
  genre: z.string().describe("Genre, e.g. 'Neo-noir / Thriller'."),
  time_period: z.string().describe("Period from the page, or '—' if the page is silent (also flag as a gap)."),
  short_synopsis: z.string().describe("2-4 sentence synopsis."),
  full_synopsis: z.string().describe("Act-by-act synopsis, present tense, no dialogue."),

  // --- Tone & themes (→ bible) ---
  tone: z.string().describe("2-3 sentences on tone + genre + the feeling in the room."),
  themes: z.array(z.string()).describe("3-5 core themes as short phrases."),
  comparable_films: z
    .array(z.object({ title: z.string(), note: z.string().describe("why it's comparable") }))
    .describe("2-3 comparable films, each with why."),
  what_makes_different: z.string().describe("What makes this singular."),

  // --- World (→ bible) ---
  world_rules: z.string().describe("The rules of this world, from the page."),
  atmosphere: z.string().describe("Texture, weather, ambient feel of the world."),

  // --- Visual language (→ bible) — feeds the Cinematographer's look-lock ---
  visual_palette: z
    .array(z.object({ hex: z.string().describe("#RRGGBB"), name: z.string() }))
    .describe("3-6 palette swatches with hex + name."),
  lighting_philosophy: z.string().describe("Hard/soft, motivated source, time-of-day bias."),
  cinematography_notes: z.string().describe("Lens/camera philosophy: focal lengths, distance, movement."),
  editorial_rhythm: z.string().describe("Cutting rhythm / pacing."),
  visual_motifs: z.array(z.string()).describe("Recurring visual motifs."),
  casting_direction: z.string().describe("Casting archetypes — never real names."),

  // --- Characters (→ characters table) ---
  characters: z
    .array(
      z.object({
        name: z.string(),
        role: z.enum(CHARACTER_ROLES),
        identity_descriptor: z
          .string()
          .describe(
            "A DENSE physical descriptor the Cinematographer uses verbatim: age, build, features, distinguishing marks, default wardrobe. Concrete and unmistakable."
          ),
        background: z.string().describe("Backstory grounded in the page."),
        psychology_want: z.string(),
        psychology_fear: z.string(),
        psychology_wound: z.string(),
        arc_start: z.string(),
        arc_middle: z.string(),
        arc_end: z.string(),
        voice: z.string().describe("How they speak."),
        key_quote: z.string().describe("A defining line from the page, or empty."),
        wardrobe_direction: z.string()
      })
    )
    .describe("Every named character. Never invent beyond the script."),

  // --- Locations (→ locations table) ---
  locations: z
    .array(
      z.object({
        name: z.string(),
        int_ext: z.enum(["INT", "EXT"]),
        time_of_day: z.string().nullable()
      })
    )
    .describe("Every distinct location."),

  // --- Beats (→ beats table) — minted LAST ---
  beats: z
    .array(
      z.object({
        scene_heading: z.string().describe("Slugline, e.g. 'INT. WAREHOUSE - NIGHT'."),
        title: z.string().describe("Short action title."),
        summary: z.string().describe("One tight, camera-visible paragraph."),
        characters: z.array(z.string()).describe("Names present (must match the characters list)."),
        location: z.string().nullable().describe("Location name (must match the locations list) or null."),
        mood: z.array(z.string()).describe("1-3 emotional-register tags."),
        props: z.array(z.string()).describe("Key props in shot."),
        continuity_flag: z.string().nullable().describe("A continuity risk to surface, or null.")
      })
    )
    .describe("Numbered beats in screen order."),

  // --- Gaps (→ clarifications table) ---
  gaps: z
    .array(
      z.object({
        question: z.string().describe("The gap, in plain language."),
        why: z.string().describe("Why it matters downstream."),
        options: z.array(z.string()).describe("2-4 concrete options."),
        recommended: z.string().describe("Your recommended default.")
      })
    )
    .describe("Every place the page is silent/ambiguous about something the Bible needs. Ask, never invent.")
};

export type Breakdown = z.infer<z.ZodObject<typeof breakdownShape>>;
