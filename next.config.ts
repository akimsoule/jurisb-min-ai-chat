import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Correction pour Next.js 16 : on sort de 'experimental'
  serverExternalPackages: ["@xenova/transformers", "onnxruntime-node"],

  // Pour éviter que Turbopack ne tente d'analyser le binaire ONNX
  experimental: {
    turbo: {
      resolveAlias: {
        "onnxruntime-node": false,
      },
    },
  },
};

export default nextConfig;
