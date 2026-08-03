import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // puppeteer-extra + its plugins use dynamic requires (clone-deep/merge-deep)
  // that webpack can't statically analyse. Keep the whole browser-automation
  // stack out of the bundle and load it from node_modules at runtime (server
  // only — these routes are runtime: "nodejs").
  serverExternalPackages: [
    "puppeteer-core",
    "puppeteer-extra",
    "puppeteer-extra-plugin-stealth",
    "puppeteer-extra-plugin",
    "clone-deep",
    "merge-deep"
  ],
  experimental: {
    // hugeicons' free set is a ~13.6k-export barrel; without this, importing a
    // handful of icons can pull (or fail to tree-shake) the whole module and
    // balloon the bundle + slow builds. This rewrites barrel imports to direct
    // per-icon imports. (lucide-react is optimized by Next by default.)
    optimizePackageImports: ["@hugeicons/core-free-icons", "@hugeicons/react"]
  }
};

export default nextConfig;
