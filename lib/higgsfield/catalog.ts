/**
 * Catalog of Higgsfield generation models available via the consumer MCP, with
 * the params Direkta sends and an approximate credit cost so the UI can show a
 * preflight ("≈ N credits") before spending. Costs are measured ballparks from
 * the MCP get_cost preflight for the default settings below — they vary a little
 * with duration/resolution, hence "approx".
 */

export interface VideoModel {
  id: string;
  label: string;
  description: string;
  /** Approx credits for one ~5s clip at the default params. */
  approxCost: number;
  /** Extra params merged into generate_video for this model. */
  params: Record<string, unknown>;
}

export interface ImageModel {
  id: string;
  label: string;
  description: string;
  /** Approx credits per image. */
  approxCost: number;
  params: Record<string, unknown>;
}

export const VIDEO_MODELS: VideoModel[] = [
  {
    id: "seedance_2_0_fast",
    label: "Seedance 2.0 Fast",
    description: "Identity-consistent image-to-video, 720p. Cheapest. Default.",
    approxCost: 17,
    params: { model: "seedance_2_0", mode: "fast", resolution: "720p", generate_audio: false }
  },
  {
    id: "seedance_2_0_std",
    label: "Seedance 2.0",
    description: "Best identity + quality, up to 1080p. Costs more.",
    approxCost: 34,
    params: { model: "seedance_2_0", mode: "std", resolution: "1080p", generate_audio: false }
  },
  {
    id: "kling3_0_turbo",
    label: "Kling 3.0 Turbo",
    description: "Fast single-frame animation. Less identity lock than Seedance.",
    approxCost: 14,
    params: { model: "kling3_0_turbo", resolution: "720p" }
  }
];

export const IMAGE_MODELS: ImageModel[] = [
  {
    id: "cinematic_studio_2_5",
    label: "Cinematic Studio 2.5",
    description: "Default storyboard frame model — filmic, fast.",
    approxCost: 2,
    params: { model: "cinematic_studio_2_5", resolution: "1k" }
  },
  {
    id: "nano_banana_pro",
    label: "Nano Banana Pro",
    description: "Sharp 4K-capable, excellent in-frame text.",
    approxCost: 6,
    params: { model: "nano_banana_pro" }
  }
];

export const DEFAULT_VIDEO_MODEL = "seedance_2_0_fast";

export function videoModel(id: string | undefined): VideoModel {
  return VIDEO_MODELS.find((m) => m.id === id) ?? VIDEO_MODELS[0];
}
