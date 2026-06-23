# Codex — Generation Worker Handoff

You are the **free generation worker** for Direkta's in-house pipeline. Read this once to
understand your role, then record two skills. You never write to the database or the website —
you only **generate media in a free web UI and drop named files into a folder.** Claude (the
operator) does everything else.

---

## The pipeline and your place in it

```
director gives Claude a script
  └─ Claude: parse → import_breakdown ............... Movie Bible + beats        (Direkta DB)
  └─ Claude: compose coverage → import_shotlist ..... look-locked frame prompts  (Direkta DB)
  └─ Claude: write_worklist ......................... worklist.json (the shots to generate)
        │
        ▼
  >>> YOU (Codex Record & Replay): read worklist.json → generate each shot in a FREE web UI
      → download → save into the inbox as the exact filename given <<<
        │
        ▼
  └─ Claude: sync_generations ....................... files attach to their shots → Direkta UI
```

Why you exist: generating through Direkta's Higgsfield MCP path **costs credits**. You drive a
**free** generator's web UI on the director's ChatGPT subscription instead — zero per-image cost.

---

## The contract (this is the whole job)

**Input** — a JSON file Claude writes before each batch:

- Path: `<DATA_DIR>/worklist.json` → on this machine: `/Users/nishkarsh/Direkta_inhouse/data/worklist.json`
- Shape:
  ```json
  {
    "project_id": "…",
    "count": 4,
    "inbox": "/Users/nishkarsh/Direkta_inhouse/data/inbox",
    "items": [
      { "id": "owqoIXNRnu", "kind": "image", "beat": 1,
        "prompt": "<full positive prompt>", "negative": "<negative prompt>",
        "aspect": "2.39:1", "save_as": "frame_owqoIXNRnu.png" }
    ]
  }
  ```

**For each item** — generate one image from `prompt` (use `negative` as the negative prompt and
`aspect` as the aspect ratio if the UI supports them), download it, and **save it into the
`inbox` folder named EXACTLY the item's `save_as`** (e.g. `frame_owqoIXNRnu.png`).

**Output** — files in the inbox folder:
- Frames: `frame_<id>.png` (or `.jpg` / `.webp`)
- Clips (video stage, later): `clip_<stitch_node_id>.mp4` (or `.mov` / `.webm`)

The filename is the only link back to the right shot — **do not rename, renumber, or invent ids.**
One file per worklist item. If a generation fails or is refused, **skip it** and move on (Claude
will re-issue it); never substitute a different image.

When the batch is done, tell the director: *"Generation batch complete — run sync_generations."*

---

## Skills to record (once, on the macOS Codex app)

Requires: macOS, Codex app v26.616+, **Computer Use enabled** (Settings), a logged-in account on
the free generator, and a ChatGPT Plus/Pro/Business/Enterprise/Edu plan (outside EEA/UK/CH).

1. **`direkta-generate-image`** — demonstrate the loop once:
   read the next item from `worklist.json` → open **`<FREE_GENERATOR_URL>`** *(director: fill this
   in — the free image generator's web UI)* → paste `prompt` → set the negative prompt and aspect
   if available → generate → download → save the download into the `inbox` folder as `save_as`.
   The skill should iterate over all `items` of `kind: "image"`.

2. **`direkta-generate-video`** *(video stage — record later)* — open the free **video** generator
   → provide the start frame → paste the motion prompt → generate → download → save as
   `clip_<stitch_node_id>.mp4` in the inbox.

Because Record & Replay captures *intent* (a `SKILL.md`), the prompt is a **variable** filled per
run — the same recorded skill handles every shot.

---

## Boundaries
- **Generate + save files only.** Do not touch Direkta's database, the dev server, OSS, or git —
  Claude owns all sync via the `direkta` MCP server.
- **Exact filenames**, one per item, into the inbox folder. Nothing else goes in that folder.
- **Free UI only** — the point is zero credits. Don't fall back to a paid API.
- Skipped/failed shots are fine; report which `id`s you skipped.

---

## How the director triggers a run
1. Paste a script to **Claude**: *"parse this and run the pipeline."*
2. Claude parses → `import_breakdown` → `import_shotlist` → `write_worklist` (writes `worklist.json`).
3. Claude says: *"worklist ready — N shots."* → **you** run the `direkta-generate-image` skill.
4. You finish → Claude runs `sync_generations` → frames appear in Direkta's Storyboard/Library.
5. (Later) frames are arranged on the Stitch board → Claude writes a video worklist → you run
   `direkta-generate-video` → Claude syncs the clips.

That's it — Claude is the brain and the sync; you are the free hands that make the pixels.
