import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { seedLisbonPact } from "./seed-lisbon";

/**
 * On Vercel the function's working directory is read-only, so we write to
 * /tmp (the only writable path). Data resets on every cold start — accepted
 * for the demo deploy. Locally we keep ./data so dev state persists.
 */
const DATA_DIR =
  process.env.DATA_DIR ||
  (process.env.VERCEL ? "/tmp/zinema-data" : path.join(process.cwd(), "data"));
const DB_PATH = path.join(DATA_DIR, "zinema.sqlite");

let _db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (_db) return _db;

  fs.mkdirSync(DATA_DIR, { recursive: true });

  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");

  migrate(db);
  seed(db);
  _db = db;
  return db;
}

function migrate(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      premise TEXT NOT NULL DEFAULT '',
      logline TEXT NOT NULL DEFAULT '',
      format TEXT NOT NULL DEFAULT 'Short Film',
      length_estimate TEXT NOT NULL DEFAULT 'Under 5 min',
      aspect_ratio TEXT NOT NULL DEFAULT '16:9',
      script TEXT NOT NULL DEFAULT '',
      script_submitted INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS nodes (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      x REAL NOT NULL DEFAULT 0,
      y REAL NOT NULL DEFAULT 0,
      width REAL NOT NULL DEFAULT 220,
      height REAL NOT NULL DEFAULT 140,
      meta TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_nodes_project ON nodes(project_id);

    CREATE TABLE IF NOT EXISTS edges (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      source TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
      target TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
      label TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_edges_project ON edges(project_id);

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      layer TEXT,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_messages_project ON messages(project_id, created_at);

    CREATE TABLE IF NOT EXISTS vendors (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      api_key TEXT NOT NULL DEFAULT '',
      base_url TEXT,
      enabled INTEGER NOT NULL DEFAULT 1,
      kind TEXT NOT NULL DEFAULT 'text'
    );

    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      node_id TEXT REFERENCES nodes(id) ON DELETE CASCADE,
      target_kind TEXT NOT NULL DEFAULT 'node',
      target_id TEXT,
      kind TEXT NOT NULL,
      url TEXT NOT NULL,
      prompt TEXT NOT NULL DEFAULT '',
      vendor_id TEXT,
      meta TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_assets_node ON assets(node_id, created_at DESC);

    /* === DIREKTA V1 === */

    CREATE TABLE IF NOT EXISTS beats (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      n INTEGER NOT NULL,
      scene_heading TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL DEFAULT '',
      characters TEXT NOT NULL DEFAULT '[]',
      location_id TEXT,
      mood TEXT NOT NULL DEFAULT '[]',
      props TEXT NOT NULL DEFAULT '[]',
      notes TEXT NOT NULL DEFAULT '',
      flag TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_beats_project ON beats(project_id, n);

    CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Supporting',
      scene_count INTEGER NOT NULL DEFAULT 0,
      dialogue INTEGER NOT NULL DEFAULT 1,
      brief TEXT NOT NULL DEFAULT '{}',
      soul_id_state TEXT NOT NULL DEFAULT 'empty',
      soul_id_progress REAL NOT NULL DEFAULT 0,
      consistency REAL,
      error TEXT,
      refs TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_characters_project ON characters(project_id);

    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      int_ext TEXT NOT NULL DEFAULT 'INT',
      time_of_day TEXT,
      scene_count INTEGER NOT NULL DEFAULT 0,
      soul_id_state TEXT NOT NULL DEFAULT 'empty',
      soul_id_progress REAL NOT NULL DEFAULT 0,
      refs TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_locations_project ON locations(project_id);

    CREATE TABLE IF NOT EXISTS bible (
      project_id TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
      characters_doc TEXT NOT NULL DEFAULT '',
      world_doc TEXT NOT NULL DEFAULT '',
      tone_doc TEXT NOT NULL DEFAULT '',
      word_count INTEGER NOT NULL DEFAULT 0,
      built INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS storyboard_variants (
      id TEXT PRIMARY KEY,
      beat_id TEXT NOT NULL REFERENCES beats(id) ON DELETE CASCADE,
      n INTEGER NOT NULL,
      asset_id TEXT,
      prompt TEXT NOT NULL DEFAULT '',
      state TEXT NOT NULL DEFAULT 'waiting',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_variants_beat ON storyboard_variants(beat_id, n);

    CREATE TABLE IF NOT EXISTS storyboard_rows (
      beat_id TEXT PRIMARY KEY REFERENCES beats(id) ON DELETE CASCADE,
      state TEXT NOT NULL DEFAULT 'waiting',
      selected_variant_id TEXT,
      style TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS stitch_nodes (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      beat_id TEXT REFERENCES beats(id) ON DELETE CASCADE,
      x REAL NOT NULL DEFAULT 0,
      y REAL NOT NULL DEFAULT 0,
      duration REAL NOT NULL DEFAULT 3.0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_stitch_nodes_project ON stitch_nodes(project_id);

    CREATE TABLE IF NOT EXISTS transitions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      from_node_id TEXT NOT NULL REFERENCES stitch_nodes(id) ON DELETE CASCADE,
      to_node_id TEXT NOT NULL REFERENCES stitch_nodes(id) ON DELETE CASCADE,
      style TEXT NOT NULL DEFAULT 'cut',
      state TEXT NOT NULL DEFAULT 'pending',
      clip_asset_id TEXT,
      duration REAL NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_transitions_project ON transitions(project_id);

    CREATE TABLE IF NOT EXISTS proposals (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      agent TEXT NOT NULL,
      kind TEXT NOT NULL,
      target_kind TEXT,
      target_id TEXT,
      payload TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      resolved_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_proposals_project ON proposals(project_id, status);

    CREATE TABLE IF NOT EXISTS clarifications (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      target_kind TEXT,
      target_id TEXT,
      question TEXT NOT NULL,
      options TEXT NOT NULL DEFAULT '[]',
      resolution TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS activity (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      agent TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'info',
      text TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_activity_project ON activity(project_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS snippets (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      use_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Single-row store for the user's Higgsfield OAuth/MCP connection.
    -- Lets Direkta generate on the user's own Higgsfield plan via mcp.higgsfield.ai.
    CREATE TABLE IF NOT EXISTS higgsfield_connection (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      client_id TEXT,
      client_secret TEXT,
      code_verifier TEXT,
      state TEXT,
      access_token TEXT,
      refresh_token TEXT,
      expires_at INTEGER NOT NULL DEFAULT 0,
      connected_at TEXT
    );

    CREATE TABLE IF NOT EXISTS codex_connection (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      access_token TEXT,
      refresh_token TEXT,
      account_id TEXT,
      expires_at INTEGER NOT NULL DEFAULT 0,
      connected_at TEXT
    );
  `);

  // Backwards-compatible column upgrades for pre-existing databases.
  ensureColumn(db, "projects", "logline", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "projects", "format", "TEXT NOT NULL DEFAULT 'Short Film'");
  ensureColumn(db, "projects", "length_estimate", "TEXT NOT NULL DEFAULT 'Under 5 min'");
  ensureColumn(db, "projects", "script", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "projects", "script_submitted", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "assets", "target_kind", "TEXT NOT NULL DEFAULT 'node'");
  ensureColumn(db, "assets", "target_id", "TEXT");

  // Lightweight column upgrades for pre-existing databases.
  ensureColumn(db, "projects", "aspect_ratio", "TEXT NOT NULL DEFAULT '16:9'");
  ensureColumn(db, "vendors", "kind", "TEXT NOT NULL DEFAULT 'text'");

  /* === Movie Bible spec (DIREKTA_MOVIE_BIBLE.md) === */
  // projects: title-page fields + synopses + production meta
  ensureColumn(db, "projects", "genre", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "projects", "tagline", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "projects", "director_name", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "projects", "draft_version", "TEXT NOT NULL DEFAULT 'v1'");
  ensureColumn(db, "projects", "short_synopsis", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "projects", "full_synopsis", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "projects", "time_period", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "projects", "budget_tier", "TEXT NOT NULL DEFAULT 'indie'");
  ensureColumn(db, "projects", "script_ai_generated", "INTEGER NOT NULL DEFAULT 0");

  // bible: tone, world, visual language, production notes
  ensureColumn(db, "bible", "themes", "TEXT NOT NULL DEFAULT '[]'");
  ensureColumn(db, "bible", "comparable_films", "TEXT NOT NULL DEFAULT '[]'");
  ensureColumn(db, "bible", "what_makes_different", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "bible", "world_rules", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "bible", "atmosphere", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "bible", "visual_palette", "TEXT NOT NULL DEFAULT '[]'");
  ensureColumn(db, "bible", "cinematography_notes", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "bible", "lighting_philosophy", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "bible", "editorial_rhythm", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "bible", "visual_motifs", "TEXT NOT NULL DEFAULT '[]'");
  ensureColumn(db, "bible", "production_challenges", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "bible", "vfx_requirements", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "bible", "casting_direction", "TEXT NOT NULL DEFAULT ''");

  // stitch_nodes: variant_id so a single beat can contribute multiple cuts to stitch
  ensureColumn(db, "stitch_nodes", "variant_id", "TEXT");
  // stitch_nodes: per-shot motion clip (image-to-video) — asset + render state
  ensureColumn(db, "stitch_nodes", "clip_asset_id", "TEXT");
  ensureColumn(db, "stitch_nodes", "clip_state", "TEXT NOT NULL DEFAULT 'none'");
  // storyboard_variants: director review — approval state + director's note
  ensureColumn(db, "storyboard_variants", "approval", "TEXT NOT NULL DEFAULT 'pending'");
  ensureColumn(db, "storyboard_variants", "note", "TEXT NOT NULL DEFAULT ''");

  // characters: psychology, arc, voice, wardrobe, key quote, relationships
  ensureColumn(db, "characters", "background", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "characters", "psychology_want", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "characters", "psychology_fear", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "characters", "psychology_wound", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "characters", "arc_start", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "characters", "arc_middle", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "characters", "arc_end", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "characters", "voice", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "characters", "key_quote", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "characters", "wardrobe_direction", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "characters", "relationships", "TEXT NOT NULL DEFAULT '[]'");
  // Dense physical identity descriptor — the Cinematographer's look-lock reads this verbatim.
  ensureColumn(db, "characters", "identity_descriptor", "TEXT NOT NULL DEFAULT ''");

  // Indexes that depend on upgraded columns must run after ensureColumn.
  db.exec("CREATE INDEX IF NOT EXISTS idx_assets_target ON assets(target_kind, target_id)");
}

function ensureColumn(db: DatabaseSync, table: string, column: string, decl: string) {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (rows.some((row) => row.name === column)) return;
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${decl}`);
}

function ensureVendor(
  db: DatabaseSync,
  id: string,
  label: string,
  provider: string,
  model: string,
  kind: "text" | "image" | "video",
  enabled: 0 | 1
) {
  const existing = db.prepare("SELECT id FROM vendors WHERE id = ?").get(id);
  if (existing) return;
  db.prepare(
    "INSERT INTO vendors (id, label, provider, model, api_key, base_url, enabled, kind) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(id, label, provider, model, "", null, enabled, kind);
}

function seed(db: DatabaseSync) {
  ensureVendor(db, "anthropic-default", "Anthropic Claude", "anthropic", "claude-sonnet-4-6", "text", 1);
  ensureVendor(db, "openai-default", "OpenAI GPT", "openai", "gpt-4o-mini", "text", 0);
  ensureVendor(db, "google-default", "Google Gemini", "google", "gemini-2.0-flash", "text", 0);
  ensureVendor(db, "fal-default", "Fal AI (Flux)", "fal", "fal-ai/flux/schnell", "image", 1);
  ensureVendor(db, "openai-image-default", "OpenAI gpt-image-1", "openai-image", "gpt-image-1", "image", 0);
  ensureVendor(db, "fal-video-default", "Fal AI (Kling)", "fal-video", "fal-ai/kling-video/v1/standard/text-to-video", "video", 1);
  ensureVendor(db, "runway-default", "Runway Gen-3", "runway", "gen3a_turbo", "video", 0);
  ensureVendor(db, "minimax-default", "MiniMax Hailuo", "minimax", "video-01", "video", 0);
  ensureVendor(db, "higgsfield-image-default", "Higgsfield Cloud", "higgsfield", "soul", "image", 0);
  ensureVendor(db, "higgsfield-video-default", "Higgsfield Cloud (DoP)", "higgsfield-video", "dop-preview", "video", 0);

  seedLisbonPact(db);
}
