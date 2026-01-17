const nextConfig = {
  // Cette clé est la plus importante pour Transformers.js sur Vercel
  serverExternalPackages: ["@xenova/transformers"],

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
