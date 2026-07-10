import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

// Inter for body/UI text; Manrope for display headings + mono/eyebrow
// metadata (film-slate feel) — the v3 studio-shell pairing.
const ui = Inter({
  subsets: ["latin"],
  variable: "--font-ui-loaded",
  display: "swap"
});

const display = Manrope({
  weight: ["500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-display-loaded",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Direkta — Your AI Film Crew",
  description:
    "You direct. AI delivers. Direkta is a browser-based film production platform with a full crew of specialised AI agents for screenplay, casting, storyboarding, stitching, and export."
};

// Set the theme on <html> before first paint to avoid a light→dark flash.
const THEME_BOOTSTRAP = `(function(){try{var k='direkta:theme';var t=localStorage.getItem(k);if(t!=='light'&&t!=='dark'){t=(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';}document.documentElement.dataset.theme=t;}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${ui.variable} ${display.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
