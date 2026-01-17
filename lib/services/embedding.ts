type Transformers = typeof import("@xenova/transformers");

let extractor: any = null;
let transformersPromise: Promise<Transformers> | null = null;

async function getTransformers(): Promise<Transformers> {
  if (!transformersPromise) {
    transformersPromise = import("@xenova/transformers");
  }

  return transformersPromise;
}

/**
 * Génère des embeddings pour un texte using Xenova transformers
 * Le modèle est chargé une seule fois et mis en cache
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const { pipeline, env } = await getTransformers();

    // Force l'usage du runtime WebAssembly et du CDN pour les assets
    env.allowLocalModels = false;
    env.allowRemoteModels = true;
    if (env.backends?.onnx?.wasm) {
      env.backends.onnx.wasm.wasmPaths =
        "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/";
      env.backends.onnx.wasm.proxy = true;
      env.backends.onnx.wasm.numThreads = 1;
      env.backends.onnx.device = "wasm";
      env.backends.onnx.preferredExecutionProviders = ["wasm"] as any;
    }

    if (!extractor) {
      extractor = await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L12-v2"
      );
    }

    const output = await extractor(text, { pooling: "mean", normalize: true });

    // Convertit le Tensor en tableau classique pour Neo4j
    return Array.from(output.data);
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}
