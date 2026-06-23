import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Display — Fraunces: a warm editorial serif. Cinematic at large sizes, pairs
// with the cream palette far better than the old chunky display face.
const display = Fraunces({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-display-loaded",
  display: "swap"
});

// UI — Inter: clean, professional, full weight range for the interface.
const ui = Inter({
  subsets: ["latin"],
  variable: "--font-ui-loaded",
  display: "swap"
});

const mono = JetBrains_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-mono-loaded",
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
      className={`${display.variable} ${ui.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
