# Direkta Scripting Pipeline — Design Rationale

Durable capture of *why* the scripting pipeline is built the way it is. The canonical
source of truth is the three agent rule files in [`../agents/`](../agents/); this document
is the reasoning around them, plus how they map into the production Direkta app.

> Companion artifacts: [`../WORKFLOW_SUMMARY.md`](../WORKFLOW_SUMMARY.md) (prototype summary),
> [`../README.md`](../README.md) (how to run), [`architecture.html`](architecture.html)
> (the whole-system visual architecture doc).

---

## The shape

```
screenplay ─► [ Screenplay Agent ] ─► Movie Bible ─► [ Cinematographer ] ─► shotlist ─► [ Higgsfield Operator ] ─► frames
              prism analysis,           (the contract)   DP + prompt engineer,  (per-beat,    research-current,
              evidence-bound,                            look-lock + identity    numbered)     confirm, generate
              fills gaps with you                        across a multishot set                beat-by-beat
```

Each stage is prototyped as a **plain-markdown rule file** — the agent's source of truth.
The runtime prompt stays a one-liner ("be this agent, follow your rules, go"); all the
intelligence lives in the rule file. Tune behaviour by editing markdown, then port the
proven logic into the app. The sandbox lives **outside** the main codebase on purpose so
each agent reasons only from its own rules and the artifact in front of it.

---

## Why these design choices

1. **Rules in the folder, prompt is one line.** Behaviour is data, not code — editable and
   diffable. The same rule files become the editable skills in the product.
2. **Propose, don't commit — director-gated.** No agent auto-advances; nothing expensive
   fires without a human go. The director co-authors, never rubber-stamps.
3. **Strict handoffs / single source of truth.** Each artifact is the contract for the next
   stage. The Cinematographer reads the **Bible, never the script**; the Higgsfield Operator
   reads the **Bible + shotlist**. A downstream agent never re-derives upstream work.
4. **Prism thinking.** Refract the work through multiple lenses so concerns don't smear into
   a blur — analytical bands for the Screenplay Agent, professional use-cases for the
   Operator. Contradictions live *between* bands; every such seam is a gap to flag, never
   smooth over.
5. **Live research over stale memory.** The Operator verifies Higgsfield's current state
   before acting (the platform ships weekly), and goes online for any skill it lacks.
6. **Beat-by-beat approval.** Generation runs one beat at a time, signed off before the next
   — never the whole project at once.

---

## The three agents

### Screenplay Agent — script → Movie Bible
Rule file: [`../agents/screenplay-agent.md`](../agents/screenplay-agent.md)

- **Prism method:** refract the script into 8 analytical bands (structural, character, world,
  theme, tonal, visual, production, continuity); interrogate each band *alone* so a thin spot
  in one is never patched by another; recombine and surface cross-band contradictions as gaps.
- **Evidence or ask — never invent.** Every interpretive claim cites the scene + a verbatim
  quote. **Read only the page** even for real history/known IP — outside knowledge is for
  *recognising* a gap and asking a sharp question, never for *filling* one.
- **Passes in order, beats minted LAST** (Pass 0 tally → Spine → Depth → Look → Beats →
  Continuity), pausing after each pass for director review so the Bible is co-authored.
- **Output:** a 9-section Movie Bible (`bible.md`) where every character carries a **dense
  identity descriptor** (build, features, distinguishing marks, default wardrobe) — this is
  what the Cinematographer's look-lock depends on — plus a `handoff.md` of the few things the
  Cinematographer most needs.

### Cinematographer Agent — Bible → shot prompts
Rule file: [`../agents/cinematographer-agent.md`](../agents/cinematographer-agent.md)

- Reads the **Bible, not the script**; if §7 (beats) is unminted it stops and sends the
  director back to the Screenplay Agent rather than guessing.
- **The look-lock is sacred:** palette (hex), lighting philosophy, lens/grade character, and
  motifs are composed *byte-identically* into every prompt — this is what makes hundreds of
  frames feel like one film.
- **Identity is held, not re-randomised:** each character/location uses the same verbatim
  identity descriptor from the Bible everywhere it appears.
- **Coverage, not single frames:** per beat, a multishot set (establishing + hero + the
  angles that cut it), sized to the beat, chosen from the film's own grammar.
- **5-layer prompt composition** (order = priority to the model): framing → subjects+identity
  → setting → look-lock → mood/format tail, plus a negative prompt, aspect ratio, and a
  seed/identity consistency note.
- **Output:** `prompts/shotlist.md` — a LOOK-LOCK block + CAST IDENTITY block + per-beat
  numbered prompts (S<n>.1, S<n>.2 …) + a shot index.

### Higgsfield Operator — prompts → generation
Rule file: [`../agents/higgsfield-agent.md`](../agents/higgsfield-agent.md)

- **Use-case prism:** operates through the lens the work demands (filmmaker here; also social,
  marketing, game design…) — the lens decides models, ratios, lengths, finishing.
- **Familiarize → plan → confirm → generate**, never spending a credit before the director
  answers the setup gate (output type, models, Soul-ID strategy, aspect, length, cadence,
  budget).
- **Consistency is law:** Soul ID locks each character (train-first; a text-only character
  gets candidate stills generated and chosen before a Soul ID is trained), Soul HEX / palette
  law locks colour, the look-lock rides in every prompt.
- **Verify live:** Higgsfield updates weekly — confirm models/methods before relying on them.
- Generates **one beat at a time, on approval**; writes `generation/plan.md` + `log.md`.

---

## Validation — "Maurya Origins" (2-minute trailer)

Run cold through the full pipeline (artifacts under [`../output/maurya-origins/`](../output/maurya-origins/)):

- **Screenplay → Bible v1.0:** 12 blocks tallied (7 scenes + 5 montage/card blocks), passes
  run in order, **stopped to ask** the real gaps (period, the two-age Chandragupta casting
  question, the unnamed narrator), logged **8 director decisions** + **6 continuity flags**,
  minted **12 beats** last. Every quote traced to the page; no real history imported.
- **Cinematographer → shotlist:** **51 look-locked prompts**, sequential S1→S12, sized per
  beat. Look-lock byte-identical in all 51; identity descriptors verbatim; the boy→man
  match-cut staged where the Bible specified; continuity enforced in positive + negative
  prompts.
- **Higgsfield Operator:** ready to take the 51 prompts, confirm model + Soul-ID strategy,
  and generate beat-by-beat on approval.

---

## Path to production (Direkta app)

The rule files are the proven prompt-logic the production agents will carry:

| Prototype agent | Production target |
|---|---|
| Screenplay Agent | the breakdown / POV-pass engine that builds the Movie Bible |
| Cinematographer | the `composeBeatPrompt` + per-beat coverage pipeline |
| Higgsfield Operator | the generation layer (Soul-ID train-first consistency, heroes-only-by-default coverage, cost-gated) |

---

## Open threads (in progress — not yet decided)

Captured so the reasoning isn't lost; these are being worked on the in-house build, not
finalised here:

- **In-house engine:** Claude Agent SDK with ambient auth + an MCP-connections registry
  replacing the BYOK vendor/key model (generation via MCP tools/plugins, not API keys).
- **Gap-asking loop:** the Screenplay Agent's co-authored gap dialogue maps onto the existing
  `clarifications` table (batched questions, options + recommended default, resolve-then-resume).
- **Data model:** the Bible/beat/character/location output maps onto the existing
  `beats` / `bible` / `characters` / `locations` tables; the dense identity descriptor is the
  field the cinematographer look-lock reads.
- **Codex vs Bible** and the **scripting sub-tabs** (Outline / Codex / Discuss / Analyse)
  remain to be reconciled against the Bible as single-source-of-truth.
