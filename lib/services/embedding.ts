import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const result = await hf.featureExtraction({
      model: "nomic-ai/nomic-embed-text-v1.5",
      inputs: text,
    });

    // Le résultat est souvent un tableau imbriqué (ex: [ [0.1, 0.2...] ])
    return Array.isArray(result[0])
      ? (result[0] as number[])
      : (result as number[]);
  } catch (error) {
    console.error("HF Error:", error);
    throw error;
  }
}
