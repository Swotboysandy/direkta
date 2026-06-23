import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// One clean sans for everything — Inter. Headings reuse it (no separate
// decorative display face), kept at restrained sizes/weights for a calm
// dashboard feel.
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
      className={`${ui.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
