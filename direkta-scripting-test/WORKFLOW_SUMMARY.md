# Direkta — Scripting Agent Workflow (Prototype Summary)

**Status:** validated end-to-end on a real script.
A portable, rule-file-based agent pipeline that takes a screenplay all the way to
generation-ready prompts — built to be tested in any agentic CLI (Claude Code, Codex) *before*
being wired into the Direkta app.

---

## The idea

Each stage of Direkta's creative pipeline is prototyped as a **plain markdown rule file** — the
agent's "source of truth" / personality / lens. The runtime prompt stays a one-liner ("be this
agent, follow your rules, go"); **all the intelligence lives in the rule file, working in the
back.** This lets us tune the agents' thinking by editing markdown, then port the proven logic
into the real product.

The sandbox lives **outside** the main codebase on purpose, so the agents reason only from their
own rules and the script in front of them — not the whole repo.

## The pipeline

```
screenplay  ──►  [ Screenplay Agent ]  ──►  Movie Bible  ──►  [ Cinematographer Agent ]  ──►  shotlist  ──►  [ Higgsfield Operator ]  ──►  frames
                  prism analysis,              (the contract)     DP + prompt engineer,            (per-beat,        research-current,
                  evidence-bound,                                 look-lock + identity             numbered)         confirm, generate
                  fills gaps with you                             across a multishot set                            beat-by-beat
```

Handoffs are strict: **each agent trusts the prior artifact, not the raw script.** The
Cinematographer reads the Bible (never the script); the Higgsfield Operator reads the Bible +
shotlist.

## The three agents

| Agent | Role | Key disciplines | Reads | Writes |
|---|---|---|---|---|
| **Screenplay** | Script → Movie Bible | **Prism thinking** (refract into 8 analytical bands, recombine, surface cross-band contradictions as gaps); evidence-or-ask (every claim quotes the page); **never imports real history**; beats minted last; works **with** the director to fill gaps | the script | `bible.md`, `handoff.md` |
| **Cinematographer** | Bible → shot prompts | Master DP + prompt engineer; **look-lock** identical in every prompt; identity held verbatim; **multishot coverage** sequential by beat (as many prompts as each beat needs) | the Bible | `prompts/shotlist.md` |
| **Higgsfield Operator** | Prompts → generation | **Use-case prism** (filmmaker / social / marketing / game design…); **researches Higgsfield live** (it updates weekly); Soul-ID consistency; **confirms model/settings, then generates beat-by-beat on approval** | Bible + shotlist | `generation/` |

## Design principles (the same ones that govern the real app)

1. **Rules in the folder, prompt is one line.** Tune behavior by editing the rule file.
2. **Propose, don't commit — director-gated.** Agents never auto-advance; nothing expensive fires
   without a human go.
3. **Strict handoffs / single source of truth.** Each artifact is the contract for the next stage.
4. **Prism thinking.** Refract the work through multiple lenses (analytical bands for the
   Screenplay agent; professional use-cases for the Operator).
5. **Live research over stale memory.** The Operator verifies Higgsfield's current state before
   acting, and goes online for any skill it doesn't have preloaded.
6. **Beat-by-beat approval.** Generation runs one beat at a time, signed off before the next —
   never the whole project at once.

## Validation — "Maurya Origins" (2-minute trailer)

Run cold through the full pipeline:

- **Screenplay Agent → Bible v1.0.** Tallied 12 blocks (7 scenes + 5 montage/card blocks),
  ran its passes in order, **stopped to ask** the real gaps (period, the two-age Chandragupta
  casting question, the unnamed narrator), logged **8 director decisions** and **6 continuity
  flags**, minted **12 beats** last. Verified: every quote traced to the page; no real history
  imported.
- **Cinematographer Agent → shotlist.** Produced **51 look-locked prompts**, sequential S1→S12,
  sized per beat (the 11-shot training montage and 5-shot finale fully covered). Verified:
  look-lock byte-identical in all 51; identity descriptors verbatim; the boy→man match-cut staged
  exactly where the Bible specified; continuity (oath-knot, blood, gold-never-on-rebels) enforced
  in both positive and negative prompts; nothing fabricated.
- **Higgsfield Operator.** Ready to take the 51 prompts, confirm model + Soul-ID strategy, and
  generate beat-by-beat on approval.

## How to run

Open an agentic CLI **in this folder**, then one line per stage:

```
Be the Screenplay Agent — read agents/screenplay-agent.md and follow it. Break down scripts/<file>.
Be the Cinematographer Agent — read agents/cinematographer-agent.md and follow it. Work from output/<project>/bible.md.
Be the Higgsfield Operator — read agents/higgsfield-agent.md and follow it. Work from output/<project>/bible.md, handoff.md, and prompts/shotlist.md.
```

## Path to production

This maps directly onto Direkta's real agents: the Screenplay Agent → the breakdown/POV-pass
engine that builds the Movie Bible; the Cinematographer → the `composeBeatPrompt` + coverage
pipeline; the Higgsfield Operator → the generation layer (Soul-ID train-first consistency,
heroes-only-by-default coverage, cost-gated). The rule files are the proven prompt-logic these
production agents will carry.

## Folder map

```
.
├── agents/                      ← the rule files (source of truth)
│   ├── screenplay-agent.md
│   ├── cinematographer-agent.md
│   └── higgsfield-agent.md
├── scripts/                     ← input screenplays
│   ├── the-late-fare.md         ← sample short (planted gaps)
│   └── maurya-origins.md        ← the validation script
├── output/maurya-origins/       ← the run artifacts
│   ├── bible.md                 ← v1.0 Movie Bible
│   ├── handoff.md               ← Screenplay → Cinematographer contract
│   └── prompts/shotlist.md      ← 51 generation prompts
├── README.md                    ← how to run
└── WORKFLOW_SUMMARY.md          ← this file
```
