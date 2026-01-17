import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cette clé est la plus importante pour Transformers.js sur Vercel
  serverExternalPackages: ["@xenova/transformers", "onnxruntime-node"],

  // On utilise une approche prudente pour TypeScript
};

export default nextConfig;
