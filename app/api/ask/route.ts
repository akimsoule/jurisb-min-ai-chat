import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";
import prisma from "@/lib/db/prisma";
import { generateEmbedding } from "@/lib/services/embedding";
import { generateLegalResponse } from "@/lib/services/groq";
import { searchArticles } from "@/lib/services/neo4j";

const NO_RESULT_MESSAGE =
  "Aucune disposition légale béninoise pertinente n’a été trouvée dans la base juridique actuelle.";

/**
 * POST /api/ask
 * Pipeline complet : auth → quota → embedding → RAG Neo4j → génération Groq → décrément crédit
 */
export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();
    const cleanedQuestion = typeof question === "string" ? question.trim() : "";

    if (!cleanedQuestion) {
      return NextResponse.json(
        { error: "Une question est requise" },
        { status: 400 },
      );
    }

    // Auth obligatoire
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 },
      );
    }

    // Chargement utilisateur + quota
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });
    if (!user) {
      return NextResponse.json({ error: "Session invalide" }, { status: 401 });
    }

    // if (user.credits < 1) {
    //   return NextResponse.json(
    //     { error: "Crédits insuffisants" },
    //     { status: 402 }
    //   );
    // }

    // Embedding de la question
    const embedding = await generateEmbedding(cleanedQuestion);

    // Récupération du contexte Neo4j (vector search)
    const articles = await searchArticles(embedding, 4);

    // Seuil de similarité minimum (cosine similarity)
    // Score < 0.5 = articles non pertinents = refuser de répondre
    const MIN_SIMILARITY_SCORE = 0.5;
    const relevantArticles = articles.filter(
      (article) => article.score >= MIN_SIMILARITY_SCORE,
    );

    if (!articles.length || !relevantArticles.length) {
      return NextResponse.json(
        { answer: NO_RESULT_MESSAGE, sources: [], tokens_used: 0 },
        { status: 200 },
      );
    }

    // Construction du contexte textuel (uniquement articles pertinents)
    const context = relevantArticles
      .map(
        (article) =>
          `Article: ${article.numero_article} – ${article.titre_loi}\nContenu: ${article.contenu}\nScore: ${article.score}`,
      )
      .join("\n\n---\n\n");

    const { text, tokens } = await generateLegalResponse(
      cleanedQuestion,
      context,
    );

    // Vérifier si le LLM a retourné le message de refus standard
    // Si oui, ne pas retourner de sources (éviter les références parasites)
    const isNoResultResponse = text.includes(
      "Aucune disposition légale béninoise pertinente",
    );

    if (isNoResultResponse) {
      return NextResponse.json(
        { answer: NO_RESULT_MESSAGE, sources: [], tokens_used: tokens },
        { status: 200 },
      );
    }

    // Décrément d'1 crédit (transaction atomique)
    try {
      await prisma.$transaction(async (tx) => {
        const fresh = await tx.user.findUnique({
          where: { id: user.id },
          select: { credits: true },
        });

        // if (!fresh || fresh.credits < 1) {
        //   throw new Error("INSUFFICIENT_CREDITS");
        // }

        await tx.user.update({
          where: { id: user.id },
          data: { credits: { decrement: 1 } },
        });
      });
    } catch (creditError) {
      console.error("Credit decrement failed:", creditError);
      return NextResponse.json(
        { error: "Crédits insuffisants" },
        { status: 402 },
      );
    }

    return NextResponse.json(
      {
        answer: text,
        sources: relevantArticles.map((article) => ({
          title: article.titre_loi,
          article: article.numero_article,
          lawNumber: article.metadata?.lawNumber,
          lawDate: article.metadata?.lawDate,
          source: article.metadata?.source,
        })),
        tokens_used: tokens,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in /api/ask:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
