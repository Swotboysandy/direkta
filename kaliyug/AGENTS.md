# Kaliyug - Agent Contract

Follow `~/Project Pipeline/PROJECTPIPELINE.md` when available. Static file - no session state here.

## What This Is
Kaliyug is a mythic post-apocalyptic game/trailer concept package for an ultra semi-realistic Unreal Engine / PS5-style cinematic world where Kali Yuga has consumed civilization and Kalki gradually awakens as the final avatar.

## Territories
| Agent | Owns (writes) | Never touches |
|---|---|---|
| Codex | Markdown story, trailer, prompt, quality-control, and local planning files in this package | Secrets, external private docs, unrelated user files |
| Claude Code | Future engine/game implementation paths if added | Codex-authored trailer documents unless requested |

Cross-territory needs go in `task_state.md` under blocked/waiting or a `TODO(agent):` note.

## Reading Order
1. `AGENTS.md`
2. `task_state.md`
3. Last 10 entries of `build_log.md`
4. Relevant source docs:
   - `01_source_story_docs/kaliyug_story_master_document.md`
   - `01_source_story_docs/kaliyug_story_narrative_bible.md`
   - `02_locked_visual_bible/kaliyug_trailer_visual_bible_locked.md`
   - `03_trailer_storyboard/kaliyug_concept_trailer_storyboard_v1.md`

## Authority Order
1. `task_state.md` for current session truth
2. `build_log.md` for history
3. Source story docs and locked visual bible
4. Storyboard, prompts, outputs, and notes

## Hard Rules
- Kali means the demon/personification of Kali Yuga, never Goddess Kali.
- Kaliyug is not Vyom.
- Do not frame Kaliyug as tech, AI, cyberpunk, simulation, or data-space themed.
- Real-world shots use grounded post-apocalyptic physical corruption.
- Secrets never go in markdown.
