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

export type MessageRole = "user" | "assistant" | "system" | "tool";

export type AspectRatio = "16:9" | "9:16" | "1:1" | "4:5" | "21:9";

export interface Project {
  id: string;
  title: string;
  premise: string;
  aspect_ratio: AspectRatio;
  created_at: string;
  updated_at: string;
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

export type VendorKind = "text" | "image" | "video";

export type TextProvider = "anthropic" | "openai" | "google" | "deepseek" | "openai-compatible";
export type ImageProvider = "fal" | "openai-image";
export type VideoProvider = "fal-video" | "runway" | "minimax";

export type AssetKind = "image" | "video";

export interface Asset {
  id: string;
  node_id: string;
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
  provider: TextProvider | ImageProvider | VideoProvider;
  model: string;
  api_key: string;
  base_url?: string;
  enabled: boolean;
  kind: VendorKind;
}

export interface SkillFile {
  id: string;
  title: string;
  layer: AgentLayer;
  description: string;
  body: string;
  source: string;
}
