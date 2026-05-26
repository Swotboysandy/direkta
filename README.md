# Direkta

AI workbench that turns stories into cinematic short films, staying in a single Node.js / Next.js stack.

## What is included

| Feature | Direkta implementation |
| --- | --- |
| Infinite canvas production workspace | Pan, zoom, drag, manual node + edge creation, edge delete, frame-all, keyboard delete (`app/_components/Canvas.tsx`) |
| Three-layer agent system | Decision → Execution → Supervision orchestrator streaming over SSE, auto-wires edges between produced nodes (`lib/agents/orchestrator.ts`) |
| Skill files (markdown prompts) | `data/skills/*.md` loaded with frontmatter via `gray-matter` (`lib/skills/loader.ts`) |
| Programmable vendor system | SQLite vendor table with `kind=text\|image\|video`, multi-provider resolver (`lib/vendors/resolver.ts`, `lib/agents/image.ts`, `lib/agents/video.ts`) |
| Persistent project memory | SQLite (`node:sqlite`): projects / nodes / edges / messages / vendors / assets (`lib/db/`) |
| Chapter event graph | Decision plans produce ordered, kind-aware edges (script → scenes → shots; characters/music branch off) |
| Multi-project workspace | Project picker + URL `?p=` state + new/delete projects (`app/_components/ProjectPicker.tsx`) |
| Aspect-aware production | Per-project aspect ratio (16:9 / 9:16 / 1:1 / 4:5 / 21:9) passed to text framing + image dimensions + video output |
| Image generation | Fal AI (Flux) and OpenAI gpt-image-1, per-node `Generate image`, every variant stored in `assets` table |
| Video generation | Fal AI (Kling) wired; Runway + MiniMax scaffolded with clear "needs wiring" stubs, per-node `Generate video` |
| Inline editing | Live edit project title/premise and node title/body with debounced auto-save |
| Asset history | Every regeneration kept as a row in the `assets` table, browsable from the inspector with per-variant delete |

## What is intentionally deferred

- **ONNX vector memory** (`@huggingface/transformers`) — heavy, postponed; current memory is full-text SQLite.
- **Video generation** — image generation works; video stages still describe shots without rendering motion.
- **VM2 sandbox for TS vendor plugins** — vendor settings are JSON-backed config, not executable TypeScript yet.
- **Socket.IO** — replaced with Server-Sent Events from Next.js route handlers, which streams the agent pipeline natively.
- **Multi-language UI** — English only.
- **Electron packaging** — runs as a regular Next.js web app.

## Stack

- Next.js 15, React 19, TypeScript strict
- `better-sqlite3` + raw SQL for persistence
- Vercel AI SDK (`ai` + `@ai-sdk/anthropic` + `@ai-sdk/openai` + `@ai-sdk/google`)
- `gray-matter` + `fast-glob` for markdown skill loading
- `framer-motion`, `lucide-react`, `clsx` for the UI
- `zod` for plan validation

## Layout

```
app/
├── api/                  Route handlers (replaces Express routes)
│   ├── assets/[id]       Delete a generated image/video variant
│   ├── chat/             SSE stream of the 3-layer pipeline
│   ├── edges/            POST / DELETE node connections
│   ├── nodes/            CRUD + /image + /video + /assets per node
│   ├── projects/         CRUD for projects
│   ├── skills/           Lists loaded markdown skill files
│   └── vendors/          Vendor (AI provider) config
├── oss/[file]            Static-serve generated images and videos
├── _components/          Canvas, Inspector, AgentDock, ProjectPicker
├── settings/             Text / image / video vendor + skill management
└── page.tsx              Workbench shell with URL ?p=<projectId>
lib/
├── agents/               orchestrator.ts, image.ts, video.ts
├── db/                   client.ts (SQLite + migrations), repo.ts (entities)
├── skills/               loader.ts (gray-matter + fast-glob)
├── vendors/              resolver.ts (text providers)
└── types/                Shared types
data/
├── skills/               decision.md / execution.md / supervision.md
├── oss/                  generated images + videos (gitignored)
└── zinema.sqlite         created on first run (gitignored)
```

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), go to **Settings**, and configure up to three vendors:

- **Text vendor** (Anthropic Claude / OpenAI GPT / Google Gemini) — drives the three agent layers.
- **Image vendor** (Fal AI Flux / OpenAI `gpt-image-1`) — generates frames for character / scene / storyboard / shot nodes.
- **Video vendor** (Fal AI Kling — fully wired; Runway / MiniMax — scaffolded, see `lib/agents/video.ts`).

Without keys the UI still works — node editing, manual canvas wiring, project switching, skill files, schema, everything. The image/video buttons surface a clean "no vendor with key" error until you paste one.

### Working with the canvas

- **Project picker** in the topbar — switch between projects, create or delete one.
- **Aspect picker** — affects how the text agent frames shots and the dimensions the image/video stages render at.
- **Drag a node** to reposition. **Scroll** to zoom. **Drag empty canvas** to pan. The **frame-all** button in the bottom HUD fits everything.
- **Drag the dot** at a node's bottom edge to another node's top edge to draw an edge. **Click an edge** to delete it.
- **Add a node** by hand via the inspector's `Add node` grid (visible when nothing is selected).
- **Inline-edit** project title/premise and node title/body in the inspector — changes auto-save.
- **`Del` / `Backspace`** removes the selected node. **`Esc`** deselects.

### Running the agent

Type a request in the agent dock — for example:

> Plan the cold open: write a script beat, design the heroine, board the first chase, and queue a music cue.

The Decision layer plans the work, the Execution layer fills each node, and the Supervision layer reviews. Nodes appear on the canvas as they are produced, with edges drawn between related nodes (script → scenes → shots). Select a visual node, click **Generate image** or **Generate video** in the inspector — assets land in `data/oss/` and every variant is kept in the `assets` table.

## Build

```bash
npm run build
npm run start
```

## Reset the local database

```bash
npm run db:reset
```

## License

Apache-2.0.
