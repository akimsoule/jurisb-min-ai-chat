import { Driver, Session } from "neo4j-driver";
import neo4j from "neo4j-driver";

let driver: Driver | null = null;

function getDriver(): Driver {
  if (!driver) {
    const uri = process.env.NEO4J_URI || "neo4j://localhost:7687";
    const user = process.env.NEO4J_USER || "neo4j";
    const password = process.env.NEO4J_PASSWORD || "password";

    driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  }
  return driver;
}

interface ArticleHit {
  id: string;
  numero_article: string;
  titre_loi: string;
  contenu: string;
  score: number;
  metadata?: {
    lawNumber?: string;
    lawDate?: string;
    source?: string;
  };
}

/**
 * Recherche les articles pertinents via similarité cosinus sur l'index vectoriel Neo4j
 */
export async function searchArticles(
  embedding: number[],
  limit: number = 4
): Promise<ArticleHit[]> {
  const driver = getDriver();
  const session: Session = driver.session({
    database: process.env.NEO4J_DATABASE || "neo4j",
  });

  try {
    const result = await session.run(
      `
      CALL db.index.vector.queryNodes('article_embeddings', $limit, $embedding)
      YIELD node, score
      RETURN node.id AS id, node.numero_article AS numero_article, node.titre_loi AS titre_loi, node.contenu AS contenu, node.source AS source, node.metadata AS metadata, score
      `,
      { limit: Math.floor(limit), embedding }
    );

    console.log(result);
    return result.records.map((record) => {
      const metadata = record.get("metadata");
      let parsedMetadata: ArticleHit["metadata"] = {
        source: record.get("source"),
      };

      if (metadata && typeof metadata === "string") {
        try {
          const parsed = JSON.parse(metadata);
          parsedMetadata = { ...parsedMetadata, ...parsed };
        } catch (e) {
          console.warn("Failed to parse metadata:", metadata);
        }
      }

      return {
        id: record.get("id"),
        numero_article: record.get("numero_article"),
        titre_loi: record.get("titre_loi"),
        contenu: record.get("contenu"),
        score: record.get("score"),
        metadata: parsedMetadata,
      };
    });
  } catch (error) {
    // Fallback sans index vectoriel : retourne les premiers articles pour éviter un crash
    console.error("Error searching articles:", error);
    const fallback = await session.run(
      `
      MATCH (a:Article)
      RETURN a.id AS id, a.numero_article AS numero_article, a.titre_loi AS titre_loi, a.contenu AS contenu, a.source AS source, a.metadata AS metadata
      LIMIT $limit
      `,
      { limit: Math.floor(limit) }
    );

    return fallback.records.map((record) => {
      const metadata = record.get("metadata");
      let parsedMetadata: ArticleHit["metadata"] = {
        source: record.get("source"),
      };

      if (metadata && typeof metadata === "string") {
        try {
          const parsed = JSON.parse(metadata);
          parsedMetadata = { ...parsedMetadata, ...parsed };
        } catch (e) {
          console.warn("Failed to parse metadata:", metadata);
        }
      }

      return {
        id: record.get("id"),
        numero_article: record.get("numero_article"),
        titre_loi: record.get("titre_loi"),
        contenu: record.get("contenu"),
        score: 0,
        metadata: parsedMetadata,
      };
    });
  } finally {
    await session.close();
  }
}

/**
 * Récupère les relations entre articles (abroge, modifie, etc.)
 */
export async function getArticleRelations(articleId: string) {
  const driver = getDriver();
  const session: Session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (a:Article { id: $articleId })-[r]-(related:Article)
      RETURN type(r) as relationType, related.id, related.numero_article, related.titre_loi
      `,
      { articleId }
    );

    return result.records.map((record) => ({
      type: record.get("relationType"),
      articleId: record.get("related.id"),
      numero_article: record.get("related.numero_article"),
      titre_loi: record.get("related.titre_loi"),
    }));
  } catch (error) {
    console.error("Error fetching article relations:", error);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Ferme la connexion au driver
 */
export async function closeDriver() {
  if (driver) {
    await driver.close();
    driver = null;
  }
}
