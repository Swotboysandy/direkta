# Instructions for Codex

## Task
Use the source docs and locked visual bible to generate image batches for a 3-minute Kaliyug concept trailer. The goal is not final animation yet; the goal is to create high-quality 16:9 world-first keyframe candidates for human selection.

## Step 1 — Read These Files First
1. `01_source_story_docs/kaliyug_story_narrative_bible.md`
2. `01_source_story_docs/kaliyug_story_master_document.md`
3. `02_locked_visual_bible/kaliyug_trailer_visual_bible_locked.md`
4. `03_trailer_storyboard/kaliyug_concept_trailer_storyboard_v1.md`
5. `04_batch_prompts/standalone_keyframe_prompts.md`
6. `06_quality_control/selection_checklist.md`

## Step 2 — Generate Batches
Generate image batches plate by plate using `04_batch_prompts/standalone_keyframe_prompts.md`.

Each prompt is standalone and should not require extra chat context.

Generate 4 variations per plate unless the user explicitly requests a different count.

## Step 3 — Enforce Aspect and Quality
Every output must be 16:9 landscape, high quality, sharp, clean, 4K target, and cinematic realistic fantasy.

If the image model cannot directly output 4K, generate at the highest resolution available and optionally upscale after generation.

## Step 4 — Avoid Context Leakage
Do not use previous generated images that had incorrect visual direction unless explicitly requested. Incorrect prior directions include Goddess Kali as villain, real-world floating sacred geometry, too much neon cosmic sci-fi in physical locations, and semi-animated/anime look.

## Step 5 — Save Metadata
For every generated image, save a sidecar `.md` or `.json` note containing exact prompt used, model/tool used, seed if available, plate number, variation number, and notes on what was varied.

Example:

```json
{
  "plate": "plate23_raavan_behind_burning_fortress",
  "variation": "v03",
  "prompt": "...",
  "aspect_ratio": "16:9",
  "quality_target": "4K",
  "notes": "Lower camera, heavier smoke, stronger Raavan silhouette."
}
```

## Step 6 — Sort Outputs
After generation, place results into selected, rejected, and needs_regen folders.

Common reasons for rejection: wrong aspect ratio, pixelated/soft output, incorrect Kali goddess depiction, sacred geometry in real world, weak red demonic vein corruption, character portrait focus in world-first plates, protagonist looks too modern or superheroic, Raavan looks cartoonish.

## Final Deliverable from Codex
A folder containing generated image batches, prompt metadata files, selection notes, and a `best_candidates.md` summary listing the strongest options per plate.
