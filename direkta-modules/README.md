# Direkta Modules

Three format-specialised modules for Direkta, each to be powered by its own agent/skill.
This folder starts as the research base (branch `modules`); the agents/skills get built on
top of these docs.

```
direkta-modules/
├── research/
│   ├── amv-music-video.md       AMV / Music Video module research (739 lines)
│   ├── movie-anime-trailer.md   Movie / Anime Trailer module research (665 lines)
│   ├── micro-drama.md           Micro Drama (vertical duanju) module research (631 lines)
│   └── music-analysis-skill.md  Music-analysis skill: findings + build recommendation (851 lines)
├── agents/
│   ├── amv-music-video-agent.md track + beat map (+ brief/Bible) → sync map → shotlist → cutlist
│   ├── trailer-agent.md         Movie Bible + cue beat maps → A/V script → shotlist → cutlist (+ anime-PV mode)
│   └── micro-drama-agent.md     premise brief → season bible → timestamp-skeleton episodes → shotlists
└── skills/
    └── music-analysis/
        ├── SKILL.md             when to run it, install ladder, CLI usage, output contract
        ├── music_analysis.py    the CLI: ffmpeg normalize → librosa core → beat_this/allin1/demucs upgrades
        └── requirements.txt     core deps + optional extras
```

The agents follow the house pattern of `direkta-scripting-test/agents/` (persona, prime
directives, director-gated passes, exact artifact formats) and inherit the Direkta laws:
propose-don't-commit, evidence-or-ask, strict handoffs, no credit spent unconfirmed.
The AMV and Trailer agents STOP if `analysis/<track-id>.json` is missing and share the
same sync constants (`cut_offset_frames` −1..−3, the accent-weight ladder).

## The three modules

| Module | Core deliverable | Defining craft |
|---|---|---|
| **AMV / Music Video** | 2–4 min music-locked edit | Beat-grid cutting, per-section pacing, sync-point hierarchy, effects on transients |
| **Movie / Anime Trailer** | 60–120s trailer (+ teaser/PV/spot ladder) | 4-act structure, music-first radio cut, dip-to-black rhythm, title-card cadence, pre-climax dropout |
| **Micro Drama** | 60–100 × 90s vertical episodes | Timestamp-skeleton episodes, hook/cliffhanger cadence, paywall placement, close-up-heavy 9:16 grammar |

Each research doc ends with a **§9 Skill rules** section — numbered, imperative decision
rules (34–40 per module). Those sections are the distillation source for each module's
agent rule-file, in the same style as `direkta-scripting-test/agents/*.md`.

## The shared music engine

The AMV and Trailer modules both consume a **beat map**: a JSON artifact
(bpm, beats[], downbeats[], sections[] with energy, onsets[] with accent weights, troughs[])
produced by a `music-analysis` skill run once per track at authoring time.

`research/music-analysis-skill.md` is the verdict on how to get it. Short version:
**nothing off the shelf is sufficient** (existing librosa-based skills/MCPs can't detect
downbeats; hosted APIs return tags, not beat-time arrays, or are dead) — so Direkta builds
a small custom skill: a Python CLI (`ffmpeg` normalize → `librosa` + `beat_this`, with
`allin1` sections and `demucs` stems) that Claude shells out to, matching the existing
authoring-time agent pattern. The doc contains the runnable script sketch, the beat-map
JSON schema, and the cut-list generation algorithm the agents implement against it.

## Provenance

Researched 2026-08-08/09 via a multi-agent workflow (Opus deep-dives per module,
Sonnet tool/craft hunts, Opus synthesis writers, Opus completeness critic, Sonnet gap
fixers). Confidence tags ([H]/[M]/[L] etc.) and source URLs are preserved inline;
low-confidence items to re-verify are listed in each doc's appendix/§10.
