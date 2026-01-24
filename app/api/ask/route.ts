import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding } from "@/lib/services/embedding";
import { generateWithFallback } from "@/lib/services/generation";
import { searchArticles } from "@/lib/services/neo4j";
import {
  getClientKey,
  limit,
  rateLimitHeaders,
} from "@/lib/security/rate-limit";
import { NO_RESULT_MESSAGE, UNVAILABLE_ANSWER_MESSAGE } from "@/lib/constants";
import { WITH_LLM } from "@/lib/config";

const MAX_QUESTION_LENGTH = 500;
const RATE_LIMIT = { max: 15, windowMs: 60_000 };
const MIN_SIMILARITY_SCORE = 0.65;

/**
 * POST /api/ask
 * Pipeline : rate-limit → validation → embedding → RAG → décision → LLM
 */
export async function POST(req: NextRequest) {
  try {
    /* ------------------------------------------------------------------ */
    /* Rate limiting                                                       */
    /* ------------------------------------------------------------------ */
    const key = getClientKey(req.headers);
    const rl = limit(key, RATE_LIMIT.max, RATE_LIMIT.windowMs);

    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessayez plus tard." },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    /* ------------------------------------------------------------------ */
    /* Validation input                                                    */
    /* ------------------------------------------------------------------ */
    const body = await req.json();
    const question =
      typeof body?.question === "string" ? body.question.trim() : "";

    if (!question || question.length > MAX_QUESTION_LENGTH) {
      return NextResponse.json({ error: "Question invalide" }, { status: 400 });
    }

    /* ------------------------------------------------------------------ */
    /* Embedding                                                           */
    /* ------------------------------------------------------------------ */
    let embedding: number[] = [];

    if (WITH_LLM) {
      try {
        embedding = await generateEmbedding(question);
      } catch (err) {
        console.error("Embedding failed, fallback text search:", err);
      }
    }

    /* ------------------------------------------------------------------ */
    /* RAG – Recherche Neo4j                                               */
    /* ------------------------------------------------------------------ */
    const articles = await searchArticles(embedding, question, 4);

    if (!articles.length) {
      return NextResponse.json(
        {
          answer: NO_RESULT_MESSAGE,
          sources: [],
          tokens_used: 0,
          reason: "NO_LEGAL_BASIS",
        },
        { status: 200 },
      );
    }

    const relevantArticles = articles.filter(
      (a) => a.score >= MIN_SIMILARITY_SCORE,
    );

    if (!relevantArticles.length) {
      return NextResponse.json(
        {
          answer: UNVAILABLE_ANSWER_MESSAGE,
          sources: articles.map(mapSource),
          tokens_used: 0,
          reason: "INSUFFICIENT_RELEVANCE",
        },
        { status: 200 },
      );
    }

    /* ------------------------------------------------------------------ */
    /* Construction du contexte                                            */
    /* ------------------------------------------------------------------ */
    const context = relevantArticles
      .map((a) => `Article ${a.numero_article} – ${a.titre_loi}\n${a.contenu}`)
      .join("\n\n---\n\n");

    /* ------------------------------------------------------------------ */
    /* Génération LLM                                                      */
    /* ------------------------------------------------------------------ */
    if (!WITH_LLM) {
      return NextResponse.json(
        {
          answer: UNVAILABLE_ANSWER_MESSAGE,
          sources: relevantArticles.map(mapSource),
          tokens_used: 0,
          reason: "LLM_DISABLED",
        },
        { status: 200 },
      );
    }

    try {
      const res = await generateWithFallback(question, context);

      if (!res?.text) {
        return NextResponse.json(
          {
            answer: UNVAILABLE_ANSWER_MESSAGE,
            sources: relevantArticles.map(mapSource),
            tokens_used: res?.tokens ?? 0,
            reason: "LLM_EMPTY_RESPONSE",
          },
          { status: 200 },
        );
      }

      return NextResponse.json(
        {
          answer: res.text,
          sources: relevantArticles.map(mapSource),
          tokens_used: res.tokens ?? 0,
          provider: res.provider ?? "unknown",
          reason: "ANSWERED",
        },
        { status: 200 },
      );
    } catch (err) {
      console.warn("LLM generation failed:", err);

      return NextResponse.json(
        {
          answer: UNVAILABLE_ANSWER_MESSAGE,
          sources: relevantArticles.map(mapSource),
          tokens_used: 0,
          reason: "LLM_FAILURE",
        },
        { status: 200 },
      );
    }
  } catch (error) {
    console.error("Error in /api/ask:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
function mapSource(article: any) {
  return {
    title: article.titre_loi,
    article: article.numero_article,
    lawNumber: article.metadata?.lawNumber,
    lawDate: article.metadata?.lawDate,
    source: article.metadata?.source,
  };
}
