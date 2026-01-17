import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Nouveau nom pour les packages externes (indispensable pour Transformers/ONNX)
  serverExternalPackages: ["@xenova/transformers", "onnxruntime-node"],

  // 2. Turbopack est activé par défaut en Next.js 15+

  // 3. Si vous avez absolument besoin de Webpack, vous devez
  // désactiver Turbopack dans votre script de build (voir étape suivante)
};

export default nextConfig;
