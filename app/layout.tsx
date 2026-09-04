import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// One voice. Display and mono used to be Inter Tight and JetBrains Mono; three
// families with three different x-heights meant a 10px label never shared a
// baseline with the 13px title beside it. They are roles now, separated by
// size, weight, tracking and case inside the one family — see tokens.css.
const ui = Inter({
  subsets: ["latin"],
  variable: "--font-ui-loaded",
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
      className={ui.variable}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
