# Codex Batch Plan

## Goal
Generate image candidates for each world-first trailer plate so the user can sort through and select the best style/keyframes.

## Required Output per Plate
For each storyboard plate, generate:
- **4 variations**
- **16:9 landscape**
- **4K quality target**
- clean, sharp, non-pixelated outputs
- no text overlays unless the plate is the final title card

## Batch Naming Convention

```text
kaliyug_plate##_short-title_v##_model-or-seed.ext
```

Examples:

```text
kaliyug_plate01_ash-dawn-bharat_v01.png
kaliyug_plate15_kalis-throne_v02.png
kaliyug_plate25_kalki-raavan-scale_v04.png
```

## Suggested Folder Output Structure

```text
outputs/
  plate01_ash_dawn_over_bharat/
  plate02_poisoned_sacred_river/
  plate03_highways_become_ruins/
  ...
  plate26_title_card/
selected/
rejected/
needs_regen/
notes/
```

## Variation Strategy
For every plate, vary only a few parameters at a time: camera distance, lighting, corruption density, atmosphere, world scale, and where small human silhouettes appear.

Do not turn world-first plates into character portraits. Characters should usually be scale markers, omens, or late-trailer punctuation.

## Quality-Sensitive Plates

| Plate | Reason | Recommended Variations |
|---|---|---:|
| 01 | Establishes fallen Bharat and world-first scale | 4 |
| 02 | Defines corrupted sacred geography | 4 |
| 04 | Defines red-black demonic infection language | 4 |
| 06 | Establishes pure Kailash sanctuary contrast | 4 |
| 13 | Defines horror/cult corruption without sacred geometry | 4 |
| 15 | Kali visual language without goddess imagery | 4 |
| 18 | First dream/vision sacred geometry pivot | 4 |
| 21 | Blue-white awakening as environmental effect | 4 |
| 23 | Raavan reveal at world scale | 4 |
| 25 | Final confrontation money tableau | 4 |

## Do Not Generate
- Any image depicting Kali as Goddess Kali
- Any multi-armed goddess villain
- Any tongue-out goddess imagery
- Any cyberpunk city aesthetic
- Any visible sacred geometry in real-world scenes
- Any anime/cartoon style
- Any low-resolution or soft/pixelated images
- Any generated text overlays except the final KALIYUG title card
