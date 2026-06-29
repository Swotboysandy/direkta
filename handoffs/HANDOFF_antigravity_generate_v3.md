# Handoff for ANTIGRAVITY — Generate the Kaliyug Trailer v3 keyframes (Nano Banana Pro)

> You are the **image-generation worker**, running in **Google Antigravity** (agent-first IDE/CLI with
> filesystem + browser control). Claude is the brain and owns all sync via the `direkta` MCP server.
> Read your contract once — `docs/CODEX_HANDOFF.md` (the role is identical) — then this page.

## Generator: Nano Banana Pro = **Gemini 3 Pro Image** — NOT Higgsfield
- Use the **image** model **Gemini 3 Pro Image** (consumer name **"Nano Banana Pro"**), API id
  **`gemini-3-pro-image-preview`**. *(Note: Antigravity's coding LLM is Gemini 3.1 Pro — that is NOT
  the image model. Generate the pictures with Gemini 3 Pro Image / Nano Banana Pro.)*
- Do **not** use the `direkta` Higgsfield path (that spends credits) and **no** paid third-party API.
- Two equivalent ways to run it — pick one:
  - **Scripted (preferred — you are a coding agent):** read `data/worklist.json`, loop the items in
    order, and for each call **Gemini 3 Pro Image** (`gemini-3-pro-image-preview`, via the Gemini API
    or `google-genai` SDK) with the item's `prompt` + `negative`, **aspect 16:9**, then write the bytes
    to the inbox as `frame_<id>.png`. One pass, fully automated.
  - **Browser (alternative):** drive the **Gemini app / Google AI Studio** with Nano Banana Pro selected,
    paste each prompt, set 16:9, download, save as `frame_<id>.png`.

## The batch is READY
- **Input:** `/Users/nishkarsh/Direkta_inhouse/data/worklist.json` — **47 prompts**, project
  **`LSKaw2WE4E`** (re-cut **trailer v3**), all 17 beats, already in screen order. Each item:
  `{ id, kind:"image", beat, prompt, negative, aspect:"16:9", save_as:"frame_<id>.png" }`.
- **Inbox (output):** `/Users/nishkarsh/Direkta_inhouse/data/inbox/` (exists, empty).
- **Look context (optional read):** `kaliyug/02_locked_visual_bible/kaliyug_game_art_direction.md`.

## The loop — IN ORDER (beat 1 → 17), for EACH item
1. Generate with **Gemini 3 Pro Image (Nano Banana Pro)** from the item's **`prompt`** (positive);
   apply **`negative`** and **aspect `16:9`**. Use the WHOLE prompt — it is long and self-contained
   (5-layer: framing · subjects/identity · setting · look-lock · mood).
2. Save into the inbox named **EXACTLY** the item's **`save_as`** (e.g. `frame_0HBM3Cml_3.png`) — the
   filename is the tag that links the frame to its shot/beat. **Never rename, renumber, or invent ids.**
3. One file per item, in order, through all **47**. When done, tell the director:
   **"Generation batch complete — run sync_generations."**

## The look (sanity-check each output)
Soulsborne-grade dark mythic; **Indo-Gothic** ruined Bharat (Hindu temple + colonial Victorian-Gothic +
prominent WWIII ruin, fused); desaturated, **one accent per frame** (crimson **or** blue-white);
**Kali is abstract** (empty throne / smoke / never a figure); **beat 10** is the only cosmic /
sacred-geometry dream — the deities are **reimagined but recognizable** (cosmic, not calendar art).
Reject anything that looks like clean sci-fi, neon cyberpunk, Goddess Kali, a horned demon, or flat
calendar god-art.

## Rules
- One file per item, into the inbox only, named exactly `save_as`. Nothing else in the inbox.
- On a **failed/refused** generation: **skip it**, report the `id`, move on — never substitute a different image. Claude re-issues skips.
- **Gemini 3 Pro Image (Nano Banana Pro) only** — never Higgsfield, never a paid third-party API.
- **Do NOT touch** the database, the dev server, OSS, or git. You only generate + save files.

## Verify on pickup
```
cat /Users/nishkarsh/Direkta_inhouse/docs/CODEX_HANDOFF.md     # the role contract
jq '.count, .project_id' /Users/nishkarsh/Direkta_inhouse/data/worklist.json   # → 47, "LSKaw2WE4E"
ls /Users/nishkarsh/Direkta_inhouse/data/inbox/                # the drop folder (empty until you generate)
```
