import type { DatabaseSync } from "node:sqlite";
import { nanoid } from "nanoid";

/**
 * Seed "The Lisbon Pact" project — ports buzz/main:project/assets/app/data.jsx
 * into our schema. Idempotent: runs only when the lisbon project doesn't exist.
 */
export function seedLisbonPact(db: DatabaseSync) {
  const exists = db.prepare("SELECT id FROM projects WHERE id = ?").get("lisbon");
  if (exists) return;

  const PROJECT_ID = "lisbon";

  db.prepare(
    `INSERT INTO projects
       (id, title, premise, logline, format, length_estimate, aspect_ratio, script, script_submitted,
        genre, tagline, director_name, draft_version, short_synopsis, full_synopsis, time_period, budget_tier)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    PROJECT_ID,
    "The Lisbon Pact",
    "A detective tracks a former friend across two cities, only to find his own past waiting in Lisbon.",
    "A detective tracks a former friend across two cities, only to find his own past waiting in Lisbon.",
    "Short Film",
    "15–30 min",
    "16:9",
    SCRIPT_TEXT,
    "Neo-noir / Thriller",
    "Some debts cross borders.",
    "M. Doyle",
    "v1.2",
    PROJECT_SHORT_SYNOPSIS,
    PROJECT_FULL_SYNOPSIS,
    "Present day. Two cities — one northern, one southern.",
    "indie"
  );

  db.prepare(
    `INSERT INTO bible
       (project_id, characters_doc, world_doc, tone_doc, word_count, built,
        themes, comparable_films, what_makes_different,
        world_rules, atmosphere,
        visual_palette, cinematography_notes, lighting_philosophy, editorial_rhythm, visual_motifs,
        production_challenges, vfx_requirements, casting_direction)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    PROJECT_ID,
    BIBLE_CHARACTERS,
    BIBLE_WORLD,
    BIBLE_TONE,
    3200,
    JSON.stringify(BIBLE_THEMES),
    JSON.stringify(BIBLE_COMPARABLES),
    BIBLE_WHAT_MAKES_DIFFERENT,
    BIBLE_WORLD_RULES,
    BIBLE_ATMOSPHERE,
    JSON.stringify(BIBLE_PALETTE),
    BIBLE_CINEMATOGRAPHY,
    BIBLE_LIGHTING,
    BIBLE_EDITORIAL,
    JSON.stringify(BIBLE_MOTIFS),
    BIBLE_PRODUCTION_CHALLENGES,
    BIBLE_VFX,
    BIBLE_CASTING
  );

  // — Characters (with full Movie Bible spread) —
  type CharSeed = {
    id: string;
    name: string;
    role: "Lead" | "Supporting" | "Featured" | "Background";
    scene_count: number;
    dialogue: boolean;
    state: "empty" | "training" | "trained" | "failed";
    progress?: number;
    consistency?: number;
    error?: string;
    brief?: Record<string, string>;
    /* Movie Bible spread */
    background: string;
    want: string;
    fear: string;
    wound: string;
    arc_start: string;
    arc_middle: string;
    arc_end: string;
    voice: string;
    key_quote: string;
    wardrobe_direction: string;
    relationships: Array<{ with: string; type: string }>;
  };

  const characters: CharSeed[] = [
    {
      id: "marcus",
      name: "MARCUS",
      role: "Lead",
      scene_count: 28,
      dialogue: true,
      state: "trained",
      consistency: 8.4,
      brief: {
        age: "42–46",
        build: "Lean, weathered",
        features: "Grey at the temples; long scar above the left eye",
        wardrobe: "Worn leather jacket. Dark jeans. Looks underdressed in any room.",
        personality: "Hasn't slept in days but still commands a room.",
        register: "Morally complex"
      },
      background:
        "Ex-fixer for a name nobody says out loud. Walked away seven years ago to live a quiet life with Maya. Lisbon is where the old name lives.",
      want: "To stay walked-away — to finish the life he built with Maya.",
      fear: "That leaving never actually counted; that the city remembers him.",
      wound: "Something he did in Lisbon that he never told anyone, including himself.",
      arc_start:
        "Re-emerges at the warehouse out of obligation, not choice — believes he can do one last clean thing.",
      arc_middle:
        "Lisbon strips that belief; Rafa makes him say the old name out loud.",
      arc_end:
        "Returns to Maya not absolved, but accountable. Sits at the kitchen window. Doesn't lie this time.",
      voice:
        "Mostly verbs. Two-word sentences. When he finally uses a long sentence, it should hit.",
      key_quote: "I'm calling.",
      wardrobe_direction:
        "One leather jacket through the whole film, slowly losing layers underneath. Lisbon scene: shirt unbuttoned one extra notch — the only place he allows it.",
      relationships: [
        { with: "MAYA", type: "Partner, kept in the dark" },
        { with: "REYES", type: "Tracked by — and once trusted" },
        { with: "RAFA", type: "Old friend, owed something" }
      ]
    },
    {
      id: "reyes",
      name: "DETECTIVE REYES",
      role: "Lead",
      scene_count: 26,
      dialogue: true,
      state: "training",
      progress: 0.67,
      brief: {
        age: "36–40",
        build: "Athletic, compact",
        features: "Cropped dark hair. Steady jaw.",
        wardrobe: "Tailored coat over rumpled work clothes. Always carries a notebook.",
        personality: "Sees what others miss. Speaks less than she listens.",
        register: "Protagonist"
      },
      background:
        "Eight years on homicide, two of them watching Marcus's old crew from across a parking lot. Has been waiting for him to come back.",
      want: "To close the case the way it deserves — not the way Hall wants on paper.",
      fear: "That Marcus is right about the things he refuses to say.",
      wound: "Lost a partner to the same crew Marcus used to run with. Never filed the grief.",
      arc_start: "Procedural; clean; gun low. The hunter who has out-waited the prey.",
      arc_middle:
        "Returns to the warehouse alone and finds she has more questions than her board can hold.",
      arc_end:
        "Lets Marcus go. The board comes down. She files something else under his name.",
      voice:
        "Quiet. Specific. Asks for coffee for two before she asks for backup. Never raises her voice — not once in 47 beats.",
      key_quote: "Send a unit. Bring coffee for two.",
      wardrobe_direction:
        "Long coat — same every scene. Underneath shifts: precinct shirt, civilian sweater by Beat 12. The coat is her armour.",
      relationships: [
        { with: "MARCUS", type: "Quarry, mirror" },
        { with: "HALL", type: "Captain, gatekeeper" }
      ]
    },
    {
      id: "maya",
      name: "MAYA",
      role: "Supporting",
      scene_count: 12,
      dialogue: true,
      state: "trained",
      consistency: 9.1,
      background:
        "Bookbinder. Built a life around Marcus's silences. Knows more than she's allowed to say.",
      want: "For Marcus to stop choosing the door over the kitchen.",
      fear: "That his quiet has always meant he was leaving.",
      wound: "Married into a question she was never going to be allowed to ask.",
      arc_start: "At the kitchen window — composed. Already three steps ahead of the conversation.",
      arc_middle: "Finds the folded letter. Reads it twice. Doesn't tell anyone.",
      arc_end: "Pours two cups when Marcus walks back in.",
      voice: "Mostly questions. The quietest character in the film, but every line is a verdict.",
      key_quote: "You said the script was ready.",
      wardrobe_direction:
        "Soft, lived-in colours — oat, dusk, cream. Never matches the noir palette. She's the place noir comes home to.",
      relationships: [
        { with: "MARCUS", type: "Partner" },
        { with: "REYES", type: "Has never met — but is the reason Reyes can't sleep" }
      ]
    },
    {
      id: "rafa",
      name: "RAFA",
      role: "Supporting",
      scene_count: 8,
      dialogue: true,
      state: "empty",
      background:
        "Marcus's oldest friend, from the Lisbon years. Stayed when Marcus left. The bill from those years is in his pocket.",
      want: "An honest goodbye, finally — or an honest answer about why.",
      fear: "That Marcus came back for a reason that isn't him.",
      wound: "Took the fall for something Marcus chose. Lost a decade. Didn't write.",
      arc_start: "At the corner table. Patient the way the world owes him patience.",
      arc_middle: "Says the old name. Marcus flinches.",
      arc_end: "Lets him go. Pays for both coffees.",
      voice: "Slow. Few words. Picks each one like a weight he intends to leave on the table.",
      key_quote: "You're early.",
      wardrobe_direction:
        "Linen. Sun-aged. A single watch he didn't have ten years ago. Never closed top button.",
      relationships: [
        { with: "MARCUS", type: "Old friend, ledger held" },
        { with: "ELENA", type: "Knows her from before — won't say how" }
      ]
    },
    {
      id: "hall",
      name: "CAPT. HALL",
      role: "Featured",
      scene_count: 4,
      dialogue: true,
      state: "failed",
      error:
        "Not enough visual consistency in reference photos. Try photos with similar lighting and angle.",
      background:
        "Career captain. Knew Marcus's name when it meant something. Has reasons of his own for wanting this case closed quietly.",
      want: "A clean file. Closed. Filed. Forgotten.",
      fear: "That Reyes won't let it be clean.",
      wound: "Signed off on something seven years ago that he can't unsign.",
      arc_start: "In the doorway, arms folded the way arms fold when they don't want to listen.",
      arc_middle: "Tells Reyes to step off. She doesn't.",
      arc_end: "Initials a different file than the one she handed him.",
      voice: "Short. Procedural. Uses 'paper' as a verb.",
      key_quote: "Tell me you have something I can put on paper.",
      wardrobe_direction:
        "Department blue. Tie always one knot too tight. Coffee mug that says nothing.",
      relationships: [
        { with: "REYES", type: "Captain, gatekeeper" },
        { with: "MARCUS", type: "Old name on an old file" }
      ]
    },
    {
      id: "elena",
      name: "ELENA",
      role: "Supporting",
      scene_count: 6,
      dialogue: true,
      state: "trained",
      consistency: 8.8,
      background:
        "Arrives in the second act. Knew Marcus when he was the name Lisbon used. Carries a question only Rafa can answer.",
      want: "To finish a conversation that ended seven years ago.",
      fear: "That Marcus has decided who he is now and it doesn't include her.",
      wound: "Was the last person Marcus called before he left Lisbon.",
      arc_start: "Pushes through the cafe door. Doesn't sit until invited.",
      arc_middle: "Sets a single object on the table between Marcus and Rafa.",
      arc_end: "Stays in the cafe after both men leave. Orders another coffee.",
      voice: "Direct. No throat-clearing. Asks the question other characters have been circling.",
      key_quote: "You knew I'd come.",
      wardrobe_direction:
        "Tailored, urgent. Lisbon palette but sharper — a single dark element pinned somewhere visible.",
      relationships: [
        { with: "MARCUS", type: "Past, unfinished" },
        { with: "RAFA", type: "Older history, shared silence" }
      ]
    }
  ];

  const insertChar = db.prepare(
    `INSERT INTO characters
       (id, project_id, name, role, scene_count, dialogue, brief, soul_id_state, soul_id_progress, consistency, error, refs,
        background, psychology_want, psychology_fear, psychology_wound,
        arc_start, arc_middle, arc_end, voice, key_quote, wardrobe_direction, relationships)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const c of characters) {
    const ref = `/direkta/generated/characters/${c.id}.png`;
    insertChar.run(
      c.id,
      PROJECT_ID,
      c.name,
      c.role,
      c.scene_count,
      c.dialogue ? 1 : 0,
      JSON.stringify(c.brief ?? {}),
      c.state,
      c.progress ?? 0,
      c.consistency ?? null,
      c.error ?? null,
      JSON.stringify([ref]),
      c.background,
      c.want,
      c.fear,
      c.wound,
      c.arc_start,
      c.arc_middle,
      c.arc_end,
      c.voice,
      c.key_quote,
      c.wardrobe_direction,
      JSON.stringify(c.relationships)
    );
  }

  // — Locations —
  const locations: Array<{
    id: string;
    name: string;
    int_ext: "INT" | "EXT";
    scene_count: number;
    state: "empty" | "training" | "trained" | "failed";
    progress?: number;
  }> = [
    { id: "warehouse", name: "WAREHOUSE — INT — NIGHT", int_ext: "INT", scene_count: 5, state: "trained" },
    { id: "apartment", name: "APARTMENT — INT — NIGHT", int_ext: "INT", scene_count: 9, state: "trained" },
    { id: "precinct", name: "PRECINCT — INT — DAY", int_ext: "INT", scene_count: 4, state: "training", progress: 0.42 },
    { id: "riverside", name: "RIVERSIDE — EXT — DAWN", int_ext: "EXT", scene_count: 3, state: "empty" },
    { id: "cafe", name: "LISBON CAFE — INT — DAY", int_ext: "INT", scene_count: 4, state: "empty" },
    { id: "rooftop", name: "ROOFTOP — EXT — NIGHT", int_ext: "EXT", scene_count: 2, state: "empty" }
  ];

  const insertLoc = db.prepare(
    "INSERT INTO locations (id, project_id, name, int_ext, scene_count, soul_id_state, soul_id_progress, refs) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  );
  for (const l of locations) {
    const ref = `/direkta/generated/locations/${l.id}.png`;
    insertLoc.run(
      l.id,
      PROJECT_ID,
      l.name,
      l.int_ext,
      l.scene_count,
      l.state,
      l.progress ?? 0,
      JSON.stringify([ref])
    );
  }

  // — Beats —
  const beatsData: Array<{
    n: number;
    scene_heading: string;
    title: string;
    characters: string[];
    location_id: string;
    mood: string[];
    props?: string[];
    notes?: string;
    flag?: string;
  }> = [
    {
      n: 1,
      scene_heading: "INT. WAREHOUSE — NIGHT",
      title: "Marcus discovers the body",
      characters: ["MARCUS", "REYES"],
      location_id: "warehouse",
      mood: ["TENSION", "DISCOVERY"],
      props: ["Flashlight", "Folded letter"]
    },
    {
      n: 2,
      scene_heading: "EXT. RIVERSIDE — DAWN",
      title: "Reyes calls it in",
      characters: ["REYES"],
      location_id: "riverside",
      mood: ["PROCEDURAL", "COLD"]
    },
    {
      n: 3,
      scene_heading: "INT. PRECINCT — DAY",
      title: "The board goes up",
      characters: ["REYES", "HALL"],
      location_id: "precinct",
      mood: ["PROCEDURAL"]
    },
    {
      n: 4,
      scene_heading: "INT. APARTMENT — NIGHT",
      title: "Marcus tells Maya he's leaving",
      characters: ["MARCUS", "MAYA"],
      location_id: "apartment",
      mood: ["INTIMATE", "DEPARTURE"]
    },
    {
      n: 5,
      scene_heading: "EXT. WAREHOUSE — NIGHT",
      title: "Reyes returns to the scene",
      characters: ["REYES"],
      location_id: "warehouse",
      mood: ["QUIET", "REFLECTIVE"],
      flag: "continuity"
    },
    {
      n: 6,
      scene_heading: "INT. CAFE — LISBON — DAY",
      title: "Marcus meets Rafa in Lisbon",
      characters: ["MARCUS", "RAFA"],
      location_id: "cafe",
      mood: ["REUNION", "SUSPICION"]
    },
    {
      n: 7,
      scene_heading: "INT. APARTMENT — NIGHT",
      title: "Maya finds the letter",
      characters: ["MAYA"],
      location_id: "apartment",
      mood: ["DISCOVERY"],
      notes: "Flashback"
    },
    {
      n: 8,
      scene_heading: "INT. CAFE — LISBON — DAY",
      title: "Elena's arrival",
      characters: ["MARCUS", "RAFA", "ELENA"],
      location_id: "cafe",
      mood: ["TURN", "REVEAL"]
    }
  ];

  const insertBeat = db.prepare(
    "INSERT INTO beats (id, project_id, n, scene_heading, title, characters, location_id, mood, props, notes, flag) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  const beatIds: Record<number, string> = {};
  for (const b of beatsData) {
    const id = nanoid(10);
    beatIds[b.n] = id;
    insertBeat.run(
      id,
      PROJECT_ID,
      b.n,
      b.scene_heading,
      b.title,
      JSON.stringify(b.characters),
      b.location_id,
      JSON.stringify(b.mood),
      JSON.stringify(b.props ?? []),
      b.notes ?? "",
      b.flag ?? null
    );
  }

  // — Storyboard rows + 4 variants per beat —
  // Maps to data.jsx STORYBOARD: state per row, selected variant for completed ones
  const storyboardRows: Array<{ beat: number; state: "waiting" | "generating" | "complete" | "error"; selected?: number; flag?: string }> = [
    { beat: 1, state: "complete", selected: 1 },
    { beat: 2, state: "complete", selected: 2 },
    { beat: 3, state: "generating" },
    { beat: 4, state: "complete", selected: 0 },
    { beat: 5, state: "complete", selected: 3, flag: "continuity" },
    { beat: 6, state: "waiting" },
    { beat: 7, state: "error" },
    { beat: 8, state: "waiting" }
  ];

  const insertRow = db.prepare(
    "INSERT INTO storyboard_rows (beat_id, state, selected_variant_id) VALUES (?, ?, ?)"
  );
  const insertVariant = db.prepare(
    "INSERT INTO storyboard_variants (id, beat_id, n, prompt, state, asset_id) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const insertAsset = db.prepare(
    "INSERT INTO assets (id, target_kind, target_id, kind, url, prompt, vendor_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );

  for (const row of storyboardRows) {
    const beatId = beatIds[row.beat];
    if (!beatId) continue;

    const variantIds: string[] = [];
    if (row.state === "complete" || row.state === "error") {
      // 4 variants per beat
      for (let n = 1; n <= 4; n++) {
        const vid = nanoid(10);
        const assetId = nanoid(10);
        const padded = `${String(row.beat).padStart(2, "0")}-v${String(n).padStart(2, "0")}`;
        const url = `/direkta/generated/storyboard/beat-${padded}.png`;
        insertAsset.run(
          assetId,
          "storyboard_variant",
          vid,
          "image",
          url,
          "Cinematographer · seeded reference frame",
          null
        );
        insertVariant.run(vid, beatId, n, "", "complete", assetId);
        variantIds.push(vid);
      }
    }

    const selectedId = row.selected !== undefined ? variantIds[row.selected] ?? null : null;
    insertRow.run(beatId, row.state, selectedId);
  }

  // — Activity feed —
  const insertActivity = db.prepare(
    "INSERT INTO activity (id, project_id, agent, kind, text, created_at) VALUES (?, ?, ?, ?, ?, datetime('now', ?))"
  );
  const activity: Array<{ agent: string; kind: string; text: string; ago: string }> = [
    { agent: "cinematographer", kind: "info", text: "Generated 4 variants for **Beat 03** — ready for review.", ago: "-4 minutes" },
    { agent: "continuity", kind: "error", text: "Flagged **Beat 05** — Marcus wearing leather jacket inconsistent with Beat 03 (same night).", ago: "-8 minutes" },
    { agent: "casting-dir", kind: "info", text: "Training Soul ID for **DETECTIVE REYES** — 67% complete.", ago: "-12 minutes" },
    { agent: "editor", kind: "info", text: "Suggested cut style for **Beat 03 → Beat 04**: match cut on Maya's hands.", ago: "-15 minutes" },
    { agent: "video-director", kind: "info", text: "Generating clip for **Beat 02 → Beat 03** — estimated 18s.", ago: "-18 minutes" },
    { agent: "bible-builder", kind: "info", text: "Updated character profile: **MAYA** — added wardrobe direction.", ago: "-24 minutes" },
    { agent: "casting-dir", kind: "success", text: "Trained Soul ID for **ELENA** — consistency 8.8 / 10.", ago: "-32 minutes" },
    { agent: "casting-dir", kind: "error", text: "Training failed for **CAPT. HALL** — reference photo lighting too inconsistent.", ago: "-40 minutes" },
    { agent: "beat-writer", kind: "warning", text: "Flagged a clarification on **Beat 12**: 'what happened in Lisbon'.", ago: "-47 minutes" },
    { agent: "cinematographer", kind: "info", text: "Generated 4 variants for **Beat 02** — ready for review.", ago: "-60 minutes" },
    { agent: "cinematographer", kind: "info", text: "Generated 4 variants for **Beat 01** — ready for review.", ago: "-62 minutes" },
    { agent: "casting-dir", kind: "success", text: "Trained Soul ID for **MAYA** — consistency 9.1 / 10.", ago: "-64 minutes" },
    { agent: "casting-dir", kind: "success", text: "Trained Soul ID for **MARCUS** — consistency 8.4 / 10.", ago: "-66 minutes" },
    { agent: "script-reader", kind: "success", text: "Completed analysis — 47 scenes, 12 characters, 8 locations.", ago: "-68 minutes" },
    { agent: "bible-builder", kind: "success", text: "Created production bible — 3,200 words.", ago: "-70 minutes" },
    { agent: "producer", kind: "info", text: "Project **The Lisbon Pact** assembled. Crew waiting for the script.", ago: "-72 minutes" }
  ];
  for (const a of activity) {
    insertActivity.run(nanoid(10), PROJECT_ID, a.agent, a.kind, a.text, a.ago);
  }

  // — Snippets (Codex) —
  const insertSnippet = db.prepare(
    "INSERT INTO snippets (id, project_id, kind, title, body, use_count) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const snippets = [
    { kind: "tone", title: "Tone — Noir Register", use: 12, body: "Quiet. Restrained. Verbs first. Characters say less than they mean." },
    { kind: "world", title: "World — Lisbon Sequence", use: 6, body: "Lisbon is warm, tiled, distant. The light is forgiving. The people are not." },
    { kind: "format", title: "Format — Scene Heading", use: 47, body: "INT./EXT. — LOCATION — DAY/NIGHT" },
    { kind: "character_rule", title: "Rule — Reyes never raises her voice", use: 26, body: "Detective Reyes speaks less than she listens. She never raises her voice — not once in 47 beats." }
  ];
  for (const s of snippets) {
    insertSnippet.run(nanoid(10), PROJECT_ID, s.kind, s.title, s.body, s.use);
  }

  // — Stitch nodes — one per beat that has a selected variant —
  const insertStitchNode = db.prepare(
    "INSERT INTO stitch_nodes (id, project_id, beat_id, x, y, duration) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const stitchPositions: Array<{ beat: number; x: number; y: number; duration: number }> = [
    { beat: 1, x: 80, y: 180, duration: 3.0 },
    { beat: 2, x: 360, y: 220, duration: 2.4 },
    { beat: 3, x: 640, y: 160, duration: 4.0 },
    { beat: 4, x: 920, y: 220, duration: 5.6 },
    { beat: 5, x: 1200, y: 160, duration: 2.8 },
    { beat: 6, x: 1480, y: 240, duration: 4.4 }
  ];
  const stitchNodeIds: Record<number, string> = {};
  for (const pos of stitchPositions) {
    const beatId = beatIds[pos.beat];
    if (!beatId) continue;
    const id = nanoid(10);
    stitchNodeIds[pos.beat] = id;
    insertStitchNode.run(id, PROJECT_ID, beatId, pos.x, pos.y, pos.duration);
  }

  // — Transitions — edges between consecutive stitch nodes —
  const insertTransition = db.prepare(
    "INSERT INTO transitions (id, project_id, from_node_id, to_node_id, style, state, duration) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  const transitions: Array<{ from: number; to: number; style: string; state: string; duration: number }> = [
    { from: 1, to: 2, style: "cut", state: "complete", duration: 0 },
    { from: 2, to: 3, style: "dissolve", state: "complete", duration: 1.2 },
    { from: 3, to: 4, style: "match", state: "generating", duration: 0 },
    { from: 4, to: 5, style: "cut", state: "pending", duration: 0 },
    { from: 5, to: 6, style: "cut", state: "pending", duration: 0 }
  ];
  for (const t of transitions) {
    const fromId = stitchNodeIds[t.from];
    const toId = stitchNodeIds[t.to];
    if (!fromId || !toId) continue;
    insertTransition.run(nanoid(10), PROJECT_ID, fromId, toId, t.style, t.state, t.duration);
  }

  // — Library entries: sequences (animatic exports) —
  const insertLibAsset = db.prepare(
    "INSERT INTO assets (id, target_kind, target_id, kind, url, prompt, vendor_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  const sequences = [
    { id: "animatic-v3", title: "Animatic v3 — Acts 1+2", url: "/direkta/generated/sequences/animatic-v3.png" },
    { id: "animatic-v2", title: "Animatic v2 — Act 1", url: "/direkta/generated/sequences/animatic-v2.png" },
    { id: "animatic-v1", title: "Animatic v1 — Block 1", url: "/direkta/generated/sequences/animatic-v1.png" }
  ];
  for (const s of sequences) {
    insertLibAsset.run(nanoid(10), "sequence", PROJECT_ID, "image", s.url, s.title, null);
  }
}

const SCRIPT_TEXT = `INT. WAREHOUSE — NIGHT

MARCUS, 44, picks his way between rusted crates. A flashlight beam — narrow, tired. The air smells like the river.

He stops. Something pale on the concrete. He doesn't bring the light up immediately.

MARCUS
  (quiet, to himself)
Don't.

He raises the beam. DETECTIVE REYES is already there, three paces behind, gun low at her side.

REYES
You said you'd call before you came in.

MARCUS
I'm calling.

EXT. RIVERSIDE — DAWN

REYES at the rail. The river holds the lights of the city in pieces. She talks into her radio without looking down.

REYES
Send a unit. Bring coffee for two.

INT. PRECINCT — DAY

A whiteboard. REYES pins photographs. CAPT. HALL watches from the doorway, his arms folded the way arms fold when they don't want to listen.

HALL
Tell me you have something I can put on paper.

REYES
I have a name. Marcus Doyle. He won't run.

INT. APARTMENT — NIGHT

MAYA at the kitchen window. Rain sheets the glass. The kettle clicks off behind her but she doesn't turn.

MAYA
  (quiet)
You said the script was ready.

MARCUS (O.S.)
It was. Until I read it again.

EXT. WAREHOUSE — NIGHT (LATER)

REYES walks the perimeter alone. She stops where she stopped before. Looks down. Looks at where Marcus stood. Doesn't move.

INT. CAFE — LISBON — DAY

Sunlight through tiled windows. RAFA waits at the corner table, the same way he waited for everything — like the world owed him quiet.
`;

const BIBLE_CHARACTERS = `MARCUS — 44, lean and weathered. Grey at the temples, long scar above the left eye. Worn leather jacket, dark jeans. Looks underdressed in any room. Hasn't slept in days but still commands one. Morally complex.

DETECTIVE REYES — 36, athletic and compact. Cropped dark hair, steady jaw. Tailored coat over rumpled work clothes. Always carries a notebook. Sees what others miss. Speaks less than she listens. Protagonist.

MAYA — Marcus's partner. Quiet, observant. Wears soft colours that disagree with her line of work.

RAFA — Marcus's former friend in Lisbon. Waits the way the world owes him quiet.

CAPT. HALL — Reyes's captain. Arms folded the way arms fold when they don't want to listen.

ELENA — Lisbon arrival, late entry. Will turn the second act.`;

const BIBLE_WORLD = `Two cities. The home city is cold, procedural, sodium-lit. Lisbon is warm, tiled, distant — the light is forgiving, the people are not. Rain plays a recurring role.

WAREHOUSE — riverside industrial. Smells like the river. Crate maze. Where the body is found.

APARTMENT — Maya and Marcus's. Rain on glass. Kitchen window framed by a kettle that keeps clicking off.

PRECINCT — whiteboard, photographs pinned in two rows. Hall's doorway is the room's gravity.

LISBON CAFE — sunlight through tiled windows. Rafa's corner table never moves.`;

const BIBLE_TONE = `Noir register. Quiet. Restrained. Verbs first. Characters say less than they mean.

Every scene must have a clear visual decision, not only exposition. Use one cinematic surprise every 20 seconds to keep momentum. Do not change the main character face, costume palette, or voice between shots.

Reyes never raises her voice — not once in 47 beats.`;

/* ============================================================
   MOVIE BIBLE — extended fields
   ============================================================ */

const PROJECT_SHORT_SYNOPSIS = `A retired fixer is pulled back across two cities when a body — and a former friend — surface in the same week. A detective tracks him. His wife waits. Lisbon remembers.`;

const PROJECT_FULL_SYNOPSIS = `ACT ONE — In a riverside city, a body turns up in a warehouse. MARCUS, a man who walked away seven years ago to live quietly with his wife MAYA, is the first person at the scene. He is also the first person DETECTIVE REYES expected to find there. The encounter is calm, professional, almost gentle — both have been waiting for it. Reyes builds a board. Hall, her captain, wants the case closed on paper. Marcus tells Maya he is leaving for a few days. She doesn't ask which days.

ACT TWO — Lisbon. Marcus meets RAFA, the friend he left behind, at a cafe under tiled windows. The conversation is the one they have been not-having for ten years. ELENA arrives in the second hour with a question only she could ask. The three of them name the thing Marcus has never said aloud. Reyes, alone back in the home city, returns to the warehouse and realises the answer is in the building, not in the file. Maya finds a folded letter in a drawer she shouldn't have opened.

ACT THREE — Marcus comes home. Reyes meets him at the door instead of the precinct. They speak without their professions. She lets him pass. Hall signs a different file than the one Reyes hands him. Marcus sits at the kitchen window with Maya. She pours two cups. He doesn't reach for his.`;

const BIBLE_THEMES = [
  "Memory as evidence",
  "Loyalty after betrayal",
  "The cost of leaving",
  "What the city remembers about you"
];

const BIBLE_COMPARABLES = [
  { title: "Sicario (2015)", note: "Restraint, procedural calm under threat. We share the silence, not the scale." },
  { title: "The American (2010)", note: "European stillness, a man trying to disappear. Closest match for the second act." },
  { title: "Klute (1971)", note: "Long pauses, two investigators with different reads of the same room. Our two-detective dynamic." },
  { title: "Le Samouraï (1967)", note: "Wardrobe as character. The trench coat is the protagonist." }
];

const BIBLE_WHAT_MAKES_DIFFERENT = `Two cities, one man's past chasing him through both — but the detective is not the protagonist. The fugitive is. The audience watches Marcus decide whether to keep being who he became or accept who he was. Reyes is the mirror, not the engine. The film ends in a kitchen, not a precinct.`;

const BIBLE_WORLD_RULES = `No fantasy elements, no supernatural. Surveillance is omnipresent but never depicted — the city watches by inference. Phones exist but are used sparingly; everyone in this world prefers to be seen face-to-face. Nobody runs. Nobody fights. The threat is always whether the next sentence will be said out loud.`;

const BIBLE_ATMOSPHERE = `The home city is sodium-cold — orange streetlamps over wet asphalt, fluorescent precincts, rain that hasn't stopped in a week. The air feels iron-mineral. Lisbon is the inverse: tile-warm, sun through arched windows, the temperature of someone who has waited a long time for you to arrive. Both cities are quiet — not empty, but composed. People move with purpose, talk in low voices. The film is set in a present day that could be any present day in the last thirty years.`;

const BIBLE_PALETTE = [
  { hex: "#0C0F12", name: "Sodium Black — home city night" },
  { hex: "#2A2018", name: "Leather Brown — Marcus" },
  { hex: "#7A8B95", name: "River Slate — water + windows" },
  { hex: "#D4B886", name: "Lisbon Sand — afternoon tile" },
  { hex: "#E2C9A1", name: "Cafe Cream — Lisbon interior" },
  { hex: "#E84A35", name: "Pact Red — single accent, used once per act" }
];

const BIBLE_CINEMATOGRAPHY = `35mm and 50mm primes for almost everything; one 85mm in the Lisbon cafe scene only. Camera mostly locked or on a slow dolly — handheld reserved for Reyes's return to the warehouse in Beat 05. Distance from subjects is medium-to-close; no extreme wides except the riverside dawn. Eye-line cuts carry the scene; nobody breaks the 180-degree line.`;

const BIBLE_LIGHTING = `Low-key in the home city — single source where possible, deep shadow, sparing highlights. Practicals do most of the work (kettle, desk lamp, flashlight, precinct overhead). Lisbon is high-key but never bright — soft window light filtered through tile and linen. No artificial coloured lights anywhere; everything reads as motivated. One exception: the precinct fluorescents have a cold cyan shift to make the room feel airless.`;

const BIBLE_EDITORIAL = `Long takes in dialogue scenes — minimum four seconds per cut, often more. Hard cuts between cities (no dissolves) to keep the geographic shift jarring. One match-cut per act: kettle steam to flashlight beam (Beat 04 → 05), coffee cup to riverside cup (Beat 06 → 02 reprise), folded letter to closed door (Beat 07 → 14). Silences are full counts of three before resolution.`;

const BIBLE_MOTIFS = [
  "The folded letter — appears in three scenes, never opened on camera",
  "Coffee left untouched — every Marcus scene with another person",
  "Light moving on water — opens Act 1, closes Act 3"
];

const BIBLE_PRODUCTION_CHALLENGES = `Two-city shoot. Either two production blocks (preferred — easier continuity for cast and DP) or a single home-city block plus a one-week Lisbon insert with a reduced crew. Marcus is in every scene; schedule around him. Rain has to be controlled — practical rain rigs for the apartment-window scenes, real weather for riverside if luck holds. The continuity flag on Beat 05 (Marcus's jacket) is a wardrobe risk worth one supervisor pass per take.`;

const BIBLE_VFX = `Minimal. No CGI. One brief sky replacement for the riverside dawn if practical doesn't work. Wire removal for the warehouse beam rig (Beat 01). Otherwise: in-camera only.`;

const BIBLE_CASTING = `Marcus needs the kind of actor whose stillness reads as restraint, not absence — the role lives in two-word sentences. Reyes needs procedural authority that doesn't tip into hardness; an actor who can listen on screen. Maya is the hardest part: a single scene with two lines that has to land the whole back half. Cast for restraint over reach; nobody in this film overplays anything. Lisbon roles (Rafa, Elena) should ideally be cast in Portugal — the accent and physical comfort with the language matters more than the credit list.`;
