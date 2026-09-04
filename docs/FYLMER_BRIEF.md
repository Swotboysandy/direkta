# FYLMER — Master Product, AI, UX and Interface Redesign Brief

September 2026. This is the standing specification for the Fylmer redesign. Every
phase of work checks itself against it. Section numbers are referenced from
commits and the audit.

Fylmer was formerly Direkta. The deployment boundary (env var names, VPS paths,
public URL) still says `direkta`; that is deliberate.

---

The assignment is not cosmetic improvement of the existing interface. It is to
evolve Fylmer into a professional AI-native filmmaking platform that can stand
alongside Google Flow, Runway and Higgsfield in capability while developing a
distinct interface and interaction model of its own.

**Do not build:** a generic prompt box with a generation grid · a permanent
ChatGPT-style sidebar · a Runway, Higgsfield or Google Flow clone · a dashboard
made primarily of cards · a purple-gradient AI interface · a glassmorphism-heavy
interface · glowing borders · an oversized left sidebar with every navigation
item · unrelated shadcn components assembled without a coherent system.

Fylmer should feel like a new category: an AI-native film production
environment where the screenplay, cast, locations, references, generations,
shots, edits, audio and final cut all belong to one persistent creative
intelligence. The key word is **film production**, not video generation.

## 1. Product vision

Three ideas combined:

1. **AI creative studio** — text→image, text→video, image→video, frame→video,
   first/last-frame, reference-driven generation, character / location / video /
   audio references, shot extension, variation, prompt iteration, comparison,
   visual editing, conversational changes.
2. **Film production system** — screenplay, scenes, beats, characters,
   locations, props, costumes, visual style, storyboard, shots, takes, sequence,
   audio, score, edit, titles, export.
3. **AI director** — a project-aware layer that understands the current
   production, screenplay, selected scene/beat/shot/frame, cast in the shot,
   Soul IDs, locations, props, references, previous approved shots, camera
   language, style, continuity, available models and their capabilities, GPU
   state, cost, history, approvals and the current edit.

It should feel like a director, production designer, storyboard artist,
cinematographer and editor working inside one application.

## 2. Do not break the existing system

Fylmer already works. Before implementing anything: inspect the repository; map
the UI architecture, routes and APIs, SQLite schema, SSE streams, generation
workflow state, RunPod orchestration, ComfyUI integration, asset types, the
seven-stage workflow, reusable components, safely-replaceable UI, and backend
assumptions that cannot be broken.

The redesign is initially an interface and interaction architecture evolution,
not a backend rewrite. Preserve unless there is a concrete reason not to:
Next.js 15.1.8, React 19, App Router, Node 24.15, SQLite via `node:sqlite`, the
existing database and foreign keys, current API routes, Tailwind v4, the shadcn
foundation, Motion, SSE, ComfyUI, RunPod orchestration, ffmpeg assembly,
Caddy/systemd. Database or API changes migrate incrementally with compatibility.

## 3. Existing system (seven workspaces)

01 Dashboard (always) · 02 Screenplay — write/paste/import text or PDF → scenes,
numbered beats, headings, summaries, mood, props; creative brief and brand kit ·
03 Casting — characters and locations extracted; each character gets a
persistent **Soul ID**; opens once a screenplay exists · 04 Storyboard —
multiple takes per beat, framing controls, director approval, reference
injection, identity locking · 05 Stitch — node board, duration, camera motion,
audio, animation, frame interpolation, continuity · 06 Library — clips, frames,
characters, locations, props; filters, favourites, lazy load, hover preview ·
07 Export — ffmpeg: title card, Ken Burns, crossfades, fades, 1080p, score,
master audio.

## 4. Core model infrastructure

Fylmer runs **MiniMax H3** directly (~33B params). Weights ~53 GB across four
Comfy-Org `.safetensors`; text encoder Qwen3-VL 32B (~27 GB); peak VRAM 50.6 GB
measured → 80 GB GPU required; currently RunPod A100 80 GB. Sampler Euler /
simple / 8 steps / CFG 1.0. Measured ~206 s per shot, 124 frames ≈ 5.2 s at 24
fps; video and audio generated together, muxed with ffmpeg. Reference channels:
image, video, video+audio, standalone audio. Expose these through a coherent
creative interface without forcing users to understand ComfyUI.

## 5. GPU orchestration

The system: checks balance → estimates cost → checks reserve → refuses if it
cannot afford completion → starts pod → SSH → restores dependencies → starts
ComfyUI → health check → submits graph → relays progress via SSE → downloads →
muxes → stores assets → stops pod. Shutdown stays protected by a `finally`.
Never make GPU billing invisible, but do not expose a DevOps dashboard during
filmmaking. Translate infrastructure into creative language:
`Render Engine · Ready` rather than `POD: RUNNING / A100-SXM4-80GB`, with detail
on demand.

## 6. Core differentiator: continuity

The same character must remain the same person across shots, lenses,
environments, lighting, angles, costumes. Fylmer uses reference locking, not a
LoRA per character: a reference is generated once and becomes the Soul ID,
inserted automatically downstream. Extend this: Character → **Soul ID**,
Location → **World ID**, Prop → **Object ID**, Costume → **Look ID**, production
visual language → **Style DNA**. Every generated shot visibly shows which
persistent references influence it. Continuity is a first-class UI concept.

## 7. Information architecture

Two paths. **Create** — fast generation with no production setup: image, video,
animate, between frames, references, extend, character, location, camera
experiments, upload, variation; anything made here can later join a production.
**Production** — screenplay, world, cast, storyboard, shots, sequence, audio,
edit, export.

## 8. Global app structure

Reconsider the icon rail + permanent right chat panel; do not reskin it. Global
top bar carries only persistent context: logo, current production/workspace,
project switcher, save/sync, rendering indicator, compute indicator,
account/budget, notifications if needed, user/settings. Workspace switcher
destinations: **Home · Create · Productions · Assets**. Compute and settings do
not compete with creative destinations.

## 9. Production navigation

Inside a production the production is the navigation context. Horizontal stage
strip: **Script → World → Storyboard → Shots → Cut → Finish**. Library becomes
global Assets; Dashboard becomes Production Home. Gating logic remains. A locked
stage says why and what unlocks it (`Shots unlock after at least one storyboard
frame exists.`). Never a disabled, unexplained item.

## 10–12. The Director Dock and Director Mode

A persistent, compact command surface at the lower edge of the workspace that
understands current context (selected shot / character / scene / beat / frames)
so the user never restates it. Compact state: context indicator, multimodal
prompt, attachment, microphone where appropriate, action button, current mode,
estimated cost only when relevant. Attachments render as visual chips or
thumbnails. It expands into **Director Mode**: conversation, proposed/executed
actions, current context objects, and a concise execution plan for multi-step
tasks (task, status, tool, result, approval, error, cost). Never expose private
chain-of-thought.

## 13. Human-in-the-loop

Cheap, reversible actions run immediately (rewrite prompt, organise assets,
metadata, tags, descriptions, suggestions). Expensive or destructive actions
need approval (start GPU, generate 20 shots, delete approved media, replace an
approved Soul ID, overwrite an edit, export a master) with a calm, professional
cost sheet: estimated GPU time, maximum cost, references, output — `Cancel` /
`Generate`.

## 14–15. Create workspace and generation composer

Canvas + composer. Starts relatively empty; the Dock drives creation; a compact
mode selector above it (Image · Video · Animate · Frames · Edit). Ingredients as
chips: `[Asha] [Desert Temple] [Frame 03]`. Structured controls in a contextual
sheet: Output (duration, aspect, resolution, fps), Camera (framing, focal
length, movement, intensity), Motion (subject, camera, environment), reference
strength per attachment, Audio (on/off, dialogue, ambience, reference),
Generation (model, seed, steps, CFG, advanced). **Simple** and **Advanced**
modes; technical controls hidden by default.

## 16. Model system

A capability abstraction: a model declares support for text→video, image→video,
text→image, first frame, last frame, multiple references, video reference, audio
reference, native audio, video editing, resolutions, durations, aspect ratios,
inference settings. The composer adapts; unavailable settings never remain as
broken controls.

## 17–19. Takes, lineage, compare

Every generation is a **take** and knows: prompt, model, references, settings,
timestamp, seed, estimated and actual cost, parent, children, approval state,
production usage, source beat/shot. Hover shows only primary actions (Preview ·
Approve · Vary · Use); metadata lives in the inspector. Lineage is visible as a
lightweight version tree (Take 04 ↳ 04B ↳ 04C ↳ 04C.1). **Compare mode** for 2–4
generations: synchronised/individual playback, scrubbing, mute/solo, metadata,
prompt diffs, approve winner; images side-by-side, overlay, swipe, synced zoom.

## 20. Production Home

Opening a film project, not a SaaS dashboard. Hero strip (title, cut duration,
status, last activity, continue). Sequence preview strip of approved shots.
Compact stage state. Open decisions (frames awaiting approval, missing Soul ID,
failed shot, unset title). Recent work as media. One contextual Director
suggestion. No meaningless charts.

## 21–22. Script and beats

A screenplay editor, not a textarea: headings, action, character, dialogue,
parenthetical, transitions, notes; a scenes/beats outline; an inspector only
when relevant. Selecting text enables contextual AI actions (create visual beat,
rewrite, shorten, split, identify prop, assign character, visualise, storyboard
selection) — selection *is* the context. Beats are visible and editable:
number, scene, summary, action, cast, location, props, mood, continuity notes;
merge, split, reorder, regenerate, correct cast/location, mark non-visual, send
to Storyboard. AI edits are reversible.

## 23–26. World

Replaces Casting: Characters, Locations, Props, Costumes, Style DNA. Image-led
tiles, not SaaS cards. Character detail: identity, a prominent Soul ID,
reference board (front, profile, 3/4, full body, expressions, costume, poses),
continuity (shots containing them), looks, identity confidence; changing a Soul
ID warns about downstream shots. Locations get the same seriousness: World ID,
establishing and environmental references, time-of-day and lighting variants
(`Temple courtyard · dawn` and `· storm` are variants of one identity),
scenes, shots. **Style DNA**: references, aspect ratio, colour language,
contrast, texture, film stock, camera behaviour, lens, depth of field, lighting
and movement philosophy, design rules — influences all generations unless
overridden; inspectable and editable, not a hidden system prompt.

## 27–28. Storyboard and framing

A cinematic planning surface: responsive grid or filmstrip by beat; each beat
holds candidates; shows beat, approved frame, alternatives, cast refs, World
ID, framing, lens, prompt status, approval; density levels Overview / Frames /
Detail. The 3×3 framing control is kept and represented visually, combined with
shot size, angle, focal length, placement; presets ECU CU MCU MS MLS WS EWS OTS
POV populate parameters but stay editable.

## 29–31. Shots, continuity, recipe

The evolved Stitch. A shot strip; selecting a shot opens the **Shot Desk**:
preview, take strip, references, direction, camera, motion, audio, collapsed
generation recipe, continuity (previous/next), Generate. **Continuity view**
shows `Shot 07 ← Shot 08 → Shot 09` with one-click: use 07's final frame, 09's
first frame, match camera, match lighting, preserve position, interpolate.
Every shot has a reproducible **recipe** (model, duration, prompt, Soul IDs,
World ID, references, camera, inference, seed) that can be duplicated, edited,
saved as preset, varied, compared.

## 32–33. Cut and AI editing

A film-editing workspace (the node graph may remain internal): large viewer,
thumbnail timeline, audio lanes, trim / reorder / split / replace take /
transition / fade / duration / title / music / ambience, contextual inspector.
Not Premiere; an AI-first editor for assembling generated films. The Director
understands timeline commands (replace Shot 5 with Take B, make the opening
faster, add a fade, carry ambience under the next shot) and shows proposed
operations.

## 34–35. Assets

Global: images, video, characters, locations, props, costumes, audio,
references, exports. Visual and semantic search, filters, favourites,
collections, by production / scene / character / location / date / approval /
origin. Hover playback only after intentional delay. Every asset exposes
contextual primary actions (image: use as frame / character ref / location ref
/ animate / vary / edit / add to production; video: add to cut / use as ref /
extend / extract frame / regenerate / inspect recipe; character: lock Soul ID /
add look / storyboard / inspect shots) — no twenty-item three-dot menus.

## 36–39. Compute, budget, queue, notifications

Compute states in creative language: Offline · Starting · Preparing render
engine · Loading H3 · Ready · Rendering Shot 08 · 63% · Stopping · Unavailable;
diagnostics for administrators. Budget UX: before (time, max spend, cold-start,
render), during (elapsed, remaining, accumulated), production totals (spend,
cost per accepted shot, discarded spend) — calm, not frightening. A generation
**queue**: waiting / preparing / rendering / processing / complete / failed /
cancelled; reorder, cancel, retry, inspect; the Director may populate it after
approval. Notify only render complete/failed, insufficient balance, export
complete, long task complete, critical continuity issue; progress stays on the
task.

## 40–41. Empty and error states

Every empty state answers what this is, why it is empty, what to do next, with
an action. Every async surface supports idle / loading / success / empty /
error (and queued / processing / cancelled where relevant). Errors appear near
the action, not only as toasts; technical detail expandable.

## 42–45. Visual design, shape, type, density

A cinematic editorial workstation, not a sci-fi panel. Dark default: near-black
/ graphite, neutral surfaces, off-white primary text, muted secondary, subtle
separators, one restrained accent, high contrast where actions matter. Content
provides the colour; the interface recedes. No gradients, glow, blobs, glass,
neon, oversized rounded cards, marketing headings, fake depth. Radii: controls
6px, surfaces 8px, major overlays 10–12px, pills only for true chips. Type
precise and editorial; a neutral UI sans (Geist or equivalent) if a change is
warranted; mono only for seeds, model names, settings, timestamps, costs,
render data; `tabular-nums`, `text-balance`, `text-pretty`. Density of Linear
and professional editors, not marketing pages.

## 46–48. Motion and icons

Motion must improve comprehension (origin, continuity, hierarchy, state,
selection, completion, spatial relation): Dock expanding, inspector entering
from its source, asset moving into a shot, queue transitions, play state,
selected take, approval, icon state. Frequent actions near-instant, feedback
under 200 ms, animate transform and opacity only, respect reduced motion.
**Morphicons** (morphicons.com) only where one state becomes another (play↔
pause, volume↔mute, grid↔list, expand↔collapse, add↔confirmed, lock↔unlock,
edit↔done). **Keyline** (keylineicons.com) as primary icon set; consistent
stroke, size, weight; one family per screen; every icon-only button labelled.

## 49–56. Skills and component sources

Use ibelick/ui-skills (at minimum `baseline-ui`; also layout, motion,
typography, accessibility, interaction, responsive, performance) as a review
pass after each workspace. Use emilkowalski/skills (emil-design-eng, animate,
review-animations, improve-animations, find-animation-opportunities,
animation-vocabulary, pick-ui-library, prototype): prototype materially
different structures before committing; run an animation review after. Component
order: existing Fylmer primitives → shadcn → Astryx → AI-specific sources →
custom only when necessary; never mix primitive systems in one surface.
Prompt Kit for AI building blocks (restyled); evaluate assistant-ui for the
Director runtime (streaming, tools, approvals, attachments, branching,
generative UI) and AI SDK Elements for Agent/Plan/Task/Tool/Queue/Canvas
primitives; Astryx for app-shell primitives. shadcn remains the foundation for
conventional primitives; never rebuild keyboard/focus/dialog/menu behaviour.

## 57–61. Command palette, inspector, focus, multiselect, drag

`Cmd/Ctrl+K` palette (go to scene, open character, create shot, start render
engine, open queue, search, export, switch production…). The inspector appears
only on selection and disappears on none — never a permanent 30% column.
**Focus Mode** on click: large media, playback, scrubber, metadata, compare,
approve, vary, use; Escape closes; no unnecessary navigation. Shift / Cmd
multiselect with batch approve / delete / generate / move / tag / add / compare.
Drag-and-drop only where spatial movement has meaning, with keyboard
alternatives.

## 62–66. Generative UI, tools, memory, search

The Director renders structured interfaces (camera options, shot plans, cast
candidates, approval sheets, comparisons), not only markdown bubbles. It acts
through explicit validated tools — read_project, read_script, read_scene,
read_beat, update/create/split/merge_beat, list/create/update_character,
set_soul_id, list/create_location, set_world_id, search_assets,
attach_reference, generate_image, generate_storyboard, generate_video,
create_variation, extend_video, extract_frame, approve_take, create/update_shot,
reorder_shots, add_to_cut, update_transition, start_gpu, stop_gpu,
estimate_generation_cost, read_gpu_status, read_balance, queue_generation,
cancel_generation, export_cut — never arbitrary DB mutation. Tool activity in
human terms (`Preparing Shot 08` → `Starting render engine` → `Loading H3` →
`Generating · 42%` → `Processing audio` → `Shot ready`). Durable project memory
stored structurally (aspect ratio, style, banned motifs, camera language,
approved refs, identity, pronunciation, continuity, rules, target duration).
One universal search across projects, scenes, beats, characters, locations,
props, shots, takes, assets, prompts; natural queries eventually.

## 67–74. Responsive, accessibility, performance, loading, destructive, keys, status, tokens

Desktop-first: 1440+ primary, 1280 and 1024 supported; mobile for review,
approvals, browsing, monitoring. `h-dvh`, safe-area insets. Keyboard
navigation, visible focus, labels, accessible dialogs, reduced motion,
contrast; colour never the only indicator. Virtualise, lazy-load, thumbnail
proxies, hover-after-intent, cached metadata, optimistic where safe, structural
skeletons, no permanent `will-change`, few `useEffect`s. Generation shows real
state (`Generating frames 61 / 124`, elapsed, remaining, queue position,
cancel). Confirmations that explain impact (`Replacing Asha's Soul ID may make
12 existing shots visually inconsistent.`). Shortcuts: Space, J K L, Cmd+K, G,
F, A, R, V, Esc — none that conflict with text editing; shown in tooltips.
Consistent status vocabularies (Creative: Draft / Approved / Rejected / Locked;
Generation: Queued / Rendering / Processing / Complete / Failed / Cancelled;
GPU: Offline / Starting / Ready / Busy / Stopping / Error). Real tokens:
surfaces (canvas, base, raised, overlay, selected), text (primary, secondary,
tertiary, disabled), borders (subtle, standard, strong), brand (accent,
accent-hover, accent-foreground), status (success, warning, error, info),
Tailwind spacing, a fixed radius set, a documented z-index scale.

## 75. What makes Fylmer different

Script is source of truth · everything has lineage · characters persist (Soul
ID) · locations persist (World ID) · style persists (Style DNA) · AI understands
context · generation and editing are connected · compute is owned · cost is
transparent · the application is built to finish films.

## 76–78. Reference production, limits, honesty

Kaliyug is the stress test: 13,605-char screenplay, 17 beats, 24 characters,
15 locations, 17 shots, ~64 s film, continuous audio bed, crossfades, ffmpeg
title card. App holds ~11 productions, 89 beats, 63 characters, 54 locations,
296 catalogued assets, 7.7 GB media. Design against dense real data. Known
limits: ~$0.90 per five-second shot including ~$0.40 cold start; container
persistence; more media on disk than catalogued; text model unconfigured — the
UI represents missing configuration gracefully. **Do not fake functionality**:
real APIs, real DB, real SSE, real GPU states, real assets; mocks only during
isolated component development and removed before integration.

## 79. Implementation process

Phase 1 Audit → 2 Design foundation (tokens, type, icons, buttons, inputs,
overlays, media primitives, status, loading, errors) → 3 App shell (global nav,
switcher, production nav, command palette, Director Dock, inspector) → 4 Create
→ 5 Production Home → 6 Script → 7 World → 8 Storyboard → 9 Shots → 10 Cut → 11
Finish → 12 Assets → 13 Director (tools, generative UI) → 14 Polish (design and
animation review skills).

## 80–81. Prototype, then review

For uncertain structures (Director Dock, composer, Shot Desk, Storyboard, Cut
timeline, Production Home) build 2–3 genuinely different prototypes; evaluate
clarity, speed, density, flow, discoverability, utilisation, consistency,
uniqueness; choose; remove switchers. Before calling a workspace complete review
hierarchy, density, context, AI, continuity, cost, performance, motion,
accessibility, empty states, errors, consistency, originality.

## 82. Non-negotiable rules

1 No gradients without content reason · 2 No purple AI aesthetic · 3 No glow as
affordance · 4 No heavy glass · 5 No permanent chat sidebar · 6 No permanent
inspector without reason · 7 No giant SaaS cards · 8 No excessive pills · 9 No
emoji icons · 10 Proper icon assets · 11 Icon buttons labelled · 12 Accessible
primitives · 13 Never hand-roll focus/keyboard · 14 Structural skeletons · 15
Errors near the action · 16 `h-dvh` · 17 Safe areas · 18 Transform/opacity only
· 19 Reduced motion · 20 Fast frequent interactions · 21 No decorative motion ·
22 Media dominates · 23 One accent per view · 24 Progressive disclosure · 25
Never hide cost before an expensive render · 26 Never break gating · 27 Never
silently replace approved work · 28 Important AI actions reversible or
confirmed · 29 No private chain-of-thought · 30 Show tools, progress, results ·
31 Preserve working backends · 32 Reusable primitives, not page hacks · 33 Test
on real production data · 34 Professional density · 35 Faster after, not merely
prettier.

## 83–84. North star

A user types: *Create a 60-second mythological trailer from this screenplay.
Keep Kalki visually consistent throughout. Establish the ruined city first,
introduce the supporting cast before Kali appears, use increasingly aggressive
camera movement toward the end, and stop before spending more than $12.* —
and Fylmer understands the screenplay, structures beats, identifies characters,
locations and props, generates missing Soul and World IDs, proposes Style DNA,
plans shots, estimates compute, presents the plan, requests approval,
storyboards, queues generation, starts the GPU, generates with references
preserved, shows progress, stops on budget, assembles, adds transitions and
audio, builds a cut, presents decisions, exports. The user remains the
director; the AI executes production.

**Do not optimise Fylmer for one impressive video. Optimise it for making Shot
37 still look like the same film as Shot 1.**

Operational constraint from the owner: the RunPod connection and every other
existing connection (Higgsfield, Codex, BytePlus, Gemini) must remain properly
wired throughout.
