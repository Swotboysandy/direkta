# Motion

Direkta moves with **soft spring**. Nothing snaps; nothing slides linearly. Three durations, three easings — pick by the size of the change.

| Token | Value | Use for |
|---|---|---|
| `--dur-1` | `120ms` | Micro — hover lifts, focus rings, pip pulses |
| `--dur-2` | `220ms` | Standard — card hovers, tab switches, modal fade |
| `--dur-3` | `360ms` | Macro — modal pop, page enter, drawer open |
| `--dur-4` | `520ms` | Hero — splash, on-load reveal |

| Token | Curve | Use for |
|---|---|---|
| `--ease-out`    | `cubic-bezier(0.22, 0.61, 0.36, 1)`  | Default for almost everything — content arriving |
| `--ease-in`     | `cubic-bezier(0.55, 0.06, 0.68, 0.19)` | Content leaving |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Modal pop, button press release, success states |

## Principles

1. **No linear easings, ever.** Default to `--ease-out`. Use `--ease-spring` only when overshoot is deliberate.
2. **Lift, don't slide.** Cards on hover translateY(-2px) + shadow step. Never `translateX`.
3. **Stagger collections.** Lists/grids enter with a 40–60ms per-item stagger using the entry keyframe (`.fx-enter-up`).
4. **Respect tilt.** When a tilted card hovers, preserve its rotation in the hover transform — don't reset to 0deg.
5. **Reduce motion.** Wrap entry/loop animations in `@media (prefers-reduced-motion: no-preference)`. The class utilities in `motion.css` already do this.

## Utility classes (`motion.css`)

- `.fx-enter-up`        — fade + 8px translate, used on page load. Add `--fx-delay: 60ms` per child for stagger.
- `.fx-pulse-pip`       — 1.4s loop for `.pip[data-status="working"]`.
- `.fx-rotate-load`     — slow spin for loading indicators.
- `.fx-shake`           — error nudge (4 frames).

## Don'ts

- ❌ No parallax — Direkta is a tool, not a brochure.
- ❌ No `transition: all`. Always list properties.
- ❌ No animations longer than `--dur-4` outside the splash sequence.
- ❌ No bouncing buttons. The springiness lives in the modal pop and the on-load entry — not in every click.
