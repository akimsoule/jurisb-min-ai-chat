import { pipeline } from "@xenova/transformers";

let extractor: any = null;

/**
 * Génère des embeddings pour un texte using Xenova transformers
 * Le modèle est chargé une seule fois et mis en cache
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Charger le modèle une seule fois
    // Utilise un modèle qui génère 768 dimensions (compatible Neo4j)
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
