import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { neogma } from "../index";

export const searchLegalArticlesTool = createTool({
  id: "search-legal-articles",
  description:
    "Recherche d'articles juridiques pertinents dans la base de données Neo4j",
  inputSchema: z.object({
    query: z.string().describe("La question ou requête de recherche"),
    embedding: z
      .array(z.number())
      .optional()
      .describe("Embedding vectoriel de la requête"),
    limit: z.number().default(4).describe("Nombre maximum de résultats"),
  }),
  outputSchema: z.object({
    articles: z.array(
      z.object({
        id: z.string(),
        numero_article: z.string(),
        titre_loi: z.string(),
        contenu: z.string(),
        score: z.number(),
        metadata: z.any().optional(),
      }),
    ),
    totalFound: z.number(),
  }),
  execute: async ({ query, embedding, limit = 4 }) => {
    try {
      let cypherQuery = "";
      let params: any = { query, limit };

      if (embedding && embedding.length > 0) {
        // Recherche vectorielle avec similarité cosinus
        cypherQuery = `
          MATCH (a:ARTICLE)
          WHERE a.embedding IS NOT NULL
          WITH a, gds.similarity.cosine(a.embedding, $embedding) AS score
          WHERE score >= 0.65
          RETURN a.id, a.numero_article, a.titre_loi, a.contenu, score, a.metadata
          ORDER BY score DESC
          LIMIT $limit
        `;
        params.embedding = embedding;
      } else {
        // Recherche textuelle
        cypherQuery = `
          MATCH (a:ARTICLE)
          WHERE toLower(a.contenu) CONTAINS toLower($query)
          RETURN a.id, a.numero_article, a.titre_loi, a.contenu, 1.0 as score, a.metadata
          LIMIT $limit
        `;
      }

      const result = await neogma.queryRunner.run(cypherQuery, params);
      const articles = result.records.map((record) => ({
        id: record.get("a.id"),
        numero_article: record.get("a.numero_article"),
        titre_loi: record.get("a.titre_loi"),
        contenu: record.get("a.contenu"),
        score: record.get("score"),
        metadata: record.get("a.metadata"),
      }));

      return {
        articles,
        totalFound: articles.length,
      };
    } catch (error) {
      console.error("Erreur lors de la recherche d'articles:", error);
      throw error;
    }
  },
});
