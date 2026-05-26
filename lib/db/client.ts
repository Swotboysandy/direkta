import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "zinema.sqlite");
type Db = ReturnType<typeof Database>;

let _db: Db | null = null;

export function getDb(): Db {
  if (_db) return _db;

  fs.mkdirSync(DATA_DIR, { recursive: true });

  const db = new Database(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");

  migrate(db);
  seed(db);
  _db = db;
  return db;
}

function migrate(db: Db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      premise TEXT NOT NULL DEFAULT '',
      aspect_ratio TEXT NOT NULL DEFAULT '16:9',
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
      node_id TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      url TEXT NOT NULL,
      prompt TEXT NOT NULL DEFAULT '',
      vendor_id TEXT,
      meta TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_assets_node ON assets(node_id, created_at DESC);
  `);

  // Lightweight column upgrades for pre-existing databases.
  ensureColumn(db, "projects", "aspect_ratio", "TEXT NOT NULL DEFAULT '16:9'");
  ensureColumn(db, "vendors", "kind", "TEXT NOT NULL DEFAULT 'text'");
}

function ensureColumn(db: Db, table: string, column: string, decl: string) {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (rows.some((row) => row.name === column)) return;
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${decl}`);
}

function ensureVendor(
  db: Db,
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

function seed(db: Db) {
  ensureVendor(db, "anthropic-default", "Anthropic Claude", "anthropic", "claude-sonnet-4-6", "text", 1);
  ensureVendor(db, "openai-default", "OpenAI GPT", "openai", "gpt-4o-mini", "text", 0);
  ensureVendor(db, "google-default", "Google Gemini", "google", "gemini-2.0-flash", "text", 0);
  ensureVendor(db, "fal-default", "Fal AI (Flux)", "fal", "fal-ai/flux/schnell", "image", 1);
  ensureVendor(db, "openai-image-default", "OpenAI gpt-image-1", "openai-image", "gpt-image-1", "image", 0);
  ensureVendor(db, "fal-video-default", "Fal AI (Kling)", "fal-video", "fal-ai/kling-video/v1/standard/text-to-video", "video", 1);
  ensureVendor(db, "runway-default", "Runway Gen-3", "runway", "gen3a_turbo", "video", 0);
  ensureVendor(db, "minimax-default", "MiniMax Hailuo", "minimax", "video-01", "video", 0);

  const projects = db.prepare("SELECT COUNT(*) AS n FROM projects").get() as { n: number };
  if (projects.n === 0) {
    db.prepare(
      "INSERT INTO projects (id, title, premise, aspect_ratio) VALUES (?, ?, ?, ?)"
    ).run(
      "demo",
      "Runaway Heiress",
      "A pressured heir escapes a royal city while a loyal guard rewrites her route.",
      "16:9"
    );
  }
}
