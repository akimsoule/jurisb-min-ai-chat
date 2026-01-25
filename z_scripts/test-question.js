#!/usr/bin/env node

/**
 * Test complet du pipeline RAG : embedding → recherche vectorielle → génération Groq
 * Usage: node z_scripts/test-question.js "votre question"
 * Exemple: node z_scripts/test-question.js "Quelles sont les obligations d'un propriétaire et les garanties lors de la construction d'un bâtiment ?"
 */

require('dotenv').config({ path: '.env.production' });

const neo4j = require('neo4j-driver');
const { HfInference } = require('@huggingface/inference');
const { Groq } = require('groq-sdk');

const question = "Comment obtenir la nationalité béninoise ?";

if (!question) {
  console.error('❌ Veuillez fournir une question.');
  console.error('Usage: node z_scripts/test-question.js "votre question"');
  process.exit(1);
}

const NEO4J_URI = process.env.NEO4J_URI || 'neo4j://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USERNAME || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'password';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'neo4j';
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const MIN_SIMILARITY_SCORE = 0.50;
const SEARCH_LIMIT = 12;

const DEFAULT_SYSTEM_PROMPT = `Tu es un assistant juridique spécialisé en droit béninois.

RÈGLE ABSOLUE : Tu dois répondre EXCLUSIVEMENT à partir du contexte fourni.

INTERDICTIONS STRICTES :
- Ne JAMAIS inventer un article de loi
- Ne JAMAIS utiliser ta connaissance générale du droit
- Ne JAMAIS citer un article qui n'est PAS dans le contexte fourni
- Ne JAMAIS extrapoler ou supposer

Si le contexte ne contient PAS de disposition claire et pertinente pour la question :
Réponds EXACTEMENT ET UNIQUEMENT cette phrase (AUCUNE autre section) :
"Aucune disposition légale béninoise pertinente n'a été trouvée dans la base juridique actuelle."

N'ajoute AUCUNE section "Fondement légal", "Extrait(s) pertinent(s)" ou "Limites / réserves" dans ce cas.

Si le contexte contient des dispositions pertinentes, utilise ce format OBLIGATOIRE :

### Réponse juridique
<réponse claire et synthétique basée UNIQUEMENT sur le contexte>

### Fondement légal
- Article X – Titre complet de la loi (DOIT être dans le contexte)
- Article Y – Titre complet de la loi (DOIT être dans le contexte)

### Extrait(s) pertinent(s)
> "Extrait exact du texte légal tiré du contexte"

### Limites / réserves
<conditions, exceptions, ambiguïtés mentionnées dans le contexte>`;

async function generateEmbedding(text) {
  if (!HF_API_KEY) {
    throw new Error('HUGGINGFACE_API_KEY non définie');
  }
  const hf = new HfInference(HF_API_KEY);
  const result = await hf.featureExtraction({
    model: 'sentence-transformers/all-MiniLM-L12-v2',
    inputs: text,
  });
  return Array.isArray(result[0]) ? result[0] : result;
}

async function searchArticles(embedding) {
  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
  const session = driver.session({ database: NEO4J_DATABASE });

  try {
    // Compter le nombre total d'articles
    const countResult = await session.run('MATCH (a:Article) RETURN count(a) AS total');
    const totalArticles = countResult.records[0].get('total').toNumber();
    console.log(`📊 Nombre total d'articles dans Neo4j: ${totalArticles}`);

    // Résoudre l'index vectoriel disponible
    let vectorIndexName = null;
    try {
      const showRes = await session.run(`SHOW INDEXES YIELD name RETURN name`);
      const names = showRes.records.map((r) => r.get('name'));
      console.log(`🔍 Index disponibles: ${names.join(', ')}`);
      if (names.includes('article_embeddings')) {
        vectorIndexName = 'article_embeddings';
      } else if (names.includes('node_embeddings')) {
        vectorIndexName = 'node_embeddings';
      }
    } catch (e) {
      console.warn('⚠️  Impossible de récupérer les index vectoriels:', e.message);
    }

    if (!vectorIndexName) {
      console.warn('⚠️  Aucun index vectoriel disponible dans Neo4j.');
      return [];
    }

    console.log(`✅ Utilisation de l'index vectoriel: ${vectorIndexName}`);

    const result = await session.run(
      `
      CALL db.index.vector.queryNodes($indexName, $limitInt, $embedding)
      YIELD node, score
      WITH node, score
      WHERE any(l IN labels(node) WHERE l IN ['ARTICLE', 'Article'])
      OPTIONAL MATCH (node)-[:APPARTIENT_A]->(law:LAW)
      RETURN 
        node.id AS id,
        node.numero_article AS numero_article,
        node.titre_loi AS titre_loi,
        node.contenu AS contenu,
        node.metadata AS metadata,
        law.titre AS law_titre,
        score
      `,
      { indexName: vectorIndexName, limitInt: SEARCH_LIMIT, embedding }
    );

    const articles = result.records.map((record) => {
      const metadataStr = record.get('metadata');
      let metadata = {};
      if (metadataStr && typeof metadataStr === 'string') {
        try {
          metadata = JSON.parse(metadataStr);
        } catch (e) {
          // Ignore
        }
      }

      return {
        id: record.get('id'),
        numero_article: record.get('numero_article') || '',
        titre_loi: record.get('titre_loi') || record.get('law_titre') || '',
        contenu: record.get('contenu') || '',
        score: record.get('score'),
        metadata,
      };
    });

    console.log(`🔎 ${articles.length} articles trouvés via recherche vectorielle`);
    return articles;
  } finally {
    await session.close();
    await driver.close();
  }
}

async function generateLegalResponse(question, context) {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY non définie');
  }
  const groq = new Groq({ apiKey: GROQ_API_KEY });

  const message = await groq.chat.completions.create({
    model: GROQ_MODEL,
    max_tokens: 1200,
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content: DEFAULT_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: `Contexte légal strict (ne jamais inventer) :\n${context}\n\nQuestion utilisateur : ${question}`,
      },
    ],
  });

  return {
    text: message.choices[0].message.content?.trim() || '',
    tokens: message.usage?.total_tokens || 0,
  };
}

async function main() {
  console.log('📝 Question:', question);
  console.log('---\n');

  try {
    // Étape 1 : Embedding
    console.log('⏳ Génération de l\'embedding...');
    const embedding = await generateEmbedding(question);
    console.log(`✅ Embedding généré (dimension: ${embedding.length})\n`);

    // Étape 2 : Recherche vectorielle
    console.log('⏳ Recherche vectorielle dans Neo4j...');
    const articles = await searchArticles(embedding);
    console.log(`✅ ${articles.length} article(s) trouvé(s)\n`);

    if (!articles.length) {
      console.log('⚠️  Aucun article trouvé. Vérifiez que Neo4j est connecté et que l\'index vectoriel existe.');
      process.exit(0);
    }

    // Afficher les articles trouvés
    console.log('📚 Articles récupérés:');
    articles.forEach((article, i) => {
      console.log(`[${i + 1}] ${article.numero_article} – ${article.titre_loi}`);
      console.log(`    Score: ${article.score.toFixed(4)}`);
      console.log(`    Contenu: ${article.contenu.substring(0, 150).replace(/\s+/g, ' ')}...`);
    });
    console.log('');

    // Filtre par score minimum
    const seen = new Set();
    const relevantArticles = articles.filter((article) => {
      if (article.score < MIN_SIMILARITY_SCORE) return false;
      const key = `${article.numero_article}::${article.titre_loi}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    console.log(`📊 Articles pertinents (score >= ${MIN_SIMILARITY_SCORE}): ${relevantArticles.length}`);
    if (!relevantArticles.length) {
      console.log('❌ Aucun article avec score suffisant.');
      process.exit(0);
    }
    console.log('');

    // Étape 3 : Construction du contexte
    const context = relevantArticles
      .map(
        (article) =>
          `Article: ${article.numero_article} – ${article.titre_loi}\nContenu: ${article.contenu}\nScore: ${article.score.toFixed(4)}`
      )
      .join('\n\n---\n\n');

    // Étape 4 : Génération Groq
    console.log('⏳ Génération de la réponse juridique via Groq...');
    const { text, tokens } = await generateLegalResponse(question, context);
    console.log(`✅ Réponse générée (${tokens} tokens)\n`);

    // Affichage final
    console.log('═'.repeat(60));
    console.log('🎯 RÉPONSE JURIDIQUE');
    console.log('═'.repeat(60));
    console.log(text);
    console.log('═'.repeat(60));
    console.log(`\n📊 Statistiques:\n  • Articles trouvés: ${articles.length}\n  • Articles pertinents: ${relevantArticles.length}\n  • Tokens Groq: ${tokens}`);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

main();
