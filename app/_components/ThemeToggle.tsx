"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sun, Moon } from "./icons";

const KEY = "direkta:theme:v3";
type Theme = "light" | "dark";

/**
 * Light/dark switch. The initial theme is applied pre-paint by the bootstrap
 * script in app/layout.tsx (reading the same localStorage key), so this just
 * reflects + flips it. We read the live value off <html> on mount to stay in
 * sync with that script and avoid a hydration mismatch.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const current = (document.documentElement.dataset.theme as Theme) || "light";
    setTheme(current);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* private mode — theme just won't persist */
    }
    setTheme(next);
  }

  const isDark = theme === "dark";
  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm theme-toggle"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      <motion.span
        key={theme}
        initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
        style={{ display: "inline-flex" }}
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </motion.span>
    </button>
  );
}
