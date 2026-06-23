# docs/ — Direkta in-house build

The `inhouse` branch runs Direkta as an internal tool where **Claude is the backend and Direkta is
the interface**, driven over a dedicated MCP server, with keyless generation.

| Doc | What |
|---|---|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | The in-house system: the two engines (Claude primary / Codex fallback), the `direkta` MCP server + tools, media generation (Higgsfield account vs free Codex Record-&-Replay), the pipeline stages, data model, how to run, and status. |
| [`CODEX_HANDOFF.md`](CODEX_HANDOFF.md) | Codex's role as the free generation worker — read `worklist.json`, generate in a free web UI, save `frame_<id>` / `clip_<id>` into the inbox; the skills to record. |

Start with `ARCHITECTURE.md`.
