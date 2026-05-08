import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    proxyClientMaxBodySize: 210 * 1024 * 1024,
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
