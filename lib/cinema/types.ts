// Shot-level metadata persisted on CanvasNode.meta for nodes of kind "shot".
// All fields optional — a shot can be authored from any subset.

import type { CameraAngle, CameraMove, Lens, Lighting, ShotSize, TimeOfDay } from "./vocabulary";
import type {
  AgeBracket,
  Archetype,
  Build,
  EyeColor,
  HairColor,
  HairStyle,
  SkinTone,
  VoiceQuality,
  WardrobeStyle
} from "./characterVocabulary";

export interface ShotMeta {
  shotSize?: ShotSize;
  cameraAngle?: CameraAngle;
  cameraMove?: CameraMove;
  lens?: Lens;
  lighting?: Lighting;
  timeOfDay?: TimeOfDay;
  emotion?: string[];          // open vocabulary
  ambientSound?: string;       // free text
  soundEffects?: string[];     // open vocabulary
  durationSeconds?: number;    // 1..12
  characterIds?: string[];     // node ids of characters featured
  notes?: string;              // free-form director's notes
}

// Character-level metadata persisted on CanvasNode.meta for nodes of kind "character".
// All fields optional.
export interface CharacterMeta {
  age?: AgeBracket;
  build?: Build;
  skinTone?: SkinTone;
  hairColor?: HairColor;
  hairStyle?: HairStyle;
  eyeColor?: EyeColor;
  wardrobe?: WardrobeStyle;
  wardrobeAccents?: string[];     // open vocabulary
  identifyingMarks?: string[];    // open vocabulary
  voice?: VoiceQuality;
  archetype?: Archetype;
  pronouns?: string;              // free text
  occupation?: string;            // free text
  backstoryBeats?: string;        // free text, short
  anchorImage?: string;           // URL of the pinned anchor image (lives in data/oss)
}

export function readCharacterMeta(meta: Record<string, unknown> | undefined): CharacterMeta {
  if (!meta || typeof meta !== "object") return {};
  const m = meta as Record<string, unknown>;
  const strArray = (key: string) =>
    Array.isArray(m[key]) ? (m[key] as unknown[]).filter((x): x is string => typeof x === "string") : undefined;
  const str = <T extends string>(key: string): T | undefined =>
    typeof m[key] === "string" ? (m[key] as T) : undefined;
  return {
    age: str<AgeBracket>("age"),
    build: str<Build>("build"),
    skinTone: str<SkinTone>("skinTone"),
    hairColor: str<HairColor>("hairColor"),
    hairStyle: str<HairStyle>("hairStyle"),
    eyeColor: str<EyeColor>("eyeColor"),
    wardrobe: str<WardrobeStyle>("wardrobe"),
    wardrobeAccents: strArray("wardrobeAccents"),
    identifyingMarks: strArray("identifyingMarks"),
    voice: str<VoiceQuality>("voice"),
    archetype: str<Archetype>("archetype"),
    pronouns: typeof m.pronouns === "string" ? m.pronouns : undefined,
    occupation: typeof m.occupation === "string" ? m.occupation : undefined,
    backstoryBeats: typeof m.backstoryBeats === "string" ? m.backstoryBeats : undefined,
    anchorImage: typeof m.anchorImage === "string" ? m.anchorImage : undefined
  };
}

export function readShotMeta(meta: Record<string, unknown> | undefined): ShotMeta {
  if (!meta || typeof meta !== "object") return {};
  const m = meta as Record<string, unknown>;
  return {
    shotSize: typeof m.shotSize === "string" ? (m.shotSize as ShotMeta["shotSize"]) : undefined,
    cameraAngle: typeof m.cameraAngle === "string" ? (m.cameraAngle as ShotMeta["cameraAngle"]) : undefined,
    cameraMove: typeof m.cameraMove === "string" ? (m.cameraMove as ShotMeta["cameraMove"]) : undefined,
    lens: typeof m.lens === "string" ? (m.lens as ShotMeta["lens"]) : undefined,
    lighting: typeof m.lighting === "string" ? (m.lighting as ShotMeta["lighting"]) : undefined,
    timeOfDay: typeof m.timeOfDay === "string" ? (m.timeOfDay as ShotMeta["timeOfDay"]) : undefined,
    emotion: Array.isArray(m.emotion) ? (m.emotion as unknown[]).filter((x): x is string => typeof x === "string") : undefined,
    ambientSound: typeof m.ambientSound === "string" ? m.ambientSound : undefined,
    soundEffects: Array.isArray(m.soundEffects) ? (m.soundEffects as unknown[]).filter((x): x is string => typeof x === "string") : undefined,
    durationSeconds: typeof m.durationSeconds === "number" ? m.durationSeconds : undefined,
    characterIds: Array.isArray(m.characterIds) ? (m.characterIds as unknown[]).filter((x): x is string => typeof x === "string") : undefined,
    notes: typeof m.notes === "string" ? m.notes : undefined
  };
}
