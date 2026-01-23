import { generateLegalResponse } from "./groq";

export type ProviderName = "groq";

export interface GenerationResult {
  text: string;
  tokens?: number;
  provider: ProviderName;
}

export interface LegalGenerator {
  name: ProviderName;
  generate(question: string, context: string): Promise<GenerationResult>;
}

/* =========================
   Groq (UNIQUE PROVIDER)
   ========================= */

class GroqGenerator implements LegalGenerator {
  name: ProviderName = "groq";

  async generate(question: string, context: string): Promise<GenerationResult> {
    const { text, tokens } = await generateLegalResponse(question, context);

    if (!text || !text.trim()) {
      throw new Error("Réponse Groq vide");
    }

    return {
      text: text.trim(),
      tokens,
      provider: "groq",
    };
  }
}

/* =========================
   Factory
   ========================= */

export function getDefaultGenerators(): LegalGenerator[] {
  return [new GroqGenerator()];
}

/* =========================
   Generation runner
   ========================= */

export async function generateWithFallback(
  question: string,
  context: string,
  generators: LegalGenerator[] = getDefaultGenerators(),
): Promise<GenerationResult> {
  const generator = generators[0];

  if (!generator) {
    throw new Error("No generator configured");
  }

  try {
    return await generator.generate(question, context);
  } catch (error: any) {
    const msg = String(error?.message || error);
    console.error(`[generation] Provider '${generator.name}' failed: ${msg}`);
    throw error;
  }
}
