/** Tailwind v4 runs as a PostCSS plugin; there is no tailwind.config.js —
 *  the theme is declared in CSS, in app/_brand/tailwind.css. */
const config = {
  plugins: {
    "@tailwindcss/postcss": {}
  }
};

export default config;
