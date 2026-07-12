"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Sun, Moon } from "./icons";
import { SPRING_POP } from "./motion";

const KEY = "direkta:theme:v3";
type Theme = "light" | "dark";

/** Chrome/Edge/Safari-TP expose this; typed loosely so we can feature-detect. */
type ViewTransitionDocument = Document & {
  startViewTransition?: (cb: () => void) => { ready: Promise<void> };
};

/**
 * Light/dark switch. The initial theme is applied pre-paint by the bootstrap
 * script in app/layout.tsx (reading the same localStorage key), so this just
 * reflects + flips it. We read the live value off <html> on mount to stay in
 * sync with that script and avoid a hydration mismatch.
 *
 * Flip = a clip-path circular reveal (View Transitions API) that expands the
 * incoming theme out of the toggle button. Browsers without startViewTransition
 * (or users who prefer reduced motion) just swap instantly.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const current = (document.documentElement.dataset.theme as Theme) || "light";
    setTheme(current);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";

    const apply = () => {
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem(KEY, next);
      } catch {
        /* private mode — theme just won't persist */
      }
      setTheme(next);
    };

    const doc = document as ViewTransitionDocument;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!doc.startViewTransition || reduce || !btnRef.current) {
      apply();
      return;
    }

    // Reveal originates from the centre of the toggle and grows to the farthest
    // screen corner, so the whole viewport is covered by the new theme.
    const rect = btnRef.current.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = doc.startViewTransition(apply);
    transition.ready
      .then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`
            ]
          },
          {
            duration: 520,
            easing: "cubic-bezier(0.22, 0.61, 0.36, 1)",
            pseudoElement: "::view-transition-new(root)"
          }
        );
      })
      // Aborts when the tab is hidden or the user double-toggles — the theme has
      // already applied, so swallow the rejection rather than log it.
      .catch(() => {});
  }

  const isDark = theme === "dark";
  return (
    <motion.button
      ref={btnRef}
      type="button"
      className="btn btn-ghost btn-sm theme-toggle"
      onClick={toggle}
      whileTap={{ scale: 0.9 }}
      transition={SPRING_POP}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      <motion.span
        key={theme}
        initial={{ rotate: -120, opacity: 0, scale: 0.5 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={SPRING_POP}
        style={{ display: "inline-flex" }}
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </motion.span>
    </motion.button>
  );
}
