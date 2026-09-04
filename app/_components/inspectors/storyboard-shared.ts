"use client";

import { useSyncExternalStore } from "react";
import type { AspectRatio, Beat } from "../../../lib/types";

/**
 * What the Storyboard workspace and its frame inspector share.
 *
 * The inspector is mounted by the shell, outside the workspace tree, so React
 * context cannot reach it. The workspace publishes a small API object here on
 * every render and the inspector subscribes; when the workspace unmounts it
 * publishes null and the inspector says so instead of acting on stale data.
 */

export interface StoryboardRow {
  beat_id: string;
  state: "waiting" | "generating" | "complete" | "error";
  selected_variant_id: string | null;
  style: BeatStyle;
}

export interface StoryboardVariant {
  id: string;
  beat_id: string;
  n: number;
  prompt: string;
  state: string;
  asset_id: string | null;
  asset_url: string | null;
  approval: string;
  note: string;
}

export interface BeatStyle {
  visual?: string;
  aspect?: AspectRatio;
  light?: string;
  temp?: string;
  camera?: string;
  prompt_override?: string;
  camera_angle?: string;
  lens?: string;
  movement?: string;
  shot_size?: string;
  aperture?: string;
  camera_body?: string;
  /** Cast members explicitly placed in this frame (reference-locked). */
  cast_override?: string[];
}

export interface GlobalStyle {
  visual: string;
  aspect: AspectRatio;
  light: string;
  temp: string;
  camera: string;
}

export interface CastMember {
  name: string;
  hasLook: boolean;
  portrait: string | null;
}

export interface WorldPlace {
  id: string;
  name: string;
  plate: string | null;
}

export const VISUAL_OPTIONS = ["Naturalistic", "Noir", "High contrast", "Documentary", "Stylised", "Hyperreal"];
export const ASPECT_OPTIONS: AspectRatio[] = ["16:9", "9:16", "1:1", "4:5", "21:9"];
export const LIGHT_OPTIONS = ["Natural", "Golden hour", "Overcast", "Hard shadows", "Low key", "High key", "Dawn", "Dusk"];
export const TEMP_OPTIONS = ["Cool", "Neutral", "Warm"];
export const CAMERA_OPTIONS = ["Wide", "Medium", "Close", "Extreme close", "Mixed"];
export const SHOT_SIZE_OPTIONS = ["Wide", "Medium", "Close", "Extreme close", "Two-shot", "Over-shoulder", "Insert", "Establishing"];
export const LENS_OPTIONS = ["24mm", "35mm", "50mm", "85mm", "135mm"];
export const MOVEMENT_OPTIONS = ["Locked", "Pan", "Tilt", "Dolly", "Handheld", "Push in", "Pull out", "Whip"];
export const ANGLE_OPTIONS = ["Eye level", "Low", "High", "Dutch", "Bird's eye", "Worm's eye"];
export const APERTURE_OPTIONS = ["f/1.4 (shallow DoF)", "f/2.8", "f/4 (balanced)", "f/8", "f/11 (deep focus)"];
export const CAMERA_BODY_OPTIONS = ["Digital cine 8K", "Full-frame cine digital", "70mm film", "16mm film", "Anamorphic", "Vintage prime"];

/** Measured Seedream cost per frame (mirrors TOKEN_COSTS.image in lib/usage,
 *  which cannot be imported client-side because it opens the database). */
export const IMAGE_TOKENS = 14_400;

/**
 * Shot presets (brief §28). Each populates shot size, angle and lens — and a
 * movement where the preset implies one — and every field stays editable
 * afterwards. Values come from the option lists above so the selects agree.
 */
export interface ShotPreset {
  id: string;
  label: string;
  hint: string;
  style: Pick<BeatStyle, "shot_size" | "camera_angle" | "lens" | "movement">;
}

export const SHOT_PRESETS: ShotPreset[] = [
  { id: "ECU", label: "ECU", hint: "Extreme close-up", style: { shot_size: "Extreme close", camera_angle: "Eye level", lens: "85mm" } },
  { id: "CU", label: "CU", hint: "Close-up", style: { shot_size: "Close", camera_angle: "Eye level", lens: "85mm" } },
  { id: "MCU", label: "MCU", hint: "Medium close-up", style: { shot_size: "Close", camera_angle: "Eye level", lens: "50mm" } },
  { id: "MS", label: "MS", hint: "Medium shot", style: { shot_size: "Medium", camera_angle: "Eye level", lens: "50mm" } },
  { id: "MLS", label: "MLS", hint: "Medium long shot", style: { shot_size: "Medium", camera_angle: "Eye level", lens: "35mm" } },
  { id: "WS", label: "WS", hint: "Wide shot", style: { shot_size: "Wide", camera_angle: "Eye level", lens: "24mm" } },
  { id: "EWS", label: "EWS", hint: "Extreme wide, establishing", style: { shot_size: "Establishing", camera_angle: "High", lens: "24mm" } },
  { id: "OTS", label: "OTS", hint: "Over the shoulder", style: { shot_size: "Over-shoulder", camera_angle: "Eye level", lens: "50mm" } },
  { id: "POV", label: "POV", hint: "Point of view, handheld", style: { shot_size: "Medium", camera_angle: "Eye level", lens: "35mm", movement: "Handheld" } }
];

/** The 3×3 framing frame: columns are shot size, rows are angle. */
export const FRAMING_SHOTS = ["Wide", "Medium", "Close"] as const;
export const FRAMING_ANGLES = ["High", "Eye level", "Low"] as const;

export function defaultPromptFor(beat: Beat, beatStyle: BeatStyle, globalStyle: GlobalStyle): string {
  const visual = beatStyle.visual ?? globalStyle.visual;
  const light = beatStyle.light ?? globalStyle.light;
  const temp = beatStyle.temp ?? globalStyle.temp;
  const aspect = beatStyle.aspect ?? globalStyle.aspect;
  const shot = beatStyle.shot_size ?? "Wide";
  const angle = beatStyle.camera_angle ?? "Eye level";
  const lens = beatStyle.lens ?? "35mm";
  const movement = beatStyle.movement ?? "Locked";
  const aperture = beatStyle.aperture ?? "f/4 (balanced)";
  const cameraBody = beatStyle.camera_body ?? "Full-frame cine digital";
  // Script cast ∪ hand-picked cast — everyone named here gets reference-locked.
  const names = [...beat.characters];
  for (const n of beatStyle.cast_override ?? []) {
    if (!names.some((x) => x.trim().toLowerCase() === n.trim().toLowerCase())) names.push(n);
  }
  return `${shot} shot, ${angle.toLowerCase()} angle, ${lens}, ${movement.toLowerCase()} camera. Shot on ${cameraBody.toLowerCase()}, ${aperture}. ${beat.scene_heading}. ${beat.title}. ${names.length ? `Featuring ${names.join(", ")}. ` : ""}${beat.mood.length ? `Mood: ${beat.mood.join(", ")}. ` : ""}${visual} aesthetic, ${light.toLowerCase()} lighting, ${temp.toLowerCase()} palette. Aspect ${aspect}.`;
}

export const pad2 = (n: number) => String(n).padStart(2, "0");

/* ------------------------------------------------------------ the store */

export interface FrameApi {
  projectId: string;
  aspect: string;
  beats: Beat[];
  rows: Record<string, StoryboardRow>;
  variants: StoryboardVariant[];
  stitched: Set<string>;
  patchVariant: (id: string, patch: { prompt?: string; approval?: string; note?: string }) => Promise<void>;
  patchRow: (beatId: string, patch: { style?: BeatStyle }) => Promise<void>;
  addToStitch: (v: StoryboardVariant) => Promise<void>;
  removeFromStitch: (v: StoryboardVariant) => Promise<void>;
  /** Confirms (it deletes the beat's takes), then rolls the row again. */
  regenerateRow: (beatId: string, prompt: string) => Promise<void>;
  openFocus: (variantId: string) => void;
}

let current: FrameApi | null = null;
const listeners = new Set<() => void>();

export function publishFrameApi(api: FrameApi | null) {
  current = api;
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useFrameApi(): FrameApi | null {
  return useSyncExternalStore(subscribe, () => current, () => null);
}
