import { InferenceClient } from "@huggingface/inference";

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const HF_MODEL = "sentence-transformers/all-MiniLM-L12-v2";

let hfClient: InferenceClient | null = null;

function getClient(): InferenceClient | null {
  if (!HF_API_KEY) return null;

  hfClient ??= new InferenceClient(HF_API_KEY);

  return hfClient;
}

/**
 * Génère un embedding vectoriel
 * ⚠️ Contrat strict : retourne TOUJOURS number[]
 * - [] = embedding indisponible (erreur, désactivé, fallback)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text?.trim()) {
    return [];
  }

  const client = getClient();
  if (!client) {
    return [];
  }

  try {
    const result = await client.featureExtraction({
      model: HF_MODEL,
      inputs: text,
      provider: "hf-inference",
    });

    return normalizeEmbedding(result);
  } catch (error) {
    console.error("[embedding] failed", {
      error,
      preview: text.slice(0, 80),
    });

    return [];
  }
}

function normalizeEmbedding(result: unknown): number[] {
  if (!Array.isArray(result)) return [];

  // HF peut renvoyer number[] ou number[][]
  if (Array.isArray(result[0])) {
    return Array.isArray(result[0]) ? (result[0] as number[]) : [];
  }

  return result as number[];
}
