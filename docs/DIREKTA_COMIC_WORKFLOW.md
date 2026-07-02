# Direkta — Comic Generation Workflow (script → panels → PDF)

A comic-optimized version of the Direkta pipeline. Same inverted model (the chat is the brain; Direkta
persists + ingests), same tools — but the **Cinematographer becomes a comic panelling & pacing expert**,
**shots become panels**, the **look-lock becomes an art-style lock**, and the **video stitch becomes PDF
page assembly.** Workflow only, not the website. (See `DIREKTA_LOCAL_GENERATION_WORKFLOW.md` for the base.)

## Cinema → Comic mapping
| Cinema | Comic |
|---|---|
| Cinematographer (DoP) | **Panelling & Pacing expert** (page layout, panel grammar, reading order, page-turn reveals) |
| Shot (storyboard variant) | **Panel** |
| Beat coverage (shotlist) | **Page layout** — an ordered set of panels of varied types |
| Look-lock (palette/lens/light) | **Art-style lock** (line/ink/color/render, palette, lettering) |
| `frame_<variant_id>.png` | the **panel artwork** |
| Stitch board + `clip_<node_id>` (video) | **Page assembly** — place panels + letter + export |
| Final: a trailer | Final: a **PDF comic** |

## Pipeline (reuses the Direkta tools, reinterpreted)
```
create_project(title, script, aspect_ratio)         →  project_id            (aspect = page ratio, e.g. "2:3")
import_breakdown(project_id, breakdown)             →  Story Bible + numbered SCENE BEATS (+ gaps→clarifications)
get_project(project_id)                             →  ART-STYLE LOCK (the "look_lock") + cast identity + beat ids
import_shotlist(project_id, beat_id, …, shots[])    →  the PAGE LAYOUT for that beat  (shots[] = PANELS, in reading order)   [per beat]
write_worklist(project_id)                          →  data/worklist.json  (one item per PANEL)
   → GENERATE each panel, save  data/inbox/frame_<variant_id>.png
sync_generations()                                  →  panels attached to their variants (the page's panels)
ASSEMBLE → compose pages from panels per layout, add lettering, export PDF
```

## Stage 1 — Story (Screenplay agent, unchanged)
Script → a Story Bible: logline, synopsis, tone, **world**, **characters with DENSE identity descriptors**
(critical — these hold character consistency across panels), locations, and numbered **scene beats**.
Persist with `import_breakdown`. The bible's visual fields carry the **art-style lock** (below).

## Stage 2 — Panelling & Pacing (the Cinematographer's new job)
For **each scene beat**, design a **page** (or spread) as an ordered sequence of **panels**. This is the
craft — not "a picture of the scene" but *how to break the moment into panels that read and pace right.*

**Panel-type vocabulary** (pick per beat, guided by the story's grammar):
- **Splash** (full-page single panel) — arrivals, reveals, act openers.
- **Full-bleed / borderless** — immersion, dread, scale (no gutters, art to the page edge).
- **Establishing / wide** — open a location; place characters in the world.
- **Grid tiers** — standard storytelling: 3-tier, 6-panel, or the **9-panel grid** (control, tension, time).
- **Medium / two-shot** — conversation.
- **Close-up / extreme close-up** — emotion, a decision, a reaction beat.
- **Insert / detail** — a hand, an object, a clue the scene turns on.
- **Action panel** — dynamic angle, motion lines, diagonal composition.
- **POV** — inside a character's eyes.
- **Silent / beat panel** — no words; a held moment (pacing).
- **Inset** (panel-within-panel) — simultaneity or emphasis.
- **Cinemascope letterbox** (wide short panel) — scope, a slow beat.
- **Tall vertical panel** — falling, height, a figure dominating.
- **Split / diagonal gutters** — chaos, speed, a shattered moment.

**Pacing & layout rules:**
- **Gutter = time.** Wider gutter / bigger panel = more time; a dense grid = compressed, fast time.
- **Decompressed vs compressed:** few big panels (slow, cinematic) vs many small (fast, kinetic). Vary it.
- **Reading order:** left→right, top→bottom (Z-path). Panel shapes must guide the eye; the *hero panel*
  (usually largest) carries the beat's dramatic point; the **establishing panel** anchors the space.
- **The page turn is a reveal device.** Put a surprise/reveal on the **first panel after a turn**; end
  a page (recto) on a hook.
- **Panel count:** a quiet beat = 1 splash or a few panels; a busy beat = a full grid. Don't pad/starve.
- Note **every panel's lettering** now: dialogue **balloons** (who/what), **captions** (narration/VO),
  and **SFX** — with rough placement. (Text is added at assembly, not baked into the art — see Stage 4.)

**What you store** (via `import_shotlist`, `shots[]` = panels **in reading order**): each panel is a
"shot" whose `angle` encodes the **panel type + shape/size + grid box**, `positive` is the panel prompt,
`negative` protects the art style, `aspect` is the panel's own ratio, `seed_identity` holds the shared
page seed + character anchors. Keep a parallel **page-layout record** (JSON below) that also carries each
panel's **box** (position/size on the page) and its **lettering** — the assembler needs those.

## Stage 3 — The panel prompt (5-layer, adapted for comic art)
Every panel prompt, built in priority order, ending with the **byte-identical art-style lock**:
1. **PANEL** — panel type + shape (splash / wide / grid / close-up / insert…), camera angle, composition, the eye-path within the panel.
2. **SUBJECTS + IDENTITY** — each character, named, with their **verbatim identity descriptor** (this is what holds face/costume consistency across panels) + their action/expression in this panel.
3. **SETTING + ACTION** — location, time, key props, and *what happens* in this panel (comics show a moment, not a span).
4. **ART-STYLE LOCK** (identical every panel) — line weight & inking, rendering (e.g. flat cel color / painted / halftone / noir chiaroscuro), palette (hex), shading, level of detail, era/genre of comic art, and the **lettering style**. This block is what makes 100 panels look like one book.
5. **MOOD + FORMAT TAIL** — mood tags + the panel aspect + a quality tail (e.g. "comic book panel, clean linework, professional sequential art"), and **leave clean space for the balloon(s)/SFX** noted in the layout.

Plus a **negative** protecting the style (`inconsistent character, wrong costume, off-model face, 3D render, photoreal, extra fingers, text, watermark, signature` — usually **negative "text"** so the art is clean and lettering is added later).

## Stage 4 — Assembly → PDF (the new "stitch")
This replaces video stitching. Build **pages** from the generated panels per the layout, add lettering,
export a PDF.

**Page-layout JSON** (the panelling expert's output; drives both generation and assembly):
```json
{ "page": 4, "size_px": [1988, 3056], "bleed_px": 38, "gutter_px": 24,
  "panels": [
    { "variant_id": "<id>", "type": "establishing-wide", "box": [0,0,1,0.28],
      "letters": [ { "kind":"caption", "text":"Later that night…", "at":[0.05,0.06] } ] },
    { "variant_id": "<id>", "type": "close-up", "box": [0,0.30,0.5,0.34],
      "letters": [ { "kind":"balloon", "who":"MAYA", "text":"Don't.", "tail":[0.3,0.6], "at":[0.1,0.34] } ] },
    { "variant_id": "<id>", "type": "insert", "box": [0.52,0.30,0.48,0.34], "letters": [] }
  ]
}
```
(`box` = `[x, y, w, h]` as fractions of the page; `variant_id` links to the generated `frame_<id>.png`.)

**Assembler (local, generator-agnostic):**
1. For each page: create a canvas at `size_px`; place each panel image into its `box` (fit/crop), draw
   **gutters** (page-colour spacing) and panel **borders** (or none for bleeds).
2. **Letter it:** draw dialogue **balloons** (with tails), **caption** boxes, and **SFX** from `letters`,
   using a comic font. (Doing text here — not in the image — keeps it crisp, editable, and consistent.)
3. Render each page to an image, then combine all pages into a **PDF**.
- Two easy local stacks: **HTML/CSS page templates → headless Chrome/puppeteer `print-to-PDF`** (best for
  balloons/typography), or **Python (Pillow to composite + draw text) → `img2pdf`/`reportlab` for the PDF.**

## Consistency (the hard part in comics)
- **Character model sheets first:** generate a reference panel per main character (front/3-4 view) and
  reuse it as an image/style reference + the verbatim identity descriptor in every panel prompt.
- **Art-style lock byte-identical** in every panel (layer 4) + **share one seed per page** (`seed_identity`)
  so a page reads as one hand.
- Keep **text out of the generated art**; add all lettering at assembly.

## Run it locally (end to end, no website)
```
create_project → import_breakdown (Story Bible + scene beats)
get_project → art-style lock + cast identity + beat ids
import_shotlist × N  (each = a PAGE of panels, in reading order)   +  keep the page-layout JSON per beat
write_worklist → generate each panel → data/inbox/frame_<variant_id>.png → sync_generations
assemble: page-layout JSON + the synced panels → compose pages + letter → export comic.pdf
```
Direkta stays generator-agnostic: any local image model makes the panel art (`frame_<variant_id>.png` in
`data/inbox/`, then `sync_generations`); the only comic-specific new piece is the **page-layout + lettering
+ PDF assembler**, which you run after sync.
