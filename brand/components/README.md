# Components

Every Direkta UI surface composes from this set. Class names match the markup in `examples.html` — open that file in a browser to see each component live, then copy the markup verbatim.

All components depend on `../tokens/tokens.css` and `../type/type-scale.css`. Import them once at the top of your stylesheet, then add `components.css`.

## Index

| Class | What | Variants | Where used |
|---|---|---|---|
| `.btn`              | Button — base   | `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger`, `.btn-sm`, `.btn-lg` | CTAs, toolbars |
| `.pip`              | Status dot (8px) | `data-status="working" / "done" / "draft" / "error"` | Inline next to titles |
| `.pip-state`        | Status pill (label + dot) | same `data-status` values | Cards, headers |
| `.tag`              | Metadata chip | `.tag-accent`, `.tag-2`, `.tag-3` | Project metadata strip |
| `.card`             | Surface card — cream-warm fill, soft shadow, 16px radius | `.card-tilt-a/b/c` for signature rotation | Wraps any panel content |
| `.stage-card`       | Pipeline stage card | `data-status` | Dashboard pipeline strip |
| `.quick-card`       | Quick-access card with icon + cta | — | Dashboard quick row |
| `.topnav`           | Top navigation bar | — | App chrome — every page |
| `.sidebar-item`     | Sidebar workspace row | `data-active`, `data-locked` | Sidebar |
| `.input`            | Text input | `.input-mono` | Forms |
| `.toast`            | Toast notification | `data-kind="info" / "success" / "danger"` | Bottom-right stack |
| `.modal`            | Modal dialog | — | Confirmations |
| `.divider`          | Horizontal rule | `.divider-tick` for film-leader styling | Section breaks |

## Patterns

### A page header
```html
<header class="page-head">
  <div>
    <span class="t-eyebrow">DASHBOARD · THE LISBON PACT</span>
    <h1 class="t-display-m">The Lisbon Pact</h1>
    <p class="lead">An ex-spy returns to Portugal to settle a debt.</p>
    <div class="tag-strip">
      <span class="tag">Short</span>
      <span class="tag tag-2">8 min</span>
      <span class="tag tag-3">Drama</span>
    </div>
  </div>
  <div class="page-head-actions">
    <button class="btn btn-secondary">Edit project</button>
    <button class="btn btn-primary">Continue working →</button>
  </div>
</header>
```

### A pipeline strip
```html
<div class="eyebrow-row">
  <span class="t-eyebrow">PRODUCTION PIPELINE · 5 STAGES</span>
</div>
<div class="pipeline">
  <article class="stage-card card-tilt-a" data-status="done">
    <header>
      <span class="t-eyebrow">01 / 05</span>
      <span class="pip" data-status="done"></span>
    </header>
    <h3 class="t-h3">SCRIPT</h3>
    <p class="t-body-s t-mute">Bible built · 46 beats</p>
    <div class="progress"><div class="progress-bar" style="width:100%"></div></div>
    <span class="pip-state" data-status="done">DONE</span>
  </article>
  …
</div>
```

### A card with tilt
```html
<div class="card card-tilt-b">
  <h2 class="t-h2">Card title</h2>
  <p>Any body content sits inside.</p>
</div>
```

## Tilt — when to use it

The brand's signature is the **slight per-card rotation** (±0.3°–0.6°). Use it on **collected** card grids — dashboards, libraries, galleries — where the playful rhythm helps. **Don't tilt:**
- form inputs
- modals
- toasts
- nav items
- anything inside a list or table

The three tilt utility classes (`card-tilt-a/b/c`) alternate signs so that adjacent cards lean toward each other. Apply them in order (`a, b, c, a, b, c, …`) across a row.

## Density

Default density assumes a 1280px+ viewport. For dense data views (Library tables, Codex word-counts), wrap the section in `[data-density="compact"]` and the component CSS halves padding + drops one font-size step. See `components.css`.

## What's NOT in components.css

- Workspace-specific layouts (Storyboard timeline, Stitch node graph) — those live in the workspace JSX.
- Data viz — bar/line charts. Use a chart lib themed via `--accent` / `--accent-2` / `--accent-3`.
- Auth screens, marketing pages — separate stylesheets.
