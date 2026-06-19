// Import a screenplay breakdown into Direkta.
//
// In the in-house model the *parsing* happens in the Claude chat session (the Screenplay Agent
// rule file); this function is the pure persistence side the Direkta MCP server exposes as the
// `import_breakdown` tool. No LLM call — it takes the structured breakdown Claude produced and
// writes it across the existing tables (projects, bible, characters, locations, beats) plus
// routes gaps to clarifications (propose-don't-commit).

import {
  activity,
  beats,
  bible,
  characters,
  clarifications,
  locations,
  projects
} from "../../db/repo";
import type { Breakdown } from "./schema";

export interface ImportResult {
  beats: number;
  characters: number;
  locations: number;
  gaps: number;
  logline: string;
}

const norm = (s: string) => s.trim().toLowerCase();

/** Persist a Claude-produced breakdown into the project. Replaces any prior breakdown. */
export function importBreakdown(projectId: string, out: Breakdown): ImportResult {
  const project = projects.get(projectId);
  if (!project) throw new Error(`Project not found: ${projectId}`);

  // --- Characters (dedupe by name; persist the full spread + identity descriptor) ---
  const charByName = new Map<string, string>();
  for (const c of characters.forProject(projectId)) charByName.set(norm(c.name), c.id);
  for (const c of out.characters ?? []) {
    if (!c.name?.trim() || charByName.has(norm(c.name))) continue;
    const created = characters.create({ project_id: projectId, name: c.name.trim(), role: c.role });
    characters.update(created.id, {
      identity_descriptor: c.identity_descriptor ?? "",
      background: c.background ?? "",
      psychology_want: c.psychology_want ?? "",
      psychology_fear: c.psychology_fear ?? "",
      psychology_wound: c.psychology_wound ?? "",
      arc_start: c.arc_start ?? "",
      arc_middle: c.arc_middle ?? "",
      arc_end: c.arc_end ?? "",
      voice: c.voice ?? "",
      key_quote: c.key_quote ?? "",
      wardrobe_direction: c.wardrobe_direction ?? ""
    });
    charByName.set(norm(c.name), created.id);
  }

  // --- Locations (dedupe by name) ---
  const locByName = new Map<string, string>();
  for (const l of locations.forProject(projectId)) locByName.set(norm(l.name), l.id);
  for (const l of out.locations ?? []) {
    if (!l.name?.trim() || locByName.has(norm(l.name))) continue;
    const created = locations.create({
      project_id: projectId,
      name: l.name.trim(),
      int_ext: l.int_ext,
      time_of_day: l.time_of_day ?? null
    });
    locByName.set(norm(l.name), created.id);
  }

  // --- Beats (replace prior breakdown for a clean re-import) ---
  beats.deleteForProject(projectId);
  out.beats?.forEach((b, i) => {
    beats.create({
      project_id: projectId,
      n: i + 1,
      scene_heading: b.scene_heading ?? "",
      title: b.title ?? "",
      summary: b.summary ?? "",
      characters: b.characters ?? [],
      location_id: b.location ? locByName.get(norm(b.location)) ?? null : null,
      mood: b.mood ?? [],
      props: b.props ?? [],
      notes: b.continuity_flag ?? "",
      flag: b.continuity_flag ? "continuity" : null
    });
  });

  // --- Bible (the contract for the Cinematographer) ---
  const charactersDoc = (out.characters ?? [])
    .map((c) => `${c.name} (${c.role}) — ${c.identity_descriptor}\n${c.background}`)
    .join("\n\n");
  const worldDoc = [
    out.atmosphere ?? "",
    (out.locations ?? [])
      .map((l) => `${l.int_ext}. ${l.name}${l.time_of_day ? ` — ${l.time_of_day}` : ""}`)
      .join("\n")
  ]
    .filter(Boolean)
    .join("\n\n");
  bible.update(projectId, {
    tone_doc: out.tone ?? "",
    characters_doc: charactersDoc,
    world_doc: worldDoc,
    themes: out.themes ?? [],
    comparable_films: out.comparable_films ?? [],
    what_makes_different: out.what_makes_different ?? "",
    world_rules: out.world_rules ?? "",
    atmosphere: out.atmosphere ?? "",
    visual_palette: out.visual_palette ?? [],
    cinematography_notes: out.cinematography_notes ?? "",
    lighting_philosophy: out.lighting_philosophy ?? "",
    editorial_rhythm: out.editorial_rhythm ?? "",
    visual_motifs: out.visual_motifs ?? [],
    casting_direction: out.casting_direction ?? "",
    word_count: (project.script ?? "").split(/\s+/).filter(Boolean).length,
    built: true
  });

  // --- Project-level Bible fields ---
  projects.update(projectId, {
    logline: out.logline?.trim() || project.logline,
    tagline: out.tagline ?? "",
    genre: out.genre ?? "",
    time_period: out.time_period ?? "",
    short_synopsis: out.short_synopsis ?? "",
    full_synopsis: out.full_synopsis ?? "",
    script_submitted: true
  });

  // --- Gaps → director clarifications (propose-don't-commit) ---
  const gaps = out.gaps ?? [];
  for (const g of gaps) {
    if (!g.question?.trim()) continue;
    clarifications.create({
      project_id: projectId,
      question: `${g.question}${g.why ? ` — ${g.why}` : ""}${g.recommended ? ` (recommended: ${g.recommended})` : ""}`,
      options: (g.options ?? []).map((o) => ({ value: o, label: o }))
    });
  }

  const result: ImportResult = {
    beats: out.beats?.length ?? 0,
    characters: charByName.size,
    locations: locByName.size,
    gaps: gaps.length,
    logline: out.logline?.trim() ?? ""
  };
  activity.append({
    project_id: projectId,
    agent: "script-reader",
    kind: "success",
    text: `Bible imported — ${result.beats} beats, ${result.characters} characters, ${result.locations} locations${result.gaps ? `, ${result.gaps} gaps to resolve` : ""}.`
  });
  return result;
}
