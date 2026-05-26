/* DIREKTA — Shared dummy data
   Project: "The Lisbon Pact"
   exports → window.DK_DATA */

const DK_DATA = (() => {

  // — Projects (sidebar list) —
  const PROJECTS = [
    {
      id: "lisbon",
      title: "The Lisbon Pact",
      lastEdited: "2 min ago",
      format: "Short Film",
      length: "15–30 min",
      lengthEstimate: "22 min est.",
      logline: "A detective tracks a former friend across two cities, only to find his own past waiting in Lisbon.",
      tone: ["Thriller", "Drama"],
      stages: { screenplay: 1.0, casting: 0.66, storyboard: 0.32, stitch: 0.18, export: 0 },
      sceneCount: 47, beatCount: 47, charCount: 12, locCount: 8, bibleWords: 3200
    },
    { id: "northbound", title: "Northbound", lastEdited: "yesterday", format: "Music Video",
      stages: { screenplay: 1, casting: 1, storyboard: 1, stitch: 1, export: 1 } },
    { id: "saturday", title: "Saturday Lights", lastEdited: "3 days ago", format: "Ad",
      stages: { screenplay: 1, casting: 0.4, storyboard: 0, stitch: 0, export: 0 } },
    { id: "eleven", title: "Eleven Days", lastEdited: "1 week ago", format: "Short Film",
      stages: { screenplay: 0.55, casting: 0, storyboard: 0, stitch: 0, export: 0 } }
  ];

  // — Nine agents —
  const AGENTS = [
    { id: "script-reader",  name: "Script Reader",       state: "done" },
    { id: "beat-writer",    name: "Beat Writer",         state: "attention" }, // clarification pending
    { id: "bible-builder",  name: "Bible Builder",       state: "done" },
    { id: "casting-dir",    name: "Casting Director",    state: "working" },
    { id: "cinematographer",name: "Cinematographer",     state: "working" },
    { id: "continuity",     name: "Continuity Checker",  state: "attention" },
    { id: "editor",         name: "Editor",              state: "idle" },
    { id: "video-director", name: "Video Director",      state: "idle" },
    { id: "export-agent",   name: "Export Agent",        state: "idle" }
  ];

  // — Workspaces — sequential gating —
  const WORKSPACES = [
    { id: "dashboard",  label: "Dashboard",  unlocked: true,  status: "active" },
    { id: "scripting",  label: "Scripting",  unlocked: true,  status: "in-progress", note: "46 / 47 beats" },
    { id: "casting",    label: "Casting",    unlocked: true,  status: "in-progress", note: "4 / 6 Soul IDs" },
    { id: "storyboard", label: "Storyboard", unlocked: true,  status: "in-progress", note: "15 / 47 frames" },
    { id: "stitch",     label: "Stitch",     unlocked: true,  status: "in-progress", note: "6 nodes · 2 clips" },
    { id: "library",    label: "Library",    unlocked: true,  status: "active", note: "all outputs" },
    { id: "export",     label: "Export",     unlocked: false, status: "locked", note: "after Stitch", lockReason: "Stitch is at 2 of 5 transitions. Export unlocks when the animatic is fully rendered." }
  ];

  // — Characters & Locations (Casting) —
  const CASTING = [
    { id: "marcus",  type: "character", name: "MARCUS",            role: "Lead",        scenes: 28, dialogue: true,
      state: "trained",  consistency: 8.4,
      brief: { age: "42–46", build: "Lean, weathered", features: "Grey at the temples; long scar above the left eye", wardrobe: "Worn leather jacket. Dark jeans. Looks underdressed in any room.", personality: "Hasn't slept in days but still commands a room.", register: "Morally complex" }
    },
    { id: "reyes",   type: "character", name: "DETECTIVE REYES",   role: "Lead",        scenes: 26, dialogue: true,
      state: "training", progress: 0.67, refsCount: 6,
      brief: { age: "36–40", build: "Athletic, compact", features: "Cropped dark hair. Steady jaw.", wardrobe: "Tailored coat over rumpled work clothes. Always carries a notebook.", personality: "Sees what others miss. Speaks less than she listens.", register: "Protagonist" }
    },
    { id: "maya",    type: "character", name: "MAYA",              role: "Supporting", scenes: 12, dialogue: true,
      state: "trained",  consistency: 9.1 },
    { id: "rafa",    type: "character", name: "RAFA",              role: "Supporting", scenes: 8,  dialogue: true,
      state: "empty" },
    { id: "hall",    type: "character", name: "CAPT. HALL",        role: "Featured",   scenes: 4,  dialogue: true,
      state: "failed", error: "Not enough visual consistency in reference photos. Try photos with similar lighting and angle." },
    { id: "elena",   type: "character", name: "ELENA",             role: "Supporting", scenes: 6,  dialogue: true,
      state: "trained",  consistency: 8.8 },
    { id: "warehouse",type:"location", name: "WAREHOUSE — INT — NIGHT",   tag: "INT", scenes: 5, state: "trained" },
    { id: "apartment",type:"location", name: "APARTMENT — INT — NIGHT",   tag: "INT", scenes: 9, state: "trained" },
    { id: "precinct", type:"location", name: "PRECINCT — INT — DAY",      tag: "INT", scenes: 4, state: "training", progress: 0.42 },
    { id: "riverside",type:"location", name: "RIVERSIDE — EXT — DAWN",    tag: "EXT", scenes: 3, state: "empty" },
    { id: "cafe",     type:"location", name: "LISBON CAFE — INT — DAY",   tag: "INT", scenes: 4, state: "empty" },
    { id: "rooftop",  type:"location", name: "ROOFTOP — EXT — NIGHT",     tag: "EXT", scenes: 2, state: "empty" }
  ];

  // — Beats —
  const BEATS = [
    { n: 1, slug: "INT. WAREHOUSE — NIGHT",     title: "Marcus discovers the body",         chars: ["MARCUS","REYES"],   loc: "warehouse", mood: ["TENSION","DISCOVERY"], props: ["Flashlight","Folded letter"] },
    { n: 2, slug: "EXT. RIVERSIDE — DAWN",      title: "Reyes calls it in",                 chars: ["REYES"],            loc: "riverside", mood: ["PROCEDURAL","COLD"] },
    { n: 3, slug: "INT. PRECINCT — DAY",        title: "The board goes up",                 chars: ["REYES","HALL"],     loc: "precinct",  mood: ["PROCEDURAL"] },
    { n: 4, slug: "INT. APARTMENT — NIGHT",     title: "Marcus tells Maya he's leaving",    chars: ["MARCUS","MAYA"],    loc: "apartment", mood: ["INTIMATE","DEPARTURE"] },
    { n: 5, slug: "EXT. WAREHOUSE — NIGHT",     title: "Reyes returns to the scene",        chars: ["REYES"],            loc: "warehouse", mood: ["QUIET","REFLECTIVE"], flag: "continuity" },
    { n: 6, slug: "INT. CAFE — LISBON — DAY",   title: "Marcus meets Rafa in Lisbon",       chars: ["MARCUS","RAFA"],    loc: "cafe",      mood: ["REUNION","SUSPICION"] },
    { n: 7, slug: "INT. APARTMENT — NIGHT",     title: "Maya finds the letter",             chars: ["MAYA"],             loc: "apartment", mood: ["DISCOVERY"], note: "Flashback" }
  ];

  // — Activity feed —
  const ACTIVITY = [
    { agent: "cinematographer", text: "Generated 4 variants for **Beat 03** — ready for review.", time: "4 min ago" },
    { agent: "continuity",      text: "Flagged **Beat 05** — Marcus wearing leather jacket inconsistent with Beat 03 (same night).", time: "8 min ago" },
    { agent: "casting-dir",     text: "Training Soul ID for **DETECTIVE REYES** — 67% complete.", time: "12 min ago" },
    { agent: "bible-builder",   text: "Updated character profile: **MAYA** — added wardrobe direction.", time: "24 min ago" },
    { agent: "beat-writer",     text: "Flagged a clarification on **Beat 12**: 'what happened in Lisbon'.", time: "47 min ago" },
    { agent: "cinematographer", text: "Generated 4 variants for **Beat 02** — ready for review.", time: "1 h ago" },
    { agent: "script-reader",   text: "Completed analysis — 47 scenes, 12 characters, 8 locations.", time: "1 h ago" },
    { agent: "bible-builder",   text: "Created production bible — 3,200 words.", time: "1 h ago" }
  ];

  // — Storyboard rows (mixed states) —
  const STORYBOARD = [
    // Beat, state, selectedIndex (0..3), continuity flag
    { beat: 1, state: "complete", selected: 1 },
    { beat: 2, state: "complete", selected: 2 },
    { beat: 3, state: "generating" },
    { beat: 4, state: "complete", selected: 0 },
    { beat: 5, state: "complete", selected: 3, flag: "continuity" },
    { beat: 6, state: "waiting" },
    { beat: 7, state: "error" }
  ];

  // — Stitch nodes & edges —
  const STITCH_NODES = [
    { id: "n1", beat: 1, x: 80,   y: 180, duration: 3.0 },
    { id: "n2", beat: 2, x: 360,  y: 220, duration: 2.4 },
    { id: "n3", beat: 3, x: 640,  y: 160, duration: 4.0 },
    { id: "n4", beat: 4, x: 920,  y: 220, duration: 5.6 },
    { id: "n5", beat: 5, x: 1200, y: 160, duration: 2.8 },
    { id: "n6", beat: 6, x: 1480, y: 240, duration: 4.4 }
  ];
  const STITCH_EDGES = [
    { from: "n1", to: "n2", state: "complete", style: "hard cut",    duration: 0.0 },
    { from: "n2", to: "n3", state: "complete", style: "dissolve",    duration: 1.2 },
    { from: "n3", to: "n4", state: "generating", style: "match cut",  est: 18 },
    { from: "n4", to: "n5", state: "pending" },
    { from: "n5", to: "n6", state: "pending" }
  ];

  // — Script excerpt (Screenplay left panel) —
  const SCRIPT = [
    { type: "scene",     n: 1, text: "INT. WAREHOUSE — NIGHT" },
    { type: "action",    text: "MARCUS, 44, picks his way between rusted crates. A flashlight beam — narrow, tired. The air smells like the river." },
    { type: "action",    text: "He stops. Something pale on the concrete. He doesn't bring the light up immediately." },
    { type: "char",      text: "MARCUS" },
    { type: "paren",     text: "(quiet, to himself)" },
    { type: "dialogue",  text: "Don't." },
    { type: "action",    text: "He raises the beam. DETECTIVE REYES is already there, three paces behind, gun low at her side." },
    { type: "char",      text: "REYES" },
    { type: "dialogue",  text: "You said you'd call before you came in." },
    { type: "char",      text: "MARCUS" },
    { type: "dialogue",  text: "I'm calling." },
    { type: "scene",     n: 2, text: "EXT. RIVERSIDE — DAWN" },
    { type: "action",    text: "REYES at the rail. The river holds the lights of the city in pieces. She talks into her radio without looking down." },
    { type: "char",      text: "REYES" },
    { type: "dialogue",  text: "Send a unit. Bring coffee for two." },
    { type: "scene",     n: 3, text: "INT. PRECINCT — DAY" },
    { type: "action",    text: "A whiteboard. REYES pins photographs. CAPT. HALL watches from the doorway, his arms folded the way arms fold when they don't want to listen." },
    { type: "char",      text: "HALL" },
    { type: "dialogue",  text: "Tell me you have something I can put on paper." },
    { type: "char",      text: "REYES" },
    { type: "dialogue",  text: "I have a name. Marcus Doyle. He won't run." },
    { type: "scene",     n: 4, text: "INT. APARTMENT — NIGHT" },
    { type: "action",    text: "MAYA at the kitchen window. Rain sheets the glass. The kettle clicks off behind her but she doesn't turn." },
    { type: "char",      text: "MAYA" },
    { type: "paren",     text: "(quiet)" },
    { type: "dialogue",  text: "You said the script was ready." },
    { type: "char",      text: "MARCUS (O.S.)" },
    { type: "dialogue",  text: "It was. Until I read it again." },
    { type: "scene",     n: 5, text: "EXT. WAREHOUSE — NIGHT (LATER)" },
    { type: "action",    text: "REYES walks the perimeter alone. She stops where she stopped before. Looks down. Looks at where Marcus stood. Doesn't move." },
    { type: "scene",     n: 6, text: "INT. CAFE — LISBON — DAY" },
    { type: "action",    text: "Sunlight through tiled windows. RAFA waits at the corner table, the same way he waited for everything — like the world owed him quiet." }
  ];

  // — Acts / Chapters / Scenes (Outline tree) —
  const ACTS = [
    {
      n: 1, title: "Setup · The Body",
      chapters: [
        { n: 1, title: "Discovery",       beats: [1, 2],     wordCount: 1840, scenes: 2 },
        { n: 2, title: "The Board Goes Up", beats: [3],      wordCount: 1240, scenes: 1 },
        { n: 3, title: "Goodbye to Maya",  beats: [4],       wordCount: 2010, scenes: 1 }
      ]
    },
    {
      n: 2, title: "Confrontation · Lisbon",
      chapters: [
        { n: 4, title: "The Perimeter",   beats: [5],        wordCount: 920,  scenes: 1 },
        { n: 5, title: "Reunion at the Café", beats: [6],    wordCount: 2640, scenes: 1 },
        { n: 6, title: "The Letter",      beats: [7],        wordCount: 1180, scenes: 1, flashback: true },
        { n: 7, title: "Cracks",          beats: [8, 9, 10], wordCount: 3120, scenes: 3 }
      ]
    },
    {
      n: 3, title: "Resolution · Returning",
      chapters: [
        { n: 8, title: "The Pact",        beats: [11, 12],   wordCount: 2280, scenes: 2, flag: "clarification" },
        { n: 9, title: "Last Light",      beats: [13, 14],   wordCount: 1690, scenes: 2 }
      ]
    }
  ];

  // — Codex Snippets (reusable text) —
  const SNIPPETS = [
    { id: "tone-noir",       title: "Tone — Noir Register",      kind: "Tone",      use: 12, body: "Quiet. Restrained. Verbs first. Characters say less than they mean." },
    { id: "world-lisbon",    title: "World — Lisbon Sequence",   kind: "World",     use: 6,  body: "Lisbon is warm, tiled, distant. The light is forgiving. The people are not." },
    { id: "fmt-scene",       title: "Format — Scene Heading",    kind: "Format",    use: 47, body: "INT./EXT. — LOCATION — DAY/NIGHT" },
    { id: "rule-reyes",      title: "Rule — Reyes never raises her voice", kind: "Character Rule", use: 26, body: "Detective Reyes speaks less than she listens. She never raises her voice — not once in 47 beats." }
  ];

  // — Chat threads (Discuss tab) —
  const CHAT_THREADS = [
    { id: "th-1", title: "Beat 12 — How to handle 'Lisbon backstory'",
      agent: "beat-writer", date: "2 hours ago", count: 8, pinned: true, active: true,
      messages: [
        { from: "agent", agent: "Beat Writer", text: "Marcus mentions 'what happened in Lisbon' on page 19 — there's no setup for this anywhere in the script. Three options on how I treat it:" },
        { from: "agent", agent: "Beat Writer", text: "(a) Add it to the Bible as implied backstory · (b) Flag it as a plot gap for you to fix · (c) Treat it as a deliberate mystery and let it sit." },
        { from: "user", text: "How would a deliberate mystery affect the climax?" },
        { from: "agent", agent: "Beat Writer", text: "Two reads. If Lisbon stays implied, the café reunion in Beat 06 becomes our only window — every line Rafa says has to carry double weight. If it's a plot gap, we can plant a flashback earlier in Act 2 to ground the reference." },
        { from: "user", text: "What would you choose?" },
        { from: "agent", agent: "Beat Writer", text: "Deliberate mystery. Your strongest scene is Beat 06 already — leaning into ambiguity sharpens it. But you'd want to cut one of Marcus's earlier references so the reveal isn't telegraphed." }
      ]
    },
    { id: "th-2", title: "Help me write a backstory for RAFA", agent: "bible-builder", date: "yesterday", count: 14 },
    { id: "th-3", title: "Give me a tone sample for Act 2 opening", agent: "script-reader", date: "yesterday", count: 4 },
    { id: "th-4", title: "What does the warehouse smell like?", agent: "bible-builder", date: "2 days ago", count: 3 },
    { id: "th-5", title: "Rewrite Maya's exit — make it colder", agent: "script-reader", date: "3 days ago", count: 9 },
    { id: "th-6", title: "Codex entry for the Lisbon Cafe", agent: "bible-builder", date: "5 days ago", count: 6 },
    { id: "th-7", title: "Is the pacing of Act 1 too slow?", agent: "script-reader", date: "1 week ago", count: 11 }
  ];

  // — Manuscript (for Script tab) — scene beats + prose —
  const MANUSCRIPT = [
    { kind: "act", n: 1, title: "Setup · The Body" },
    { kind: "chapter", n: 1, title: "Discovery", wordCount: 1840 },
    {
      kind: "scene",
      n: 1, slug: "INT. WAREHOUSE — NIGHT",
      beatTitle: "Marcus discovers the body",
      sceneBeat: "Marcus enters the warehouse alone. He thinks he is alone. Reyes is already there — she's been waiting. They speak in fragments, neither one mentioning the body until they have to.",
      prose: [
        "MARCUS, 44, picks his way between rusted crates. A flashlight beam — narrow, tired. The air smells like the river.",
        "He stops. Something pale on the concrete. He doesn't bring the light up immediately.",
        "{MARCUS}\n(quiet, to himself)\nDon't.",
        "He raises the beam. {REYES} is already there, three paces behind, gun low at her side.",
        "{REYES}\nYou said you'd call before you came in.",
        "{MARCUS}\nI'm calling."
      ],
      wordCount: 980
    },
    {
      kind: "scene",
      n: 2, slug: "EXT. RIVERSIDE — DAWN",
      beatTitle: "Reyes calls it in",
      sceneBeat: "Reyes at the rail. Practical. Already two steps into the work, already three steps ahead of dispatch.",
      prose: [
        "{REYES} at the rail. The river holds the lights of the city in pieces. She talks into her radio without looking down.",
        "{REYES}\nSend a unit. Bring coffee for two."
      ],
      wordCount: 860, sceneBeatCollapsed: true
    },
    { kind: "chapter", n: 2, title: "The Board Goes Up", wordCount: 1240 },
    {
      kind: "scene",
      n: 3, slug: "INT. PRECINCT — DAY",
      beatTitle: "The board goes up",
      sceneBeat: "Reyes presents what she has. Hall doesn't want it. The board is small but it's a name now.",
      prose: [
        "A whiteboard. {REYES} pins photographs. {HALL} watches from the doorway, his arms folded the way arms fold when they don't want to listen.",
        "{HALL}\nTell me you have something I can put on paper.",
        "{REYES}\nI have a name. Marcus Doyle. He won't run."
      ],
      wordCount: 1240
    },
    { kind: "chapter", n: 3, title: "Goodbye to Maya", wordCount: 2010 },
    {
      kind: "scene",
      n: 4, slug: "INT. APARTMENT — NIGHT",
      beatTitle: "Marcus tells Maya he's leaving",
      sceneBeat: "Marcus arrives home knowing he'll leave again before morning. Maya already knows.",
      prose: [
        "{MAYA} at the kitchen window. Rain sheets the glass. The kettle clicks off behind her but she doesn't turn.",
        "{MAYA}\n(quiet)\nYou said the script was ready.",
        "{MARCUS} (O.S.)\nIt was. Until I read it again."
      ],
      wordCount: 2010
    }
  ];

  // — Analyse: scene word counts —
  const SCENE_WORDS = [980, 860, 1240, 2010, 920, 2640, 1180, 1320, 990, 810, 1180, 1100, 870, 1690];

  // — Character distribution by scene (which chars in each scene) —
  const CHAR_DIST = [
    { scene: 1, chars: ["MARCUS","REYES"] },
    { scene: 2, chars: ["REYES"] },
    { scene: 3, chars: ["REYES","HALL"] },
    { scene: 4, chars: ["MARCUS","MAYA"] },
    { scene: 5, chars: ["REYES"] },
    { scene: 6, chars: ["MARCUS","RAFA"] },
    { scene: 7, chars: ["MAYA"] },
    { scene: 8, chars: ["MARCUS","RAFA","ELENA"] },
    { scene: 9, chars: ["REYES","HALL"] },
    { scene: 10, chars: ["MARCUS"] },
    { scene: 11, chars: ["MARCUS","RAFA"] },
    { scene: 12, chars: ["REYES","MARCUS"] },
    { scene: 13, chars: ["MARCUS","MAYA"] },
    { scene: 14, chars: ["REYES"] }
  ];

  // — Library —
  const LIBRARY = {
    generations: [
      // Individual beat variants — completed
      { id: "g1", beat: 1, variant: 2, kind: "image", project: "The Lisbon Pact", title: "Beat 01 · V02 — Marcus enters warehouse", mood: "warehouse", date: "4 min ago", size: "2.4 MB", picked: true },
      { id: "g2", beat: 1, variant: 1, kind: "image", project: "The Lisbon Pact", title: "Beat 01 · V01 — Marcus enters warehouse", mood: "warehouse", date: "4 min ago", size: "2.4 MB" },
      { id: "g3", beat: 2, variant: 3, kind: "image", project: "The Lisbon Pact", title: "Beat 02 · V03 — Riverside dawn", mood: "riverside", date: "9 min ago", size: "2.6 MB", picked: true },
      { id: "g4", beat: 2, variant: 1, kind: "image", project: "The Lisbon Pact", title: "Beat 02 · V01 — Riverside dawn", mood: "riverside", date: "9 min ago", size: "2.6 MB" },
      { id: "g5", beat: 4, variant: 1, kind: "image", project: "The Lisbon Pact", title: "Beat 04 · V01 — Apartment, Maya", mood: "apartment", date: "22 min ago", size: "2.3 MB", picked: true },
      { id: "g6", beat: 4, variant: 4, kind: "image", project: "The Lisbon Pact", title: "Beat 04 · V04 — Apartment, Maya", mood: "apartment", date: "22 min ago", size: "2.3 MB" },
      { id: "g7", beat: 5, variant: 4, kind: "image", project: "The Lisbon Pact", title: "Beat 05 · V04 — Reyes returns", mood: "warehouse", date: "36 min ago", size: "2.5 MB", picked: true, flag: "continuity" },
      { id: "g8", beat: 6, variant: 2, kind: "image", project: "The Lisbon Pact", title: "Beat 06 · V02 — Lisbon Café", mood: "cafe", date: "1 h ago", size: "2.7 MB" },
      { id: "g9", beat: 6, variant: 3, kind: "image", project: "The Lisbon Pact", title: "Beat 06 · V03 — Lisbon Café", mood: "cafe", date: "1 h ago", size: "2.7 MB" },
      { id: "g10", beat: 3, variant: 2, kind: "image", project: "The Lisbon Pact", title: "Beat 03 · V02 — Precinct board", mood: "precinct", date: "2 h ago", size: "2.2 MB" }
    ],
    sequences: [
      { id: "s1", title: "Animatic v3 — Acts 1+2", project: "The Lisbon Pact", duration: "3 m 42 s", clipCount: 14, date: "12 min ago", state: "complete", size: "84 MB" },
      { id: "s2", title: "Animatic v2 — Act 1 only", project: "The Lisbon Pact", duration: "1 m 18 s", clipCount: 4, date: "3 hours ago", state: "complete", size: "32 MB" },
      { id: "s3", title: "Animatic v1 — Block 1", project: "The Lisbon Pact", duration: "0 m 42 s", clipCount: 2, date: "yesterday", state: "complete", size: "18 MB" },
      { id: "s4", title: "Music video cut", project: "Northbound", duration: "2 m 10 s", clipCount: 18, date: "1 week ago", state: "complete", size: "60 MB" }
    ],
    soulids: [
      { id: "si-marcus", name: "MARCUS",          project: "The Lisbon Pact", consistency: 8.4, refsCount: 8, reused: 0,  date: "2 hours ago" },
      { id: "si-reyes",  name: "DETECTIVE REYES", project: "The Lisbon Pact", consistency: null, state: "training", progress: 0.67, refsCount: 6, date: "12 min ago" },
      { id: "si-maya",   name: "MAYA",            project: "The Lisbon Pact", consistency: 9.1, refsCount: 7, reused: 1,  date: "4 hours ago" },
      { id: "si-elena",  name: "ELENA",           project: "The Lisbon Pact", consistency: 8.8, refsCount: 6, reused: 0,  date: "6 hours ago" },
      { id: "si-wh",     name: "WAREHOUSE",       project: "The Lisbon Pact", consistency: 8.2, refsCount: 12, reused: 0, type: "location", date: "yesterday" },
      { id: "si-ap",     name: "APARTMENT",       project: "The Lisbon Pact", consistency: 9.0, refsCount: 9, reused: 2, type: "location", date: "yesterday" },
      { id: "si-cara",   name: "CARA",            project: "Northbound",      consistency: 9.4, refsCount: 11, reused: 1, date: "1 week ago" }
    ],
    docs: [
      { id: "d1", title: "The Lisbon Pact — Screenplay v4", kind: "script", format: "FDX", project: "The Lisbon Pact", date: "12 min ago", words: 12840, pages: 38 },
      { id: "d2", title: "The Lisbon Pact — Screenplay v3", kind: "script", format: "FDX", project: "The Lisbon Pact", date: "yesterday", words: 12320, pages: 36 },
      { id: "d3", title: "Production Bible — v1", kind: "bible", format: "PDF", project: "The Lisbon Pact", date: "1 h ago", words: 3200, pages: 14 },
      { id: "d4", title: "Beat Sheet — Full Breakdown", kind: "beats", format: "PDF", project: "The Lisbon Pact", date: "1 h ago", words: 0, pages: 6 },
      { id: "d5", title: "Northbound — Treatment", kind: "treatment", format: "DOCX", project: "Northbound", date: "1 week ago", words: 1100, pages: 4 }
    ],
    exports: [
      { id: "e1", title: "Animatic v3 · 4K · with beat titles", kind: "MP4", project: "The Lisbon Pact", date: "11 min ago", size: "184 MB", downloads: 2 },
      { id: "e2", title: "Storyboard PDF · 2-up", kind: "PDF", project: "The Lisbon Pact", date: "1 h ago", size: "26 MB", downloads: 4 },
      { id: "e3", title: "Shot List · Full", kind: "PDF", project: "The Lisbon Pact", date: "1 h ago", size: "1.2 MB", downloads: 1 },
      { id: "e4", title: "Production Bible · v1", kind: "PDF", project: "The Lisbon Pact", date: "1 h ago", size: "3.4 MB", downloads: 3 },
      { id: "e5", title: "Animatic v2 · 1080p", kind: "MP4", project: "The Lisbon Pact", date: "3 h ago", size: "62 MB", downloads: 1 }
    ]
  };

  return { PROJECTS, AGENTS, WORKSPACES, CASTING, BEATS, ACTIVITY, STORYBOARD, STITCH_NODES, STITCH_EDGES, SCRIPT, ACTS, SNIPPETS, CHAT_THREADS, MANUSCRIPT, SCENE_WORDS, CHAR_DIST, LIBRARY };
})();

// expose
window.DK_DATA = DK_DATA;
