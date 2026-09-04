# Fylmer — Interior rebuild tasks (Phases 6–11)

Each task below is handed to one agent as its whole brief, together with the
**Contract** section. The owner reviews every result through the visual gate
before it merges. Read [FYLMER_BRIEF.md](./FYLMER_BRIEF.md) and
[FYLMER_AUDIT.md](./FYLMER_AUDIT.md) first; the section numbers cited are
theirs.

---

## Contract — applies to every task

**What already exists, and you build on it, never around it**

- Shell: `app/page.tsx` owns project/bundle/gate/mode state and mounts the
  workspaces. The top bar, stage strip (`StageStrip.tsx`), Director Dock
  (`DirectorDock.tsx`) and inspector shell (`Inspector.tsx`) are done. Your
  workspace renders inside `<main class="main">` and must not add its own
  fixed or sticky chrome.
- Tokens: `app/_brand/tokens.css` — use the semantic names
  (`--surface-*`, `--text-*`, `--border-*`, `--brand-*`, `--status-*`,
  `--r-control/surface/overlay`, `--z-*`). Never a hex literal, never a
  pill unless it is a chip or tag.
- Primitives in `app/_components/ui/`: `Button`, `IconButton` (label
  required), `Dialog`, `AlertDialog` + `useConfirm()`, `Sheet`, `Tooltip`,
  `Status` (the only status vocabulary), `EmptyState` (title, why, action —
  all required), `InlineError`, `Skeleton`, `MediaTile` (hover-after-intent,
  one playing at a time), `prompt-input`.
- Icons: `app/_components/icons.tsx` only. Never import an icon library.
- Selection: `useSelection()` from `app/_state/selection.tsx`. Call
  `select({kind, id, label, projectId})` wherever the workspace already tracks
  a selection. Register an inspector body with
  `registerInspector(kind, Component)` from `Inspector.tsx`; the shell places
  it, resizes it and turns it into a sheet below 1280px.
- Stage names: `STAGE_LABELS` from `app/_lib/stages.ts`. Internal ids stay.
- Motion: `framer-motion` via `app/_components/motion.ts` presets; transform
  and opacity only; under 200ms for feedback; nothing decorative.

**Where your code goes — so five of you can work at once**

- Your stylesheet is `app/_brand/stage-<name>.css` (script, world, storyboard,
  shots, cut). It is already imported. Do not edit `globals.css`,
  `components.css`, `tokens.css`, `page.tsx`, `icons.tsx`, or anything under
  `ui/` — if a primitive is missing, build it inside your workspace file and
  say so in your report.
- Do not add dependencies.

**What must keep working — the audit's §3 contracts**

Every fetch the old workspace made, you make with the same route, method and
body; every response field it read, you read. The list is in
FYLMER_AUDIT.md §3 and in the per-workspace facts of the audit journal. In
particular: Screenplay and Casting are always mounted (`display:contents`) —
do not break that; Casting batches are sequential and halt on 402; a
storyboard re-roll deletes prior variants (confirm it); beats/extract wipes
beats (confirm it); `POST animate` needs `canStart === true` from
`/api/minimax-h3/preflight` before the Generate button is enabled, and shows
the estimate beside it (brief §25).

**How you finish**

1. `npx tsc --noEmit` clean · `npm run test:h3` 34/34 · `npm run build` clean.
2. Zero `style={{` in the workspace except for values that are genuinely
   dynamic (a width from data, an image URL). Count before and after; report
   both.
3. Every empty state is an `EmptyState` with an action. Every error sits
   next to the action that caused it.
4. Every icon-only button has a label. Every locked or disabled control says
   why (tooltip or inline).
5. No text can clip: long titles ellipsize inside a `min-width: 0` track or
   wrap; nothing uses `white-space: nowrap` on prose.
6. Do not deploy. Report what changed, what you verified, and what you could
   not verify. The owner deploys and runs the screenshot sweep at 1440 and
   1280 (`/home/claudebot/direkta/.sweep.cjs`) and sends fixes back.

---

## Task 6 — Script (`app/_workspaces/Screenplay.tsx`, 758 lines, 53 inline styles)

Brief §21–22. Audit facts: Screenplay section of the workspace map.

Keep: 800ms autosave `PATCH /api/projects/{id} {script}`; streaming
`generate` and `enhance` readers (text/plain, not JSON) and the PATCH that
persists them; PDF import (`multipart file` → `{text}`); the 50-word submit
gate → `POST script/submit` → auto `POST beats/extract`; unlock via
`PATCH {script_submitted:false}` behind `useConfirm`; `ProjectRules`; the
bible modal trigger.

Build:
- A screenplay surface, not a textarea: monospace, scene headings detected
  and styled (`INT./EXT.` lines), character cues centred-ish, dialogue
  indented — done with CSS on a `contenteditable`-free approach: a textarea
  for editing plus a rendered view that toggles, or a lightweight
  line-classifier that styles the textarea's mirror. Do not pull in a rich
  editor library.
- A scenes/beats outline as a left column (250px) that scrolls with the
  script and jumps on click; after submission it lists beats with cast and
  location chips.
- Selection: selecting text in the script sets `select({kind:'scene', …})`
  with the selected passage as `label` (truncated), so the Dock's context
  reads it.
- Beat cards after extraction: number, title, heading, summary, cast, location,
  mood; a beat is selectable (`kind:'beat'`).
- Replace the corkboard's tilted cards with a plain grid; drop `TILTS`.
- Empty state when there is no script: what a script is here, why it is
  empty, action "Write the script" / "Import a file".
- Missing text model (see memory `text-model-blocker`): when generate/enhance
  return 503/502, show an `InlineError` beside the button naming the Key
  Vault, not a toast.

## Task 7 — World (`app/_workspaces/Casting.tsx`, 1,895 lines, 100 inline styles)

Brief §23–26. Audit facts: Casting section.

Keep: every route in the audit's Casting entities table (characters,
locations, props, portrait/plate, upload-*, import, PATCH/DELETE); the
sequential `BatchGenerate` with stop-before-next and the 402 halt; abstract
characters excluded from Soul ID totals; `CharacterEditModal` fields and
bodies; `AddModal` bodies.

Build:
- Three sections — Characters, Locations, Props — as image-led tiles
  (portrait 3:4 for people, 16:9 for places and props), compact metadata
  under the image, not SaaS cards with borders and shadows. `MediaTile` for
  the image.
- Names: **Soul ID** (character), **World ID** (location), **Object ID**
  (prop). The storage is identical (`refs`, `soul_id_state`); the label is
  what changes.
- A tile is selectable (`kind:'character' | 'location' | 'prop'`). Register
  inspector bodies for all three: identity fields (edit in place — the
  modal's fields move here), the locked reference large, a reference board
  of the other refs, "Clear looks" and "Delete" behind `useConfirm` with the
  brief's impact copy ("Replacing X's Soul ID may make N existing shots
  visually inconsistent" — N from `/api/projects/{id}/stitch` nodes whose
  `beat.characters` includes the name).
- Delete `HoverButton`/`HoverDiv`; hover is CSS.
- The `14_400` token constant becomes one import from a shared place.
- Style DNA: a fourth section that edits the project's `style_template`,
  `continuity_lock`, `set_lock`, `avoid_prompt` via `PATCH /api/projects/{id}`
  as labelled fields (Visual references / Continuity rules / Set rules /
  Avoid), replacing `ProjectRules`' role here. Keep `ProjectRules` in Script.

## Task 8 — Storyboard (`app/_workspaces/Storyboard.tsx`, 2,032 lines, 57 inline styles)

Brief §27–28. Audit facts: Storyboard section.

Keep: `GET storyboard` shape; `PATCH rows/{beatId} {style}` merge; `POST
rows/{beatId}/generate {variants, prompt}` with the optimistic `pending-*`
placeholders and `locked_*` toast; `prompt` route; `select` + `POST
/api/stitch/nodes {variant_id}` pair for Add to Shots; `PATCH variants/{id}`
approvals `approved|needs_work|pending`; `defaultPromptFor` and the
hand-edit guard; roll-all and stitch-all sequential loops with stop; the
`FrameLightbox` review flow (approve / send back / next pending /
regenerate).

Build:
- Filmstrip by beat with density switch **Overview / Frames / Detail**
  (segmented control, not pills).
- Each beat row: number, title, heading, cast chips (Soul IDs present as
  small portraits), World ID chip, framing/lens tags, approval `Status`.
- The 3×3 framing picker drawn as a frame: a 16:9 rectangle with nine
  regions, the chosen one highlighted; shot presets ECU CU MCU MS MLS WS EWS
  OTS POV populate `shot_size`/`camera_angle`/`lens` and stay editable.
- Frame selection sets `select({kind:'frame'})`; register an inspector body
  showing the frame large, prompt (editable → PATCH), camera fields, approval
  buttons, "Add to Shots", "Regenerate row" (behind `useConfirm` because it
  deletes variants).
- `FrameLightbox` becomes `MediaFocus` on the shared primitive: Escape
  closes, arrows move between takes.
- Re-roll confirms via `useConfirm` ("Rolling again replaces the 4 takes for
  this beat").
- Hard-coded `data-flagged` heuristic goes.

## Task 9 — Shots (`app/_workspaces/Stitch.tsx` timeline half + `StitchInspector`, `StitchNodeCard.tsx`)

Brief §29–31. Audit facts: Stitch section. This task owns the **Shot Desk**;
Task 10 owns the timeline/graph.

Keep: `GET stitch` shape; `PATCH nodes/{id}` (duration/trim on release,
scene_number); `POST animate` body and the `canStart` gate through
`H3Controls`; `upload-clip`, `dialogue`, `lipsync`, `frame` routes;
`H3LiveMonitor` + `ClipFrameTools`; balance reload after animate.

Build:
- A **shot strip** (the filmstrip) where each shot shows its frame or clip
  poster, number, duration, and a `Status` (generation domain) — never
  "Pending" on a shot that has a clip.
- Selecting a shot sets `select({kind:'shot', label:'Shot 07'})` and the
  **Shot Desk** is the registered inspector body: large preview (clip if
  present, else frame), take strip (the clip and any lipsync/upload
  versions), references (Soul/World IDs from `beat.characters`/location),
  direction (prompt), camera (motion select), audio, the recipe collapsed
  (model, duration, seed if known from `assets.meta`, settings), continuity
  row (prev/next shot thumbnails with "use previous last frame" wired to
  `continuityMode:'continue'`), and **Generate** with the estimate beside it.
- Extract the inspector out of `Stitch.tsx` into
  `app/_components/inspectors/ShotInspector.tsx`; remove the absolute
  `<motion.aside>` and its `bottom: 206` offsets.
- Theme-blind hex in the strip and node card go.

## Task 10 — Cut (`Stitch.tsx` timeline + graph views)

Brief §32–33. Keep the React Flow graph as an alternate view; the default is
the film timeline.

Keep: rAF playhead, scrub, monitor `<video>` sync, `PX_PER_SEC`, order by
`beat.n` then `x`, node drag → `PATCH {x,y}`, transitions read-only.

Build:
- Timeline: thumbnails per shot (poster), duration labels in mono
  tabular-nums, transition marks between shots, playhead, ruler. Trim handles
  on a selected shot that commit on release. Reorder by drag with a keyboard
  alternative (select + `[`/`]` to move) — writes `scene_number`.
- Audio lane placeholder only if there is a score attached
  (`GET score.attached`).
- Selecting a clip in the timeline is the same `kind:'shot'` selection as
  Task 9; the Shot Desk serves both.
- Delete node → `useConfirm` (already done for the inspector; keep it).

## Task 11 — Finish (`app/_workspaces/Export.tsx`, 458 lines, 32 inline styles)

Brief §11 "Finish". Keep: `POST render` and its result fields; score
GET/POST/DELETE; final-video GET pre-populate.

Build:
- One column, not four cards: the cut (large `<video>` in the project's
  aspect), then a row of facts (shots, duration, titled, scored, audio) as
  `Status` chips, then **Render** as the primary action with a plain
  sentence of what it does, then the score attach row.
- Remove the three "Coming soon" placeholder cards entirely (brief §78: no
  fake functionality). If the storyboard PDF / shot list / bible exports are
  wanted later they get built, not previewed.
- After a render, insert an asset row so the master shows in Assets
  (`assets` with `target_kind 'sequence'`, `kind 'video'`, `prompt 'Master —
  <title>'`) — one small addition in `render/route.ts` after the file is
  written.

---

## Review gate (owner)

For each returned task: read the diff; run the three checks; deploy; run
`.sweep.cjs`; open the workspace screenshots at 1440 and 1280 plus the
inspector open on a selection; check the brief §81 list; send back anything
that clips, wraps, hides cost, or breaks a contract.
