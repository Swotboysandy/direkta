# Direkta · Brand Guide

> **For coding agents (Claude Code, etc.):** this folder is a self-contained brand kit. Everything you need to implement Direkta's UI lives here. Start with `tokens/tokens.css` — it is the single source of truth.

Direkta is an AI filmmaking tool. The visual identity is **"playful retro modern"** — concession-stand cartoon palette (cream / tomato / mustard / viridian / cocoa), chunky Bagel Fat One headlines, soft pillow shadows, slight per-card tilt. Cinema-warm, never sterile.

---

## Folder map

```
brand/
├── README.md                   ← you are here
├── Brand Guide.html            ← open in a browser for the human-viewable guide
│
├── tokens/
│   ├── tokens.css              ← all CSS custom properties (palette, type, spacing, shadow, radius, motion)
│   └── tokens.json             ← same tokens, machine-readable
│
├── logo/
│   ├── README.md               ← logo usage rules (clear space, min size, do / don't)
│   ├── logomark.svg            ← aperture mark — DEFAULT (cocoa on transparent)
│   ├── logomark-cream.svg      ← cream — for dark surfaces
│   ├── logomark-tomato.svg     ← accent — for cream/cocoa surfaces, sparingly
│   ├── logomark-mono.svg       ← single-colour for print / embossing
│   ├── wordmark.svg            ← "DIREKTA" wordmark (cocoa)
│   ├── wordmark-cream.svg
│   ├── primary-lockup.svg      ← logomark + wordmark, cocoa
│   ├── primary-lockup-cream.svg
│   └── primary-lockup-color.svg ← cocoa wordmark + tomato aperture (hero use only)
│
├── type/
│   ├── README.md               ← font roles, scale rationale, fallbacks
│   └── type-scale.css          ← type classes (.t-display-l, .t-h1, .t-body, .t-mono, etc.)
│
├── components/
│   ├── README.md               ← component index with class names + when to use
│   ├── components.css          ← all component styles (.btn, .card, .pip, .stage, .topnav…)
│   └── examples.html           ← live preview of every component (open in a browser)
│
└── motion/
    ├── README.md               ← motion principles (easing, duration scale, on-load behaviour)
    └── motion.css              ← keyframes + utility classes
```

---

## How to implement Direkta in a new codebase

1. **Drop `tokens/tokens.css` into your stylesheet entry.** Everything downstream — components, type, motion — references its custom properties. Do not hard-code colours or sizes anywhere else.
2. **Load the three Google Fonts** (Bagel Fat One, Nunito, JetBrains Mono). See `type/README.md`. The `tokens.css` file includes the `@import` if you need it inline, but a `<link>` in `<head>` is preferred.
3. **Import `components/components.css`.** Class names match the markup in `components/examples.html` — copy any pattern verbatim.
4. **Use `logo/primary-lockup.svg`** for nav-bar branding by default. Swap to `logomark.svg` when space is tight (< 120px).
5. **Optional polish:** `motion/motion.css` adds the on-load entry animations and hover micro-interactions. Skippable for a v1.

---

## Token cheat-sheet (full list in `tokens/tokens.css`)

| Token | Value | Where to use |
|---|---|---|
| `--bg`          | `#F5EDDC` (cream)   | Page background |
| `--surface`     | `#FFFBF1` (warm white) | Card surfaces |
| `--ink`         | `#2A1A12` (cocoa)   | Primary text, outlines |
| `--accent`      | `#E84A35` (tomato)  | Primary CTAs, "danger" |
| `--accent-2`    | `#F2B83C` (mustard) | Secondary highlights, in-progress |
| `--accent-3`    | `#3DA89B` (viridian)| Success, completion |
| `--mute`        | `#7A6855`           | Secondary text, captions |
| `--radius`      | `16px`              | All card / button corners |
| `--shadow-soft` | `0 6px 14px rgba(...)` | All elevated surfaces |
| `--tilt`        | `-0.6deg`           | Card hero rotation |
| `--font-display`| `"Bagel Fat One"`   | Headlines, brand text |
| `--font-ui`     | `"Nunito"`          | All UI / body |
| `--font-mono`   | `"JetBrains Mono"`  | Code, timecodes, status labels |

---

## What's deliberately NOT here

- **Imagery / photography** — Direkta is a tool that *generates* imagery; the brand uses none of its own. Treat user-generated film stills as the imagery, framed in `--surface` cards.
- **Iconography beyond the logomark** — the existing `assets/icons/` set (Lucide-style line icons) is fine to keep. If you swap them, match `2px` stroke at `24px` size.
- **Marketing layouts** — this kit is product-UI-first. Marketing site is a separate brief.

---

## Versioning

This is **v1.0** of the playful-retro brand. The previous "film-negative dark" identity (in `/assets/tokens.css` at the project root) is deprecated for product UI but kept for reference.

— Last updated 2026-05-26
