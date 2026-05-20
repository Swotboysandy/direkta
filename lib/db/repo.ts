import { nanoid } from "nanoid";
import type { SQLInputValue } from "node:sqlite";
import { getDb } from "./client";
import type {
  Asset,
  AssetKind,
  CanvasEdge,
  CanvasNode,
  Message,
  NodeKind,
  Project,
  VendorConfig
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
    premise: String(row.premise),
    aspect_ratio: (String(row.aspect_ratio ?? "16:9") as Project["aspect_ratio"]),
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
    node_id: String(row.node_id),
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
  create(title: string, premise: string, aspect_ratio: Project["aspect_ratio"] = "16:9"): Project {
    const id = nanoid(10);
    getDb()
      .prepare("INSERT INTO projects (id, title, premise, aspect_ratio) VALUES (?, ?, ?, ?)")
      .run(id, title, premise, aspect_ratio);
    return this.get(id)!;
  },
  update(id: string, patch: Partial<Pick<Project, "title" | "premise" | "aspect_ratio">>) {
    const fields: string[] = [];
    const values: SQLInputValue[] = [];
    if (patch.title !== undefined) {
      fields.push("title = ?");
      values.push(patch.title);
    }
    if (patch.premise !== undefined) {
      fields.push("premise = ?");
      values.push(patch.premise);
    }
    if (patch.aspect_ratio !== undefined) {
      fields.push("aspect_ratio = ?");
      values.push(patch.aspect_ratio);
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
