# Direkta — In-house Architecture (`inhouse` branch)

This branch runs Direkta as an **internal production tool**, not the public BYOK product. The
operating model is inverted from the website:

- **Claude (the chat session) is the backend.** It runs the rule-file agents (Screenplay,
  Cinematographer, Operator) — parsing, breakdown, coverage, and syncing — and reaches Direkta
  through a dedicated MCP server.
- **Direkta is the interface + store.** Next.js UI + a single-file `node:sqlite` DB. It renders
  what gets imported; it does **not** call an LLM itself.
- **The bridge is the `direkta` MCP server** (`mcp/direkta-server.ts`, stdio, run via `tsx`).
- **No per-user API keys.** Everything is keyless/subscription/account-based to minimise cost.

The public website (`main` / `nishkarsh`) keeps the BYOK / paid-vendor paths; those exist here
only as last-resort fallbacks.

---

## Two engines, one core (Claude primary, Codex fallback)

Both engines produce the **same artifacts** through the **same** persistence core
(`importBreakdown` / `importShotlist`), the **same** editable skills, and the **same** Zod schema.

| | Primary — Claude | Fallback — Codex |
|---|---|---|
| How | the chat session reasons, then calls MCP `import_*` | server route → `generateStructured` (keyless ChatGPT sub) → `import_*` |
| When | a human is driving Claude | unattended / in-app, no human in chat |
| Cost | Claude subscription | ChatGPT subscription |

`generateStructured` (`lib/agents/fallback.ts`) resolves **Codex-if-connected → else AI-SDK vendor
(last resort)**, parses text→JSON, and validates against the schema. Codex connection is keyless:
`/api/codex/import` reads `~/.codex/auth.json` from a `codex login` on the host.

---

## Media generation (image / video) — keyless

Two keyless options; **never** a paid vendor key for internal use:

1. **Higgsfield via the user's account over MCP** (`lib/higgsfield/mcp.ts`) — image + Seedance
   image-to-video. Costs Higgsfield **credits**.
2. **Codex Record & Replay — the free path** (preferred for cost). Codex drives a free generator's
   web UI and drops named files into an inbox; Direkta ingests them. Zero credits. See
   [`CODEX_HANDOFF.md`](CODEX_HANDOFF.md).

The free-generation loop:
```
write_worklist(project) → worklist.json   (id + prompt + negative + aspect per shot)
   → Codex R&R: generate in a free web UI → save inbox/frame_<variant_id>.<ext>
   → sync_generations() → copy to OSS, attach to the variant/stitch node → Direkta UI
```

---

## The `direkta` MCP server — tools

| Group | Tools |
|---|---|
| Read / setup | `list_projects`, `get_project`, `create_project` |
| Screenplay | `import_breakdown` (Bible + beats; gaps → clarifications) |
| Cinematographer | `import_shotlist` (look-locked coverage) |
| Operator | `get_shotlist`, `write_worklist`, `sync_generations`, `import_generation` |
| Director | `resolve_clarification` |

`get_project` also returns the computed **look-lock** + **cast identity** (for composing coverage)
and any pending **clarifications**.

---

## Pipeline stages
1. **Screenplay** — script → 9-section Movie Bible + numbered beats + per-character dense identity
   descriptor; unanswered questions become **clarifications** (propose-don't-commit) shown in the UI.
2. **Cinematographer** — per beat: a sacred **look-lock** + verbatim **cast identity** + multishot
   **5-layer** prompts (the shotlist), persisted as storyboard variants.
3. **Operator** — generate each shot (Higgsfield credits **or** free Codex R&R) and sync the assets
   back onto their variants / stitch clips.
4. **Director** — resolves gaps in the browser; selects winning frames; arranges the Stitch board.

Source of truth for agent behaviour: the rule files in
`~/direkta-scripting-test/agents/{screenplay,cinematographer,higgsfield}-agent.md`, mirrored as the
editable in-app skills `data/skills/{screenplay,cinematography}.md`.

---

## Data model touchpoints
`projects` (+ Movie-Bible fields, `script_ai_generated`), `bible` (tone/themes/world/visual
language), `characters` (+ `identity_descriptor`), `locations`, `beats`, `storyboard_rows`
(`style.shots[]` = per-shot coverage metadata, `look_lock`, `cast_identity`), `storyboard_variants`
(the frame prompts/assets), `stitch_nodes` (clips), `clarifications` (gaps), `assets`,
`codex_connection`, `higgsfield_connection`.

---

## Run it
```bash
# 1. dev server (shares ./data with the MCP server)
cd /Users/nishkarsh/Direkta_inhouse && DATA_DIR=$PWD/data npm run dev   # http://localhost:3000

# 2. register the MCP server (once), then reconnect the client
claude mcp add direkta -s user --env DATA_DIR=/Users/nishkarsh/Direkta_inhouse/data -- \
  /Users/nishkarsh/Direkta_inhouse/node_modules/.bin/tsx /Users/nishkarsh/Direkta_inhouse/mcp/direkta-server.ts

# 3. (optional fallback) connect Codex on the host
codex login --device-auth   # then POST /api/codex/import

npm run typecheck && npm run build   # both clean
```
> Note: after editing `mcp/direkta-server.ts`, reconnect the client so it reloads the new tools.

---

## Status
- ✅ Verified (tsc + build + tsx round-trips): breakdown import, shotlist + look-lock, clarification
  resolve, Codex-fallback parse+persist, library-sync ingest. Browser run confirmed end-to-end
  (script → import → beats + Bible + clarification cards in the UI).
- ❓ Not run live: actual Codex network call (`~/.codex/auth.json` required), real Higgsfield
  generation, and a real Codex Record-&-Replay browser session against a chosen free generator.
- TODO: pick the free generator URL (`CODEX_HANDOFF.md`); port the UI refresh from `nishkarsh`
  (dark mode / fonts / dashboard); UI triggers for the Codex server routes; fix the Bible-summary
  Characters/Locations count tiles in `Screenplay.tsx`.
