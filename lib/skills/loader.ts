import fg from "fast-glob";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { AgentLayer, SkillFile } from "../types";

const SKILLS_DIR = path.join(process.cwd(), "data", "skills");

let cache: SkillFile[] | null = null;

export function loadSkills(force = false): SkillFile[] {
  if (cache && !force) return cache;
  if (!fs.existsSync(SKILLS_DIR)) {
    cache = [];
    return cache;
  }
  const files = fg.sync("**/*.md", { cwd: SKILLS_DIR, absolute: true });
  cache = files.map((file) => {
    const raw = fs.readFileSync(file, "utf8");
    const parsed = matter(raw);
    const data = parsed.data as Record<string, unknown>;
    const id = String(data.id ?? path.basename(file, ".md"));
    return {
      id,
      title: String(data.title ?? id),
      layer: (data.layer as AgentLayer) ?? "execution",
      description: String(data.description ?? ""),
      body: parsed.content.trim(),
      source: path.relative(process.cwd(), file).replace(/\\/g, "/")
    };
  });
  return cache;
}

export function skillFor(layer: AgentLayer): SkillFile | undefined {
  return loadSkills().find((skill) => skill.layer === layer);
}
