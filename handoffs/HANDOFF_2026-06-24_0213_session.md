# Direkta in-house — Session Handoff (2026-06-24 02:13 IST)

## Context
Direkta in-house tool on branch `inhouse` (`/Users/nishkarsh/Direkta_inhouse`, a clone of
swotboysandy/direkta): **Claude is the backend** (parses/composes/syncs via the `direkta` stdio
MCP server), Direkta is the interface + `node:sqlite` store, generation is **keyless**. This
session: compared `main`/`nishkarsh` (new work was on `nishkarsh`, not `main`), merged the keyless
wins, built the **Codex fallback engine** (Claude/Codex parity) and the **free-generation
library-sync loop** (Codex Record-&-Replay), verified end-to-end in the browser, documented, and
pushed everything.

## Current state
**Works ✅ (tsc + next build clean; tsx round-trips; one live browser run):**
- Full front pipeline live in the browser — created project **"The Late Fare"** (`TMI9uo2VGk`) →
  `import_breakdown` → beats + Bible + **5 clarification cards** rendered; resolving one dropped it
  to 4 (propose-don't-commit confirmed).
- Keyless media merged from nishkarsh: Higgsfield-**account** image→video (Seedance) + PDF import (`unpdf`).
- **Codex fallback engine** (`lib/agents/fallback.ts`): `generateStructured` = Codex-if-connected →
  else AI-SDK vendor → text→JSON→Zod, feeding the SAME `importBreakdown`/`importShotlist` as Claude.
- **Library-sync** (`lib/agents/operator/sync.ts`): `write_worklist` → `worklist.json`; Codex saves
  `frame_<variant_id>.<ext>`/`clip_<node_id>.<ext>` to inbox; `sync_generations` copies to OSS +
  attaches. Round-trip tested.
- 10 MCP tools; **pushed to `origin/inhouse` @ f54865d**; docs written.

**Not verified ❓ (explicitly untested):**
- Actual **Codex network call** — needs `codex login` → `~/.codex/auth.json`; never run live.
- Real **Higgsfield generation** (spends credits) — not run.
- A real **Codex Record-&-Replay** browser session — no free-generator URL chosen, no skill recorded.
- `write_worklist`/`sync_generations` as live MCP tools — the connected server instance predates
  them; needs a **reconnect** to load all 10.
- Cosmetic: Bible-summary **Characters/Locations tiles show "—"** in `Screenplay.tsx` (data is fine).

## Locked decisions (incl. rejected — do not relitigate)
- `inhouse` = internal tool, **keyless only** (no per-user API keys). Public site (`main`/`nishkarsh`)
  keeps BYOK/paid paths.
- Architecture: **Claude chat = backend; Direkta = interface+store; the `direkta` MCP server = bridge.**
  **NOT** a server-side Agent SDK (it 401s outside the Claude host; retired).
- **Two engines, one core:** Claude primary (chat+MCP), **Codex fallback** (server, keyless ChatGPT).
  Both → `importBreakdown`/`importShotlist` + the same skills + Zod schema (parity).
- Media keyless: Higgsfield account via MCP (credits) **or** free **Codex R&R** browser loop
  (preferred). **NOT** Fal/OpenAI API keys internally.
- Codex R&R is real (macOS Codex app v26.616+, Computer Use, ChatGPT sub; intent-based `SKILL.md` →
  the per-shot prompt is a variable, so one recorded skill covers all shots).
- File convention: `frame_<variant_id>.<ext>` / `clip_<stitch_node_id>.<ext>` into the inbox.
- Per-shot coverage metadata lives on `row.style.shots[]`, **NOT** `variant.note` (review note).
- **Did NOT** adopt nishkarsh's UI refresh (dark mode/fonts/dashboard) or its thin beats-only Codex
  extract — kept our rich rule-file pipeline. Codex `lib/codex/*` adopted only as the fallback.
- Source of truth for agent logic: `~/direkta-scripting-test/agents/*.md` (mirrored in `data/skills/`).

## Open problems
1. **No free generator chosen** → `docs/CODEX_HANDOFF.md` has a `<FREE_GENERATOR_URL>` placeholder.
   *Hyp:* pick a free image-gen site with downloadable output, record `direkta-generate-image`.
2. **New MCP tools not live in-session** (`write_worklist`/`sync_generations`). *Hyp:* reconnect/
   restart the client reloads the rebuilt server (all 10 tools).
3. **No UI triggers** for the Codex server routes / worklist. *Hyp:* part of the deferred UI port.

## Next step (ONE)
Reconnect the `direkta` MCP server (restart the client), then drive a real script through
`create_project → import_breakdown → import_shotlist → write_worklist` and confirm `worklist.json`
lists the shots (the input the Codex worker consumes).

## Verify on pickup
```
git -C /Users/nishkarsh/Direkta_inhouse log --oneline -5
#  → f54865d, a1eaf15, 6316a4f, 4859402, 046d5ed
git -C /Users/nishkarsh/Direkta_inhouse status -sb            # → ## inhouse...origin/inhouse (in sync)
claude mcp get direkta                                        # → Status: ✓ Connected
cd /Users/nishkarsh/Direkta_inhouse && npx tsc --noEmit --incremental false   # → 0 errors
DATA_DIR=$PWD/data npm run dev                                # → http://localhost:3000
```

## File map (what the next session touches)
- `mcp/direkta-server.ts` — the 10 MCP tools (bridge).
- `lib/agents/operator/{sync.ts,generation.ts}` — worklist + ingest + import_generation/clip.
- `lib/agents/fallback.ts` — Codex/vendor structured generation.
- `lib/agents/screenplay/{schema.ts,import.ts}`, `lib/agents/cinematographer/{lookLock.ts,import.ts,shotlistSchema.ts}`.
- `app/api/projects/[id]/breakdown`, `app/api/storyboard/rows/[beatId]/shotlist` — Codex fallback routes.
- `docs/ARCHITECTURE.md`, `docs/CODEX_HANDOFF.md` — canonical docs.
- `app/_workspaces/Screenplay.tsx` — Bible-summary count tiles (cosmetic fix).
- `~/direkta-scripting-test/agents/*.md` — rule files (read-only source of truth).
