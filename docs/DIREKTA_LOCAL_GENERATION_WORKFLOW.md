# Direkta — Workflow & Local Image/Video Generation (for another chat)

This explains **how the Direkta in-house pipeline works** and **how to run image + video generation
locally** — the *workflow only*, not the Next.js website/UI. If you can read/write files in this repo
and run `tsx`, you can drive the whole thing.

---

## 1. The model (why it's inverted)
- **You (the chat/agent) are the "backend."** You do the reasoning — parse a script, compose coverage,
  author worklists. Direkta does **not** call an LLM.
- **Direkta is the interface + store:** a single-file **`node:sqlite`** DB under `DATA_DIR` (default
  `./data/zinema.sqlite`) plus a local `oss/` folder served at `/oss`.
- **The bridge is the `direkta` MCP server** (`mcp/direkta-server.ts`, stdio, run via `tsx`). It exposes
  ~10 tools. Everything is **keyless** — generation is either the user's Higgsfield *account* (credits)
  or a **free** generator you drive yourself (zero credits).

Two ways to call the pipeline:
- **A) MCP tools** — register the server, then call `create_project`, `import_breakdown`, etc.
- **B) Direct `tsx`** — import the same core functions from `lib/…` and call them. Use this when a
  payload is too big to hand-type into an MCP call (the breakdown/shotlist objects are large). Pattern:
  ```
  cd /Users/nishkarsh/Direkta_inhouse
  DATA_DIR=$PWD/data npx tsx -e "import('./lib/agents/screenplay/import').then(m => ...)"
  ```

Register the MCP server (once):
```
claude mcp add direkta -s user --env DATA_DIR=/Users/nishkarsh/Direkta_inhouse/data -- \
  /Users/nishkarsh/Direkta_inhouse/node_modules/.bin/tsx /Users/nishkarsh/Direkta_inhouse/mcp/direkta-server.ts
```

---

## 2. The pipeline (4 agents, one core)
| Stage | You produce | Persist via | Result in DB |
|---|---|---|---|
| **Screenplay** | a Movie Bible breakdown from the script (logline, synopsis, tone, world, characters w/ dense identity descriptors, locations, numbered **beats**, gaps) | `import_breakdown(project_id, breakdown)` | `projects`, `bible`, `characters`, `locations`, `beats`; gaps → `clarifications` |
| **Cinematographer** | per beat: a **look-lock** (palette/lighting/lens/editorial/motifs, byte-identical everywhere), cast identity, and a **shotlist** of 5-layer prompts | `import_shotlist(project_id, beat_id, look_lock, cast_identity, dramatic_point, coverage_rationale, shots[])` | `storyboard_rows` + `storyboard_variants` (one per shot, `state:"waiting"`) |
| **Operator** | generate each shot; sync results | `write_worklist` → generate → `sync_generations` (or `import_generation`) | assets attached to variants |
| **Director** | resolve gaps; pick winning frames; arrange the **Stitch board** (video) | `resolve_clarification`, stitch nodes | `stitch_nodes` |

The **10 MCP tools:** `list_projects`, `get_project`, `create_project`, `import_breakdown`,
`import_shotlist`, `get_shotlist`, `write_worklist`, `sync_generations`, `import_generation`,
`resolve_clarification`. (`get_project` returns the computed **look-lock** + **cast identity** + beats
with their ids — that's your Cinematographer input.)

Data shape (touchpoints): `projects → beats → storyboard_variants` (the shots) → chosen frames →
`stitch_nodes` (the clips) → `assets`. A **variant** = one image shot; a **stitch node** = one video clip.

---

## 3. IMAGE generation loop (concrete)
```
create_project(title, script, aspect_ratio)        →  project_id
import_breakdown(project_id, breakdown)            →  beats + Bible (+ clarifications from gaps)
get_project(project_id)                            →  look_lock, cast_identity, beat ids
import_shotlist(project_id, beat_id, …, shots[])   →  storyboard_variants (state "waiting")   [repeat per beat]
write_worklist(project_id)                         →  data/worklist.json
   → GENERATE each shot, save into data/inbox/ as  frame_<variant_id>.<ext>
sync_generations()                                 →  copy to data/oss, attach to variant, move file to inbox/_done
```

**`worklist.json`** (what a generator consumes) — `write_worklist` writes only the *pending* (not
`complete`) image shots:
```json
{ "project_id": "…", "count": 47, "inbox": "…/data/inbox",
  "items": [ { "id": "<variant_id>", "kind": "image", "beat": 3,
               "prompt": "<full 5-layer positive>", "negative": "…",
               "aspect": "16:9", "save_as": "frame_<variant_id>.png" } ] }
```

**The generation contract (this is the whole integration):**
- Read `worklist.json`. For each item, generate an image from `prompt` (use `negative`, `aspect`).
- Save the file into the **inbox** named **exactly** `save_as` = **`frame_<variant_id>.<ext>`**
  (`png`/`jpg`/`jpeg`/`webp`). The filename is the *only* link back to the shot — never rename.
- Run **`sync_generations()`** — it scans the inbox, matches `^(frame|clip)_<id>.<ext>$`, copies to
  `oss/`, attaches each `frame_` to its variant, and moves the file to `inbox/_done`.
- Alternative to inbox+sync: **`import_generation(variant_id, url)`** attaches an already-hosted image
  URL to a variant directly.

---

## 4. VIDEO generation loop (image → video)
Direkta's video is **image-to-video**: a chosen still frame (start image) + a motion prompt → a short
clip attached to a **stitch node**.
```
(pick winning frames, arrange them on the Stitch board → stitch_nodes)
author a VIDEO worklist:  for each stitch node → { node_id, start_frame (its chosen image), motion_prompt, aspect }
   → GENERATE each clip (image-to-video), save into data/inbox/ as  clip_<stitch_node_id>.<ext>
sync_generations()   →  attaches each clip_ to its stitch node (importStitchClip), copies to oss
```
Notes:
- `sync_generations` already handles **`clip_<stitch_node_id>.<ext>`** (`mp4`/`mov`/`webm`/`m4v`) →
  `importStitchClip(node_id, url)`. So the *ingest* side is done.
- **`write_worklist` only emits IMAGE shots** today — you author the **video** worklist yourself
  (list the stitch node ids + each node's start frame + a motion prompt). Then generate `clip_<node_id>.mp4`.
- Same filename law: the id in `clip_<id>` must be the **stitch_node_id**.

---

## 5. The two generation engines (pick either — both keyless)
1. **Higgsfield via the user's account (MCP)** — `lib/higgsfield/mcp.ts`. Image generation and
   **Seedance image-to-video** (`animate` a start frame → clip; default `seedance_2_0`; ratios
   `21:9/16:9/4:3/1:1/3:4/9:16`). Costs Higgsfield **credits**. Good when connected.
2. **Free Record-&-Replay (you drive any generator)** — the preferred zero-credit path. Drive **any**
   image/video generator (GPT Image 2, Nano Banana Pro / Gemini 3 Pro Image, a local diffusion model,
   ComfyUI, a local image-to-video model, etc.), download the output, and drop it in the inbox with the
   right name. **Direkta doesn't care which generator** — only the filename convention + `sync_generations`.

**To try it fully locally:** run any local image model → `frame_<variant_id>.png` in `data/inbox/`;
run any local image-to-video model on the chosen frames → `clip_<stitch_node_id>.mp4` in `data/inbox/`;
call `sync_generations()`. Done.

---

## 6. Gotchas
- **Big payloads:** `import_breakdown` / `import_shotlist` objects are large — produce them as JSON and
  call the core via `tsx` (Path B) rather than hand-typing an MCP call. Validate a breakdown with
  `z.object(breakdownShape).parse(obj)` (from `lib/agents/screenplay/schema`) before `importBreakdown`.
- **`import_breakdown` replaces** the whole breakdown (re-import re-mints beats → new beat ids, which
  would orphan existing shotlists). For a variant of a trailer, **create a new project** instead of
  re-importing over one that already has shotlists.
- **Look-lock is sacred:** pass the same computed `look_lock` (from `get_project`) into every
  `import_shotlist`, and embed it byte-identical as layer 4 of every shot prompt — that's what makes 47
  frames feel like one film.
- **State:** `write_worklist` only lists variants whose `state != "complete"`, so re-running it after a
  partial sync emits just the *remaining* shots. Skipped/failed generations are safe — regenerate and
  re-sync.
- **Paths:** `DATA_DIR` roots everything (`data/zinema.sqlite`, `data/worklist.json`, `data/inbox/`,
  `data/oss/`). `oss/` is served at `/oss` by `next dev` if you also want to see it in the UI (optional).

---

## 7. Minimal end-to-end (image + video), no website
```
# image
create_project → import_breakdown → (get_project) → import_shotlist×N → write_worklist
generate frames → data/inbox/frame_<variant_id>.png → sync_generations

# video (after choosing frames + building stitch nodes)
author video worklist (node_id + start frame + motion prompt)
generate clips → data/inbox/clip_<stitch_node_id>.mp4 → sync_generations
```
That's the entire workflow. The "brain" (script→breakdown→shotlist→worklists) is the chat's job; Direkta
just persists and ingests. Any local generator plugs in through the `frame_<id>` / `clip_<id>` + inbox +
`sync_generations` contract.
