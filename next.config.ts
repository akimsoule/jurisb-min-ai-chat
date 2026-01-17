import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cette clé est la plus importante pour Transformers.js sur Vercel
  serverExternalPackages: ["@xenova/transformers", "onnxruntime-node"],

  // On utilise une approche prudente pour TypeScript
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        "onnxruntime-node": "commonjs onnxruntime-node",
      });
    }
    return config;
  },
};

export default nextConfig;
