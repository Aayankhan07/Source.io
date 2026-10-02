import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep src/ directory for non-route code; app/ is at root for routes
  // No custom webpack needed — Next.js handles React, TS, Tailwind natively
};

export default nextConfig;