# HANDOFF — 2026-08-10 01:36 · branch `modules` · next focus: MICRO-DRAMA full-workflow test

## Context
Direkta is an AI film-production platform (Next.js + SQLite, script → Movie Bible → shotlist →
AI clips → stitch). Branch `modules` adds three format modules — AMV/music-video, trailer,
micro-drama — as markdown agent rule-files plus a working `music-analysis` Python skill, and
rebuilt the Stitch workspace as a Freeform-style node canvas. This session validated the AMV
skill end-to-end on a real trending track; the next session tests the MICRO-DRAMA skill through
its entire workflow the same way.

## Current state
**Committed** (`ef72414`, `03fd658`): 4 research docs (`direkta-modules/research/`), 3 agent
rule-files (`direkta-modules/agents/`), `music-analysis` skill (CLI tested 21/21).
**Verified ✅**
- `music_analysis.py` on real music: 114.84 BPM detected vs 115 published (Dracula JENNIE remix).
- AMV skill dry-run (Opus, cold, autonomous): sync-map/shotlist/cutlist produced frame-accurate
  to the beat map; 19 director questions + 20 rule-friction findings logged
  (`direkta-modules/test/output/dracula-reel/`).
- Logic Pro bridge Phase 0: `File > Open` on a generated SMF imports markers + tempo map
  (114.8→120 change) + 4/4 + D♯m — architecture green-lit (`direkta-modules/research/daw-breakdown-logic.md`).
- Stitch canvas v1+v2: browser-verified (place/duplicate/connect/edit/persist, 6 node types,
  floating drawer, chain A/B), typecheck + lint clean; 7 review findings fixed and re-verified.
**Unverified ❓ / NOT tested**
- MICRO-DRAMA agent: never dry-run. TRAILER agent: never dry-run.
- Generation leg: zero credits ever spent; all pipelines stop at planning artifacts.
- DAW Phase 1 (stems + kit): not built (multi-GB models vs ~17GB free disk — awaiting go).
- AMV's 20 friction findings NOT yet folded back into the agent files.
**Uncommitted** (~19 files): Stitch v1+v2 (incl. deleted `app/_components/Canvas.tsx`),
`daw-breakdown-logic.md`, `direkta-modules/test/*`, `.gitignore` audio rules. Do not discard.
**Incident log**: a subagent deleted `data/zinema.sqlite` during the v1 build (regenerates with
the Lisbon seed; founder informed). Standing rule since: agents never touch `data/`.

## Locked decisions (do not relitigate)
- Subagents: **Opus** for deep/creative/review work, **Sonnet** for mechanical/verify — **never
  Fable subagents**; main session supervises ("watch over").
- Direkta laws bind every agent: propose-don't-commit · evidence-or-ask · strict handoffs ·
  no credit spend before an explicit director gate · beat/section-gated delivery.
- Micro-drama agent has **NO beat-map dependency** (music is cue-based stings) — don't add one.
- Music analysis: custom librosa + `beat_this` CLI. NOT madmom (dead), NOT hosted APIs (no
  beat-level data), NOT existing skills/MCPs (no downbeats).
- Logic bridge: SMF-via-`File > Open` Import Kit. NOT `.logicx` writer (Phase-4 spike only),
  NOT AAF/FCPXML, no Logic automation exists at all.
- Stitch: extend the hand-rolled canvas, NOT react-flow. Separate node boxes (frame / video /
  sound / dialogue prompt / note / shape); chain order derives from frame→frame edges ONLY.
- Skill-test pattern (the template for micro-drama): ONE Opus subagent adopts the rule file
  cold, autonomous dry-run mode — does the passes, writes artifacts, records the questions it
  would have asked in DIRECTOR QUESTIONS blocks (★ = recommended default), and returns a candid
  report: artifacts / DIRECTOR QUESTIONS / RULE FRICTION (cite rule §) / uncovered cases.
- Never delete or reset `data/zinema.sqlite` or anything under `data/`.

## Open problems
- AMV friction findings unapplied; micro-drama file shares house DNA. Hypothesis: most AMV
  friction was short-form-scaling (its §9 assumed 3.5-min pieces) — micro-drama's §9 is already
  90s-native, so expect a different friction class (season-scale sequencing, paywall audit
  loop). Capture new friction; do not pre-patch the file before the test.
- Seeded Lisbon stitch nodes have empty prompt boxes (fixture gap; 2-line seed fix, cosmetic).
- Stitch v1+v2 sits uncommitted; commit decision belongs to the founder before app work stacks.
- Dev server may or may not be running from last session (`npm run dev`, port 3000).

## Next step (ONE action)
Run the micro-drama full-workflow dry-run: launch ONE Opus subagent that reads
`direkta-modules/agents/micro-drama-agent.md` and adopts it cold in autonomous dry-run mode,
with a premise brief from the founder (if none given, propose: revenge + hidden-identity,
ReelShort-style Western cast, 70×90s vertical, then confirm). It must execute the agent's passes
in order and write into `direkta-modules/test/output/microdrama-<slug>/`: `season-bible.md`
(incl. paywall map + tentpoles + cast tag-stacks), `episode-001.md`–`episode-003.md`
(golden-window sample as timestamp skeletons), the Pass-3 paywall-episode audit, `shotlist-e01.md`
(4-slot coverage, punch-in/lip-sync flags), and the costed generation handoff — generation itself
stays gated. Final message = the candid test report per the locked skill-test pattern.

## Verify on pickup
```bash
cd /Users/nishkarsh/Direkta_git && git branch --show-current   # → modules
git log --oneline -2        # → 03fd658 Build module skills… / ef72414 Module research…
git status --short | wc -l  # → ~19 (uncommitted Stitch v1+v2 — expected, do NOT clean/discard)
wc -l direkta-modules/agents/micro-drama-agent.md              # → 274
ls direkta-modules/test/output/dracula-reel/                   # → cutlist.md shotlist.md sync-map.md
```

## File map (what next session touches)
- `direkta-modules/agents/micro-drama-agent.md` — the skill under test (read-only during test)
- `direkta-modules/research/micro-drama.md` — its rule source, for friction cross-checks
- `direkta-modules/test/output/dracula-reel/` — AMV dry-run = report-format reference
- `direkta-modules/test/output/microdrama-<slug>/` — NEW: all outputs land here
- `direkta-modules/agents/{amv-music-video,trailer}-agent.md` — cross-consistency reference only
