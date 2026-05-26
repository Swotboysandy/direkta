import { nanoid } from "nanoid";
import type { SQLInputValue } from "node:sqlite";
import { getDb } from "./client";
import type {
  ActivityItem,
  Asset,
  AssetKind,
  Beat,
  Bible,
  BudgetTier,
  CanvasEdge,
  CanvasNode,
  Character,
  CharacterBrief,
  CharacterRelationship,
  Clarification,
  ComparableFilm,
  Location,
  Message,
  NodeKind,
  PaletteSwatch,
  Project,
  Proposal,
  StoryboardRow,
  StoryboardVariant,
  Snippet,
  VendorConfig,
  ProjectFormat,
  LengthEstimate,
  AspectRatio
} from "../types";

type Row = Record<string, unknown>;

function rowToNode(row: Row): CanvasNode {
  return {
    id: String(row.id),
    project_id: String(row.project_id),
    kind: String(row.kind) as NodeKind,
    title: String(row.title),
    body: String(row.body ?? ""),
    x: Number(row.x),
    y: Number(row.y),
    width: Number(row.width),
    height: Number(row.height),
    meta: row.meta ? JSON.parse(String(row.meta)) : {},
    created_at: String(row.created_at),
    updated_at: String(row.updated_at)
  };
}

function rowToProject(row: Row): Project {
  return {
    id: String(row.id),
    title: String(row.title),
    premise: String(row.premise ?? ""),
    logline: String(row.logline ?? ""),
    format: (String(row.format ?? "Short Film") as ProjectFormat),
    length_estimate: (String(row.length_estimate ?? "Under 5 min") as LengthEstimate),
    aspect_ratio: (String(row.aspect_ratio ?? "16:9") as AspectRatio),
    script: String(row.script ?? ""),
    script_submitted: !!row.script_submitted,
    genre: String(row.genre ?? ""),
    tagline: String(row.tagline ?? ""),
    director_name: String(row.director_name ?? ""),
    draft_version: String(row.draft_version ?? "v1"),
    short_synopsis: String(row.short_synopsis ?? ""),
    full_synopsis: String(row.full_synopsis ?? ""),
    time_period: String(row.time_period ?? ""),
    budget_tier: (String(row.budget_tier ?? "indie") as BudgetTier),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at)
  };
}

function rowToEdge(row: Row): CanvasEdge {
  return {
    id: String(row.id),
    project_id: String(row.project_id),
    source: String(row.source),
    target: String(row.target),
    label: row.label != null ? String(row.label) : null
  };
}

function rowToMessage(row: Row): Message {
  return {
    id: String(row.id),
    project_id: String(row.project_id),
    role: String(row.role) as Message["role"],
    layer: row.layer ? (String(row.layer) as Message["layer"]) : null,
    content: String(row.content),
    created_at: String(row.created_at)
  };
}

function rowToAsset(row: Row): Asset {
  return {
    id: String(row.id),
    node_id: row.node_id ? String(row.node_id) : null,
    target_kind: String(row.target_kind ?? "node"),
    target_id: row.target_id ? String(row.target_id) : null,
    kind: String(row.kind) as AssetKind,
    url: String(row.url),
    prompt: String(row.prompt ?? ""),
    vendor_id: row.vendor_id ? String(row.vendor_id) : null,
    meta: row.meta ? JSON.parse(String(row.meta)) : {},
    created_at: String(row.created_at)
  };
}

function rowToVendor(row: Row): VendorConfig {
  return {
    id: String(row.id),
    label: String(row.label),
    provider: String(row.provider) as VendorConfig["provider"],
    model: String(row.model),
    api_key: String(row.api_key ?? ""),
    base_url: row.base_url ? String(row.base_url) : undefined,
    enabled: !!row.enabled,
    kind: (String(row.kind ?? "text") as VendorConfig["kind"])
  };
}

export const projects = {
  list(): Project[] {
    const rows = getDb().prepare("SELECT * FROM projects ORDER BY updated_at DESC").all() as Row[];
    return rows.map(rowToProject);
  },
  get(id: string): Project | null {
    const row = getDb().prepare("SELECT * FROM projects WHERE id = ?").get(id) as Row | undefined;
    return row ? rowToProject(row) : null;
  },
  create(input: {
    title: string;
    premise?: string;
    logline?: string;
    format?: ProjectFormat;
    length_estimate?: LengthEstimate;
    aspect_ratio?: AspectRatio;
  }): Project {
    const id = nanoid(10);
    getDb()
      .prepare(
        "INSERT INTO projects (id, title, premise, logline, format, length_estimate, aspect_ratio) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
      .run(
        id,
        input.title,
        input.premise ?? "",
        input.logline ?? "",
        input.format ?? "Short Film",
        input.length_estimate ?? "Under 5 min",
        input.aspect_ratio ?? "16:9"
      );
    return this.get(id)!;
  },
  update(
    id: string,
    patch: Partial<
      Pick<
        Project,
        | "title"
        | "premise"
        | "logline"
        | "format"
        | "length_estimate"
        | "aspect_ratio"
        | "script"
        | "script_submitted"
      >
    >
  ) {
    const fields: string[] = [];
    const values: SQLInputValue[] = [];
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      fields.push(`${key} = ?`);
      if (key === "script_submitted") {
        values.push(value ? 1 : 0);
      } else if (typeof value === "string" || typeof value === "number" || value === null) {
        values.push(value);
      }
    }
    if (!fields.length) return;
    fields.push("updated_at = datetime('now')");
    values.push(id);
    getDb().prepare(`UPDATE projects SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  },
  delete(id: string) {
    getDb().prepare("DELETE FROM projects WHERE id = ?").run(id);
  }
};

export const nodes = {
  forProject(projectId: string): CanvasNode[] {
    const rows = getDb()
      .prepare("SELECT * FROM nodes WHERE project_id = ? ORDER BY created_at ASC")
      .all(projectId) as Row[];
    return rows.map(rowToNode);
  },
  get(id: string): CanvasNode | null {
    const row = getDb().prepare("SELECT * FROM nodes WHERE id = ?").get(id) as Row | undefined;
    return row ? rowToNode(row) : null;
  },
  create(input: {
    project_id: string;
    kind: NodeKind;
    title: string;
    body?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    meta?: Record<string, unknown>;
  }): CanvasNode {
    const id = nanoid(10);
    getDb()
      .prepare(
        "INSERT INTO nodes (id, project_id, kind, title, body, x, y, width, height, meta) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .run(
        id,
        input.project_id,
        input.kind,
        input.title,
        input.body ?? "",
        input.x ?? 0,
        input.y ?? 0,
        input.width ?? 240,
        input.height ?? 160,
        JSON.stringify(input.meta ?? {})
      );
    return this.get(id)!;
  },
  update(id: string, patch: Partial<Omit<CanvasNode, "id" | "project_id" | "created_at" | "updated_at">>) {
    const fields: string[] = [];
    const values: SQLInputValue[] = [];
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      if (key === "meta") {
        fields.push("meta = ?");
        values.push(JSON.stringify(value));
      } else if (typeof value === "string" || typeof value === "number" || value === null) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    if (!fields.length) return;
    fields.push("updated_at = datetime('now')");
    values.push(id);
    getDb().prepare(`UPDATE nodes SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  },
  delete(id: string) {
    getDb().prepare("DELETE FROM nodes WHERE id = ?").run(id);
  }
};

export const edges = {
  forProject(projectId: string): CanvasEdge[] {
    const rows = getDb()
      .prepare("SELECT * FROM edges WHERE project_id = ?")
      .all(projectId) as Row[];
    return rows.map(rowToEdge);
  },
  create(input: { project_id: string; source: string; target: string; label?: string }): CanvasEdge {
    const id = nanoid(10);
    getDb()
      .prepare("INSERT INTO edges (id, project_id, source, target, label) VALUES (?, ?, ?, ?, ?)")
      .run(id, input.project_id, input.source, input.target, input.label ?? null);
    const row = getDb().prepare("SELECT * FROM edges WHERE id = ?").get(id) as Row;
    return rowToEdge(row);
  },
  delete(id: string) {
    getDb().prepare("DELETE FROM edges WHERE id = ?").run(id);
  }
};

export const messages = {
  forProject(projectId: string, limit = 200): Message[] {
    const rows = getDb()
      .prepare("SELECT * FROM messages WHERE project_id = ? ORDER BY created_at ASC LIMIT ?")
      .all(projectId, limit) as Row[];
    return rows.map(rowToMessage);
  },
  append(input: { project_id: string; role: Message["role"]; layer?: Message["layer"]; content: string }): Message {
    const id = nanoid(10);
    getDb()
      .prepare("INSERT INTO messages (id, project_id, role, layer, content) VALUES (?, ?, ?, ?, ?)")
      .run(id, input.project_id, input.role, input.layer ?? null, input.content);
    const row = getDb().prepare("SELECT * FROM messages WHERE id = ?").get(id) as Row;
    return rowToMessage(row);
  }
};

export const assets = {
  forNode(nodeId: string): Asset[] {
    const rows = getDb()
      .prepare("SELECT * FROM assets WHERE node_id = ? ORDER BY created_at DESC")
      .all(nodeId) as Row[];
    return rows.map(rowToAsset);
  },
  latest(nodeId: string, kind: AssetKind): Asset | null {
    const row = getDb()
      .prepare("SELECT * FROM assets WHERE node_id = ? AND kind = ? ORDER BY created_at DESC LIMIT 1")
      .get(nodeId, kind) as Row | undefined;
    return row ? rowToAsset(row) : null;
  },
  create(input: {
    node_id: string;
    kind: AssetKind;
    url: string;
    prompt?: string;
    vendor_id?: string | null;
    meta?: Record<string, unknown>;
  }): Asset {
    const id = nanoid(10);
    getDb()
      .prepare(
        "INSERT INTO assets (id, node_id, kind, url, prompt, vendor_id, meta) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
      .run(
        id,
        input.node_id,
        input.kind,
        input.url,
        input.prompt ?? "",
        input.vendor_id ?? null,
        JSON.stringify(input.meta ?? {})
      );
    const row = getDb().prepare("SELECT * FROM assets WHERE id = ?").get(id) as Row;
    return rowToAsset(row);
  },
  delete(id: string) {
    getDb().prepare("DELETE FROM assets WHERE id = ?").run(id);
  }
};

export const vendors = {
  list(): VendorConfig[] {
    const rows = getDb().prepare("SELECT * FROM vendors ORDER BY label").all() as Row[];
    return rows.map(rowToVendor);
  },
  get(id: string): VendorConfig | null {
    const row = getDb().prepare("SELECT * FROM vendors WHERE id = ?").get(id) as Row | undefined;
    return row ? rowToVendor(row) : null;
  },
  firstEnabled(): VendorConfig | null {
    const row = getDb()
      .prepare("SELECT * FROM vendors WHERE enabled = 1 AND api_key != '' AND kind = 'text' LIMIT 1")
      .get() as Row | undefined;
    return row ? rowToVendor(row) : null;
  },
  firstEnabledImage(): VendorConfig | null {
    const row = getDb()
      .prepare("SELECT * FROM vendors WHERE enabled = 1 AND api_key != '' AND kind = 'image' LIMIT 1")
      .get() as Row | undefined;
    return row ? rowToVendor(row) : null;
  },
  firstEnabledVideo(): VendorConfig | null {
    const row = getDb()
      .prepare("SELECT * FROM vendors WHERE enabled = 1 AND api_key != '' AND kind = 'video' LIMIT 1")
      .get() as Row | undefined;
    return row ? rowToVendor(row) : null;
  },
  update(id: string, patch: Partial<Omit<VendorConfig, "id">>) {
    const fields: string[] = [];
    const values: SQLInputValue[] = [];
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      fields.push(`${key} = ?`);
      if (key === "enabled") {
        values.push(value ? 1 : 0);
      } else if (typeof value === "string" || typeof value === "number" || value === null) {
        values.push(value);
      }
    }
    if (!fields.length) return;
    values.push(id);
    getDb().prepare(`UPDATE vendors SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  }
};

/* === Direkta repos === */

function rowToBeat(row: Row): Beat {
  return {
    id: String(row.id),
    project_id: String(row.project_id),
    n: Number(row.n),
    scene_heading: String(row.scene_heading ?? ""),
    title: String(row.title ?? ""),
    summary: String(row.summary ?? ""),
    characters: row.characters ? JSON.parse(String(row.characters)) : [],
    location_id: row.location_id ? String(row.location_id) : null,
    mood: row.mood ? JSON.parse(String(row.mood)) : [],
    props: row.props ? JSON.parse(String(row.props)) : [],
    notes: String(row.notes ?? ""),
    flag: row.flag ? String(row.flag) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at)
  };
}

export const beats = {
  forProject(projectId: string): Beat[] {
    const rows = getDb()
      .prepare("SELECT * FROM beats WHERE project_id = ? ORDER BY n ASC")
      .all(projectId) as Row[];
    return rows.map(rowToBeat);
  },
  get(id: string): Beat | null {
    const row = getDb().prepare("SELECT * FROM beats WHERE id = ?").get(id) as Row | undefined;
    return row ? rowToBeat(row) : null;
  },
  count(projectId: string): number {
    const row = getDb()
      .prepare("SELECT COUNT(*) AS n FROM beats WHERE project_id = ?")
      .get(projectId) as { n: number };
    return row.n;
  },
  create(input: {
    project_id: string;
    n: number;
    scene_heading?: string;
    title?: string;
    summary?: string;
    characters?: string[];
    location_id?: string | null;
    mood?: string[];
    props?: string[];
    notes?: string;
    flag?: string | null;
  }): Beat {
    const id = nanoid(10);
    getDb()
      .prepare(
        "INSERT INTO beats (id, project_id, n, scene_heading, title, summary, characters, location_id, mood, props, notes, flag) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .run(
        id,
        input.project_id,
        input.n,
        input.scene_heading ?? "",
        input.title ?? "",
        input.summary ?? "",
        JSON.stringify(input.characters ?? []),
        input.location_id ?? null,
        JSON.stringify(input.mood ?? []),
        JSON.stringify(input.props ?? []),
        input.notes ?? "",
        input.flag ?? null
      );
    return this.get(id)!;
  },
  update(id: string, patch: Partial<Omit<Beat, "id" | "project_id" | "created_at" | "updated_at">>) {
    const fields: string[] = [];
    const values: SQLInputValue[] = [];
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      if (key === "characters" || key === "mood" || key === "props") {
        fields.push(`${key} = ?`);
        values.push(JSON.stringify(value));
      } else if (typeof value === "string" || typeof value === "number" || value === null) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    if (!fields.length) return;
    fields.push("updated_at = datetime('now')");
    values.push(id);
    getDb().prepare(`UPDATE beats SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  },
  deleteForProject(projectId: string) {
    getDb().prepare("DELETE FROM beats WHERE project_id = ?").run(projectId);
  }
};

function rowToCharacter(row: Row): Character {
  return {
    id: String(row.id),
    project_id: String(row.project_id),
    name: String(row.name),
    role: (String(row.role ?? "Supporting") as Character["role"]),
    scene_count: Number(row.scene_count ?? 0),
    dialogue: !!row.dialogue,
    brief: row.brief ? (JSON.parse(String(row.brief)) as CharacterBrief) : {},
    soul_id_state: (String(row.soul_id_state ?? "empty") as Character["soul_id_state"]),
    soul_id_progress: Number(row.soul_id_progress ?? 0),
    consistency: row.consistency != null ? Number(row.consistency) : null,
    error: row.error ? String(row.error) : null,
    refs: row.refs ? JSON.parse(String(row.refs)) : [],
    background: String(row.background ?? ""),
    psychology_want: String(row.psychology_want ?? ""),
    psychology_fear: String(row.psychology_fear ?? ""),
    psychology_wound: String(row.psychology_wound ?? ""),
    arc_start: String(row.arc_start ?? ""),
    arc_middle: String(row.arc_middle ?? ""),
    arc_end: String(row.arc_end ?? ""),
    voice: String(row.voice ?? ""),
    key_quote: String(row.key_quote ?? ""),
    wardrobe_direction: String(row.wardrobe_direction ?? ""),
    relationships: row.relationships ? (JSON.parse(String(row.relationships)) as CharacterRelationship[]) : [],
    created_at: String(row.created_at),
    updated_at: String(row.updated_at)
  };
}

export const characters = {
  forProject(projectId: string): Character[] {
    const rows = getDb()
      .prepare("SELECT * FROM characters WHERE project_id = ? ORDER BY name ASC")
      .all(projectId) as Row[];
    return rows.map(rowToCharacter);
  },
  get(id: string): Character | null {
    const row = getDb().prepare("SELECT * FROM characters WHERE id = ?").get(id) as Row | undefined;
    return row ? rowToCharacter(row) : null;
  },
  create(input: {
    project_id: string;
    name: string;
    role?: Character["role"];
    scene_count?: number;
    dialogue?: boolean;
    brief?: CharacterBrief;
  }): Character {
    const id = nanoid(10);
    getDb()
      .prepare(
        "INSERT INTO characters (id, project_id, name, role, scene_count, dialogue, brief) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
      .run(
        id,
        input.project_id,
        input.name,
        input.role ?? "Supporting",
        input.scene_count ?? 0,
        input.dialogue === false ? 0 : 1,
        JSON.stringify(input.brief ?? {})
      );
    return this.get(id)!;
  },
  update(
    id: string,
    patch: Partial<Omit<Character, "id" | "project_id" | "created_at" | "updated_at">>
  ) {
    const fields: string[] = [];
    const values: SQLInputValue[] = [];
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      if (key === "brief" || key === "refs") {
        fields.push(`${key} = ?`);
        values.push(JSON.stringify(value));
      } else if (key === "dialogue") {
        fields.push("dialogue = ?");
        values.push(value ? 1 : 0);
      } else if (typeof value === "string" || typeof value === "number" || value === null) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    if (!fields.length) return;
    fields.push("updated_at = datetime('now')");
    values.push(id);
    getDb().prepare(`UPDATE characters SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  },
  delete(id: string) {
    getDb().prepare("DELETE FROM characters WHERE id = ?").run(id);
  }
};

function rowToLocation(row: Row): Location {
  return {
    id: String(row.id),
    project_id: String(row.project_id),
    name: String(row.name),
    int_ext: (String(row.int_ext ?? "INT") as Location["int_ext"]),
    time_of_day: row.time_of_day ? String(row.time_of_day) : null,
    scene_count: Number(row.scene_count ?? 0),
    soul_id_state: (String(row.soul_id_state ?? "empty") as Location["soul_id_state"]),
    soul_id_progress: Number(row.soul_id_progress ?? 0),
    refs: row.refs ? JSON.parse(String(row.refs)) : [],
    created_at: String(row.created_at),
    updated_at: String(row.updated_at)
  };
}

export const locations = {
  forProject(projectId: string): Location[] {
    const rows = getDb()
      .prepare("SELECT * FROM locations WHERE project_id = ? ORDER BY name ASC")
      .all(projectId) as Row[];
    return rows.map(rowToLocation);
  },
  get(id: string): Location | null {
    const row = getDb().prepare("SELECT * FROM locations WHERE id = ?").get(id) as Row | undefined;
    return row ? rowToLocation(row) : null;
  },
  create(input: {
    project_id: string;
    name: string;
    int_ext?: Location["int_ext"];
    time_of_day?: string | null;
    scene_count?: number;
  }): Location {
    const id = nanoid(10);
    getDb()
      .prepare(
        "INSERT INTO locations (id, project_id, name, int_ext, time_of_day, scene_count) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .run(
        id,
        input.project_id,
        input.name,
        input.int_ext ?? "INT",
        input.time_of_day ?? null,
        input.scene_count ?? 0
      );
    return this.get(id)!;
  },
  update(
    id: string,
    patch: Partial<Omit<Location, "id" | "project_id" | "created_at" | "updated_at">>
  ) {
    const fields: string[] = [];
    const values: SQLInputValue[] = [];
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      if (key === "refs") {
        fields.push("refs = ?");
        values.push(JSON.stringify(value));
      } else if (typeof value === "string" || typeof value === "number" || value === null) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    if (!fields.length) return;
    fields.push("updated_at = datetime('now')");
    values.push(id);
    getDb().prepare(`UPDATE locations SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  },
  delete(id: string) {
    getDb().prepare("DELETE FROM locations WHERE id = ?").run(id);
  }
};

function rowToBible(row: Row): Bible {
  return {
    project_id: String(row.project_id),
    characters_doc: String(row.characters_doc ?? ""),
    world_doc: String(row.world_doc ?? ""),
    tone_doc: String(row.tone_doc ?? ""),
    word_count: Number(row.word_count ?? 0),
    built: !!row.built,
    themes: row.themes ? (JSON.parse(String(row.themes)) as string[]) : [],
    comparable_films: row.comparable_films ? (JSON.parse(String(row.comparable_films)) as ComparableFilm[]) : [],
    what_makes_different: String(row.what_makes_different ?? ""),
    world_rules: String(row.world_rules ?? ""),
    atmosphere: String(row.atmosphere ?? ""),
    visual_palette: row.visual_palette ? (JSON.parse(String(row.visual_palette)) as PaletteSwatch[]) : [],
    cinematography_notes: String(row.cinematography_notes ?? ""),
    lighting_philosophy: String(row.lighting_philosophy ?? ""),
    editorial_rhythm: String(row.editorial_rhythm ?? ""),
    visual_motifs: row.visual_motifs ? (JSON.parse(String(row.visual_motifs)) as string[]) : [],
    production_challenges: String(row.production_challenges ?? ""),
    vfx_requirements: String(row.vfx_requirements ?? ""),
    casting_direction: String(row.casting_direction ?? ""),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at)
  };
}

export const bible = {
  get(projectId: string): Bible | null {
    const row = getDb().prepare("SELECT * FROM bible WHERE project_id = ?").get(projectId) as
      | Row
      | undefined;
    return row ? rowToBible(row) : null;
  },
  ensure(projectId: string): Bible {
    const existing = this.get(projectId);
    if (existing) return existing;
    getDb()
      .prepare(
        "INSERT INTO bible (project_id, characters_doc, world_doc, tone_doc, word_count, built) VALUES (?, '', '', '', 0, 0)"
      )
      .run(projectId);
    return this.get(projectId)!;
  },
  update(
    projectId: string,
    patch: Partial<Omit<Bible, "project_id" | "created_at" | "updated_at">>
  ) {
    this.ensure(projectId);
    const fields: string[] = [];
    const values: SQLInputValue[] = [];
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      if (key === "built") {
        fields.push("built = ?");
        values.push(value ? 1 : 0);
      } else if (typeof value === "string" || typeof value === "number") {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    if (!fields.length) return;
    fields.push("updated_at = datetime('now')");
    values.push(projectId);
    getDb()
      .prepare(`UPDATE bible SET ${fields.join(", ")} WHERE project_id = ?`)
      .run(...values);
  }
};

function rowToActivity(row: Row): ActivityItem {
  return {
    id: String(row.id),
    project_id: String(row.project_id),
    agent: String(row.agent) as ActivityItem["agent"],
    kind: (String(row.kind ?? "info") as ActivityItem["kind"]),
    text: String(row.text),
    created_at: String(row.created_at)
  };
}

export const activity = {
  forProject(projectId: string, limit = 50): ActivityItem[] {
    const rows = getDb()
      .prepare("SELECT * FROM activity WHERE project_id = ? ORDER BY created_at DESC LIMIT ?")
      .all(projectId, limit) as Row[];
    return rows.map(rowToActivity);
  },
  append(input: {
    project_id: string;
    agent: ActivityItem["agent"];
    kind?: ActivityItem["kind"];
    text: string;
  }): ActivityItem {
    const id = nanoid(10);
    getDb()
      .prepare("INSERT INTO activity (id, project_id, agent, kind, text) VALUES (?, ?, ?, ?, ?)")
      .run(id, input.project_id, input.agent, input.kind ?? "info", input.text);
    const row = getDb().prepare("SELECT * FROM activity WHERE id = ?").get(id) as Row;
    return rowToActivity(row);
  }
};

function rowToProposal(row: Row): Proposal {
  return {
    id: String(row.id),
    project_id: String(row.project_id),
    agent: String(row.agent) as Proposal["agent"],
    kind: String(row.kind),
    target_kind: row.target_kind ? String(row.target_kind) : null,
    target_id: row.target_id ? String(row.target_id) : null,
    payload: row.payload ? JSON.parse(String(row.payload)) : {},
    status: (String(row.status ?? "pending") as Proposal["status"]),
    created_at: String(row.created_at),
    resolved_at: row.resolved_at ? String(row.resolved_at) : null
  };
}

export const proposals = {
  pending(projectId: string): Proposal[] {
    const rows = getDb()
      .prepare(
        "SELECT * FROM proposals WHERE project_id = ? AND status = 'pending' ORDER BY created_at DESC"
      )
      .all(projectId) as Row[];
    return rows.map(rowToProposal);
  },
  create(input: {
    project_id: string;
    agent: Proposal["agent"];
    kind: string;
    target_kind?: string;
    target_id?: string;
    payload?: Record<string, unknown>;
  }): Proposal {
    const id = nanoid(10);
    getDb()
      .prepare(
        "INSERT INTO proposals (id, project_id, agent, kind, target_kind, target_id, payload) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
      .run(
        id,
        input.project_id,
        input.agent,
        input.kind,
        input.target_kind ?? null,
        input.target_id ?? null,
        JSON.stringify(input.payload ?? {})
      );
    const row = getDb().prepare("SELECT * FROM proposals WHERE id = ?").get(id) as Row;
    return rowToProposal(row);
  },
  resolve(id: string, status: "approved" | "rejected") {
    getDb()
      .prepare("UPDATE proposals SET status = ?, resolved_at = datetime('now') WHERE id = ?")
      .run(status, id);
  }
};

function rowToClarification(row: Row): Clarification {
  return {
    id: String(row.id),
    project_id: String(row.project_id),
    target_kind: row.target_kind ? String(row.target_kind) : null,
    target_id: row.target_id ? String(row.target_id) : null,
    question: String(row.question),
    options: row.options ? JSON.parse(String(row.options)) : [],
    resolution: row.resolution ? String(row.resolution) : null,
    created_at: String(row.created_at),
    resolved_at: row.resolved_at ? String(row.resolved_at) : null
  };
}

export const clarifications = {
  pending(projectId: string): Clarification[] {
    const rows = getDb()
      .prepare(
        "SELECT * FROM clarifications WHERE project_id = ? AND resolution IS NULL ORDER BY created_at ASC"
      )
      .all(projectId) as Row[];
    return rows.map(rowToClarification);
  },
  create(input: {
    project_id: string;
    target_kind?: string;
    target_id?: string;
    question: string;
    options?: Array<{ value: string; label: string }>;
  }): Clarification {
    const id = nanoid(10);
    getDb()
      .prepare(
        "INSERT INTO clarifications (id, project_id, target_kind, target_id, question, options) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .run(
        id,
        input.project_id,
        input.target_kind ?? null,
        input.target_id ?? null,
        input.question,
        JSON.stringify(input.options ?? [])
      );
    const row = getDb().prepare("SELECT * FROM clarifications WHERE id = ?").get(id) as Row;
    return rowToClarification(row);
  },
  resolve(id: string, resolution: string) {
    getDb()
      .prepare(
        "UPDATE clarifications SET resolution = ?, resolved_at = datetime('now') WHERE id = ?"
      )
      .run(resolution, id);
  }
};

