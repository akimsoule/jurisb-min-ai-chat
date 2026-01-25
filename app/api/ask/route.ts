import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding } from "@/lib/services/embedding";
import {
  generateWithFallback,
  generateWithFallbackStream,
} from "@/lib/services/generation";
import { searchArticles } from "@/lib/services/neo4j";
import {
  getClientKey,
  limit,
  rateLimitHeaders,
} from "@/lib/security/rate-limit";
import { NO_RESULT_MESSAGE, UNVAILABLE_ANSWER_MESSAGE } from "@/lib/constants";
import { WITH_LLM } from "@/lib/config";

/* ------------------------------------------------------------------ */
/* Configuration                                                       */
/* ------------------------------------------------------------------ */
const MAX_QUESTION_LENGTH = 500;
const RATE_LIMIT = { max: 15, windowMs: 60_000 };
const MIN_SIMILARITY_SCORE = 0.65;

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
type AnswerReason =
  | "NO_LEGAL_BASIS"
  | "INSUFFICIENT_RELEVANCE"
  | "ANSWERED"
  | "LLM_UNCERTAIN"
  | "LLM_FAILURE"
  | "LLM_DISABLED";

/* ------------------------------------------------------------------ */
/* POST /api/ask                                                       */
/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  console.log("[API /ask] Requête reçue");
  try {
    /* --------------------------- Rate limit -------------------------- */
    const key = getClientKey(req.headers);
    const rl = limit(key, RATE_LIMIT.max, RATE_LIMIT.windowMs);

    if (!rl.allowed) {
      console.log("[API /ask] Rate limit dépassé pour clé:", key);
      return NextResponse.json(
        { error: "Trop de requêtes. Réessayez plus tard." },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    /* ------------------------- Input validation ---------------------- */
    const body = await req.json();
    const question =
      typeof body?.question === "string" ? body.question.trim() : "";

    if (!question || question.length > MAX_QUESTION_LENGTH) {
      console.log("[API /ask] Question invalide:", question);
      return NextResponse.json({ error: "Question invalide" }, { status: 400 });
    }

    console.log("[API /ask] Question validée:", question);

    /* ---------------------------- Embedding -------------------------- */
    let embedding: number[] = [];

    if (WITH_LLM) {
      try {
        console.log("[API /ask] Génération d'embedding pour la question");
        embedding = await generateEmbedding(question);
        console.log("[API /ask] Embedding généré avec succès");
      } catch (err) {
        console.error(
          "[API /ask] Échec de l'embedding, fallback vers recherche texte:",
          err,
        );
      }
    }

    /* --------------------------- RAG Search -------------------------- */
    console.log("[API /ask] Recherche d'articles avec embedding et question");
    const articles = await searchArticles(embedding, question, 4);
    console.log(`[API /ask] ${articles.length} articles trouvés`);

    // ÉTAT 1 — Aucun fondement légal
    if (!articles.length) {
      console.log("[API /ask] Aucun article trouvé, réponse NO_LEGAL_BASIS");
      return respond(NO_RESULT_MESSAGE, [], 0, "NO_LEGAL_BASIS");
    }

    const relevantArticles = articles.filter(
      (a) => a.score >= MIN_SIMILARITY_SCORE,
    );
    console.log(
      `[API /ask] ${relevantArticles.length} articles pertinents (score >= ${MIN_SIMILARITY_SCORE})`,
    );

    // ÉTAT 2 — Textes existants mais insuffisants
    if (!relevantArticles.length) {
      console.log(
        "[API /ask] Articles trouvés mais insuffisamment pertinents, réponse INSUFFICIENT_RELEVANCE",
      );
      return respond(
        UNVAILABLE_ANSWER_MESSAGE,
        articles.map(mapSource),
        0,
        "INSUFFICIENT_RELEVANCE",
      );
    }

    /* -------------------------- Context build ------------------------ */
    const context = relevantArticles
      .map((a) => `Article ${a.numero_article} – ${a.titre_loi}\n${a.contenu}`)
      .join("\n\n---\n\n");
    console.log(
      "[API /ask] Contexte construit avec",
      relevantArticles.length,
      "articles",
    );

    // LLM désactivé
    if (!WITH_LLM) {
      console.log("[API /ask] LLM désactivé, réponse LLM_DISABLED");
      return respond(
        UNVAILABLE_ANSWER_MESSAGE,
        relevantArticles.map(mapSource),
        0,
        "LLM_DISABLED",
      );
    }

    /* --------------------------- LLM Call ---------------------------- */
    console.log(
      "[API /ask] Appel au LLM pour génération de réponse en streaming",
    );
    try {
      const stream = await generateWithFallbackStream(question, context);
      console.log("[API /ask] Stream du LLM obtenu");

      // Vérifier si le stream est vide ou invalide (mais difficile à vérifier sans consommer)
      // Pour simplifier, on assume que si on arrive ici, c'est valide

      console.log("[API /ask] Réponse en streaming générée");
      return respondStream(
        stream,
        relevantArticles.map(mapSource),
        "ANSWERED",
        "groq",
      );
    } catch (err) {
      console.warn("[API /ask] Échec de la génération LLM:", err);
      console.log(
        "[API /ask] Fallback vers réponse sans LLM, raison LLM_FAILURE",
      );

      return respond(
        UNVAILABLE_ANSWER_MESSAGE,
        relevantArticles.map(mapSource),
        0,
        "LLM_FAILURE",
      );
    }
  } catch (error) {
    console.error("[API /ask] Erreur générale dans /api/ask:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function respond(
  answer: string,
  sources: any[],
  tokens: number,
  reason: AnswerReason,
  provider?: string,
) {
  console.log(
    `[API /ask] Réponse envoyée avec raison: ${reason}, tokens: ${tokens}, provider: ${provider ?? "unknown"}`,
  );
  return NextResponse.json(
    {
      answer,
      sources,
      tokens_used: tokens,
      provider: provider ?? "unknown",
      reason,
    },
    { status: 200 },
  );
}

function respondStream(
  answerStream: ReadableStream<Uint8Array>,
  sources: any[],
  reason: AnswerReason,
  provider: string,
) {
  console.log(
    `[API /ask] Réponse en streaming envoyée avec raison: ${reason}, provider: ${provider}`,
  );

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Envoyer les métadonnées d'abord
      const metadata = {
        sources,
        reason,
        provider,
        streaming: true,
      };
      controller.enqueue(encoder.encode(JSON.stringify(metadata) + "\n"));

      // Puis streamer la réponse
      const reader = answerStream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = new TextDecoder().decode(value);
          controller.enqueue(encoder.encode(JSON.stringify({ chunk }) + "\n"));
        }
      } finally {
        reader.releaseLock();
      }

      // Fin du stream
      controller.enqueue(encoder.encode(JSON.stringify({ done: true }) + "\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
  });
}

function mapSource(article: any) {
  return {
    title: article.titre_loi || article.law_titre || "",
    article: article.numero_article,
    lawNumber: article.metadata?.lawNumber,
    lawDate: article.metadata?.lawDate,
    source: article.metadata?.source,
  };
}

/**
 * Détecte un refus illégitime du LLM
 * (le LLM n’a PAS le droit de dire qu’il n’existe pas de loi
 * quand des articles lui ont été fournis)
 */
function llmIsDenyingLegalBasis(text: string): boolean {
  const patterns = [
    "aucune disposition",
    "aucun article",
    "aucune base légale",
    "n'existe pas de texte",
    "aucune disposition légale",
  ];

  const lower = text.toLowerCase();
  return patterns.some((p) => lower.includes(p));
}
