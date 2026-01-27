import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding } from "@/lib/services/embedding";
import { generateWithFallback } from "@/lib/services/generation";
import { searchArticles } from "@/lib/services/neo4j";
import {
  getClientKey,
  limit,
  rateLimitHeaders,
} from "@/lib/security/rate-limit";
import {
  NO_RESULT_MESSAGE,
  UNVAILABLE_ANSWER_MESSAGE,
  LLM_UNCERTAIN_MESSAGE,
  MAX_QUESTION_LENGTH,
  RATE_LIMIT,
  MIN_SIMILARITY_SCORE,
} from "@/lib/constants";
import { WITH_LLM } from "@/lib/config";

/* ------------------------------------------------------------------ */

/* Validation de la question juridique                                */
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
    console.log("[API /ask] Appel au LLM pour génération de réponse");
    try {
      const res = await generateWithFallback(question, context);
      console.log("[API /ask] Réponse du LLM reçue, provider:", res?.provider);

      // 🔒 Le LLM n’a PAS le droit de nier l’existence du droit
      if (!res?.text || llmIsDenyingLegalBasis(res.text)) {
        console.log(
          "[API /ask] LLM a nié le fondement légal, réponse LLM_UNCERTAIN",
        );
        return respond(
          LLM_UNCERTAIN_MESSAGE(relevantArticles.length),
          relevantArticles.map(mapSource),
          res?.tokens ?? 0,
          "LLM_UNCERTAIN",
          res?.provider,
        );
      }

      // Réponse valide
      console.log("[API /ask] Réponse valide générée, raison ANSWERED");
      return respond(
        res.text,
        relevantArticles.map(mapSource),
        res.tokens ?? 0,
        "ANSWERED",
        res.provider,
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
