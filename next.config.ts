import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: [
    "ais-dev-kojfdq3dvfuvurbb4yffo7-940863549688.asia-southeast1.run.app",
    "*.run.app",
  ],
};

export default nextConfig;
