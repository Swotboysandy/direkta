/**
 * Shared framer-motion (motion.dev) variants for the pipeline workspaces.
 *
 * Premium feel = physics, not durations: entrances and presses ride springs
 * so they settle naturally instead of easing to a stop. Two shared springs:
 *  - SPRING_SMOOTH — critically-damped glide for entrances/layout (no bounce)
 *  - SPRING_SNAPPY — tight, fast settle for presses and small UI
 *
 * All entrance variants animate from a hidden state to a fully-visible one on
 * mount (no scroll/viewport gating), so content is never left stuck invisible.
 */

/** Smooth glide — entrances, layout shifts, the sidebar's sliding pill. */
export const SPRING_SMOOTH = { type: "spring" as const, stiffness: 320, damping: 34, mass: 0.8 };

/** Tight settle — button presses, chips, toggles. */
export const SPRING_SNAPPY = { type: "spring" as const, stiffness: 640, damping: 32, mass: 0.6 };

/** A touch of overshoot — pop-ins that should feel alive (panels, checks). */
export const SPRING_POP = { type: "spring" as const, stiffness: 420, damping: 26, mass: 0.7 };

/*
 * Entrance variants are TRANSFORM-ONLY (no opacity gating) on purpose.
 * framer-motion drives animations off requestAnimationFrame, which the browser
 * throttles/pauses in a backgrounded tab — and our generation batches run for
 * minutes, so users routinely switch away mid-run. An opacity:0 → 1 entrance
 * that never gets a frame strands its content INVISIBLE (the "overlay opacity"
 * dimming). A stranded y-offset of a few px is imperceptible, so content is
 * always readable no matter what happens to the animation.
 */

/** A single element rising in on mount. Spread onto a motion element. */
export const fadeUp = {
  initial: { y: 12 },
  animate: { y: 0 },
  transition: SPRING_SMOOTH
};

/** A whole page/section rising in on mount (slightly gentler). */
export const pageIn = {
  initial: { y: 8 },
  animate: { y: 0 },
  transition: SPRING_SMOOTH
};

/** Container that staggers its children. Use with `staggerItem` on each child. */
export const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } }
};

/** Child of `staggerContainer` — inherits the parent's `show` state on mount. */
export const staggerItem = {
  hidden: { y: 16 },
  show: { y: 0, transition: SPRING_SMOOTH }
};

/** Tactile press for primary action buttons — press feedback only, no hover motion. */
export const tap = {
  whileTap: { scale: 0.965 },
  transition: SPRING_SNAPPY
};

/** A popped-in floating panel — spring scale+fade, e.g. the Stitch inspector. */
export const popIn = {
  initial: { opacity: 0, scale: 0.94 },
  animate: { opacity: 1, scale: 1 },
  transition: SPRING_POP
};

/*
 * Note on modal exits: AnimatePresence exit-unmounts never complete in this
 * app's React 19 + Next dev setup (verified live — the element fades to 0 but
 * stays mounted, blocking clicks). Modals instead stay mounted and drive
 * open/close through `animate` with `transitionEnd: { visibility: "hidden" }`,
 * as NewProjectModal does.
 */
