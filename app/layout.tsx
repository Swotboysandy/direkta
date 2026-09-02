import type { Metadata } from "next";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Three voices, matching _brand/type-scale.css: Inter for UI prose and labels,
// Inter Tight for display headings (its tighter fit is what makes large type
// read as designed rather than defaulted), JetBrains Mono for anything
// countable — timecodes, durations, counters, IDs.
const ui = Inter({
  subsets: ["latin"],
  variable: "--font-ui-loaded",
  display: "swap"
});

const display = Inter_Tight({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-display-loaded",
  display: "swap"
});

const mono = JetBrains_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-mono-loaded",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Fylmer — Your AI Film Crew",
  description:
    "You direct. AI delivers. Fylmer is a browser-based film production platform with a full crew of specialised AI agents for screenplay, casting, storyboarding, stitching, and export."
};

// Set the theme on <html> before first paint to avoid a light→dark flash.
// Dark-first: default to dark regardless of OS preference. The storage key is
// versioned so a stored value from an earlier palette doesn't override the
// current default.
const THEME_BOOTSTRAP = `(function(){try{var k='fylmer:theme:v4';var t=localStorage.getItem(k);if(t!=='light'&&t!=='dark'){t='dark';}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='dark';}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${ui.variable} ${display.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
