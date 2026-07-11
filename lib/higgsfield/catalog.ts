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
  /** Which backend runs it: Higgsfield (your MCP plan) or BytePlus (API key). */
  provider: "higgsfield" | "byteplus";
  /** Human cost shown in the picker (credits for Higgsfield, $ for BytePlus). */
  costText: string;
  /** Approx Higgsfield credits for one ~5s clip — used for the balance check. */
  approxCost: number;
  /** Extra params merged into generate_video (Higgsfield MCP only). */
  params: Record<string, unknown>;
  /** BytePlus model id + resolution (BytePlus only). */
  byteplus?: { model: string; resolution: string };
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
    id: "byteplus_seedance_1_5_1080p",
    label: "Seedance 1.5 Pro · BytePlus (1080p)",
    description: "High quality, image-led. Runs on your BytePlus free tokens / metered API — cheapest at volume.",
    provider: "byteplus",
    costText: "≈245k tok · 5s",
    approxCost: 0,
    params: {},
    byteplus: { model: "seedance-1-5-pro-251215", resolution: "1080p" }
  },
  {
    id: "byteplus_seedance_1_5_720p",
    label: "Seedance 1.5 Pro · BytePlus (720p)",
    description: "Cheaper + faster draft tier on BytePlus. Still near-2.0 quality.",
    provider: "byteplus",
    costText: "≈109k tok · 5s",
    approxCost: 0,
    params: {},
    byteplus: { model: "seedance-1-5-pro-251215", resolution: "720p" }
  },
  {
    id: "seedance_2_0_fast",
    label: "Seedance 2.0 Fast · Higgsfield",
    description: "Identity-consistent image-to-video, 720p, on your Higgsfield plan.",
    provider: "higgsfield",
    costText: "≈17 cr",
    approxCost: 17,
    params: { model: "seedance_2_0", mode: "fast", resolution: "720p", generate_audio: false }
  },
  {
    id: "seedance_2_0_std",
    label: "Seedance 2.0 · Higgsfield",
    description: "Best identity + quality, up to 1080p, on Higgsfield. Costs more.",
    provider: "higgsfield",
    costText: "≈34 cr",
    approxCost: 34,
    params: { model: "seedance_2_0", mode: "std", resolution: "1080p", generate_audio: false }
  },
  {
    id: "kling3_0_turbo",
    label: "Kling 3.0 Turbo · Higgsfield",
    description: "Fast single-frame animation on Higgsfield. Less identity lock.",
    provider: "higgsfield",
    costText: "≈14 cr",
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

export const DEFAULT_VIDEO_MODEL = "byteplus_seedance_1_5_1080p";

export function videoModel(id: string | undefined): VideoModel {
  return VIDEO_MODELS.find((m) => m.id === id) ?? VIDEO_MODELS[0];
}
