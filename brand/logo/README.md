# Logo — usage rules

The Direkta logomark is a **concentric lens** — abstract film reel, camera iris, and "now showing" target dot. Four rings: cocoa outer, cream gap, mustard inner, tomato lens. The wordmark is **Bagel Fat One** set in cocoa.

## Files in this folder

| File | What it is | When to use |
|---|---|---|
| `logomark.svg`              | Default lens mark (cocoa outer) | Cream / light surfaces — favicons, app icons, anywhere ≥ 24px |
| `logomark-cream.svg`        | Inverted (cream outer)          | Dark surfaces — never on cream |
| `logomark-tomato.svg`       | Tomato outer ring               | Hero moments, splash, packaging — once per surface, sparingly |
| `logomark-mono.svg`         | Single-colour outline (uses `currentColor`) | Print, embossing, foil, anywhere fill colour must be inherited |
| `wordmark.svg`              | "DIREKTA" in Bagel Fat One (cocoa) | Cream surfaces, when the mark is shown elsewhere |
| `wordmark-cream.svg`        | Wordmark in cream                 | Dark surfaces |
| `primary-lockup.svg`        | Logomark + wordmark, cocoa        | **Default for nav bars, headers, footers, intros** |
| `primary-lockup-cream.svg`  | Lockup on dark                    | Dark mode, splash screens |
| `primary-lockup-color.svg`  | Hero — tomato mark + tomato K     | Landing pages, splash, marketing — never inside the product UI |

## Clear space

Reserve a margin equal to **the radius of the lens mark's outer cocoa ring** (the outer circle's radius — `r=92` in the source SVG, so ~46% of the mark's bounding box) around every side of the logo. Nothing — text, edge, other graphic — may enter that zone.

```
┌──────────────────────────────────┐
│   ░░░░ clear space ░░░░          │
│   ░░  ┌─────────────┐  ░░        │
│   ░░  │  ⊙ DIREKTA  │  ░░        │
│   ░░  └─────────────┘  ░░        │
│   ░░░░ clear space ░░░░          │
└──────────────────────────────────┘
```

## Minimum sizes

| Asset | Min size (digital) | Min size (print) |
|---|---|---|
| Logomark alone           | **24px** square   | **8mm** square   |
| Primary lockup           | **120px** wide    | **30mm** wide    |
| Wordmark alone           | **96px** wide     | **24mm** wide    |

Below these sizes, the inner mustard / tomato detail muddies — fall back to `logomark-mono.svg` and accept the loss of internal colour.

## Do / Don't

✅ **Do**
- Use `primary-lockup.svg` by default in product chrome.
- Use `logomark.svg` alone when horizontal space is tight (< 200px).
- Use `logomark-tomato.svg` as a one-per-surface hero accent.
- Place on cream (`#F5EDDC`) or any brand surface tone — let the lens breathe.
- Pair the lockup with **Bagel Fat One headlines** elsewhere on the surface.

❌ **Don't**
- Don't recolour outside the brand palette.
- Don't stretch, shear, rotate, or add drop shadows / strokes / glows.
- Don't put the lockup on a busy photograph without a cream card behind it.
- Don't replace the wordmark font with a system fallback unless Bagel Fat One genuinely can't load — and if so, use **Alfa Slab One**, then **Impact**.
- Don't enclose the mark in a frame or badge — it is its own badge.
- Don't use `primary-lockup-color.svg` inside the product UI. It's marketing-only.

## Implementation notes for Claude Code

- All SVGs use `viewBox` — they scale perfectly. Set `width` / `height` via CSS, not attributes.
- The wordmark SVGs reference **Bagel Fat One** via `font-family`. The host page must load the font (see `../type/README.md`) or the wordmark renders in the fallback. If you need a font-independent wordmark, outline-trace it with a tool like `fontmin` / `svgo` and commit alongside.
- `logomark-mono.svg` uses `fill="currentColor"`. Wrap in any element with a `color` to recolour.
- For React: import the SVG as a component and pass `aria-label` if you change the labelled meaning.
