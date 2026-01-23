import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding } from "@/lib/services/embedding";
import { generateWithFallback } from "@/lib/services/generation";
import { searchArticles } from "@/lib/services/neo4j";
import {
  getClientKey,
  limit,
  rateLimitHeaders,
} from "@/lib/security/rate-limit";

const NO_RESULT_MESSAGE =
  "Aucune disposition légale béninoise pertinente n’a été trouvée dans la base juridique actuelle.";

/**
 * POST /api/ask
 * Pipeline complet : auth → quota → embedding → RAG Neo4j → génération Groq → décrément crédit
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limit: max 15 requêtes par minute par IP/UA
    const key = getClientKey(req.headers);
    const rl = limit(key, 15, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessayez plus tard." },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    const body = await req.json();
    const { question } = body || {};
    const cleanedQuestion = typeof question === "string" ? question.trim() : "";

    if (!cleanedQuestion || cleanedQuestion.length > 500) {
      return NextResponse.json({ error: "Question invalide" }, { status: 400 });
    }

    // Validation simplifiée: aucune vérification CAPTCHA

    // Embedding de la question
    const embedding = await generateEmbedding(cleanedQuestion);

    // Récupération du contexte Neo4j (vector search)
    const articles = await searchArticles(embedding, 4);

    // Seuil de similarité minimum (cosine similarity)
    // Score < 0.65 = articles probablement non pertinents = refuser de répondre
    // La similarité cosinus varie de -1 à 1, avec 1 = identique
    // Un seuil de 0.65 assure une bonne pertinence des résultats
    const MIN_SIMILARITY_SCORE = 0.65;
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

    let text = "";
    let tokens = 0;
    let provider: string;
    try {
      const res = await generateWithFallback(cleanedQuestion, context);
      text = res.text;
      tokens = res.tokens ?? 0;
      provider = res.provider || "unknown";
    } catch (err: any) {
      // Tous les providers ont échoué → journaliser et renvoyer uniquement les sources
      console.warn(
        "/api/ask generation fallback failed; returning sources only",
        err,
      );
      return NextResponse.json(
        {
          answer: "",
          sources: relevantArticles.map((article) => ({
            title: article.titre_loi,
            article: article.numero_article,
            lawNumber: article.metadata?.lawNumber,
            lawDate: article.metadata?.lawDate,
            source: article.metadata?.source,
          })),
          tokens_used: 0,
          provider: "none",
        },
        { status: 200 },
      );
    }

    // Vérifier si le LLM a retourné un message de refus (plusieurs formulations possibles)
    // Si oui, ne pas retourner de sources (éviter les références parasites)
    const noResultPhrases = [
      "Aucune disposition légale béninoise pertinente",
      "Il n'y a pas d'article",
      "Il n'y a pas de disposition",
      "aucun article pertinent",
      "aucune disposition pertinente",
      "pas d'article ou de disposition",
    ];

    const isNoResultResponse = noResultPhrases.some((phrase) =>
      text.toLowerCase().includes(phrase.toLowerCase()),
    );

    if (isNoResultResponse) {
      return NextResponse.json(
        {
          answer: NO_RESULT_MESSAGE,
          sources: [],
          tokens_used: tokens,
          provider,
        },
        { status: 200 },
      );
    }

    // Décrément de crédit côté serveur à réactiver une fois la persistance prête (Stripe/idempotence)

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
        provider,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in /api/ask:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
