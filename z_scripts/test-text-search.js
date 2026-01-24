const neo4j = require("neo4j-driver");

let driver = null;

function getDriver() {
  if (!driver) {
    const uri = process.env.NEO4J_URI || "neo4j://localhost:7687";
    const user = process.env.NEO4J_USER || "neo4j";
    const password = process.env.NEO4J_PASSWORD || "password";

    driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  }
  return driver;
}

function parseMetadata(metadata, source) {
  let parsedMetadata = { source };
  if (metadata && typeof metadata === "string") {
    try {
      const parsed = JSON.parse(metadata);
      parsedMetadata = { ...parsedMetadata, ...parsed };
    } catch (e) {
      console.warn("Failed to parse metadata:", metadata, "Error:", e);
    }
  }
  return parsedMetadata;
}

async function testPerformTextSearch() {
  const driver = getDriver();
  const session = driver.session({
    database: process.env.NEO4J_DATABASE || "neo4j",
  });

  const query = "Comment obtenir la nationalité béninoise ?";
  const limit = 4;

  try {
// Liste de mots vides français
  const stopWords = new Set([
    "le", "la", "les", "de", "du", "des", "et", "à", "un", "une", "dans", "sur", "par", "pour", "avec", "sans", "sous", "entre", "chez", "vers", "comment", "quoi", "qui", "que", "quand", "où", "pourquoi", "combien", "quel", "quelle", "quels", "quelles", "est", "sont", "était", "étaient", "sera", "seront", "être", "avoir", "faire", "dire", "aller", "voir", "savoir", "pouvoir", "vouloir", "venir", "passer", "mettre", "prendre", "donner", "trouver", "rendre", "savoir", "tenir", "falloir", "devoir", "pouvoir", "vouloir"
  ]);

  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w)); // filtre bruit et mots vides

    if (keywords.length === 0) {
      console.log("No keywords");
      return;
    }

    console.log("Keywords:", keywords);

    const result = await session.run(
      `
      MATCH (a:ARTICLE)
      WHERE ANY(word IN $keywords WHERE toLower(a.contenu) CONTAINS word)
      RETURN a.id AS id,
             a.numero_article AS numero_article,
             a.titre_loi AS titre_loi,
             a.contenu AS contenu,
             a.source AS source,
             a.metadata AS metadata
      LIMIT toInteger($limit)
      `,
      { keywords, limit: Math.floor(limit) },
    );

    const hits = result.records.map((record) => ({
      id: record.get("id"),
      numero_article: record.get("numero_article"),
      titre_loi: record.get("titre_loi"),
      contenu: record.get("contenu").substring(0, 200) + "...", // truncate for display
      score: 0.8, // fallback textuel crédible
      metadata: parseMetadata(record.get("metadata"), record.get("source")),
    }));

    console.log("Results:", JSON.stringify(hits, null, 2));
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await session.close();
    await driver.close();
  }
}

testPerformTextSearch();