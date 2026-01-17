import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cette clé est la plus importante pour Transformers.js sur Vercel
  serverExternalPackages: ["@xenova/transformers"],

  experimental: {
    turbo: {
      resolveAlias: {
        // Évite le chargement natif libonnxruntime.* en forçant le backend WASM
        "onnxruntime-node": "onnxruntime-web",
      },
    },
  },

  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "onnxruntime-node": "onnxruntime-web",
    };
    return config;
  },

  // On utilise une approche prudente pour TypeScript
};

export default nextConfig;
