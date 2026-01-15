import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/ask
 * Endpoint pour poser une question juridique à l'assistant IA
 *
 * Requête:
 * {
 *   "question": "Quel est le délai de divorce au Bénin?"
 * }
 *
 * Réponse:
 * {
 *   "answer": "...",
 *   "sources": [{ "title": "...", "article": "..." }],
 *   "tokens_used": 45
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "Question is required and must be a string" },
        { status: 400 }
      );
    }

    // TODO: Intégrer Groq SDK pour générer la réponse
    // TODO: Récupérer le contexte depuis Neo4j
    // TODO: Décrémenter les crédits de l'utilisateur

    return NextResponse.json(
      {
        answer: "Réponse temporaire de test",
        sources: [],
        tokens_used: 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in /api/ask:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
