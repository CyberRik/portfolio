import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Verification/production builds can run in an isolated dist dir
  // (NEXT_DIST_DIR=.next-verify) so they never interleave artifacts
  // with a live `next dev` writing to .next — that corruption causes
  // runtime "__webpack_modules__[moduleId] is not a function" errors.
  distDir: process.env.NEXT_DIST_DIR || ".next",

  // Static assets in /public are otherwise served by Vercel with a
  // revalidate-every-time default, so every repeat visit pays a 304
  // round-trip on all ~4.8MB of models + the Draco decoder before the
  // scene can start. These files are content-stable (CC0 assets, a
  // pinned decoder build), so they get a year of immutable caching:
  // first load fills the cache, every load after is instant from disk.
  // If an asset's *content* ever changes, rename the file (or bust the
  // path) — immutable means the browser will not re-check for a year.
  async headers() {
    const immutable = [
      { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
    ];
    return [
      { source: "/models/:path*", headers: immutable },
      { source: "/draco/:path*", headers: immutable },
      { source: "/audio/:path*", headers: immutable },
      { source: "/cursors/:path*", headers: immutable },
    ];
  },
};

export default nextConfig;
