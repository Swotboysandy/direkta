# Direkta

> **You direct. AI delivers.**

A browser-based film production platform with a full crew of specialised AI agents. Direkta turns scripts into animated short dramas through five purpose-built workspaces — Screenplay, Casting, Storyboard, Stitch, and Export — each driven by named agents that propose options for the director to commit.

This branch is the merge of two upstream repos:
- **`Swotboysandy/direkta`** — Node.js / Next.js architecture (the engine: SQLite, vendor abstraction, agent runtime, route handlers)
- **`buzz1ebee/direkta`** — Claude Design handoff bundle (the visual spec: HTML prototype, JSX panels, brand tokens, `DIREKTA_USER_FLOW.md`, `DIREKTA_MASTER_CONTEXT.md`)

## V1 — Part 1 (what's landed in this commit)

- **Direkta design tokens + brand fonts** ported from `buzz/main:project/assets/tokens.css` — film-negative ink scale, bone, tungsten accent, Anton / Geist / Geist Mono via `next/font/google`.
- **App shell**: 56px topnav with project picker, **9-agent dot row** with live state, Key Vault icon, save indicator, avatar. 260px collapsible sidebar with workspace list, sequential locks, status indicators.
- **Workspace router** at `/?p=<project>&ws=<workspace>` — single Next.js route, internal state switches workspaces.
- **Sequential locks** per Direkta spec: Casting unlocks after script submission; Storyboard after first Soul ID; Stitch after first selected frame; Export after first Stitch node.
- **Dashboard workspace**: project header with logline + format tags, 5-stage horizontal pipeline tracker, 6-card quick access grid, activity feed with agent icons.
- **Screenplay workspace**: empty-state script paste (Final Draft / Fountain friendly), submit-to-crew flow that writes activity, post-submit split panel (read-only script left, beat breakdown right with Bible summary card and per-beat expandable cards).
- **Casting workspace**: character grid (4 Soul ID states — empty / training / trained / failed), locations grid (INT/EXT), manual add modal. Soul ID training stubbed for V1, ready to wire to Fal Flux LoRA.
- **Key Vault panel**: slide-in from the right. Three sections (text / image / video vendors), per-vendor toggle, model, key paste, base URL. Replaces the old `/settings` UX in-context.
- **New Project modal**: title + logline + format pills + length pills + aspect ratio pills.
- **Co-Director onboarding overlay**: floating launcher in the bottom-right, 6-step setup walkthrough that drives the user from project brief → keys → script → casting → frames → stitch.
- **Schema (12 new tables / extended)**: `projects` (+ logline / format / length_estimate / script / script_submitted), `beats`, `characters` (with `soul_id_*`), `locations`, `bible`, `storyboard_rows`, `storyboard_variants`, `stitch_nodes`, `transitions`, `proposals` (Propose-Don't-Commit queue), `clarifications`, `activity`, `snippets`, `assets` extended with `target_kind` / `target_id`.
- **Auto-migration**: existing databases upgrade in place via `ensureColumn`; no data loss.
- **9-agent dispatch endpoint** at `/api/projects/[id]/agents` derives state from project / beats / characters / bible — wires the topnav status dots.
- **REST surface**: `/api/projects/[id]/script/submit`, `/api/projects/[id]/characters`, `/api/projects/[id]/locations`, `/api/characters/[id]` PATCH/DELETE — enough to drive Screenplay and Casting end-to-end.

## V1 — Part 2 (queued)

- **Storyboard workspace** — 4-variants-per-beat grid, pick-one flow, Cinematographer pipeline using the 3-layer engine underneath.
- **Stitch workspace** — reuse the existing canvas constrained to selected frames, edge-as-transition model, Video Director.
- **Propose-Don't-Commit refactor** — orchestrator emits proposals (not committed nodes), UI surfaces them as approve/reject cards.
- **Live agent state** — replace derived state with the orchestrator's actual in-flight state; activity feed populates from real events.
- **Library workspace** — unified output browser across projects.
- **Skill files for each named agent** under `data/skills/` (one per agent).

## Post-V1

- Real Soul ID training (Fal Flux-LoRA), Continuity Checker logic, FFmpeg animatic assembly, Export pipeline (MP4 / PDF storyboard / shot list / bible), multi-language UI, scripting sub-tabs (Outline / Codex / Discuss / Analyse).

## Stack

- **Next.js 15** + React 19, TypeScript strict
- **`node:sqlite`** (built into Node 22+) for persistence
- **Vercel AI SDK** with Anthropic / OpenAI / Google for text agents
- **Fal AI** Flux for image, Kling for video; OpenAI gpt-image-1 as image alt; Runway / MiniMax scaffolded
- **gray-matter + fast-glob** for markdown skill files
- **lucide-react** for icons, **clsx** for class composition

## Layout

```
app/
├── api/
│   ├── characters/[id]               PATCH / DELETE
│   ├── projects/
│   │   ├── [id]                      GET (bundle) / PATCH / DELETE
│   │   └── [id]/
│   │       ├── agents                Derived 9-agent state
│   │       ├── characters            GET / POST
│   │       ├── locations             GET / POST
│   │       └── script/submit         POST
│   ├── edges, nodes, assets, ...     legacy routes (still wired for Stitch reuse)
│   ├── chat                          SSE 3-layer orchestrator stream
│   ├── skills                        Markdown skill loader
│   └── vendors                       Vendor config CRUD
├── _components/
│   ├── TopNav.tsx                    Brand + project picker + 9-agent dots + Key Vault
│   ├── Sidebar.tsx                   Workspace list with sequential locks
│   ├── NewProjectModal.tsx           Title / logline / format / length / aspect
│   ├── KeyVaultPanel.tsx             Slide-in vendor config
│   ├── CoDirectorOverlay.tsx         6-step onboarding
│   ├── AgentDock.tsx                 (legacy, retained for Stitch port)
│   ├── Canvas.tsx                    (legacy, retained for Stitch port)
│   ├── Inspector.tsx                 (legacy, retained for Stitch port)
│   └── ProjectPicker.tsx             (legacy, replaced by TopNav)
├── _workspaces/
│   ├── Dashboard.tsx                 Pipeline tracker, quick access, activity feed
│   ├── Screenplay.tsx                Script paste + beat breakdown
│   ├── Casting.tsx                   Soul ID cards
│   └── WorkspaceStub.tsx             Stub component for Storyboard / Stitch / Library / Export
├── oss/[file]                        Static-serve generated images and videos
├── settings/                         Legacy settings page (Key Vault is the new home)
├── globals.css                       All Direkta tokens + components
├── layout.tsx                        Fonts + metadata
└── page.tsx                          Workspace shell
lib/
├── agents/                           orchestrator.ts, image.ts, video.ts
├── db/                               client.ts (migrations), repo.ts (entity repos)
├── skills/                           loader.ts (gray-matter + fast-glob)
├── vendors/                          resolver.ts (text providers)
└── types/                            Shared types
data/
├── skills/                           decision.md / execution.md / supervision.md
├── oss/                              generated images + videos (gitignored)
└── zinema.sqlite                     created on first run (gitignored)
```

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The DB seeds itself on first request and the demo project ("Runaway Heiress" — legacy from architecture repo) appears in the picker. Open the Co-Director overlay (bottom-right pulse) for the onboarding walkthrough.

To paste API keys, click the **Key icon** in the top nav (or open the Co-Director and step through to "Connect keys"). Without keys, the UI still works — generation buttons surface a clear "no vendor configured" error until you paste one.

## Build

```bash
npm run typecheck   # Zero errors
npm run build       # 22 routes
npm run start
```

## Reset

```bash
npm run db:reset
```

## License

Apache-2.0, matching upstream Toonflow.
