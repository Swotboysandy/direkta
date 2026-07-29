# DramaClaw (github.com/dramaclaw/dramaclaw) — what's actually in the repo
Cloned 2026-07-29. Source-available (ELv2). Novel → finished video, self-hosted,
BYO OpenAI-compatible gateway. Python backend (`src/novelvideo`) + React frontend.

## Their pipeline
1. **Import novel** → `cognee` knowledge graph parses the text into queryable
   **characters, relationships, timeline**
2. **Script generation** → split into **episodes and scenes**, unified format:
   *episode-scene, characters, shot description, dialogue, SFX/VFX/system audio*.
   Modes: adaptation / direct-translation / storyboard. **Has a review-and-repair loop.**
3. **Characters + props** → AI character designs and **three-view prop sheets**;
   "identity schemes" keep them consistent across shots; per-episode variants
4. **Scenes** → scene library, shot **sketches**, then **first-frame images**
   (two-stage: sketch before first frame)
5. **Compose** → per-shot video + **emotion-aware TTS** → MP4 with subtitles + asset bundle

## Cross-cutting features worth stealing
- **Task center**: long-task progress, **resume from checkpoint**, cancel
- **Visual Style templates**: style prompts + **avoid-instructions** + style tags,
  and **upload a reference image to auto-extract style parameters**, applied project-wide
- **Freezone**: infinite node canvas for exploration, promote winners into the main pipeline
- **Xia Director**: conversational agent across script/assets/scenes

## THE KEY CODE — src/novelvideo/seedance2_i2v/prompt.py (670 lines)
An AI-first Seedance 2.0 prompt composer. Every reference image gets an explicit
**role sentence** rather than being dumped in:

| Role | Their sentence (translated) |
|---|---|
| first frame | "image N as the first frame" |
| **last frame** | **"image N as the last frame"** |
| start state | "image N as the starting state and the basis for overall composition" |
| character | "keep the character in image N visually consistent in features" |
| prop | "keep the prop in image N consistent in shape, material and detail" |
| scene | "image N as the scene reference" |
| audio | "audio N as a voice reference" |

**`Seedance2I2VMode.FIRST_LAST_FRAME` exists** — they already do start+end frame
interpolation. That is the single strongest anti-drift technique available: pin both
ends of the shot and the model cannot wander.

Composer system rules (translated):
- Asset order is decided by the system; the model may only use existing numbers
- Never add/reorder image or audio numbers, never output "@"
- **Do not force-use the whole asset manifest — only reference what this shot truly needs**
- Audio refs are optional; omit if not needed
- Duration/resolution/aspect/real-person-review go in the API request, NEVER in the prompt
- Output only the final prompt, no explanation

## What we've taken so far
- [x] Project-wide style template → `style_template` (shipped + deployed)
- [x] Split continuity out → `continuity_lock` (shipped + deployed)
- [ ] **avoid-instructions as a first-class field** (they have it; Higgsfield stresses
      negatives too — "not painterly, not 3D, no photobash")
- [ ] **FIRST_LAST_FRAME interpolation** ← biggest anti-drift win available
- [ ] Three-view prop sheets / multi-angle character sheets
- [ ] Episode/scene splitting (needed for series + kids content)
- [ ] Resume-from-checkpoint task centre
- [ ] Emotion-aware TTS
- [ ] Auto-extract style params from a reference image
