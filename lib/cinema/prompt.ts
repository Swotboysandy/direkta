// Cinema prompt builder — converts a CanvasNode (+ shotMeta, + character refs) into a
// cinematic English prompt that flows into the image / video vendor APIs.

import type { CanvasNode } from "../types";
import { CAMERA_ANGLES, CAMERA_MOVES, LENSES, LIGHTINGS, SHOT_SIZES, TIMES_OF_DAY, vocabPrompt } from "./vocabulary";
import {
  AGES,
  ARCHETYPES,
  BUILDS,
  EYE_COLORS,
  HAIR_COLORS,
  HAIR_STYLES,
  SKIN_TONES,
  VOICE_QUALITIES,
  WARDROBES
} from "./characterVocabulary";
import { readCharacterMeta, readShotMeta, type CharacterMeta } from "./types";

export interface PromptContext {
  premise: string;
  styleFragment?: string; // project-level visual style fragment (from styleProfile)
  characters: Pick<CanvasNode, "id" | "title" | "body" | "meta">[]; // resolved character nodes
}

/**
 * Build an image prompt for a node. For "shot" nodes, layers in cinema-vocabulary
 * fragments from meta (shot size, angle, lens, lighting, ToD) plus character refs
 * and ambience cues. For other node kinds, falls back to the original per-kind
 * template (preserved from the legacy buildPrompt).
 */
export function buildImagePrompt(node: CanvasNode, ctx: PromptContext): string {
  const cleanBody = node.body.replace(/\s+/g, " ").trim().slice(0, 1200);

  if (node.kind === "shot") {
    return buildShotImagePrompt(node, cleanBody, ctx);
  }
  if (node.kind === "character") {
    return buildCharacterImagePrompt(node, cleanBody, ctx);
  }
  if (node.kind === "scene") {
    return `Cinematic film scene. Location: ${node.title}. ${cleanBody}. Establishing shot, cinematic composition, depth, film grain. Context: ${ctx.premise}`;
  }
  if (node.kind === "storyboard") {
    return `Storyboard panel. ${node.title}. ${cleanBody}. Black and white sketch, dynamic composition, shot framing, film board style. Context: ${ctx.premise}`;
  }
  return `${node.title}. ${cleanBody}. Cinematic, photographic. Context: ${ctx.premise}`;
}

/**
 * Build a video prompt for a node. Shots fold in cameraMove + duration cue;
 * other kinds keep the legacy templates.
 */
export function buildVideoPrompt(node: CanvasNode, ctx: PromptContext): string {
  const cleanBody = node.body.replace(/\s+/g, " ").trim().slice(0, 1000);

  if (node.kind === "shot") {
    return buildShotVideoPrompt(node, cleanBody, ctx);
  }
  if (node.kind === "storyboard") {
    return `Live action of: ${node.title}. ${cleanBody}. Cinematic movement. Context: ${ctx.premise}`;
  }
  return `${node.title}. ${cleanBody}. Cinematic motion. Context: ${ctx.premise}`;
}

function buildShotImagePrompt(node: CanvasNode, body: string, ctx: PromptContext): string {
  const meta = readShotMeta(node.meta);
  const fragments: string[] = [];

  // Lead with the headline so the model anchors on it
  fragments.push(`Cinematic film shot — ${node.title}.`);

  if (body) fragments.push(body);

  // Cinema vocabulary, in canonical order
  const shotSizeFrag = vocabPrompt(SHOT_SIZES, meta.shotSize);
  if (shotSizeFrag) fragments.push(shotSizeFrag);

  const angleFrag = vocabPrompt(CAMERA_ANGLES, meta.cameraAngle);
  if (angleFrag) fragments.push(angleFrag);

  const lensFrag = vocabPrompt(LENSES, meta.lens);
  if (lensFrag) fragments.push(lensFrag);

  const lightingFrag = vocabPrompt(LIGHTINGS, meta.lighting);
  if (lightingFrag) fragments.push(lightingFrag);

  const todFrag = vocabPrompt(TIMES_OF_DAY, meta.timeOfDay);
  if (todFrag) fragments.push(todFrag);

  if (meta.emotion && meta.emotion.length > 0) {
    fragments.push(`emotional register: ${meta.emotion.join(", ")}`);
  }

  // Character references — rich sketch from CharacterMeta when available
  const featured = (meta.characterIds ?? [])
    .map((id) => ctx.characters.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  if (featured.length > 0) {
    const sketches = featured.map((c) => characterSketch(c.title, c.body, c.meta));
    fragments.push(`Featuring: ${sketches.join("; ")}.`);
  }

  if (meta.notes) {
    const noteClean = meta.notes.replace(/\s+/g, " ").trim().slice(0, 400);
    if (noteClean) fragments.push(`Director's notes: ${noteClean}`);
  }

  fragments.push("Photographic, motion-picture composition, high detail.");
  if (ctx.styleFragment) fragments.push(`Visual style: ${ctx.styleFragment}.`);
  fragments.push(`Context: ${ctx.premise}`);

  return fragments.join(" ");
}

function buildShotVideoPrompt(node: CanvasNode, body: string, ctx: PromptContext): string {
  const meta = readShotMeta(node.meta);
  const fragments: string[] = [];

  fragments.push(`${node.title}.`);
  if (body) fragments.push(body);

  const sizeFrag = vocabPrompt(SHOT_SIZES, meta.shotSize);
  if (sizeFrag) fragments.push(sizeFrag);

  const moveFrag = vocabPrompt(CAMERA_MOVES, meta.cameraMove);
  if (moveFrag) fragments.push(moveFrag);

  const angleFrag = vocabPrompt(CAMERA_ANGLES, meta.cameraAngle);
  if (angleFrag) fragments.push(angleFrag);

  if (meta.emotion && meta.emotion.length > 0) {
    fragments.push(`mood: ${meta.emotion.join(", ")}`);
  }

  if (meta.ambientSound) {
    fragments.push(`ambient bed: ${meta.ambientSound.trim().slice(0, 200)}`);
  }
  if (meta.soundEffects && meta.soundEffects.length > 0) {
    fragments.push(`sound effects: ${meta.soundEffects.join(", ")}`);
  }

  if (typeof meta.durationSeconds === "number" && meta.durationSeconds > 0) {
    fragments.push(`approximately ${Math.round(meta.durationSeconds)} seconds long`);
  }

  fragments.push("Cinematic motion, depth, photographic.");
  if (ctx.styleFragment) fragments.push(`Visual style: ${ctx.styleFragment}.`);
  fragments.push(`Context: ${ctx.premise}`);

  return fragments.join(" ");
}

/**
 * Build an image prompt for a CHARACTER node — uses CharacterMeta when present,
 * falls back to the node body otherwise.
 */
function buildCharacterImagePrompt(node: CanvasNode, body: string, ctx: PromptContext): string {
  const cm = readCharacterMeta(node.meta);
  const fragments: string[] = [];

  fragments.push(`Character portrait — ${node.title}.`);

  const sketch = characterMetaSketch(cm);
  if (sketch) fragments.push(sketch);

  if (body) fragments.push(body);

  if (cm.archetype) {
    const ar = vocabPrompt(ARCHETYPES, cm.archetype);
    if (ar) fragments.push(`Archetype: ${ar}.`);
  }
  if (cm.occupation) fragments.push(`Occupation: ${cm.occupation.trim().slice(0, 120)}.`);

  fragments.push("Cinematic lighting, photographic, detailed face, consistent appearance for film continuity.");
  if (ctx.styleFragment) fragments.push(`Visual style: ${ctx.styleFragment}.`);
  fragments.push(`Context: ${ctx.premise}`);

  return fragments.join(" ");
}

/**
 * One-line character sketch used inside shot prompts. Uses CharacterMeta when present
 * and falls back to a slice of node.body otherwise.
 */
function characterSketch(title: string, body: string, meta: Record<string, unknown> | undefined): string {
  const cm = readCharacterMeta(meta);
  const sketch = characterMetaSketch(cm);
  if (sketch) {
    // include first sentence of body if short, for a touch more grounding
    const firstSentence = body.replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+/)[0]?.slice(0, 160) ?? "";
    return firstSentence ? `${title} — ${sketch}. ${firstSentence}` : `${title} — ${sketch}`;
  }
  const desc = body.replace(/\s+/g, " ").trim().slice(0, 280);
  return desc ? `${title} (${desc})` : title;
}

/**
 * Lower-level: render CharacterMeta fragments into a readable English sketch.
 * Returns an empty string if no meta is set.
 */
function characterMetaSketch(cm: CharacterMeta): string {
  const parts: string[] = [];

  if (cm.age) {
    const f = vocabPrompt(AGES, cm.age);
    if (f) parts.push(f);
  }
  if (cm.build) {
    const f = vocabPrompt(BUILDS, cm.build);
    if (f) parts.push(f);
  }
  if (cm.skinTone) {
    const f = vocabPrompt(SKIN_TONES, cm.skinTone);
    if (f) parts.push(f);
  }

  // Hair: combine style + color when both set, else either alone
  const hairColor = cm.hairColor ? vocabPrompt(HAIR_COLORS, cm.hairColor) : null;
  const hairStyle = cm.hairStyle ? vocabPrompt(HAIR_STYLES, cm.hairStyle) : null;
  if (hairColor && hairStyle) {
    parts.push(`${hairStyle}, ${hairColor}`);
  } else if (hairColor) {
    parts.push(hairColor);
  } else if (hairStyle) {
    parts.push(hairStyle);
  }

  if (cm.eyeColor) {
    const f = vocabPrompt(EYE_COLORS, cm.eyeColor);
    if (f) parts.push(f);
  }

  if (cm.wardrobe) {
    const f = vocabPrompt(WARDROBES, cm.wardrobe);
    if (f) parts.push(f);
  }
  if (cm.wardrobeAccents && cm.wardrobeAccents.length > 0) {
    parts.push(`wearing ${cm.wardrobeAccents.join(", ")}`);
  }
  if (cm.identifyingMarks && cm.identifyingMarks.length > 0) {
    parts.push(cm.identifyingMarks.join(", "));
  }
  if (cm.voice) {
    const f = vocabPrompt(VOICE_QUALITIES, cm.voice);
    if (f) parts.push(`voice: ${f}`);
  }

  return parts.join(", ");
}
