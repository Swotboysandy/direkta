# Hollowrider — bakha
anime / 1990s / gothic / vampire · 987 views · 12 generations · **1,410 credits** · 115 MB

## Stack
Seedream 5.0 Pro 58.4% · Seedance 2.0 33.3% · GPT Image 2.0 8.3%

## Goal
Style-consistency experiment: keep ONE recognisable character + visual language
across many stills and clips using reference-driven generation.

## Style anchor
1990s dark gothic OVA anime — thick black ink outlines, painterly cel-shaded,
hand-painted film grain. Explicitly NOT modern digital / soft-airbrush anime.

Character: tall silhouette, tattered black cloak, wide-brimmed hat shadowing a
pale gaunt sharp face, long windswept dark hair, skeletal black horse.
Motifs: full moon (teal-green/cold white), fog, graveyards, crosses, bats,
burning villages, storms.
Palette: muted limited — teal-green moonlight, cold blue-grey night, deep
red/orange for fire. High contrast, strong rim light.

## Drift problems + fixes  ← THE VALUABLE PART
| Problem | Fix |
|---|---|
| Arrow/dart leaking into hands from an early reference | State hand position explicitly in EVERY prompt + negative-prompt it out |
| Style drifting to generic modern anime | FRONT-LOAD style-anchor language in every prompt (not once); add explicit negatives ("not modern digital anime, not soft airbrush shading") |
| Conflicting styles bleeding together | Use only **2 reference images per generation**, never all 4 |
| Unwanted props | Character defaults to empty-handed / reins-in-hand unless the scene needs a weapon |

## Workflow
1. Generate/select still in Seedream with 1–2 locked reference images
2. Cherry-pick cleanest stills for animation (clear silhouette, simple continuous motion)
3. Animate in Seedance image-to-video — **the still carries identity/style, the
   prompt handles ONLY motion + camera + one negative-constraint line**
4. Batch short 5–6s clips first to test motion/style fidelity before longer renders

## Transferable rules
- Front-load + repeat style tokens; mentioning once is not enough
- Cap references at 2 per generation
- Split responsibility: image = identity, video prompt = motion only
- Test at 5–6s before committing
