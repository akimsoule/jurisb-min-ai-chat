// Ingestion complète V2 : Gère les hiérarchies imbriquées (LAW → TITLE → CHAPTER → ARTICLE)
// Nettoie les anciens nœuds et recrée tout proprement

/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env.local' });

const neo4j = require('neo4j-driver');
const fs = require('fs');
const path = require('path');

(async () => {
  const uri = process.env.NEO4J_URI || 'neo4j://localhost:7687';
  const user = process.env.NEO4J_USER || 'neo4j';
  const password = process.env.NEO4J_PASSWORD || 'password';

  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  const session = driver.session({ database: process.env.NEO4J_DATABASE || 'neo4j' });

  try {
    console.log('🔧 INGESTION COMPLÈTE V2 : Support hiérarchies imbriquées\n');

    // Étape 1 : Nettoyer les anciens nœuds
    console.log('🗑️  Étape 1 : Suppression des anciens nœuds...');
    await session.run(`MATCH (n:ARTICLE) DETACH DELETE n`);
    await session.run(`MATCH (n:CHAPTER) DETACH DELETE n`);
    await session.run(`MATCH (n:TITLE) DETACH DELETE n`);
    await session.run(`MATCH (n:BOOK) DETACH DELETE n`);
    console.log('   ✅ Nœuds supprimés');

    // Étape 2 : Lire les fichiers JSON + vectors
    const dataDir = path.join(__dirname, '..', 'data', 'node');
    const vectorDir = path.join(__dirname, '..', 'data', 'vector');
    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

    console.log(`\n📂 ${files.length} fichiers JSON trouvés\n`);

    let lawCount = 0;
    let articleCount = 0;
    let embeddingCount = 0;

    // Map pour stocker les embeddings
    const embeddingMap = new Map();

    // Pré-charger tous les embeddings
    console.log('📊 Pré-chargement des embeddings...');
    for (const file of files) {
      const vectorFileName = file.replace('.json', '_vectors.json');
      const vectorPath = path.join(vectorDir, vectorFileName);
      
      if (fs.existsSync(vectorPath)) {
        try {
          const vectorData = JSON.parse(fs.readFileSync(vectorPath, 'utf-8'));
          const vectorNodes = vectorData.nodes || [];
          
          for (const vnode of vectorNodes) {
            const type = vnode.type || '';
            const number = vnode.number || '';
            const index = vnode.index || '';
            const vector = vnode.vector || [];
            
            const key = `${type}_${number}_${index}`;
            if (vector.length > 0) {
              embeddingMap.set(key, vector);
              embeddingCount++;
            }
          }
        } catch (e) {
          // Ignore vector file errors
        }
      }
    }
    console.log(`   ✅ ${embeddingCount} embeddings chargés\n`);

    // Étape 3 : Ingérer les structures de nœuds
    console.log('📋 Ingestion des structures...');

    // Fonction récursive pour extraire tous les ARTICLE, même imbriqués
    const extractArticles = (node, lawId, lawTitle) => {
      const articles = [];
      
      if (node.type === 'ARTICLE') {
        // C'est un article, l'ajouter
        articles.push({ node, lawId, lawTitle });
      } else if (node.children && Array.isArray(node.children)) {
        // Récurser dans les enfants
        for (const child of node.children) {
          articles.push(...extractArticles(child, lawId, lawTitle));
        }
      }
      
      return articles;
    };

    for (const file of files) {
      try {
        const filePath = path.join(dataDir, file);
        const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        if (jsonData.type !== 'LAW') {
          continue;
        }

        const lawMeta = jsonData.metadata || {};
        const lawNumber = lawMeta.number || file.replace('.json', '');
        const lawTitle = lawMeta.object || lawNumber;
        const lawSource = lawMeta.source || '';

        const lawId = `LAW_${lawNumber.replace(/[^0-9-]/g, '')}`;

        // Créer ou mettre à jour LAW
        await session.run(`
          MERGE (l:LAW {id: $lawId})
          SET l.titre = $titre,
              l.numero = $numero,
              l.object = $object,
              l.source = $source
          RETURN l
        `, {
          lawId,
          titre: lawTitle,
          numero: lawNumber,
          object: lawTitle,
          source: lawSource
        });

        lawCount++;

        // Extraire tous les ARTICLE (même s'ils sont nested)
        const allArticles = [];
        const children = jsonData.children || [];
        for (const child of children) {
          allArticles.push(...extractArticles(child, lawId, lawTitle));
        }

        // Ingérer les articles
        for (const { node: article, lawId, lawTitle } of allArticles) {
          const artMeta = article.metadata || {};
          const artNumber = artMeta.number || '';
          const artIndex = artMeta.index || '';
          const artText = artMeta.text || '';
          const articleId = `ARTICLE_${artNumber}_${artIndex}`;

          // Chercher l'embedding
          const embeddingKey = `ARTICLE_${artNumber}_${artIndex}`;
          const embedding = embeddingMap.get(embeddingKey);

          const params = {
            articleId,
            number: artNumber,
            index: artIndex,
            text: artText,
            numeroArticle: `Article ${artNumber}`,
            titreLoi: lawTitle,
            contenu: artText,
            lawId,
            metadata: JSON.stringify({
              lawNumber: lawNumber,
              source: lawSource
            })
          };

          if (embedding) {
            params.embedding = embedding;
          }

          const setEmbedding = embedding ? ', a.embedding = $embedding' : '';

          await session.run(`
            MERGE (a:ARTICLE {id: $articleId})
            SET a.number = $number,
                a.index = $index,
                a.text = $text,
                a.numero_article = $numeroArticle,
                a.titre_loi = $titreLoi,
                a.contenu = $contenu,
                a.metadata = $metadata
                ${setEmbedding}
            WITH a
            MATCH (l:LAW {id: $lawId})
            MERGE (a)-[:APPARTIENT_A]->(l)
            RETURN a
          `, params);

          articleCount++;
        }

        console.log(`   ✅ ${lawNumber}: ${allArticles.length} article(s)`);

      } catch (err) {
        console.error(`   ❌ Erreur ${file}:`, err.message);
      }
    }

    console.log(`\n✅ Ingestion complétée:`);
    console.log(`   ${lawCount} LAW`);
    console.log(`   ${articleCount} ARTICLE`);
    console.log(`   ${embeddingCount} embeddings assignés\n`);

    // Étape 4 : Créer l'index vectoriel
    console.log('🔍 Étape 4 : Création de l\'index vectoriel...');
    
    // Détecter la dimension
    const dimRes = await session.run(`
      MATCH (a:ARTICLE)
      WHERE a.embedding IS NOT NULL
      RETURN size(a.embedding) AS dim
      LIMIT 1
    `);

    if (dimRes.records.length === 0) {
      console.log('   ⚠️  Aucun embedding trouvé, index non créé');
    } else {
      const dim = dimRes.records[0].get('dim');
      console.log(`   ➡️  Dimension détectée: ${dim}`);

      // Supprimer index existant
      try {
        await session.run(`DROP INDEX article_embeddings IF EXISTS`);
        await session.run(`DROP INDEX node_embeddings IF EXISTS`);
      } catch (e) {
        // Ignore
      }

      // Créer l'index
      await session.run(`
        CREATE VECTOR INDEX article_embeddings
        FOR (a:ARTICLE) ON (a.embedding)
        OPTIONS {
          indexConfig: {
            \`vector.similarity_function\`: 'cosine',
            \`vector.dimensions\`: ${dim}
          }
        }
      `);

      console.log(`   ✅ Index 'article_embeddings' créé (${dim} dims)\n`);
    }

    // Étape 5 : Statistiques
    console.log('📊 Statistiques finales:');
    const stats = await session.run(`
      MATCH (l:LAW)
      OPTIONAL MATCH (a:ARTICLE)-[:APPARTIENT_A]->(l)
      WITH count(l) AS laws, count(a) AS articles
      MATCH (ae:ARTICLE) WHERE ae.embedding IS NOT NULL
      RETURN laws, articles, count(ae) AS articlesWithEmbedding
    `);

    const record = stats.records[0];
    console.log(`   LAW: ${record.get('laws').toNumber()}`);
    console.log(`   ARTICLE: ${record.get('articles').toNumber()}`);
    console.log(`   ARTICLE avec embeddings: ${record.get('articlesWithEmbedding').toNumber()}`);

    console.log('\n🎉 Ingestion terminée!');
  } catch (err) {
    console.error('❌ Erreur:', err.message);
    process.exitCode = 1;
  } finally {
    await session.close();
    await driver.close();
  }
})();
