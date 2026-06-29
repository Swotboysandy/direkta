# Direkta in-house — Handoff for CODEX (free-generation worker) · 2026-06-24

> You are the **free hands** of the pipeline: you generate media in a **free web UI** and drop
> named files into an inbox. Claude is the brain and owns all sync. Read `docs/CODEX_HANDOFF.md`
> (your full contract) once, then this page for the **live run state**.

## Context
Direkta in-house tool (branch `inhouse`, `/Users/nishkarsh/Direkta_inhouse`): **Claude = backend**
(parses/composes/syncs via the `direkta` MCP server), Direkta = interface + `node:sqlite` store,
generation is **keyless**. Right now Claude is mid-run on a real trailer script, **"Maurya Origins"**
(project `N6mmfZQ2qG`), driving `create_project → import_breakdown → import_shotlist → write_worklist`.

## Current state
- ✅ `create_project` done → **"Maurya Origins"** (`N6mmfZQ2qG`), script stored, aspect **2.39:1**.
- ⏳ Breakdown (Movie Bible + 12 beats incl. 2 montages + cards) being imported; the Cinematographer
  shotlist (look-locked 5-layer prompts → storyboard variants) is next.
- ⏭ `write_worklist(N6mmfZQ2qG)` will write **`data/worklist.json`** — your input — listing every
  pending shot as `{ id, kind, beat, prompt, negative, aspect, save_as }` + the `inbox` path.
- **Verified earlier (not this run):** the sync round-trip — Codex drops `frame_<variant_id>.<ext>`
  in the inbox → `sync_generations` copies to OSS + attaches to the variant. tsx round-trips clean.
- **NOT tested / not done:** a **real Codex Record-&-Replay browser session** (never run live); no
  **free-generator URL** chosen yet; `worklist.json` for this project **not written yet**; real
  Higgsfield generation (would spend credits) — not run.

## Locked decisions (do not relitigate)
- **Free UI only** — the whole point is **zero credits**. **NOT** a paid API (Fal/OpenAI), **NOT**
  Higgsfield credits for this loop.
- **Exact filenames, one file per item:** frames `frame_<id>.<ext>` (png/jpg/webp), clips (later)
  `clip_<stitch_node_id>.<ext>`. The filename is the **only** link back to the shot — never rename,
  renumber, or invent ids.
- **Nothing else goes in the inbox folder.** On a failed/refused generation, **skip it** and report
  the `id` — **never substitute a different image**. Claude re-issues skipped shots.
- **Boundaries:** you do **NOT** touch the DB, the dev server, OSS, or git. Claude owns all sync via
  the `direkta` MCP server. You only generate + save files.
- Record & Replay is intent-based: one recorded skill fills `prompt`/`negative`/`aspect` as
  **variables** per item, so **one** `direkta-generate-image` skill covers **every** shot.

## Open problems
1. **No free generator chosen** → `docs/CODEX_HANDOFF.md` still has a `<FREE_GENERATOR_URL>`
   placeholder. *Hyp:* director picks a free image-gen site with downloadable output; you record
   `direkta-generate-image` against it (paste prompt → set negative + aspect if supported → generate
   → download → save as `save_as` into the inbox).
2. **`worklist.json` not present yet for Maurya.** *Hyp:* it appears the moment Claude finishes
   `import_shotlist` + `write_worklist` — imminent; watch for Claude's "worklist ready — N shots".

## Next step (ONE)
Record the **`direkta-generate-image`** skill against the chosen free generator (URL pending from the
director) so it is ready the instant `data/worklist.json` lands — then run it over every
`kind:"image"` item, saving each download to `data/inbox/` as exactly its `save_as`.

## Verify on pickup
```
cat /Users/nishkarsh/Direkta_inhouse/docs/CODEX_HANDOFF.md        # your full contract
cat /Users/nishkarsh/Direkta_inhouse/data/worklist.json           # → "No such file" until Claude writes it;
                                                                  #   after Claude's signal → { items:[ {id,prompt,negative,aspect,save_as}, … ] }
ls  /Users/nishkarsh/Direkta_inhouse/data/inbox/                  # the drop folder (use the worklist's `inbox` path)
```

## File map (only what YOU touch)
- `data/worklist.json` — **READ** the batch (the shots to generate).
- `data/inbox/` — **WRITE** only `frame_<id>.<ext>`, one per item, nothing else.
- `docs/CODEX_HANDOFF.md` — **READ** your full role contract + the loop diagram.
- *(hands-off, Claude-owned: `data/zinema.sqlite`, the dev server, `/oss`, git.)*
