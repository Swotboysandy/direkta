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
    // A file is a "part" skill if it declares kind: part (or a part: id), else a layer skill.
    const kind: "layer" | "part" =
      data.kind === "part" || (!data.layer && data.part) ? "part" : "layer";
    return {
      id,
      title: String(data.title ?? id),
      kind,
      layer: (data.layer as AgentLayer) ?? "execution",
      part: kind === "part" ? String(data.part ?? id) : undefined,
      description: String(data.description ?? ""),
      body: parsed.content.trim(),
      source: path.relative(process.cwd(), file).replace(/\\/g, "/")
    };
  });
  return cache;
}

/** The skill driving one of the 3 agent layers (decision/execution/supervision). */
export function skillFor(layer: AgentLayer): SkillFile | undefined {
  return loadSkills().find((skill) => skill.kind === "layer" && skill.layer === layer);
}

/** The per-part generation skill for an app part (e.g. "cinematography", "casting", "video"). */
export function skillForPart(part: string): SkillFile | undefined {
  return loadSkills().find((skill) => skill.kind === "part" && (skill.part === part || skill.id === part));
}

/** Rewrite a skill's body to its markdown file (frontmatter preserved), then refresh the cache. */
export function saveSkill(id: string, body: string): SkillFile | undefined {
  const skill = loadSkills().find((s) => s.id === id);
  if (!skill) return undefined;
  const file = path.join(process.cwd(), skill.source);
  const parsed = matter(fs.readFileSync(file, "utf8"));
  fs.writeFileSync(file, matter.stringify(`${body.trim()}\n`, parsed.data), "utf8");
  cache = null;
  return loadSkills(true).find((s) => s.id === id);
}
