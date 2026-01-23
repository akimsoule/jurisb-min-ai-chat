#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Script de génération des embeddings vectoriels pour tous les articles
 * Crée les fichiers _vectors.json dans /data/vector/
 */

require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');
const { HfInference } = require('@huggingface/inference');

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
if (!HF_API_KEY) {
  console.error('❌ HUGGINGFACE_API_KEY non définie');
  process.exit(1);
}

const hf = new HfInference(HF_API_KEY);

const dataDir = path.join(__dirname, '..', 'data', 'node');
const vectorDir = path.join(__dirname, '..', 'data', 'vector');

// Créer vectorDir s'il n'existe pas
if (!fs.existsSync(vectorDir)) {
  fs.mkdirSync(vectorDir, { recursive: true });
}

async function generateEmbedding(text) {
  try {
    const result = await hf.featureExtraction({
      model: 'sentence-transformers/all-MiniLM-L12-v2',
      inputs: text,
    });
    return Array.isArray(result[0]) ? result[0] : result;
  } catch (error) {
    console.error('  ❌ Erreur embedding:', error.message);
    return null;
  }
}

function extractArticles(node, articles = []) {
  if (node.type === 'ARTICLE') {
    articles.push(node);
  } else if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      extractArticles(child, articles);
    }
  }
  return articles;
}

async function processFile(file) {
  const filePath = path.join(dataDir, file);
  const vectorFileName = file.replace('.json', '_vectors.json');
  const vectorPath = path.join(vectorDir, vectorFileName);

  try {
    // Lire le fichier JSON
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    if (jsonData.type !== 'LAW') {
      return null;
    }

    // Extraire tous les articles
    const allArticles = [];
    const children = jsonData.children || [];
    for (const child of children) {
      extractArticles(child, allArticles);
    }

    // Générer les embeddings
    const vectorNodes = [];
    for (const article of allArticles) {
      const meta = article.metadata || {};
      const text = meta.text || '';
      const number = meta.number || '';
      const index = meta.index || '';

      if (text.length < 10) continue;

      process.stdout.write('.');
      const embedding = await generateEmbedding(text);

      if (embedding) {
        vectorNodes.push({
          type: 'ARTICLE',
          number,
          index,
          text: text.substring(0, 100), // Stocker juste un aperçu
          vector: embedding,
        });
      }
    }

    // Sauvegarder les vectors
    fs.writeFileSync(
      vectorPath,
      JSON.stringify({ nodes: vectorNodes }, null, 2)
    );

    return vectorNodes.length;
  } catch (error) {
    console.error(`\n  ❌ Erreur ${file}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🔧 GÉNÉRATION DES EMBEDDINGS VECTORIELS\n');

  const files = fs.readdirSync(dataDir)
    .filter(f => f.startsWith('loi-') && f.endsWith('.json'))
    .sort();

  console.log(`📂 ${files.length} fichiers de lois trouvés\n`);

  let totalEmbeddings = 0;

  for (const file of files) {
    const lawName = file.replace('.json', '');
    process.stdout.write(`⏳ ${lawName.padEnd(20)} `);

    const count = await processFile(file);

    if (count !== null) {
      console.log(` ✅ ${count} embeddings`);
      totalEmbeddings += count;
    }
  }

  console.log(`\n✅ Génération terminée : ${totalEmbeddings} embeddings créés`);
}

main().catch((err) => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
