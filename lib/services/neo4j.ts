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

/**
 * Recherche les articles pertinents basés sur la similarité des embeddings
 */
export async function searchArticles(embedding: number[], limit: number = 5) {
  const driver = getDriver();
  const session: Session = driver.session();

  try {
    // TODO: Implémenter la similarité cosinus dans Neo4j
    // Cette requête dépendra de la manière dont les embeddings sont stockés

    const result = await session.run(
      `
      MATCH (a:Article)
      RETURN a.id, a.numero_article, a.titre_loi, a.contenu, a.embedding
      LIMIT $limit
      `,
      { limit }
    );

    return result.records.map((record) => ({
      id: record.get("a.id"),
      numero_article: record.get("a.numero_article"),
      titre_loi: record.get("a.titre_loi"),
      contenu: record.get("a.contenu"),
    }));
  } catch (error) {
    console.error("Error searching articles:", error);
    throw error;
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
