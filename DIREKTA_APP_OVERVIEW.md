# Direkta — Full Application Overview

> **You direct. AI delivers.**

This is the complete, current-state reference for Direkta: what it does, how every piece works, what infrastructure it runs on, and what's still stubbed. It supersedes the older `README.md` (which describes an early "V1 Part 1" snapshot) as the accurate picture of the app as it stands today.

Repo: `Swotboysandy/direkta`. Branch `nishkarsh` is the source of truth for the UI and pipeline; `main` is kept as a mirror of it (force-pushed to match after the two branches diverged).

---

## 1. What Direkta Is

Direkta is a browser-based **AI film/ad production studio**. A user goes from a raw idea or script to a finished, scored video entirely inside one app, moving through a fixed pipeline of workspaces:

```
Screenplay → Casting → Storyboard → Stitch → Library → Export
```

Each stage **unlocks only after the previous one has real output** — you cannot open Casting on a brand-new project until a script is submitted, cannot open Storyboard until at least one character is cast, cannot open Stitch until a storyboard frame exists, and cannot open Export until something is on the Stitch board. This sequential gating is enforced in `app/page.tsx` and mirrored in the sidebar (`app/_components/Sidebar.tsx`), which shows a lock icon and a reason string on any workspace that isn't unlocked yet.

The unique thing Direkta does versus a generic "AI video" tool: **cast identity survives across every shot.** A character's face, wardrobe, and skin tone are generated once in Casting, then locked into every subsequent Seedream frame and Seedance clip via reference images and a forceful identity-lock prompt — so a 6-shot ad doesn't quietly swap in a different-looking actor halfway through.

---

## 2. The Pipeline, Workspace by Workspace

### 2.1 Dashboard
Project header (title, logline, format, aspect ratio tags), a 5-stage horizontal pipeline tracker showing where the project currently sits, a quick-access card grid into each workspace, and an activity feed.

### 2.2 Screenplay
- Paste or upload a script (`.txt`/`.fountain`/`.fdx`/`.md` read client-side; `.pdf` goes through `/api/projects/[id]/script/import`, which uses `unpdf` server-side to extract text — PDFs with no selectable text, i.e. scanned images, are rejected with a clear error).
- **Or generate a script from scratch**: `/api/projects/[id]/script/generate` takes the project's **creative brief** + **brand/product placement** fields and the chosen length tier (including the short-form "Under 1 min" tier added for memes/ads) and writes a full script via the active text vendor (Codex/OpenAI).
- Once a script is submitted, "Extract beats" (`/api/projects/[id]/beats/extract`) runs a full breakdown: the AI returns `{beats, characters, locations}` in one pass — beats get scene headings and a per-beat character list, characters get an inferred role/dialogue-or-not/physical brief (even inventing working names like "A GIRL" for unnamed background characters), locations get INT/EXT + time-of-day. This *never* overwrites characters/locations that already exist, so re-extracting is safe.
- **Split / Board view toggle** — a segmented control with a spring-animated sliding pill between the two layouts.
- A **creative-direction card** on the pre-submit screen lets you set the creative brief and brand/product-placement text before the script is even written, so every downstream generation (script, frames, clips) inherits the same direction.
- "View Bible" opens the **Movie Bible modal** — title page, synopsis, characters, world/tone, built from the same extraction data.

### 2.3 Casting
- Character cards and location cards, each showing a Soul-ID-style training state (`empty` / `training` / `trained` / `failed`) and a portrait/plate strip.
- **"Import from script"** — re-runs just the character/location breakdown (`/api/projects/[id]/characters/import`) without touching beats, safe to run on a project that already has storyboard work.
- **Per-character portrait generation** (`/api/characters/[id]/portrait`) — one Seedream call, result becomes that character's reference image for every future frame.
- **Per-location "establishing plate" generation** (`/api/locations/[id]/plate`) — same idea for locations: no people in frame, project aspect ratio, prior plates fed back as references, explicit anti-grid constraint.
- **Batch generation** — "Cast all" / "Scout all" buttons open a popover to pick which characters/locations to include and see the total token cost before committing; a Stop button halts the batch before the *next* item (the one in flight always finishes, since its spend is already committed). Each card **shimmers live** during batch or single generation via a `generating` flag threaded down from the batch loop.
- **Delete all cast images** (bulk) and **Clear looks** (per-character, inside the edit modal) — wipe generated portraits without deleting the character itself, so you can re-roll a look that came out wrong.
- **Add character / Add location** manually, with role (Lead/Supporting/Featured/Background) and INT/EXT chips.

### 2.4 Storyboard
The Cinematographer stage — turns each beat into one or more still frames.

- **Per-beat camera direction**: shot size (Wide/Medium/Close/Extreme close/Two-shot/Over-shoulder/Insert/Establishing), camera angle (Eye level/Low/High/Dutch/Bird's-eye/Worm's-eye), lens (24–135mm), and movement (Locked/Pan/Tilt/Dolly/Handheld/Push in/Pull out/Whip) — each independently selectable per beat, defaulting to a project-wide style (visual tone, lighting, colour temperature, camera).
- **Shot recipes** — a one-click "Shot recipe" popover next to the camera-direction controls that sets shot size + angle + lens + movement together under a named look: Establishing wide, Hero/product, Talking head, Two-shot dialogue, Over-the-shoulder, Action/movement, Emotional close-up, Dutch tension, Insert/detail, Sweeping reveal.
- **Cast-in-frame chips** — toggle which cast members are locked into a given beat's frame (beyond whoever the script itself put there), each showing whether they have a portrait yet.
- **AI prompt from script** — has the cinematographer agent write the frame's prompt straight from the script + beat + current camera settings (`/api/storyboard/rows/[beatId]/prompt`), rather than the user hand-writing it.
- **Takes picker** — choose 1/2/4 variants per beat before generating, with the token cost shown, so nobody accidentally burns tokens on 4 takes when they only wanted 1.
- **Batch "Roll all missing beats"** with a Stop button, same halt-before-next-item behaviour as Casting's batches.
- **3×3 framing helper** for quickly trying grid compositions.
- List / Grid view toggle.
- Every generation call collects the beat's cast (script cast ∪ manually toggled cast), pulls each character's reference portrait(s), and builds a forceful **IDENTITY LOCK** preamble that leads the prompt (see §4 below) — this is the mechanism that keeps faces consistent.

### 2.5 Stitch
The assembly stage — a React Flow canvas where storyboard frames become an ordered sequence of shots, and each shot can be animated into a short video clip.

- Drag shots to reorder; each node shows its duration and thumbnail.
- **Per-shot duration slider** (0.5–20s).
- **Video model picker** — BytePlus Seedance 1.5 Pro (720p/1080p, runs on the free-token pack) or Higgsfield-backed models (Seedance 2.0 Fast/Std, Kling 3.0 Turbo) when Higgsfield is connected, each showing an approximate cost/credit preflight against the current balance.
- **Camera motion picker** — 13 named presets (Static/locked-off, Slow push-in, Pull-out reveal, Pan left/right, Tilt up/down, Orbit, Tracking follow, Handheld, Zoom in, Crane up). "Static" sets Seedance's `--camerafixed true`; every other choice leads the animate prompt with a plain-English camera direction line.
- **Native audio toggle** — lets Seedance generate its own audio track for a clip instead of defaulting to silence (silence is the default so a separately-attached score isn't fighting a mismatched ambient track).
- **Stop/pause** on batch clip generation, same pattern as the other workspaces.
- Timeline view (NLE-style horizontal scrub) in addition to the node-graph board view.
- The visible monitor `<video>` plays whichever clip is under the playhead; the real "N / total CLIPS" counter counts shots that actually have a rendered clip (not transitions).

### 2.6 Library
Unified browser across everything a project has generated — portraits, plates, storyboard frames, clips — in one place.

### 2.7 Export
- **"Render final cut"** — the one-click master render (see §5). Shows live status chips after rendering: Master finish, Title card, Scored, Clip audio.
- **Music score panel** — attach/replace/remove an MP3/WAV/M4A/AAC track (25MB cap) that gets muxed under the next render; no SSH/file-system access needed, it's a normal browser upload (`/api/projects/[id]/score`).
- Three additional export cards — Storyboard PDF, Shot list, Production bible — are honestly labelled "SOON" with their planned options greyed out; they are **not yet wired to real generation**, deliberately shown as a real spinner-free "coming soon" state rather than faking output.

---

## 3. Character & Location Consistency (the core differentiator)

This was the single hardest problem to get right and is worth documenting precisely, because a soft version of it looks like it works but silently drifts.

1. A character's portrait (or a location's establishing plate) is generated once in Casting and stored as a reference image (`characters.refs`, `locations.refs` — JSON arrays of `/oss/...` URLs).
2. Every Storyboard frame generation (`/api/storyboard/rows/[beatId]/generate/route.ts`) collects reference images for every character on that beat (from the script's own cast list, from manually toggled "cast in frame" chips, or from being named in a hand-written/AI-written prompt) — up to 2 looks per character, up to 6 references total.
3. Those references are converted to base64 **data URIs** before being sent to BytePlus (`referenceToDataUri()` in `lib/agents/byteplus-image.ts`) — BytePlus's own URL fetcher intermittently rejects the app's public domain, so embedding the bytes directly is the reliable path. Reference images are downscaled to ≤1280px via ffmpeg first to keep payloads small.
4. The prompt sent to Seedream 4.5 **leads with an IDENTITY LOCK block**, not a soft mention at the end — Seedream weighs early instructions much more heavily (verified via live A/B testing: lock-last caused visible identity drift, lock-first didn't). The lock language is deliberately forceful:
   > "IDENTITY LOCK — the person in this frame MUST be the exact same individual shown in the attached reference image(s): NAME (traits). Match the reference precisely: same face and facial structure, same skin tone, same hair, same wardrobe. This is the same person, NOT a look-alike or a different actor. Exactly ONE person in the entire frame — NAME. Never duplicate them, no twins, no clone, no second copy of the same person."

   A softer phrasing ("the same person as the reference") was tested live and produced a real, reproducible failure: it duplicated the subject into two people and dropped the wardrobe/skin tone. The forceful version, re-tested the same way, produced one person in the correct outfit with a face matching the portrait.
5. An anti-grid constraint always closes out the prompt ("One single cinematic frame... never a grid, collage, contact sheet...") because scripts that say things like "MONTAGE" otherwise cause Seedream to render a 3×3 contact sheet instead of one frame.
6. The same reference set carries forward into Stitch's image-to-video step, plus an "identity hold" line in the animate prompt ("Preserve the exact appearance of every person from the first frame throughout the clip").

This whole chain only runs on the **BytePlus/Seedream vendor path**. The alternate Higgsfield consumer-MCP image path does *not* accept reference images at all (it uses pre-registered "Soul Element" UUIDs instead) — since BytePlus is the active, keyed vendor, this is a non-issue in practice, but it means consistency is not guaranteed if a project were switched over to pure Higgsfield generation.

---

## 4. AI Generation — Models, Vendors, and Options

### Images — BytePlus Seedream 4.5 (`seedream-4-5-251128`)
- `POST https://ark.ap-southeast.bytepluses.com/api/v3/images/generations`, Bearer auth.
- Native ~4K, `image_urls` (up to ~14) for reference-lock — see §3.
- Minimum valid size is ≥3,686,400px; per-aspect sizes are hardcoded (`16:9` → 2560×1440, `9:16` → 1440×2560, `1:1` → 2048×2048, `4:5` → 1728×2160, `21:9` → 2944×1264).
- Alternate image vendors also wired in `lib/agents/image.ts`: Fal AI (Flux), OpenAI `gpt-image-1`, Higgsfield Cloud — but BytePlus is the one with a live key, so `vendors.firstEnabledImage()` (which filters `api_key != ''`) always resolves to it.

### Video — BytePlus Seedance 1.5 Pro (`seedance-1-5-pro-251215`)
- `POST .../contents/generations/tasks` (async — create then poll `GET .../tasks/{id}` until `succeeded`), image-to-video from a single reference frame.
- Params ride in the text prompt's tail: `--resolution 720p|1080p --duration 5|10 --camerafixed true|false --watermark false [--audio false]`.
- Camera motion (§2.5) and the native-audio toggle are the two options wired through the UI; resolution and duration are chosen via the model picker + duration slider.
- Alternate video path: Higgsfield's consumer MCP (`generate_video`, models `seedance_2_0` fast/std, `kling3_0_turbo`) when the user has connected their own Higgsfield account via OAuth — see §6.
- Every generated clip is compressed in place after download (`libx264`, `crf 24`, `veryfast`, `+faststart`).

### Text — Codex (OpenAI-backed)
Script generation and beat/character/location extraction run through the connected Codex text vendor. Connection state lives in `codex_connection`; status/import/disconnect routes under `/api/codex/*`.

---

## 5. Master Render / Export Pipeline

`POST /api/projects/[id]/render` (`app/api/projects/[id]/render/route.ts`) assembles everything on the Stitch board into one finished MP4 — not a bare concat, a real finishing pass:

1. **Canvas** — full HD per aspect ratio (16:9 → 1920×1080, 9:16 → 1080×1920, 1:1 → 1080×1080, 4:5 → 1080×1350, 21:9 → 1920×822).
2. **Title card** — project title + tagline/logline, drawn with ffmpeg `drawtext` on a black card, fading in/out. Font is resolved from a candidate list (DejaVu Sans Bold on Linux, Arial Bold on Windows) and skipped gracefully if no font is found rather than failing the whole render. (A real bug was found and fixed here: a Windows font path's drive-letter colon, `C:/Windows/...`, collides with ffmpeg's own filter-option separator and breaks the whole filter graph unless the path is quoted *and* the colon is separately backslash-escaped inside the quotes.)
3. **Ken Burns** on every still frame — a slow `zoompan` push-in, so static frames never sit dead on screen.
4. **Crossfade dissolves** (`xfade`) between every shot (title card included), each ~0.4s, chained with correctly-accumulating offsets.
5. **Fade in from black** at the very start, **fade out to black** at the very end.
6. **Audio is preserved, not stripped.** Every segment (title card, still, clip) carries exactly one audio stream — real audio if a Seedance clip was generated with "Native audio" on, silence (`anullsrc`) otherwise — chained through a parallel `acrossfade` alongside the video `xfade` chain, so real dialogue/ambience actually survives the crossfades between shots instead of being discarded.
7. **Optional music score** — if `data/oss/score_<projectId>.(mp3|m4a|wav|aac)` exists (attached via the Export UI upload panel, §2.7), it's looped and **mixed** (`amix`, not a hard replace) under the assembled cut with a fade in/out, ducked harder (0.35 vs 0.7 gain) when real clip audio is present so a user's own dialogue/foley isn't buried.
8. Final encode: `libx264`, `crf 18`, `+faststart`, AAC audio.

The whole thing degrades gracefully at every optional step (no font → no title card, no score file → silent-track master, no real clip audio → synthesized silence) rather than failing the render.

---

## 6. External Access — the MCP Server

`app/api/mcp/route.ts` exposes Direkta's pipeline over the **Model Context Protocol** (Streamable HTTP transport, Bearer-token auth) so any external AI agent (Claude, another Claude Code session, a third-party MCP client) can drive the app programmatically. Live at:

```
https://direkta.147.93.168.21.nip.io/api/mcp
```

Seven tools (`lib/mcp/server.ts`): `health`, `list_projects`, `create_project`, `generate_image`, `generate_video`, `stitch_film`, `list_library`.

Separately, `lib/higgsfield/oauth.ts` + `lib/higgsfield/mcp.ts` implement the *other* direction — Direkta acting as an MCP **client** against Higgsfield's consumer MCP server, so a user can connect their own Higgsfield Pro-plan account (via OAuth Dynamic Client Registration + PKCE) and generate on their own credits instead of a metered Cloud API key. When connected, Storyboard/Casting/Stitch generation routes all prefer MCP → Cloud vendor key → simulation, in that order.

---

## 7. Design System

- **Tokens** (`app/_brand/tokens.css`) — dark-first "film-negative studio" palette: near-black background (`#0B0C10`), translucent glass card surfaces, a purple accent (`#8B7BF7` dark / `#6B59E8` light), signal colours for success/warning/danger (viridian/mustard/tomato), a full light-theme override block. Typography is **Inter** (UI) + **Manrope** (display/mono) only — no other fonts anywhere in the app.
- **Theme toggle** — a real **View Transitions API** circular reveal: the incoming theme expands out of the toggle button as a `clip-path: circle()` on the browser's native view-transition pseudo-elements, with an instant-swap fallback for browsers that don't support it or for reduced-motion users.
- **Buttons** — a Watermelon-UI-inspired treatment: primary/secondary buttons get a top-lit gradient + inner highlight + tonal border (reads as a slightly domed physical key); semantic actions (delete/warn/success/info) use a `.btn-tinted` class family — 12%-opacity fill + full-strength border + full-strength text, rather than a flat solid fill.
- **Motion** (`app/_components/motion.ts`) — shared framer-motion (motion.dev) presets: `SPRING_SMOOTH`/`SPRING_SNAPPY`/`SPRING_POP` springs, `fadeUp`/`pageIn`/`staggerContainer`/`staggerItem` for entrances, `tap` for press feedback. **Entrances are transform-only, never opacity-gated** — framer's animations run on `requestAnimationFrame`, which browsers pause in a backgrounded tab, and Direkta's generation batches run for minutes so users routinely tab away; an opacity 0→1 entrance that never gets a frame leaves content permanently invisible, whereas a stranded few-pixel offset is imperceptible. The sidebar's active-workspace highlight and the Screenplay Split/Board toggle both use a `layoutId`-based sliding pill that physically glides between positions.
- **Icons** — HugeIcons under a lucide-compatible wrapper (`app/_components/icons.tsx`), so the whole app calls icons the same way regardless of the underlying set.
- **Contrast** — light-theme `--mute` was darkened (`#7A7B8A` → `#666778`) after measuring it failed WCAG AA (3.8:1); several places that used a translucent *fill* token (`--tungsten`/`--accent-2`, effectively 6%-opacity) as *text/icon/border* colour — making the content nearly invisible — were found and fixed (Casting role chips, disabled-button labels, Export/empty-state icons).

---

## 8. Database

`node:sqlite` (Node's built-in driver, no external dependency), file at `data/zinema.sqlite`, auto-migrating on startup via `ensureColumn` (existing DBs upgrade in place, no manual migrations to run).

Tables: `projects`, `beats`, `characters`, `locations`, `bible`, `storyboard_rows`, `storyboard_variants`, `stitch_nodes`, `transitions`, `assets`, `vendors`, `usage_log`, `activity`, `proposals`, `clarifications`, `snippets`, `codex_connection`, `higgsfield_connection`, plus legacy canvas tables (`nodes`, `edges`, `messages`) retained for the original Stitch-board implementation this was built on top of.

Token spend is tracked per-generation in `usage_log` (`lib/usage.ts`) against a configurable pack size (`DIREKTA_BYTEPLUS_PACK_TOKENS`, default 7M) with per-action costs (`image` ≈14,400 tok, `clip720` ≈108,900 tok, `clip1080` ≈245,025 tok) surfaced live in the top-nav usage chip (balance, capacity, and a per-action-cost breakdown popover).

---

## 9. Infrastructure & Deployment (VPS)

- **Host**: `maxgood-vps`, IP `147.93.168.21`, SSH as `root` (deploy key `~/.ssh/maxgood_vps`, `IdentitiesOnly yes`).
- **App path**: `/home/claudebot/direkta`, owned by the `claudebot` user (files pushed as root must be `chown claudebot:claudebot` before building/restarting).
- **Process**: `systemd` unit `direkta` runs `next start` bound to `127.0.0.1:3002` (a `su - claudebot -c '...'` shell is used for `npm run build`/`npm start` so file ownership stays correct).
- **Reverse proxy**: Caddy fronts it at **`https://direkta.147.93.168.21.nip.io`** (nip.io is a wildcard-DNS service that resolves any `*.147.93.168.21.nip.io` to that literal IP, so this is a real HTTPS domain with no separate DNS record needed).
- **Database**: `data/zinema.sqlite` on the VPS filesystem — no `sqlite3` CLI installed there; ad-hoc queries are done by writing a small `python3` script locally and `scp`-ing it over (inline heredocs over SSH mangle quoting badly enough to not be worth fighting).
- **Generated media**: `data/oss/` on the VPS, served at `/oss/<filename>` by a dedicated route; anything dropped into `public/` needs a service restart before Next.js will serve it (static assets are otherwise not picked up live).
- **Deploy procedure** (no CI/CD — deploys are manual, run from this Claude Code session): tar the changed files locally → `scp` the tarball to `/tmp` on the VPS (with a small retry loop; the SSH link to this VPS is occasionally flaky and times out transiently) → extract over the app directory (tar **never deletes files removed locally** — stale files have to be pruned by hand on the rare occasion a file is deleted, not just edited) → `chown` the touched paths back to `claudebot` → `su - claudebot -c "cd ~/direkta && npm run build"` → `systemctl restart direkta` → curl the public HTTPS URL to confirm `200`.
- **Demo projects** seeded/created over the course of development: `lisbon` ("The Lisbon Pact" — the primary UI test project, has a full script/cast/storyboard/stitch chain), `maurya` ("Maurya Origins"), `quiet-star` ("The Quiet Star" — an original sci-fi trailer built end-to-end by hand via the Higgsfield MCP CLI path to prove the pipeline before most of the in-app UI existed, scored 1080p master at `data/oss/quietstar_trailer_final.mp4`), plus several ad-style test projects created later directly through the finished UI (e.g. a "DRIPSTER" streetwear ad, "Small Ad").
- **Vendors table on the VPS**: `byteplus-image-default` (Seedream, enabled + keyed — the active image path), `byteplus-video-default` (Seedance, enabled + keyed — the active video path), `fal-default` (enabled but keyless, correctly skipped by vendor resolution), `higgsfield-image-default`/`higgsfield-video-default` (Higgsfield Cloud API — present in code but deliberately left **disabled**, because the user's paid credits are on the *consumer* Higgsfield plan which only works through the OAuth/MCP path, not the metered Cloud API; enabling a creditless Cloud vendor previously caused in-app Generate to delete good takes and write error variants), `openai-image-default` (present, disabled).
- **Git**: commits are pushed to both `nishkarsh` and `nishkarsh:main --force-with-lease` (main was an old, UI-only redesign that got superseded — the user explicitly chose to make `nishkarsh`'s full working pipeline the new `main`, prioritizing "don't dilute what's hosted on the VPS").

---

## 10. Known Gaps / Explicitly Not Built Yet

Documented here rather than left implicit, since a gap that isn't written down tends to get silently "discovered" again later:

- **Storyboard PDF, Shot list, and Production Bible exports** are UI-only placeholders in Export (§2.7) — no generation logic behind them yet.
- **No in-app AI music generation or AI-generated title-card art** — the Export music score is a user-supplied upload; a fully hand-built trailer (`quiet-star`) used Higgsfield MCP's `sonilo_music` (score) and `nano_banana_pro` (title-card image, good in-frame text) tools from the CLI, but those are not wired as server-side, in-app generation options.
- **No in-app video upscaling** — the hand-built trailers used Higgsfield MCP's `upscale_video` (0-credit 720p→1080p bump) from the CLI; the in-app master render instead renders natively at 1080p rather than generating low and upscaling.
- **Consistency lock is BytePlus-only** — if a project were switched to a pure-Higgsfield-MCP image path, reference-image identity lock would not apply (that path uses pre-registered Soul Elements instead, which aren't wired into Direkta's own character model).
- **Seedance 2.5** (announced, native ~30s single clips, up to 50 references, region-edit) is not yet integrated — ModelArk/Volcano API access for it wasn't available at time of writing.

---

## 11. Stack Summary

- **Next.js 15** (App Router, Turbopack dev) + **React 19**, TypeScript strict.
- **`node:sqlite`** — no external DB dependency.
- **framer-motion** (a.k.a. motion.dev) for all UI animation; **View Transitions API** for the theme toggle.
- **HugeIcons** (via a lucide-compatible wrapper) for iconography; **Radix UI** (`react-popover`) for popovers; **React Flow** for the Stitch canvas.
- **ffmpeg / ffprobe** (system binary, not a Node package) for every video/audio operation — clip compression, the master render's title card / Ken Burns / crossfades / audio mixing, and reference-image downscaling.
- **BytePlus ModelArk** (Seedream 4.5 images, Seedance 1.5 Pro video) as the primary, keyed generation vendor; **Higgsfield** (Cloud API and consumer OAuth/MCP) and **Fal AI**/**OpenAI image** as alternate/fallback vendors.
- **unpdf** for PDF script text extraction; **gray-matter + fast-glob** for the editable Markdown "skill" files that steer each agent's house style.
