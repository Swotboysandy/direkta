# Type system

Three families, three roles. Never mix.

| Family | Role | Token | Where |
|---|---|---|---|
| **Bagel Fat One** | Display | `--font-display` | Headlines (h1–h2), brand text, large stat numbers, button labels on primary CTAs |
| **Nunito** | UI / body | `--font-ui` | Everything else — paragraphs, labels, small UI text, secondary buttons |
| **JetBrains Mono** | Mono | `--font-mono` | Code, timecodes, eyebrows ("WORKING · 4 MIN AGO"), status pills, file paths |

## Loading the fonts

The fastest path is the `@import` at the top of `tokens/tokens.css`. If you'd rather use a `<link>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bagel+Fat+One&family=Nunito:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

If your stack self-hosts fonts (e.g. `next/font`), import:
- `Bagel Fat One` — 400 only (single weight available)
- `Nunito` — 400, 500, 600, 700, 800
- `JetBrains Mono` — 400, 500, 600

## Fallbacks

| Primary | Fallback chain |
|---|---|
| Bagel Fat One | Lilita One → Alfa Slab One → Impact → serif |
| Nunito | -apple-system → BlinkMacSystemFont → Segoe UI → system-ui → sans-serif |
| JetBrains Mono | ui-monospace → SFMono-Regular → Menlo → monospace |

Bagel Fat One has very specific metrics — if it fails to load and the fallback kicks in, expect headlines to look noticeably thinner. Always include a `font-display: swap` and accept the brief flash.

## Scale (full list in `tokens/tokens.css`)

| Token | Default size | Family | Where |
|---|---|---|---|
| `--t-display-l` | clamp(56–96px) | display | Splash, hero |
| `--t-display-m` | clamp(44–64px) | display | Project title, section opener |
| `--t-h1`        | clamp(36–48px) | display | Workspace H1 |
| `--t-h2`        | 28px           | display | Card titles, modal titles |
| `--t-h3`        | 22px           | display | Group headers, stage names |
| `--t-h4`        | 18px           | display **or** ui-700 | Inline emphasis |
| `--t-body-l`    | 17px           | ui-500 | Lead paragraphs |
| `--t-body`      | 15px           | ui-400 | Default body |
| `--t-body-s`    | 13px           | ui-500 | Compact UI, metadata |
| `--t-cap`       | 11px           | ui-700 | Inline tags |
| `--t-eyebrow`   | 10px           | mono-500, uppercase, 0.22em tracking | Section eyebrows, status text |

## Eyebrow + label patterns

The brand uses **mono uppercase eyebrows** heavily — every section header, every status, every metadata strip. Pattern:

```html
<span class="t-eyebrow">PRODUCTION PIPELINE · 5 STAGES</span>
```

```css
.t-eyebrow {
  font-family: var(--font-mono);
  font-size: var(--t-eyebrow);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: var(--tracking-eyebrow);
  color: var(--mute);
}
```

(All `.t-*` classes are pre-defined in `type-scale.css`.)

## Don'ts

- ❌ Don't use Bagel Fat One for body copy — it's unreadable below ~20px.
- ❌ Don't use Nunito for headlines — it loses the brand voice.
- ❌ Don't mix the mono with the display in the same word.
- ❌ Don't add font-weight to Bagel Fat One (only 400 exists).
- ❌ Don't italicise anything — none of the three families ship italics worth using.
