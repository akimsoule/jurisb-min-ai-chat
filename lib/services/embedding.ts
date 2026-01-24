import { InferenceClient } from "@huggingface/inference";

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const hf = new InferenceClient(HF_API_KEY);

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!HF_API_KEY) {
    throw new Error("HUGGINGFACE_API_KEY is not set");
  }

  const result = await hf.featureExtraction({
    model: "sentence-transformers/all-MiniLM-L12-v2",
    inputs: text,
    provider: "hf-inference",
  });

  if (Array.isArray(result[0])) {
    // result is number[][], flatten to number[]
    return (result as number[][]).flat();
  }
  // result is number[]
  return result as number[];
}
