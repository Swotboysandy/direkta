# Claude Code handoff

This is a copy-paste handoff prompt for the Direkta brand kit. Paste the block below into a fresh Claude Code session in your codebase.

---

## ✂️ COPY-PASTE PROMPT

```
I'm bringing the Direkta brand into this codebase. The full brand kit lives in
the attached /brand folder. Treat it as the source of truth — do not invent
colours, type, spacing, or components that aren't grounded in it.

START BY READING:
1. /brand/README.md                  ← master index + folder map + 5-step
                                       implementation plan
2. /brand/tokens/tokens.css          ← every CSS custom property the system
                                       depends on; nothing else may hard-code
                                       colours or sizes
3. /brand/components/README.md       ← component class index + when to use
4. /brand/components/examples.html   ← live preview of every component with
                                       copy-paste markup that matches the CSS

THEN, for the implementation:

1. Drop /brand/tokens/tokens.css into the stylesheet entry point of this app.
   Every downstream stylesheet must reference its --custom-properties, not
   raw hex values.

2. Load the three Google Fonts (Bagel Fat One, Nunito, JetBrains Mono). The
   @import is already in tokens.css, but prefer a <link> in <head> for
   performance. See /brand/type/README.md for the exact tag and the
   self-hosting list if you use next/font or similar.

3. Import the three companion stylesheets in this order, after tokens.css:
     /brand/type/type-scale.css
     /brand/components/components.css
     /brand/motion/motion.css

4. For brand chrome (nav bar, splash, footer) use
   /brand/logo/primary-lockup.svg. Logomark alone for tight horizontal space
   (<200px). See /brand/logo/README.md for clear-space and minimum-size
   rules — respect them.

5. Reuse class names exactly as written in /brand/components/components.css.
   When in doubt about markup, open /brand/components/examples.html in a
   browser and copy the pattern verbatim.

NON-NEGOTIABLE RULES (full list in /brand/Brand Guide.html, Chapter 08):
- Cream (#F5EDDC) is the page; warm white (#FFFBF1) is the card surface.
  Never use pure white.
- Card outlines are 0px in this brand. Definition comes from shadow + colour
  contrast.
- Tilt collected cards (.card-tilt-a / -b / -c). Never tilt inputs, modals,
  toasts, or anything inside a list / table.
- No gradients. Flat fills only.
- Colour means something:
    tomato (--accent)    = danger / primary CTA
    mustard (--accent-2) = in-progress
    viridian (--accent-3) = success / complete
  Don't reach for accent colours decoratively.
- No emoji. No icons drawn from scratch — keep the existing line-icon set if
  one is in the codebase, or use Lucide at 2px stroke, 24px.

When you're done, the result should look like the "Applied" chapter in
/brand/Brand Guide.html — a Direkta dashboard with cream background, tilted
pipeline cards, mustard project chip in the top nav, and the lens mark in the
brand corner.

Confirm you've read the README + tokens.css before writing any code.
```

---

## How to send this to Claude Code

You have three options — pick whichever fits your workflow:

### Option A — Drop the folder into your repo, then paste

1. Copy the entire `/brand` folder into your target codebase (anywhere; the prompt assumes the root, but Claude Code can re-pathify).
2. Open Claude Code in that repo.
3. Paste the block above.

### Option B — Use the GitHub bundle

If you push this Direkta design project to GitHub (or you already have it at `buzz1ebee/direkta`), tell Claude Code:

> "Pull the `/brand` folder from `<your-github-url>` into this repo, then follow the handoff prompt below: [paste the block above]"

### Option C — Hand off the whole design project as a download

Download this project as a zip (Project menu → Download), unzip the `brand/` folder next to your target repo, then paste the prompt above. The brand folder is fully self-contained — no external dependencies beyond Google Fonts.

---

## What Claude Code will have

| Artefact | Path | Purpose |
|---|---|---|
| Master index             | `brand/README.md`                 | First read — folder map + 5-step plan |
| Tokens (CSS)             | `brand/tokens/tokens.css`         | Single source of truth |
| Tokens (JSON)            | `brand/tokens/tokens.json`        | Machine-readable mirror |
| Logo rules               | `brand/logo/README.md`            | Clear space, minimums, do/don't |
| 9 logo SVGs              | `brand/logo/*.svg`                | Lockups, marks, mono, colour variants |
| Type rules               | `brand/type/README.md`            | Family roles + fallbacks |
| Type scale               | `brand/type/type-scale.css`       | `.t-display-l`, `.t-h1`, `.t-body`, `.t-mono`, `.t-eyebrow` |
| Component index          | `brand/components/README.md`      | Class index + patterns |
| Component CSS            | `brand/components/components.css` | `.btn` `.pip` `.card` `.stage-card` `.topnav` `.input` `.toast` `.modal` |
| Component live preview   | `brand/components/examples.html`  | Copy-paste markup, runs standalone |
| Motion rules             | `brand/motion/README.md`          | Durations + easings + principles |
| Motion CSS               | `brand/motion/motion.css`         | Keyframes + `.fx-*` utilities |
| Human brand guide        | `brand/Brand Guide.html`          | 9-chapter visual reference |

---

## What to ask Claude Code AFTER it confirms it's read everything

A short follow-up like:

> "Now restyle [SPECIFIC SCREEN] to match the brand. Show me the diff before applying."

…will get a much cleaner result than asking it to restyle everything at once. Start with the dashboard, then sidebar, then individual workspaces.
