// Cinema vocabulary — the words a director uses, indexed for the UI.
// Used by the director-inspector chip selectors and the prompt builder.
// Inspired by moyin-creator's director panel but freshly authored.

export interface VocabularyOption<V extends string = string> {
  value: V;
  label: string;
  prompt: string; // text appended to the model prompt when this option is picked
  hint?: string;
}

export type ShotSize =
  | "ECU"
  | "CU"
  | "MCU"
  | "MS"
  | "MWS"
  | "WS"
  | "EWS";

export const SHOT_SIZES: VocabularyOption<ShotSize>[] = [
  { value: "ECU", label: "Extreme close-up", prompt: "extreme close-up, eyes filling the frame", hint: "isolated facial detail" },
  { value: "CU", label: "Close-up", prompt: "close-up, head and shoulders, intimate framing", hint: "face and emotion" },
  { value: "MCU", label: "Medium close-up", prompt: "medium close-up, chest up", hint: "head and chest" },
  { value: "MS", label: "Medium shot", prompt: "medium shot, waist up, balanced composition", hint: "subject and a hint of setting" },
  { value: "MWS", label: "Medium wide", prompt: "medium wide shot, knees up, environment visible", hint: "subject within space" },
  { value: "WS", label: "Wide shot", prompt: "wide shot, full body, environment dominant", hint: "subject in scene" },
  { value: "EWS", label: "Extreme wide", prompt: "extreme wide shot, vast establishing landscape, tiny subject", hint: "scale and place" }
];

export type CameraAngle =
  | "eye"
  | "low"
  | "high"
  | "dutch"
  | "ots"
  | "pov"
  | "birds_eye"
  | "worms_eye";

export const CAMERA_ANGLES: VocabularyOption<CameraAngle>[] = [
  { value: "eye", label: "Eye level", prompt: "eye-level angle, neutral perspective" },
  { value: "low", label: "Low angle", prompt: "low angle looking up, subject feels powerful or imposing" },
  { value: "high", label: "High angle", prompt: "high angle looking down, subject feels vulnerable or small" },
  { value: "dutch", label: "Dutch tilt", prompt: "Dutch tilt, canted horizon, off-balance tension" },
  { value: "ots", label: "Over-the-shoulder", prompt: "over-the-shoulder framing, conversational coverage" },
  { value: "pov", label: "Point-of-view", prompt: "point-of-view shot, first-person perspective" },
  { value: "birds_eye", label: "Bird's eye", prompt: "bird's-eye top-down view, god's-eye perspective" },
  { value: "worms_eye", label: "Worm's eye", prompt: "worm's-eye view, looking straight up from the ground" }
];

export type CameraMove =
  | "static"
  | "pan"
  | "tilt"
  | "dolly_in"
  | "dolly_out"
  | "tracking"
  | "crane"
  | "handheld"
  | "steadicam"
  | "whip_pan"
  | "zoom_in"
  | "zoom_out";

export const CAMERA_MOVES: VocabularyOption<CameraMove>[] = [
  { value: "static", label: "Locked off", prompt: "locked-off static camera" },
  { value: "pan", label: "Pan", prompt: "smooth horizontal pan" },
  { value: "tilt", label: "Tilt", prompt: "vertical tilt" },
  { value: "dolly_in", label: "Dolly in", prompt: "dolly push-in, slow forward movement" },
  { value: "dolly_out", label: "Dolly out", prompt: "dolly pull-out, slow backward reveal" },
  { value: "tracking", label: "Tracking", prompt: "tracking shot following the subject" },
  { value: "crane", label: "Crane", prompt: "crane movement, vertical rise or descent" },
  { value: "handheld", label: "Handheld", prompt: "handheld camera, subtle organic motion" },
  { value: "steadicam", label: "Steadicam", prompt: "fluid steadicam motion" },
  { value: "whip_pan", label: "Whip pan", prompt: "fast whip-pan transition" },
  { value: "zoom_in", label: "Zoom in", prompt: "optical zoom-in compressing space" },
  { value: "zoom_out", label: "Zoom out", prompt: "optical zoom-out revealing context" }
];

export type Lens =
  | "ultrawide_14"
  | "wide_24"
  | "normal_35"
  | "normal_50"
  | "portrait_85"
  | "tele_135"
  | "macro"
  | "anamorphic";

export const LENSES: VocabularyOption<Lens>[] = [
  { value: "ultrawide_14", label: "14mm ultrawide", prompt: "14mm ultrawide lens, exaggerated perspective" },
  { value: "wide_24", label: "24mm wide", prompt: "24mm wide-angle, environmental context" },
  { value: "normal_35", label: "35mm", prompt: "35mm lens, natural human field of view" },
  { value: "normal_50", label: "50mm", prompt: "50mm prime, natural compression" },
  { value: "portrait_85", label: "85mm portrait", prompt: "85mm portrait lens, creamy bokeh, separation from background" },
  { value: "tele_135", label: "135mm telephoto", prompt: "135mm telephoto, compressed background" },
  { value: "macro", label: "Macro", prompt: "macro lens, extreme close detail" },
  { value: "anamorphic", label: "Anamorphic 2x", prompt: "anamorphic 2x lens, oval bokeh, horizontal flares, cinematic widescreen" }
];

export type Lighting =
  | "natural"
  | "golden_hour"
  | "blue_hour"
  | "high_key"
  | "low_key"
  | "noir"
  | "neon"
  | "candlelight"
  | "moonlight"
  | "practical"
  | "overcast"
  | "harsh_sun";

export const LIGHTINGS: VocabularyOption<Lighting>[] = [
  { value: "natural", label: "Natural", prompt: "naturalistic motivated lighting" },
  { value: "golden_hour", label: "Golden hour", prompt: "golden-hour sunlight, warm rim light, long shadows" },
  { value: "blue_hour", label: "Blue hour", prompt: "blue-hour twilight, cool ambient" },
  { value: "high_key", label: "High key", prompt: "high-key lighting, even bright illumination, minimal shadow" },
  { value: "low_key", label: "Low key", prompt: "low-key lighting, deep shadows, single key" },
  { value: "noir", label: "Noir", prompt: "film-noir lighting, hard chiaroscuro, venetian-blind shadows" },
  { value: "neon", label: "Neon", prompt: "neon-lit, saturated pink-cyan, urban night" },
  { value: "candlelight", label: "Candlelight", prompt: "candlelit, warm flicker, soft falloff" },
  { value: "moonlight", label: "Moonlight", prompt: "moonlit, cool monochrome, soft directional" },
  { value: "practical", label: "Practicals", prompt: "lit by practical fixtures in the scene" },
  { value: "overcast", label: "Overcast", prompt: "diffuse overcast daylight, soft shadows" },
  { value: "harsh_sun", label: "Harsh sun", prompt: "harsh direct sun, hot highlights, hard shadows" }
];

export type TimeOfDay =
  | "dawn"
  | "morning"
  | "midday"
  | "afternoon"
  | "dusk"
  | "night"
  | "midnight";

export const TIMES_OF_DAY: VocabularyOption<TimeOfDay>[] = [
  { value: "dawn", label: "Dawn", prompt: "dawn light, first sun" },
  { value: "morning", label: "Morning", prompt: "morning daylight" },
  { value: "midday", label: "Midday", prompt: "midday sun, high contrast" },
  { value: "afternoon", label: "Afternoon", prompt: "late afternoon, warming sky" },
  { value: "dusk", label: "Dusk", prompt: "dusk, sun below horizon, residual glow" },
  { value: "night", label: "Night", prompt: "night, ambient city or moon light" },
  { value: "midnight", label: "Midnight", prompt: "deep night, minimal ambient" }
];

// Emotion tags — open-vocabulary suggestions; user can pick multiple
export const EMOTION_TAGS: string[] = [
  "tense", "tender", "fearful", "hopeful", "elated", "grieving", "longing",
  "furious", "calm", "uneasy", "playful", "wistful", "defiant", "intimate",
  "lonely", "triumphant", "anxious", "resigned", "awestruck", "vengeful"
];

// Sound effect category tags
export const SFX_TAGS: string[] = [
  "footsteps", "door slam", "rain", "wind", "thunder", "glass break",
  "engine", "tires screech", "gunshot", "explosion", "knock", "phone ring",
  "heartbeat", "whisper", "breath", "crowd murmur", "applause", "clock tick",
  "creak", "splash", "fire crackle", "metal clang"
];

// Ambient bed suggestions
export const AMBIENT_SUGGESTIONS: string[] = [
  "rain on a tin roof",
  "distant traffic hum",
  "wind through pines",
  "kitchen fluorescent buzz",
  "subway rumble",
  "ocean waves",
  "forest crickets",
  "office HVAC hum",
  "café chatter",
  "warehouse drone",
  "stadium crowd",
  "elevator silence"
];

// Helper: resolve an option to its prompt fragment
export function vocabPrompt<V extends string>(options: VocabularyOption<V>[], value: V | undefined): string | null {
  if (!value) return null;
  const found = options.find((option) => option.value === value);
  return found ? found.prompt : null;
}
