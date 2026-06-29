# Handoff for CODEX — Generate the Kaliyug Trailer v3 keyframes

> You are the **free-generation worker**. You generate each shot in a **free web UI** and drop named
> files into an inbox. Claude is the brain and owns all sync via the `direkta` MCP server. Read your
> full contract once — `docs/CODEX_HANDOFF.md` — then this page for the live batch.

## The batch is READY
- **Input:** `/Users/nishkarsh/Direkta_inhouse/data/worklist.json` — **47 prompts**, project
  **`LSKaw2WE4E`** (the re-cut **trailer v3**), all 17 beats. Each item:
  `{ id, kind:"image", beat, prompt, negative, aspect:"16:9", save_as:"frame_<id>.png" }`.
- **Inbox (output):** `/Users/nishkarsh/Direkta_inhouse/data/inbox/` (created, empty).
- **Context for the look (read for fidelity, optional):** `kaliyug/02_locked_visual_bible/kaliyug_game_art_direction.md`.

## The job (the whole loop)
For **each** item in `worklist.json` (`kind:"image"`):
1. Open the **free image generator** *(director: confirm the URL — a free web UI with downloadable
   16:9 output)*.
2. Paste the item's **`prompt`** as the positive; set the **`negative`** and **aspect `16:9`** if the UI supports them.
3. Generate, download, and **save the file into the inbox named EXACTLY the item's `save_as`** (e.g. `frame_0HBM3Cml_3.png`).
4. When the batch is done, tell the director: **"Generation batch complete — run sync_generations."**

The prompts are long and self-contained (5-layer: framing · subjects/identity · setting · the look-lock
block · mood). They already encode the aesthetic — **generate them faithfully, paste the whole prompt.**

## The look you're producing (so you can sanity-check outputs)
Soulsborne-grade dark mythic; **Indo-Gothic** ruined Bharat (Hindu temple + colonial Victorian-Gothic +
prominent WWIII ruin, fused); desaturated, **one accent per frame** (crimson **or** blue-white);
**Kali is abstract** (empty throne / smoke / never a figure); **beat 10** is the only cosmic/sacred-geometry
dream — the deities are **reimagined but recognizable** (cosmic, not calendar art). Reject anything that
looks like clean sci-fi, neon cyberpunk, Goddess Kali, a horned demon, or flat calendar god-art.

## Rules (the whole job)
- The **filename is the only link back to the shot** — never rename, renumber, or invent ids. **One file per item.** Nothing else goes in the inbox.
- **Free UI only — zero credits.** Never a paid API, never Higgsfield credits.
- On a **failed/refused** generation: **skip it**, report the `id`, move on — never substitute a different image. Claude re-issues skips.
- **Do NOT touch** the database, the dev server, OSS, or git. You only generate + save files.

## Verify on pickup
```
cat /Users/nishkarsh/Direkta_inhouse/docs/CODEX_HANDOFF.md     # your full contract
jq '.count, .project_id' /Users/nishkarsh/Direkta_inhouse/data/worklist.json   # → 47, "LSKaw2WE4E"
ls /Users/nishkarsh/Direkta_inhouse/data/inbox/                # the drop folder (empty until you generate)
```

## Open blocker
The **free-generator URL** is the one thing to confirm with the director. Record the
`direkta-generate-image` skill against it once (prompt/negative/aspect are per-item variables, so one
recorded skill covers all 47), then run it over the worklist.
