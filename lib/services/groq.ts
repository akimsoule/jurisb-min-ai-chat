import { Groq } from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Génère une réponse juridique basée sur le contexte récupéré
 */
export async function generateLegalResponse(
  question: string,
  context: string,
  systemPrompt?: string
): Promise<string> {
  try {
    const defaultSystemPrompt = `Tu es un expert en droit béninois. 
Tu dois répondre exclusivement basé sur le contexte légal fourni.
Ne fais JAMAIS d'hallucinations ou d'extrapolations.
Si aucune information pertinente n'existe dans le contexte, dis-le clairement.`;

    const message = await groq.chat.completions.create({
      model: "mixtral-8x7b-32768",
      max_tokens: 2048,
      messages: [
        {
          role: "system",
          content: systemPrompt || defaultSystemPrompt,
        },
        {
          role: "user",
          content: `Contexte légal:\n${context}\n\nQuestion: ${question}`,
        },
      ],
    });

    const responseContent = message.choices[0].message.content;
    if (responseContent) {
      return responseContent;
    }

    throw new Error("Unexpected response type from Groq");
  } catch (error) {
    console.error("Error generating legal response:", error);
    throw error;
  }
}

/**
 * Génère des embeddings pour une question
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // TODO: Utiliser l'API Groq ou un service d'embeddings comme nomic-embed-text
    // Pour le moment, retourner un tableau vide
    return [];
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}
