const nextConfig = {
  // Turbopack alias pour éviter le chargement natif d'onnxruntime
  turbopack: {
    resolveAlias: {
      "onnxruntime-node": "onnxruntime-web",
    },
  },

  webpack: (config: any) => {
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
