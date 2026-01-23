#!/usr/bin/env node

/**
 * Test Workers AI : embedding → Neo4j → génération Workers AI
 * Usage: node z_scripts/test-workerai.js "votre question"
 */

require('dotenv').config({ path: '.env.local' });

const neo4j = require('neo4j-driver');
const { HfInference } = require('@huggingface/inference');

const [, , rawQuestion] = process.argv;
const question = (rawQuestion || '').trim();

if (!question) {
  console.error('❌ Veuillez fournir une question.');
  console.error('Usage: node z_scripts/test-workerai.js "votre question"');
  process.exit(1);
}

const NEO4J_URI = process.env.NEO4J_URI || 'neo4j://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'password';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'neo4j';

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

const WORKER_AI_API_KEY = process.env.WORKER_AI_API_KEY;
const WORKER_AI_ACCOUNT_ID = process.env.WORKER_AI_ACCOUNT_ID;
const WORKER_AI_MODEL = process.env.WORKER_AI_MODEL || '@cf/meta/llama-2-7b-chat-int8';

const MIN_SIMILARITY_SCORE = 0.50;
const SEARCH_LIMIT = 12;

const SYSTEM_PROMPT = `Tu es un assistant juridique spécialisé en droit béninois.

RÈGLE ABSOLUE : Tu dois répondre EXCLUSIVEMENT à partir du contexte fourni.

INTERDICTIONS STRICTES :
- Ne JAMAIS inventer un article de loi
- Ne JAMAIS utiliser une connaissance externe au contexte
- Ne JAMAIS citer un texte absent du contexte
- Ne JAMAIS extrapoler ou supposer

SI le contexte ne contient PAS de disposition claire et pertinente pour la question :
Réponds EXACTEMENT ET UNIQUEMENT cette phrase (AUCUNE autre section) :
"Aucune disposition légale béninoise pertinente n'a été trouvée dans la base juridique actuelle."

Sinon, fournis uniquement une réponse claire, concise et factuelle, basée STRICTEMENT sur le contexte fourni.`;

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
    let vectorIndexName = null;
    try {
      const showRes = await session.run(`SHOW INDEXES YIELD name RETURN name`);
      const names = showRes.records.map((r) => r.get('name'));
      if (names.includes('article_embeddings')) vectorIndexName = 'article_embeddings';
      else if (names.includes('node_embeddings')) vectorIndexName = 'node_embeddings';
    } catch (e) {
      console.warn('⚠️  Impossible de récupérer les index vectoriels:', e.message);
    }

    if (!vectorIndexName) {
      console.warn('⚠️  Aucun index vectoriel disponible dans Neo4j.');
      return [];
    }

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

    return result.records.map((record) => {
      const metadataStr = record.get('metadata');
      let metadata = {};
      if (metadataStr && typeof metadataStr === 'string') {
        try { metadata = JSON.parse(metadataStr); } catch {}
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
  } finally {
    await session.close();
    await driver.close();
  }
}

async function generateWithWorkersAI(question, context) {
  if (!WORKER_AI_API_KEY || !WORKER_AI_ACCOUNT_ID) {
    throw new Error('WORKER_AI_API_KEY ou WORKER_AI_ACCOUNT_ID manquant');
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${WORKER_AI_ACCOUNT_ID}/ai/run/${WORKER_AI_MODEL}`;
  const userContent = `Contexte légal strict (ne jamais inventer) :\n${context}\n\nQuestion utilisateur : ${question}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WORKER_AI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Workers AI erreur HTTP ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data?.result?.response || data?.result?.output_text || data?.result?.text || '';
  return String(text).trim();
}

async function main() {
  console.log('📝 Question:', question);
  console.log('---\n');

  try {
    console.log('⏳ Génération de l\'embedding...');
    const embedding = await generateEmbedding(question);
    console.log(`✅ Embedding généré (dimension: ${embedding.length})\n`);

    console.log('⏳ Recherche vectorielle dans Neo4j...');
    const articles = await searchArticles(embedding);
    console.log(`✅ ${articles.length} article(s) trouvé(s)\n`);

    if (!articles.length) {
      console.log('⚠️  Aucun article trouvé. Vérifiez Neo4j et l\'index vectoriel.');
      process.exit(0);
    }

    console.log('📚 Articles récupérés:');
    articles.forEach((article, i) => {
      console.log(`[${i + 1}] ${article.numero_article} – ${article.titre_loi}`);
      console.log(`    Score: ${article.score.toFixed(4)}`);
      console.log(`    Contenu: ${article.contenu.substring(0, 150).replace(/\s+/g, ' ')}...`);
    });
    console.log('');

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

    const context = relevantArticles
      .map((article) => `Article: ${article.numero_article} – ${article.titre_loi}\nContenu: ${article.contenu}\nScore: ${article.score.toFixed(4)}`)
      .join('\n\n---\n\n');

    console.log('⏳ Génération de la réponse via Workers AI...');
    const text = await generateWithWorkersAI(question, context);

    console.log('═'.repeat(60));
    console.log('🎯 RÉPONSE JURIDIQUE (Workers AI)');
    console.log('═'.repeat(60));
    console.log(text);
    console.log('═'.repeat(60));
    console.log(`\n📊 Statistiques:\n  • Articles trouvés: ${articles.length}\n  • Articles pertinents: ${relevantArticles.length}`);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

main();
