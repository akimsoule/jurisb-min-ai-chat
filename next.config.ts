import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      "@xenova/transformers",
      "onnxruntime-node",
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = { "onnxruntime-node": false };
    return config;
  },
};

export default nextConfig;
