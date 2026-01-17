import { Groq } from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const DEFAULT_SYSTEM_PROMPT = `Tu es un assistant juridique spécialisé en droit béninois.

RÈGLE ABSOLUE : Tu dois répondre EXCLUSIVEMENT à partir du contexte fourni.

INTERDICTIONS STRICTES :
- Ne JAMAIS inventer un article de loi
- Ne JAMAIS utiliser ta connaissance générale du droit
- Ne JAMAIS citer un article qui n'est PAS dans le contexte fourni
- Ne JAMAIS extrapoler ou supposer

Si le contexte ne contient PAS de disposition claire et pertinente pour la question :
Réponds EXACTEMENT ET UNIQUEMENT cette phrase (AUCUNE autre section) :
"Aucune disposition légale béninoise pertinente n'a été trouvée dans la base juridique actuelle."

N'ajoute AUCUNE section "Fondement légal", "Extrait(s) pertinent(s)" ou "Limites / réserves" dans ce cas.

Si le contexte contient des dispositions pertinentes, utilise ce format OBLIGATOIRE :

### Réponse juridique
<réponse claire et synthétique basée UNIQUEMENT sur le contexte>

### Fondement légal
- Article X – Titre complet de la loi (DOIT être dans le contexte)
- Article Y – Titre complet de la loi (DOIT être dans le contexte)

### Extrait(s) pertinent(s)
> "Extrait exact du texte légal tiré du contexte"

### Limites / réserves
<conditions, exceptions, ambiguïtés mentionnées dans le contexte>`;

/**
 * Génère une réponse juridique basée sur le contexte récupéré
 */
export async function generateLegalResponse(
  question: string,
  context: string,
  systemPrompt?: string
): Promise<{ text: string; tokens: number }> {
  try {
    const message = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      max_tokens: 1200,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: systemPrompt || DEFAULT_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `Contexte légal strict (ne jamais inventer) :\n${context}\n\nQuestion utilisateur : ${question}`,
        },
      ],
    });

    const responseContent = message.choices[0].message.content?.trim();
    if (responseContent) {
      return {
        text: responseContent,
        tokens: message.usage?.total_tokens ?? 0,
      };
    }

    throw new Error("Unexpected response type from Groq");
  } catch (error) {
    console.error("Error generating legal response:", error);
    throw error;
  }
}
