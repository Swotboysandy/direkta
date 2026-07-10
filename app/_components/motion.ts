/**
 * Shared framer-motion variants for the pipeline workspaces.
 *
 * All entrance variants animate from a hidden state to a fully-visible one on
 * mount (no scroll/viewport gating), so content is never left stuck invisible.
 * Keep easings consistent with the Dashboard's existing cubic curve.
 */

const EASE = [0.22, 0.61, 0.36, 1] as const;

/** A single element easing up + in on mount. Spread onto a motion element. */
export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: EASE }
};

/** A whole page/section easing in on mount (slightly gentler). */
export const pageIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.34, ease: EASE }
};

/** Container that staggers its children. Use with `staggerItem` on each child. */
export const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } }
};

/** Child of `staggerContainer` — inherits the parent's `show` state on mount. */
export const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: EASE } }
};

/** Tactile press + lift for primary action buttons. */
export const tap = {
  whileHover: { y: -1 },
  whileTap: { scale: 0.97 },
  transition: { type: "spring" as const, stiffness: 420, damping: 26 }
};

/** A popped-in floating panel — spring scale+fade, e.g. the Stitch inspector. */
export const popIn = {
  initial: { opacity: 0, scale: 0.94 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.22, ease: [0.34, 1.56, 0.64, 1] as const }
};
