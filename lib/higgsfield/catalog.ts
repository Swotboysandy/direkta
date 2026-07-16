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
    id: "byteplus_dreamina_seedance_2_0_1080p",
    label: "Dreamina Seedance 2.0 · BytePlus (1080p)",
    description: "Best quality BytePlus tier — draws on your purchased Dreamina token pack (not the free tier).",
    provider: "byteplus",
    costText: "≈245k tok · 5s",
    approxCost: 0,
    params: {},
    byteplus: { model: "dreamina-seedance-2-0-260128", resolution: "1080p" }
  },
  {
    id: "byteplus_dreamina_seedance_2_0_720p",
    label: "Dreamina Seedance 2.0 · BytePlus (720p)",
    description: "Cheaper draft tier on the same purchased Dreamina pack.",
    provider: "byteplus",
    costText: "≈109k tok · 5s",
    approxCost: 0,
    params: {},
    byteplus: { model: "dreamina-seedance-2-0-260128", resolution: "720p" }
  },
  {
    id: "byteplus_seedance_1_5_1080p",
    label: "Seedance 1.5 Pro · BytePlus (1080p)",
    description: "Free-tier BytePlus model. Your free pack is exhausted, so this now bills pay-as-you-go per clip.",
    provider: "byteplus",
    costText: "≈245k tok · 5s",
    approxCost: 0,
    params: {},
    byteplus: { model: "seedance-1-5-pro-251215", resolution: "1080p" }
  },
  {
    id: "byteplus_seedance_1_5_720p",
    label: "Seedance 1.5 Pro · BytePlus (720p)",
    description: "Free-tier BytePlus model, cheaper draft tier. Your free pack is exhausted, so this now bills pay-as-you-go per clip.",
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

// Default is the paid Dreamina Seedance 2.0 pack — the free Seedance 1.5 Pro
// pack is exhausted and now bills pay-as-you-go per clip (verified live via
// BytePlus's own quota alert + console), while the 2.0 pack still has real
// purchased balance sitting unused.
export const DEFAULT_VIDEO_MODEL = "byteplus_dreamina_seedance_2_0_1080p";

export function videoModel(id: string | undefined): VideoModel {
  return VIDEO_MODELS.find((m) => m.id === id) ?? VIDEO_MODELS[0];
}

/**
 * Camera-motion presets for the animate (video) step. Seedance reads the move
 * from the prompt tail and honours `--camerafixed`; a locked-off shot sets
 * cameraFixed true, everything else describes the move. Shared by the Stitch
 * inspector (the picker) and the animate route (the prompt + flag).
 */
export interface CameraMotion {
  id: string;
  label: string;
  /** Sentence folded into the video prompt. Empty = let the model decide. */
  phrase: string;
  cameraFixed: boolean;
}

export const CAMERA_MOTIONS: CameraMotion[] = [
  { id: "auto", label: "Auto (let the model decide)", phrase: "", cameraFixed: false },
  { id: "static", label: "Static / locked-off", phrase: "Locked-off static shot — the camera does not move at all.", cameraFixed: true },
  { id: "push_in", label: "Slow push-in", phrase: "Slow cinematic push-in, the camera dollies gently toward the subject.", cameraFixed: false },
  { id: "pull_out", label: "Pull-out reveal", phrase: "Slow pull-out, the camera dollies back to reveal the wider scene.", cameraFixed: false },
  { id: "pan_left", label: "Pan left", phrase: "The camera pans smoothly to the left.", cameraFixed: false },
  { id: "pan_right", label: "Pan right", phrase: "The camera pans smoothly to the right.", cameraFixed: false },
  { id: "tilt_up", label: "Tilt up", phrase: "The camera tilts upward.", cameraFixed: false },
  { id: "tilt_down", label: "Tilt down", phrase: "The camera tilts downward.", cameraFixed: false },
  { id: "orbit", label: "Orbit around subject", phrase: "The camera arcs in a smooth orbit around the subject.", cameraFixed: false },
  { id: "tracking", label: "Tracking follow", phrase: "A tracking shot that follows the subject's movement.", cameraFixed: false },
  { id: "handheld", label: "Handheld", phrase: "Subtle handheld camera motion for documentary energy.", cameraFixed: false },
  { id: "zoom_in", label: "Zoom in", phrase: "A gradual zoom in on the subject.", cameraFixed: false },
  { id: "crane_up", label: "Crane up", phrase: "A sweeping crane move rising upward over the scene.", cameraFixed: false }
];

export function cameraMotion(id: string | undefined): CameraMotion {
  return CAMERA_MOTIONS.find((m) => m.id === id) ?? CAMERA_MOTIONS[0];
}
