import { pipeline } from "@xenova/transformers";

// Cache du pipeline pour éviter de le recharger
let extractor: any = null;

async function getExtractor() {
  if (!extractor) {
    extractor = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L12-v2",
    );
  }
  return extractor;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const pipe = await getExtractor();
    const result = await pipe(text, { pooling: "mean", normalize: true });

    // Le résultat est un tensor, on le convertit en array
    return Array.from(result.data);
  } catch (error) {
    console.error("Embedding Error:", error);
    throw error;
  }
}
