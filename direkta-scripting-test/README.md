# Direkta — Scripting Workflow Test Harness

An **isolated sandbox** for prototyping Direkta's agents as plain rule files, and testing the
`script → Bible → shot prompts → generation` flow conversationally inside Claude Code (or Codex)
— *before* any of it is wired into the app.

It lives **outside** `Direkta_git` on purpose: the agents should reason only from their own rule
files and the script in front of them, not the whole codebase. Open Claude Code **in this folder**
so it never reads what it doesn't need.

```
direkta-scripting-test/
├── agents/                      ← the agents' SOURCE OF TRUTH (their personality / lens)
│   ├── screenplay-agent.md      ← break a script into a Movie Bible + fill gaps with you
│   ├── cinematographer-agent.md ← read the Bible as a DP, write optimal scene prompts per beat
│   └── higgsfield-agent.md      ← operate Higgsfield (research-current), confirm, then generate
├── scripts/                     ← input scripts to test with
│   └── the-late-fare.md         ← a short sample (with deliberate gaps to test gap-filling)
├── output/                      ← agents write here: bible.md, /prompts/shotlist.md, /generation/…
└── README.md                    ← you are here
```

## The three agents

- **Screenplay Agent** — reads a script exhaustively through many lenses (structure, character,
  world, theme, tone, visual, production, continuity), then parses it into a structured **Movie
  Bible**. It is *evidence-bound* (every claim quotes the script) and it **works with you to fill
  gaps** — when the script is silent on something the Bible needs, it asks rather than invents.
- **Cinematographer Agent** — does **not** read the script. It reads the **Bible** the Screenplay
  Agent produced, understands it through a cinematographer's eye, and writes **optimal generation
  prompts** per scene/beat. It's a blend of a master DP (lens, light, coverage) and an expert
  prompt engineer (consistency, look-lock, negative prompts). One beat → a consistent multishot
  coverage set.

- **Higgsfield Operator Agent** — the hands on the tool. It familiarizes itself with the story
  (Bible + handoff) and the Cinematographer's prompts, operates through a **use-case prism**
  (filmmaker here; also social, marketing, game design…), **researches Higgsfield live** because
  the platform updates weekly, then **asks you which model and settings to use before spending a
  single credit** — and only then generates (via Higgsfield's MCP or CLI).

The handoffs are strict — each agent trusts the prior artifact, not the raw script:
**script → Bible → shotlist → generation.** The Cinematographer reads the Bible (not the script);
the Higgsfield Operator reads the Bible + shotlist.

## How to test (in Claude Code)

The agents' rule files carry all the intelligence — the prompt just assigns the role and says go.
Open Claude Code in this folder, then:

1. **Run the Screenplay Agent.** Paste the screenplay (or point at a file in `scripts/`) with a
   one-liner:
   > *"Be the Screenplay Agent — read `agents/screenplay-agent.md` and follow it. Break down the
   > screenplay below."*  ⏎  *[paste screenplay]*

   It confirms it's read its contract, tallies the script, runs its passes, and **stops to ask you**
   the gap questions. It writes `output/<project>/bible.md` + `handoff.md`.

2. **Run the Cinematographer Agent:**
   > *"Be the Cinematographer Agent — read `agents/cinematographer-agent.md` and follow it. Work
   > from `output/<project>/bible.md`."*

   It reads the Bible, states the look-lock back to you, and writes
   `output/<project>/prompts/shotlist.md` — establishing + hero prompts per beat, plus a reusable
   LOOK-LOCK and CAST IDENTITY block.

3. **Run the Higgsfield Operator** (Claude Code *or* Codex — wherever Higgsfield's MCP/CLI is set up):
   > *"Be the Higgsfield Operator — read `agents/higgsfield-agent.md` and follow it. Work from
   > `output/<project>/bible.md`, `handoff.md`, and `prompts/shotlist.md`."*

   It restates the story, picks the lens, researches current Higgsfield, proposes a generation
   plan, and **stops to ask you which model and settings to use** before spending a credit. It
   writes `output/<project>/generation/`.

> **Why role-based, not `.claude/agents/` subagents?** The Screenplay Agent must talk *with you*
> to fill gaps — a spawned subagent runs headless and can't. Adopting the role in the main session
> keeps the dialogue. (You can still promote either rule file to a `.claude/agents/` subagent later
> for autonomous runs; it'll flag gaps in its output instead of asking.)

## The sample's planted gaps (what "good" looks like)

`the-late-fare.md` deliberately withholds things the Bible needs, so you can watch the Screenplay
Agent catch them instead of bluffing:

- **No period** — could be now or near-future.
- **No named city** — the world is unnamed.
- **The case is never opened** — its contents are a hole the film hinges on.
- **Victor's backstory** is implied, never stated.
- **Nadia's choice** at the end is unexplained motivation.

A passing run **asks about these**; a failing run **invents** them. That's the test.

## Iterating

The whole point is to tune the agents' **rule files**. Run a script, see where the Bible or the
prompts fall short, and edit `agents/*.md` — that's the source of truth. When the flow feels
right here, it ports cleanly into Direkta's real Screenplay and Cinematographer agents.
