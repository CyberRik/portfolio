import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Verification/production builds can run in an isolated dist dir
  // (NEXT_DIST_DIR=.next-verify) so they never interleave artifacts
  // with a live `next dev` writing to .next — that corruption causes
  // runtime "__webpack_modules__[moduleId] is not a function" errors.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
