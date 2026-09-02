export type NodeKind =
  | "script"
  | "character"
  | "scene"
  | "storyboard"
  | "shot"
  | "music"
  | "render"
  | "note";

export type AgentLayer = "decision" | "execution" | "supervision";

/**
 * The nine Fylmer agents. The 3-layer engine still runs underneath — every named agent
 * is a configured pipeline through Decision / Execution / (optional) Supervision.
 */
export type AgentId =
  | "script-reader"
  | "beat-writer"
  | "bible-builder"
  | "casting-dir"
  | "cinematographer"
  | "continuity"
  | "editor"
  | "video-director"
  | "export-agent";

export type AgentState = "idle" | "working" | "done" | "attention";

export type MessageRole = "user" | "assistant" | "system" | "tool";

export type AspectRatio = "16:9" | "9:16" | "1:1" | "4:5" | "21:9";

export type ProjectFormat =
  | "Short Film"
  | "Music Video"
  | "Ad"
  | "Series"
  | "Feature"
  | "Other";

export type LengthEstimate =
  | "Under 1 min"
  | "Under 5 min"
  | "5–15 min"
  | "15–30 min"
  | "30+ min";

export type WorkspaceId =
  | "dashboard"
  | "screenplay"
  | "casting"
  | "storyboard"
  | "stitch"
  | "library"
  | "export";

export type WorkspaceStatus = "idle" | "in-progress" | "complete" | "locked";

export type BudgetTier = "micro" | "indie" | "mid" | "studio";

export interface Project {
  id: string;
  title: string;
  premise: string;
  logline: string;
  format: ProjectFormat;
  length_estimate: LengthEstimate;
  aspect_ratio: AspectRatio;
  script: string;
  script_submitted: boolean;
  script_ai_generated: boolean;
  /** Creative direction — what this piece IS (tone, story, audience). Feeds
   *  script generation, AI prompts and frame generation. */
  creative_brief: string;
  /** Brand & product placement — e.g. "Kindle Coffee: red-logo cups, barista
   *  aprons, storefront sign". Folded into every frame prompt. */
  brand_kit: string;
  /** Visual style template — e.g. "35mm anamorphic, golden dusk light,
   *  UTKARSH always in an olive overshirt over a blue tee; the car is always a
   *  small white Maruti Swift hatchback". Folded into every image AND video
   *  prompt so look, wardrobe and vehicles can't drift between shots. */
  style_template: string;
  /** Continuity lock — who and what must stay identical across every shot:
   *  character designs, wardrobe, vehicles, palette, world rules, set geography.
   *  Kept separate from style_template because the medium and the cast are
   *  different kinds of constraint (Higgsfield's own reference projects split
   *  them the same way: STYLE LOCK / CONTINUITY / DIRECTION / SHOT). */
  continuity_lock: string;
  /** Set lock — the geography of each recurring space and a hard instruction not to
   *  invent beyond it. Reference projects report room drift as the worst offender:
   *  the model widens rooms and adds furniture it was never shown. */
  set_lock: string;
  /** Avoid-instructions — explicit negatives appended to every prompt, e.g.
   *  "not painterly, not 3D, no photobash, no CGI smoothness, no extra furniture". */
  avoid_prompt: string;
  /* Movie Bible — title page + synopsis + production meta */
  genre: string;
  tagline: string;
  director_name: string;
  draft_version: string;
  short_synopsis: string;
  full_synopsis: string;
  time_period: string;
  budget_tier: BudgetTier;
  created_at: string;
  updated_at: string;
}

export interface ComparableFilm {
  title: string;
  note: string;
}

export interface PaletteSwatch {
  hex: string;
  name: string;
}

export interface CharacterRelationship {
  with: string;
  type: string;
}

export interface CanvasNode {
  id: string;
  project_id: string;
  kind: NodeKind;
  title: string;
  body: string;
  x: number;
  y: number;
  width: number;
  height: number;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CanvasEdge {
  id: string;
  project_id: string;
  source: string;
  target: string;
  label: string | null;
}

export interface Message {
  id: string;
  project_id: string;
  role: MessageRole;
  layer: AgentLayer | null;
  content: string;
  created_at: string;
}

export type VendorKind = "text" | "image" | "video" | "lipsync";

export type TextProvider = "anthropic" | "openai" | "google" | "deepseek" | "openai-compatible";
export type ImageProvider = "fal" | "openai-image" | "higgsfield" | "byteplus-image";
export type VideoProvider = "fal-video" | "runway" | "minimax" | "higgsfield-video" | "byteplus-video";
export type LipsyncProvider = "sync-lipsync";

export type AssetKind = "image" | "video";

export interface Asset {
  id: string;
  node_id: string | null;
  target_kind: string;
  target_id: string | null;
  kind: AssetKind;
  url: string;
  prompt: string;
  vendor_id: string | null;
  meta: Record<string, unknown>;
  created_at: string;
}

export interface VendorConfig {
  id: string;
  label: string;
  provider: TextProvider | ImageProvider | VideoProvider | LipsyncProvider;
  model: string;
  api_key: string;
  base_url?: string;
  enabled: boolean;
  kind: VendorKind;
}

export interface SkillFile {
  id: string;
  title: string;
  /** "layer" = one of the 3 agent layers; "part" = a per-workspace generation skill. */
  kind: "layer" | "part";
  layer: AgentLayer;
  /** For part skills: which app part it drives (e.g. "cinematography", "casting", "video"). */
  part?: string;
  description: string;
  body: string;
  source: string;
}

/* === Fylmer entities === */

export interface Beat {
  id: string;
  project_id: string;
  n: number;
  scene_heading: string;
  title: string;
  summary: string;
  characters: string[];
  location_id: string | null;
  mood: string[];
  props: string[];
  notes: string;
  /** Director's shot direction for this beat — shot size/angle, camera move,
   *  lighting, sound and the continuity that carries in from the previous
   *  scene. Written by the script "Direct it" pass, then folded into both the
   *  frame prompt and the animate prompt so the beat renders as directed. */
  direction: string;
  flag: string | null;
  created_at: string;
  updated_at: string;
}

export type SoulIdState = "empty" | "training" | "trained" | "failed";

export interface CharacterBrief {
  age?: string;
  ethnicity?: string;
  build?: string;
  features?: string;
  wardrobe?: string;
  personality?: string;
  register?: string;
  /** Governs portrait generation and cast identity-lock: "human" is the
   *  default assumption everywhere else in the app; the other three opt a
   *  character out of a photographic person-portrait entirely. */
  physical_form?: "human" | "creature" | "colossus" | "abstract";
}

export interface Character {
  id: string;
  project_id: string;
  name: string;
  role: "Lead" | "Supporting" | "Featured" | "Background";
  scene_count: number;
  dialogue: boolean;
  brief: CharacterBrief;
  soul_id_state: SoulIdState;
  soul_id_progress: number;
  consistency: number | null;
  error: string | null;
  refs: string[];
  /* Movie Bible — character spread */
  background: string;
  psychology_want: string;
  psychology_fear: string;
  psychology_wound: string;
  arc_start: string;
  arc_middle: string;
  arc_end: string;
  voice: string;
  key_quote: string;
  wardrobe_direction: string;
  relationships: CharacterRelationship[];
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  project_id: string;
  name: string;
  int_ext: "INT" | "EXT" | "INT/EXT" | "ABSTRACT";
  time_of_day: string | null;
  scene_count: number;
  soul_id_state: SoulIdState;
  soul_id_progress: number;
  refs: string[];
  created_at: string;
  updated_at: string;
}

export interface Prop {
  id: string;
  project_id: string;
  name: string;
  description: string;
  scene_count: number;
  soul_id_state: SoulIdState;
  soul_id_progress: number;
  refs: string[];
  created_at: string;
  updated_at: string;
}

export interface Bible {
  project_id: string;
  characters_doc: string;
  world_doc: string;
  tone_doc: string;
  word_count: number;
  built: boolean;
  /* Movie Bible — tone & themes */
  themes: string[];
  comparable_films: ComparableFilm[];
  what_makes_different: string;
  /* Movie Bible — world */
  world_rules: string;
  atmosphere: string;
  /* Movie Bible — visual language */
  visual_palette: PaletteSwatch[];
  cinematography_notes: string;
  lighting_philosophy: string;
  editorial_rhythm: string;
  visual_motifs: string[];
  /* Movie Bible — production notes */
  production_challenges: string;
  vfx_requirements: string;
  casting_direction: string;
  created_at: string;
  updated_at: string;
}

export type StoryboardState = "waiting" | "generating" | "complete" | "error";

export interface StoryboardRow {
  beat_id: string;
  state: StoryboardState;
  selected_variant_id: string | null;
  style: Record<string, unknown>;
  updated_at: string;
}

export interface StoryboardVariant {
  id: string;
  beat_id: string;
  n: number;
  asset_id: string | null;
  prompt: string;
  state: StoryboardState;
  created_at: string;
}

export interface StitchNode {
  id: string;
  project_id: string;
  beat_id: string | null;
  x: number;
  y: number;
  duration: number;
  /** Seconds into the generated clip where the kept window starts — lets a
   *  short beat pick which few seconds of a longer clip to keep. */
  trim_start: number;
  /** Uploaded dialogue/voice track this shot's lip sync runs against. */
  dialogue_audio_url: string | null;
  /** Lip-synced output — a sibling to clip_asset_id, not a replacement, so the
   *  pre-lipsync clip stays recoverable. */
  lipsync_asset_id: string | null;
  lipsync_state: "none" | "generating" | "complete" | "error";
  created_at: string;
}

export type TransitionStyle = "cut" | "dissolve" | "push" | "whip" | "match";
export type TransitionState = "pending" | "generating" | "complete" | "error";

export interface Transition {
  id: string;
  project_id: string;
  from_node_id: string;
  to_node_id: string;
  style: TransitionStyle;
  state: TransitionState;
  clip_asset_id: string | null;
  duration: number;
}

export type ProposalStatus = "pending" | "approved" | "rejected";

export interface Proposal {
  id: string;
  project_id: string;
  agent: AgentId;
  kind: string;
  target_kind: string | null;
  target_id: string | null;
  payload: Record<string, unknown>;
  status: ProposalStatus;
  created_at: string;
  resolved_at: string | null;
}

export interface Clarification {
  id: string;
  project_id: string;
  target_kind: string | null;
  target_id: string | null;
  question: string;
  options: Array<{ value: string; label: string }>;
  resolution: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface ActivityItem {
  id: string;
  project_id: string;
  agent: AgentId | "producer";
  kind: "info" | "success" | "error" | "warning";
  text: string;
  created_at: string;
}

export interface Snippet {
  id: string;
  project_id: string;
  kind: "tone" | "world" | "format" | "character_rule";
  title: string;
  body: string;
  use_count: number;
  created_at: string;
}

export interface AgentStatus {
  id: AgentId;
  name: string;
  state: AgentState;
}

export interface WorkspaceMeta {
  id: WorkspaceId;
  label: string;
  status: WorkspaceStatus;
  unlocked: boolean;
  note?: string;
  lockReason?: string;
}
