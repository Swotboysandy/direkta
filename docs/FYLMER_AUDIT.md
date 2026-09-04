# Fylmer — Phase 1 Audit and Work List

Companion to [FYLMER_BRIEF.md](./FYLMER_BRIEF.md). Written 2026-09-04 against
commit `58645d9`. Every claim carries a `file:line`; verify before relying on
it if the file has moved.

The brief's Section 2 asks for thirteen maps before anything is touched. They
are below, followed by the break risks the restructure creates, the gaps
between what exists and what the brief describes, and the work list for
Phases 2 and 3 as discrete, delegable tasks with acceptance criteria.

---

## 1. Current shell

`app/page.tsx` (613 lines) is the whole application shell: one client
component owning `projectId`, the project bundle, gate counts, the active
workspace, and every modal.

| Concern | Where | Detail |
|---|---|---|
| Routing state | `page.tsx:94-128` | `activeWorkspace` in state; `?p=<id>&ws=<workspace>` written with `history.replaceState`; `localStorage["fylmer:last-project"]` |
| Initial load | `page.tsx:101-118` | `?p` → localStorage → first project → else New Project modal |
| Bundle | `page.tsx:161-193` | `GET /api/projects/{id}` → `{project, bible, beats, characters, locations, props, activity}` then `GET .../agents` |
| Gate poll | `page.tsx:134-154, 197-201` | `GET storyboard` (variants with `asset_url`), `GET stitch` (`nodes.length`), `GET final-video` (`attached`); every 15 s and on every switch. **Only source of unlock counts.** |
| Lock chain | `page.tsx:222-233` | casting ⇐ `script_submitted`; storyboard ⇐ + `characters>0`; stitch ⇐ + `frames>0`; export ⇐ + `stitchNodes>0 ‖ hasFinalVideo` |
| Lock enforcement | `page.tsx:292-309` | `switchWorkspace` refuses silently; snap-back to dashboard after `gateLoaded` |
| Always-mounted | `page.tsx:502-525` | Screenplay and Casting hidden with `display:contents/none` so streaming script generation and batch portraits survive navigation |
| Code-split | `page.tsx:23-26` | Storyboard, Stitch, Library, Export via `dynamic(..., {ssr:false})`; Stitch pulls `@xyflow/react` |
| Layout | `globals.css:1668-1674` | `.app-body` grid `var(--rail-w) minmax(0,1fr) var(--agent-w,0)`; `--agent-w: 380px` when `data-agent=true` |
| Rail | `Rail.tsx` | 56 px glyph column; renders `Lock` at 30 % opacity for locked stages; **never renders `lockReason`** (`Rail.tsx:69-93`) |
| Top bar | `TopBar.tsx` | brand · project switcher (with delete) · search · H3 chip polling `/api/minimax-h3/status` every 60 s · agent/skills/keys/theme |
| Composer dock | `page.tsx:543-557`, `globals.css:1465-1472` | second grid row under `<main>`; `GenerationMonitor` + `Composer`; compose = `POST compose {prompt}` → `POST animate {model:'minimax_h3', refs}` (`page.tsx:363-399`) |
| Agent panel | `page.tsx:560-570` | 380 px right column, toggled; parses `/api/chat` SSE (`AgentPanel.tsx:83-108`); `onUsePrompt` seeds the composer |
| Refresh signal | `page.tsx:80` | `assetsVersion` counter, bumped on finish, read by `AssetCanvas` |
| Modals | `page.tsx:573-610` | KeyVault, Skills, MovieBible (never opened — dead path `:98`), NewProject, CoDirectorOverlay, CommandPalette (cmdk) |

`WorkspaceId` is the union `dashboard|screenplay|casting|storyboard|stitch|library|export`
(`lib/types/index.ts:49-56`). It is used as the `?ws=` value, in `Rail`
`ICONS/ORDER`, in `CommandPalette`, `CoDirectorOverlay`, and as string literals
inside every workspace's `onSwitchWorkspace(...)` call
(`Screenplay.tsx:449`, `Casting.tsx:335`, `Storyboard.tsx:645`,
`Stitch.tsx:443`, `Dashboard.tsx:91-93`, `Library.tsx:27-29`) and in
`AssetCanvas` empty-state copy (`AssetCanvas.tsx:33-75`).

## 2. Workspace interiors

All in `app/_workspaces/`. Sizes and inline-style density (the dominant debt):

| Workspace | Lines | `style={{` | Becomes | Notes |
|---|---|---|---|---|
| Dashboard | 189 | 3 | Production Home | title + `AssetCanvas` + activity + crew panels |
| Screenplay | 758 | 53 | Script | textarea editor; 800 ms autosave PATCH; streaming generate/enhance; PDF import; submit → auto beat extraction; split/board views; tilted corkboard |
| Casting | 1,895 | **100** | World | characters/locations/props grids; `HoverButton/HoverDiv` re-implement `:hover` in JS (`:50-91`); sequential batch with 402 halt; inline-styled edit/add modals |
| Storyboard | 2,032 | 57 | Storyboard | rows × 4 frame slots; BeatEditor (prompt, cast chips, six camera selects, shot recipes, 3×3 framing, lens picker, takes 1/2/4); FrameLightbox review; `BottomStrip` `position:fixed` with **undefined `--sb-w`** falling back to 240 px (`globals.css:2830`) and `paddingBottom:200` hack (`:652`) |
| Stitch | 1,502 (+StitchNodeCard) | 86 (+16) | Shots + Cut | timeline (rAF playhead, scrub, filmstrip) and React Flow graph; **absolute 320 px inspector** (`:982-1001`) — seed for the contextual inspector; hard-coded hex `#0B0B0D/#060607/#EDE8DC` theme-blind; `calc(100vh - 64px - 230px)` inline height (`:449`) |
| Library | 48 | 0 | Assets | `AssetCanvas` only |
| Export | 458 | 32 | Finish | render/score/final-video; three "Coming soon" placeholder cards |

Cross-cutting: `--r-pill` used ~60× in CSS and inline in every workspace;
native `confirm()` in six places (`Screenplay:584`, `Casting:194,1013,1026`,
`Stitch:527`, `StitchNodeCard:64`); hard-coded `14_400` token cost in four
places; batch stop-after-current implemented twice; open-routing duplicated
(`Dashboard:90-94`, `Library:24-30`); eyebrow numbering inconsistent.

## 3. API surface — 68 routes

46 method/path pairs are called by the UI; 22 are not (legacy canvas
nodes/edges, library, usage, higgsfield/browser, tools, test-gen, mcp, several
DELETE siblings). Full table in the audit journal; the contracts the shell
depends on:

- **Bundle** `GET /api/projects/{id}` → `{project, bible, beats, characters, locations, props, activity, nodes, edges}` (`projects/[id]/route.ts:15-25`)
- **Gates** as above. Stitch order is `ORDER BY x, y` (`stitch/route.ts:66`; `render/route.ts:133`) — **a new Cut UI must keep writing `x` or `scene_number`** (x = `(scene-1)*280+80`, `stitch/nodes/route.ts:52`).
- **Compose** `POST /api/projects/{id}/compose {prompt, duration?}` → `{node_id}` creates a stitch node with `beat_id NULL`, `direction=prompt` (`compose/route.ts:52-60`); client must then call animate.
- **Animate** `POST /api/stitch/nodes/{id}/animate` — the video route. Body `{model, motion, audio, refs?[≤9 {title,url,refKind}], continuityMode?, endFrame?, durationSeconds?, dryRun?}`. Preflight → `H3BudgetError` → **402 `{error, budget}`**; pod started only after `canStart` (`lib/agents/minimax-h3.ts:425-426`). Success inserts `assets` with `target_kind 'stitch_clip'` and meta `{provider, settings, actual, continuity}` (`animate/route.ts:477-481`). `dryRun` returns prompt/settings/references with no DB write.
- **Streams**: `POST /api/chat {project_id, message}` → SSE `data:` frames, union `layer|delta|plan|node|edge|supervision|error|done` (`lib/agents/orchestrator.ts:35-42`); `GET /api/minimax-h3/stream` → server-side WebSocket to `${proxyBase()}/ws?clientId=H3_CLIENT_ID` relayed as **named** SSE events (`open`, ComfyUI `status/progress/executing/executed`, `preview` base64, `error`), 15 s heartbeat.
- **H3 status** `GET /api/minimax-h3/status` → `{ok, podId, podStatus, warm, balanceUsd, hourlyRateUsd, canStart, estimatedCostUsd}`; never throws. `POST /api/minimax-h3/preflight {shotCount, aspectRatio, durationSeconds}` → estimate + `promptExpansionAvailable`; never starts a pod.
- **Assets** `GET /api/projects/{id}/assets?kind&limit&q&favourite&cursor` → `{items, next_cursor, total}`. **Only joins `storyboard_variant` and `sequence` targets** (`assets/route.ts:42-54`) — `stitch_clip` assets are invisible to the canvas, and render masters are never recorded at all.
- **Destructive server behaviours**: `beats/extract` wipes all beats (cascades to rows, variants, stitch nodes) (`:154`); storyboard re-roll deletes prior variants and their assets (`generate/route.ts:300-303`); `characters PATCH {refs:[]}` clears looks. Protected/simulated outcomes return **HTTP 200 with `ok:false`** — read the body, not the status.
- **OAuth return** `/api/higgsfield/callback` redirects to `/?higgsfield=connected|error&reason=` — the root must keep tolerating these.
- **Media** `/oss/<file>` with Range → 206 (`app/oss/[file]/route.ts:40-60`); required for `<video>` seeking.
- **MCP** `/api/mcp` JSON-RPC for external clients; must not move.

## 4. Data model (from `lib/db/client.ts`)

24 tables on `node:sqlite`, `PRAGMA foreign_keys = ON`, child tables cascade
on `project_id`. `assets` is polymorphic — `target_kind ∈ storyboard_variant |
stitch_clip | sequence | beat` + `node_id` — with **no foreign key to
projects**; `projects.delete` now clears them explicitly (`repo.ts:205-222`).
`characters`, `locations`, `props` share the shape `{refs[], soul_id_state
'empty|training|trained|failed', soul_id_progress, consistency}` — so
**World ID and Object ID already have their storage**; only the presentation
and naming are missing. `projects` carries `creative_brief, brand_kit,
style_template, continuity_lock, set_lock, avoid_prompt` — the raw material
for Style DNA, unstructured. `storyboard_variants.approval` is free text;
stitch clips have no approval column. Nothing stores seed, parent, or
lineage. There is no queue table.

## 5. GPU orchestration (`lib/agents/minimax-h3.ts`)

`H3_CLIENT_ID = "direkta-h3"`; `proxyBase()` honours `RUNPOD_H3_PROXY_BASE`
else `https://<podId>-8188.proxy.runpod.net`. `getH3Preflight()` is read-only:
pod state + `clientBalance` + health, then `estimateH3Spend()`
(`h3-settings.ts:71-88`): `12 min × frames/124 × steps/20 × pixels/base`, +12
min cold start, ×1.25, at the pod's hourly rate, +$0.10 reserve. Generation:
preflight → `H3BudgetError` if `!canStart` → start pod → SSH bootstrap
(self-heals wiped deps) → health → submit graph → poll → download → mux →
**stop in `finally`**. Env: `RUNPOD_API_KEY`, `RUNPOD_H3_POD_ID`,
`RUNPOD_H3_SSH_KEY`, optional `RUNPOD_H3_PROXY_BASE`. UI gate:
`H3Controls.tsx:27` requires `canStart === true`. **None of this changes in
Phases 2–3.** The new UI calls the same three routes in the same order:
status (poll) → preflight (before showing Generate) → animate.

## 6. Break risks for the planned restructure

Ordered by how badly they bite.

1. **Renaming `WorkspaceId`.** Touches the URL contract, localStorage, six
   workspaces' string literals, CommandPalette, CoDirectorOverlay, and
   AssetCanvas copy. **Decision: keep the internal ids; rename at the
   presentation layer** with a single `STAGE_LABELS` map. Migrate ids later
   behind a URL alias if ever.
2. **Screenplay and Casting must stay mounted.** Any new shell that
   unmounts them on stage switch kills in-flight streams and batch loops.
3. **Storyboard's fixed `BottomStrip` and `paddingBottom:200`** will overlap
   a bottom Director Dock. Must be removed in the same change that adds the
   dock.
4. **Stitch's inline `calc(100vh - 64px - 230px)` and inspector `bottom:206`**
   assume the old chrome heights. Replace with `h-dvh` and container-relative
   sizing when the shell changes.
5. **Dock replaces two things at once** (composer dock + agent panel). It must
   carry over: the compose→animate two-step with `{model:'minimax_h3', refs}`;
   the `assetsVersion` bump; the `/api/chat` frame parser; the `EventSource`
   to `/api/minimax-h3/stream`; the `onUsePrompt` seeding.
6. **Create with no production.** Every generation route is
   `/api/projects/{id}/...`. **Decision: auto-create one "Scratch" production
   per install** (`format 'Other'`, flagged in `app_settings`) so Create
   needs no new backend, and "add to production" is a later move.
7. **Gate poll.** If the stage strip is built from anything other than
   `workspaces` memo + `gate` state, locks drift from server truth.
8. **Casting batches are sequential by design**; the server's budget check
   assumes it. Do not parallelise from a new World UI.
9. **`canStart` gate** on every H3 generate button.
10. **Higgsfield `?higgsfield=` params** on the root route.
11. **z-index.** BottomStrip 20, toast fixed `bottom+160`, modal backdrops,
    React Flow controls — no scale exists. A dock + inspector + focus mode +
    palette will collide without one.

## 7. Gaps between what exists and what the brief describes

| Brief concept | Exists today | Gap |
|---|---|---|
| Takes with lineage, seed, cost, approval | `assets.meta` on stitch clips holds provider/settings/actual; approval only on storyboard variants | no `parent_id`, `seed`, approval on clips, cost columns |
| Generation queue | none — animate is synchronous per request | server job table + worker (Phase 9) |
| World ID / Object ID | locations/props have refs + soul_id_state | naming + detail pages only |
| Look ID (costume) | none | new table (Phase 7) |
| Style DNA | six free-text project columns | structured shape + inspector (Phase 7) |
| Model capability catalog | `VIDEO_MODELS` with provider/costText | capability flags (Phase 4) |
| Director tools | orchestrator emits free text + plan/node/edge | tool contracts (Phase 13) |
| Screenplay structure | textarea | structured editor (Phase 6) |
| Compare / Focus / multiselect / drag reorder | none / FrameLightbox / none / React Flow only | Phases 8–10 |
| Clips in Assets | assets route excludes `stitch_clip` | **one additive query change — do in Phase 3** |
| Render master recorded | no | insert an asset on render success (Phase 11) |
| Explained locks | `lockReason` computed, never shown | Phase 3 |
| Compute in creative language | "Ready/Waking/Asleep/Generator offline" | Phase 3 state map |
| z-index scale, status vocabulary, AlertDialog | none / three pip systems / `confirm()` | Phase 2 |

---

## 8. Work list — Phase 2: design foundation

Each task is one delegable unit. "Must not break" is the regression gate; I
run `tsc`, `npm run test:h3`, `npm run build`, deploy, and curl-verify after
each.

**P2.1 Token layer.** Add the brief's semantic tokens to
`app/_brand/tokens.css` as aliases over the existing palette so nothing
currently styled changes: `--surface-canvas/base/raised/overlay/selected`,
`--text-primary/secondary/tertiary/disabled`, `--border-subtle/standard/strong`,
`--brand-accent/accent-hover/accent-fg`, `--status-success/warning/error/info`;
radius set `--r-control 6px / --r-surface 8px / --r-overlay 12px` (keep
`--r-sm/md/lg/pill` as aliases); a documented z scale
`--z-base 0, --z-raised 10, --z-sticky 20, --z-dock 30, --z-inspector 40,
--z-overlay 50, --z-modal 60, --z-toast 70, --z-palette 80`; expose all via
`@theme inline` in `tailwind.css`. *Acceptance:* every existing token still
resolves; `grep -c "z-\[" app` unchanged or lower; light and dark both render.

**P2.2 Status vocabulary.** One `<Status domain="creative|generation|gpu"
value=...>` in `app/_components/ui/status.tsx` with the brief's exact
vocabularies, colour never the only signal (dot + label). Replace
`pip-state`, `toneColors`, `data-s`. *Acceptance:* three old systems deleted;
no new badge styles.

**P2.3 Icon system.** `app/_components/icons.ts` becomes the single barrel:
Keyline primary (`keylineicons` package — confirm name/licence before
installing), one stroke width, sizes 15/17/20; `morphicons` only for
play↔pause, volume↔mute, grid↔list, expand↔collapse, lock↔unlock,
edit↔done. `IconButton` requires `label`. *Acceptance:* one icon family per
screen; every icon-only button has an accessible name.

**P2.4 Primitives.** In `app/_components/ui/`: `Button` (primary/secondary/
ghost/danger, sizes), `IconButton`, `Dialog`, `AlertDialog` (replace the six
`confirm()` sites with impact copy), `Sheet`, `Tooltip` with shortcut slot,
`Skeleton` structural variants (tile 16:9 / row / text), `EmptyState`
(title, why, action — all required), `InlineError` (near the action,
expandable detail). All on shadcn/Radix; never hand-rolled focus.
*Acceptance:* zero `confirm(` in app; every empty state has an action.

**P2.5 Media primitives.** `MediaTile` (aspect from item, poster frame,
`preload="metadata"`, hover-play after a 400 ms intent delay, one playing at
a time, `loading="lazy"`), `MediaFocus` (Escape-closable lightbox base with
scrubber slot — FrameLightbox migrates onto it later). *Acceptance:* no
autoplay storms on the Kaliyug canvas (68 items).

## 9. Work list — Phase 3: app shell

**P3.1 Navigation model.** In `page.tsx`: add `mode: 'home'|'create'|
'productions'|'assets'` with `?m=`; keep `WorkspaceId` internal; add
`STAGE_LABELS` (`screenplay→Script, casting→World, storyboard→Storyboard,
stitch→Shots, export→Finish, dashboard→Home, library→Assets`); auto-create the
Scratch production for Create. *Must not break:* `?p`/`?ws` deep links,
localStorage key, `?higgsfield=` params, snap-back logic.

**P3.2 Global top bar v5.** Replace `TopBar.tsx`: logo · production switcher
· **stage strip** (inside a production) · save state · **Render Engine chip**
with the brief's creative-language state map (`Offline / Starting / Preparing
render engine / Loading H3 / Ready / Rendering Shot 08 · 63% / Stopping /
Unavailable`; diagnostics in a popover) · budget · Cmd+K · account menu
(keys, skills, theme move here). Nothing else. *Must not break:* 60 s status
poll; delete-project flow.

**P3.3 Stage strip.** Horizontal, from `workspaces` memo. Locked stage shows
`Lock` + tooltip **and** inline reason on hover/focus:
`Shots unlock after at least one storyboard frame exists.` Delete `Rail.tsx`
and its CSS in the same change. *Must not break:* lock predicates.

**P3.4 Director Dock — prototype first (Section 80).** Build three
materially different structures behind a dev flag, evaluate, keep one:
- **A** — single bar at the bottom edge that expands *upward* into a sheet
  for Director Mode (conversation left, actions/context/plan right).
- **B** — two-tier dock: persistent context strip + input; Director Mode
  opens as a *temporary* right panel that closes on Escape or on selection
  change.
- **C** — a floating command pill anchored to the current selection
  (follows the selected shot/character), docking to the bottom when nothing
  is selected; Director Mode as a centred overlay.
Score on clarity, speed, density, flow, discoverability, utilisation,
consistency, uniqueness. Then delete the losers and the flag.
The winner must carry: context chip from the selection store; prompt-kit
`PromptInput` (existing `Composer` internals); attachments as thumbnails
(existing ref chips); mode; cost line only when a generation is proposed;
Generate; expansion to conversation + actions + context + plan;
`/api/chat` frame parser; `EventSource('/api/minimax-h3/stream')`;
compose→animate; `assetsVersion` bump. Delete `AgentPanel.tsx`,
`.composer-dock`, `--agent-w`, `data-agent`.

**P3.5 Selection store.** `app/_state/selection.tsx`: `{kind:'shot'|
'character'|'location'|'prop'|'beat'|'scene'|'frame'|'take', id, label,
projectId}` + multi-select set; provider at the shell; Dock and inspector
subscribe. Workspaces call `select()` where they already track `selectedId`
(`Stitch.tsx:75`, Storyboard lightbox, Casting cards).

**P3.6 Contextual inspector.** Selection-driven right panel, absent when
nothing is selected; seeded by extracting `StitchInspector` (`Stitch.tsx:
917-1502`) into `app/_components/inspectors/ShotInspector.tsx` with its
handlers intact (duration/trim commit on release, scene_number, camera
motion, model, `H3Controls` + `canStart` gate, lipsync, remove). Position:
resizable panel on ≥1280, sheet below. *Must not break:* every PATCH/POST
contract listed in §3.

**P3.7 Layout and hacks.** `.app-body` → `grid-template-rows: auto 1fr auto`
(top bar / main / dock), `h-dvh`, safe-area padding on the dock; remove
Storyboard `BottomStrip` + `paddingBottom:200`; remove Stitch inline height
and inspector offsets; apply the z scale to toast, modals, React Flow
controls, palette. *Acceptance:* no fixed-position element overlaps the
dock at 1024/1280/1440.

**P3.8 Command palette.** Extend the existing cmdk `CommandPalette` with:
go to stage, open character/location by name, create shot, start/stop
render engine (with the cost sheet, never silent), open queue (stub until
Phase 9), search assets, switch production, export cut. No open animation.

**P3.9 Assets route includes clips.** Add `OR (a.target_kind='stitch_clip'
AND a.target_id IN (SELECT id FROM stitch_nodes WHERE project_id=?))` to
`assets/route.ts:42-54`, title from beat or direction. *Acceptance:* Kaliyug
canvas shows the 17 beats **and** anything generated through Shots.

**Order:** P2.1 → P2.2/P2.3/P2.4/P2.5 (parallel) → P3.1 → P3.5 → P3.2 + P3.3
→ P3.7 → P3.4 (prototypes) → P3.6 → P3.8 → P3.9. P3.9 can go first if a
demo is needed sooner.

## 10. Review gate for every task

`npx tsc --noEmit` · `npm run test:h3` (34) · `npm run build` · deploy to
the VPS · `curl` the routes the change touches · the brief's Section 81
checklist, in particular: is the primary task obvious, is the selection
context visible, is cost shown before spend, does every empty state have an
action, does it still look like Fylmer.
