import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // hugeicons' free set is a ~13.6k-export barrel; without this, importing a
    // handful of icons can pull (or fail to tree-shake) the whole module and
    // balloon the bundle + slow builds. This rewrites barrel imports to direct
    // per-icon imports. (lucide-react is optimized by Next by default.)
    optimizePackageImports: ["@hugeicons/core-free-icons", "@hugeicons/react"]
  }
};

export default nextConfig;
