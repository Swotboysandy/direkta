# Build Log — Direkta in-house (`inhouse`)

> Append-only history. Newest entries at the top.

## 2026-06-24 — Maurya pipeline run + Codex handoff + Screenplay tile fix
- Picked up from `HANDOFF_2026-06-24_0213_session.md`. Verified clean: git log
  (f54865d…046d5ed), `git status` in sync with origin/inhouse, `claude mcp get direkta` ✓ Connected,
  `tsc --noEmit` 0 errors.
- Confirmed the handoff's "reconnect" item is already resolved: this fresh session binds the current
  `direkta` server, so all **10 tools** (incl. `write_worklist`/`sync_generations`) are live.
- Started a real run on **"Maurya Origins"** (`N6mmfZQ2qG`): `create_project` done (script stored,
  2.39:1); breakdown generated via a schema-locked workflow (draft → adversarial verify → finalize),
  pending `import_breakdown`; shotlist + `write_worklist` next.
- Fixed cosmetic bug: `app/_workspaces/Screenplay.tsx` Bible-summary tiles for **Characters/Locations**
  now render `characters.length`/`locations.length` (were hardcoded `"—"`).
- Wrote `handoffs/HANDOFF_2026-06-24_codex.md` — distilled handoff for the Codex free-generation worker
  to get up to speed on the live Maurya run.
