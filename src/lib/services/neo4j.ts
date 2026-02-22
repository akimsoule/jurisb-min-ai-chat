import neo4j, { Driver, Session } from "neo4j-driver";
import { frenchStopWords } from "@/lib/constants";

let driver: Driver | null = null;

export interface ArticleHit {
  id: string;
  numero_article: string;
  titre_loi: string;
  contenu: string;
  score: number;
  metadata: {
    lawNumber: string;
    lawDate: string;
    source: string;
  };
}

export interface LawHit {
  id: string;
  code: string;
  titre: string;
  date_promulgation: string;
  source: string;
  statut: string;
}

/**
 * Retourne le driver Neo4j singleton
 */
export function getDriver(): Driver {
  if (!driver) {
    const uri = process.env.NEO4J_URI || "neo4j://localhost:7687";
    const user = process.env.NEO4J_USERNAME || "neo4j";
    const password = process.env.NEO4J_PASSWORD || "password";

    driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  }
  return driver;
}

/**
 * Parse la metadata JSON
 */
function parseMetadata(metadata: any, source: string): ArticleHit["metadata"] {
  let parsed: ArticleHit["metadata"] = { source, lawNumber: "", lawDate: "" };

  if (metadata && typeof metadata === "string") {
    try {
      parsed = { ...parsed, ...JSON.parse(metadata) };
    } catch (e) {
      console.warn("Failed to parse metadata:", metadata, e);
    }
  }

  return parsed;
}

/**
 * Charge les articles complets par IDs
 */
async function loadFullArticlesByIds(
  articleIds: string[],
): Promise<ArticleHit[]> {
  const driver = getDriver();
  const session: Session = driver.session({
    database: process.env.NEO4J_DATABASE || "neo4j",
  });

  try {
    const result = await session.run(
      `
      MATCH (a:Article)
      WHERE a.id IN $articleIds
      RETURN a.id AS id,
             a.numero_article AS numero_article,
             a.titre_loi AS titre_loi,
             a.contenu AS contenu,
             a.metadata AS metadata
      `,
      { articleIds },
    );

    const hits: ArticleHit[] = [];
    for (const record of result.records) {
      hits.push({
        id: record.get("id"),
        numero_article: record.get("numero_article"),
        titre_loi: record.get("titre_loi"),
        contenu: record.get("contenu"),
        score: 0,
        metadata: parseMetadata(
          record.get("metadata"),
          record.get("titre_loi"),
        ),
      });
    }

    return hits;
  } finally {
    await session.close();
  }
}

/**
 * Recherche textuelle basique
 */
async function performTextSearch(
  session: Session,
  query: string,
  limit: number,
): Promise<ArticleHit[]> {
  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2 && !frenchStopWords.has(w));

  console.log("[Neo4j] Recherche textuelle avec keywords:", keywords);

  if (!keywords.length) return [];

  const result = await session.run(
    `
    MATCH (a:ARTICLE)
    WHERE ANY(word IN $keywords WHERE toLower(a.contenu) CONTAINS word)
    RETURN a.id AS id,
           a.numero_article AS numero_article,
           a.titre_loi AS titre_loi,
           a.contenu AS contenu,
           a.metadata AS metadata
    LIMIT toInteger($limit)
    `,
    { keywords, limit: Math.floor(limit) },
  );

  console.log("[Neo4j] Résultats textuels:", result.records.length);

  const hits: ArticleHit[] = [];
  for (const record of result.records) {
    hits.push({
      id: record.get("id"),
      numero_article: record.get("numero_article"),
      titre_loi: record.get("titre_loi"),
      contenu: record.get("contenu"),
      score: 0.8,
      metadata: parseMetadata(record.get("metadata"), record.get("titre_loi")),
    });
  }

  return hits;
}

/**
 * Recherche vectorielle
 */
async function performVectorSearch(
  session: Session,
  embedding: number[],
  limit: number,
): Promise<ArticleHit[]> {
  console.log("[Neo4j] Exécution recherche vectorielle avec limit:", limit);
  const result = await session.run(
    `
    CALL db.index.vector.queryNodes('article_embeddings', toInteger($limit), $embedding)
    YIELD node, score
    WITH node, score
    WHERE any(l IN labels(node) WHERE l IN ['ARTICLE', 'Article'])
    OPTIONAL MATCH (node)-[:APPARTIENT_A]->(law:LOI)
    RETURN 
      node.id AS id,
      node.numero_article AS numero_article,
      node.titre_loi AS titre_loi,
      node.contenu AS contenu,
      node.metadata AS metadata,
      law.titre AS law_titre,
      score
    `,
    { limit: Math.floor(limit), embedding },
  );
  console.log("[Neo4j] Résultats vectoriels:", result.records.length);

  const hits: ArticleHit[] = [];
  for (const record of result.records) {
    hits.push({
      id: record.get("id"),
      numero_article: record.get("numero_article"),
      titre_loi: record.get("titre_loi"),
      contenu: record.get("contenu"),
      score: record.get("score"),
      metadata: parseMetadata(record.get("metadata"), record.get("titre_loi")),
    });
  }

  return hits;
}

/**
 * Recherche principale
 */
export async function searchArticles(
  embedding: number[],
  query: string,
  limit = 4,
): Promise<ArticleHit[]> {
  console.log(
    "[Neo4j] Recherche d'articles - embedding length:",
    embedding?.length,
    "query:",
    query,
  );
  const driver = getDriver();
  const session: Session = driver.session({
    database: process.env.NEO4J_DATABASE || "neo4j",
  });

  try {
    // Vérifier le nombre total d'articles
    const countResult = await session.run(
      "MATCH (a:ARTICLE) RETURN count(a) AS total",
    );
    const totalArticles = countResult.records[0].get("total").toNumber();
    console.log("[Neo4j] Nombre total d'articles dans la BD:", totalArticles);

    let results: ArticleHit[];
    if (!embedding || embedding.length === 0) {
      console.log("[Neo4j] Recherche textuelle");
      results = await performTextSearch(session, query, limit);
    } else {
      console.log("[Neo4j] Recherche vectorielle");
      results = await performVectorSearch(session, embedding, limit);
    }
    console.log("[Neo4j] Résultats trouvés:", results.length);
    return results;
  } catch (error) {
    console.error("[Neo4j] Erreur de recherche:", error);
    return [];
  } finally {
    await session.close();
  }
}

/**
 * Recherche les lois
 */
export async function searchLaws(query: string, limit = 10): Promise<LawHit[]> {
  const driver = getDriver();
  const session: Session = driver.session({
    database: process.env.NEO4J_DATABASE || "neo4j",
  });

  try {
    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2 && !frenchStopWords.has(w));

    if (!keywords.length) return [];

    const result = await session.run(
      `
      MATCH (l:Loi)
      WHERE ANY(word IN $keywords WHERE toLower(l.titre) CONTAINS word OR toLower(l.code) CONTAINS word)
      RETURN l.id AS id,
             l.code AS code,
             l.titre AS titre,
             l.date_promulgation AS date_promulgation,
             l.source AS source,
             l.statut AS statut
      LIMIT toInteger($limit)
      `,
      { keywords, limit: Math.floor(limit) },
    );

    const hits: LawHit[] = [];
    for (const record of result.records) {
      hits.push({
        id: record.get("id"),
        code: record.get("code"),
        titre: record.get("titre"),
        date_promulgation: record.get("date_promulgation"),
        source: record.get("source"),
        statut: record.get("statut"),
      });
    }

    return hits;
  } catch (error) {
    console.error("Law search failed:", error);
    return [];
  } finally {
    await session.close();
  }
}

/**
 * Récupère les articles d'une loi
 */
export async function getArticlesByLaw(lawId: string): Promise<ArticleHit[]> {
  const driver = getDriver();
  const session: Session = driver.session({
    database: process.env.NEO4J_DATABASE || "neo4j",
  });

  try {
    const result = await session.run(
      `
      MATCH (l:Loi {id: $lawId})<-[:APPARTIENT_A]-(a:Article)
      RETURN a.id AS id,
             a.numero_article AS numero_article,
             a.titre_loi AS titre_loi,
             a.contenu AS contenu,
             a.metadata AS metadata
      ORDER BY a.numero_article
      `,
      { lawId },
    );

    const hits: ArticleHit[] = [];
    for (const record of result.records) {
      hits.push({
        id: record.get("id"),
        numero_article: record.get("numero_article"),
        titre_loi: record.get("titre_loi"),
        contenu: record.get("contenu"),
        score: 0,
        metadata: parseMetadata(
          record.get("metadata"),
          record.get("titre_loi"),
        ),
      });
    }

    return hits;
  } catch (error) {
    console.error("Error fetching articles by law:", error);
    return [];
  } finally {
    await session.close();
  }
}

/**
 * Récupère les relations entre articles
 */
export async function getArticleRelations(articleId: string) {
  const driver = getDriver();
  const session: Session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (a:Article {id: $articleId})-[r]-(related:Article)
      RETURN type(r) AS relationType,
             related.id AS id,
             related.numero_article AS numero_article,
             related.titre_loi AS titre_loi
      `,
      { articleId },
    );

    return result.records.map((record) => ({
      type: record.get("relationType"),
      id: record.get("id"),
      numero_article: record.get("numero_article"),
      titre_loi: record.get("titre_loi"),
    }));
  } catch (error) {
    console.error("Error fetching article relations:", error);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Ferme le driver Neo4j
 */
export async function closeDriver() {
  if (driver) {
    await driver.close();
    driver = null;
  }
}
