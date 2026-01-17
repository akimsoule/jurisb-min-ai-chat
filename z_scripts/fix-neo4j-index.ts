/**
 * Script pour recréer l'index vectoriel Neo4j avec 384 dimensions
 * Compatible avec le modèle Xenova/all-MiniLM-L6-v2
 *
 * Utilisation : npx ts-node z_scripts/fix-neo4j-index.ts
 */

import neo4j from "neo4j-driver";

async function fixIndex() {
  const uri = process.env.NEO4J_URI || "neo4j://localhost:7687";
  const user = process.env.NEO4J_USER || "neo4j";
  const password = process.env.NEO4J_PASSWORD || "password";

  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  const session = driver.session();

  try {
    console.log("🔧 Recréation de l'index vectoriel Neo4j (384 dims)...\n");
    console.log(`Connexion: ${uri}`);
    console.log(`User: ${user}\n`);

    // Étape 1 : Supprimer l'index existant
    console.log("⏳ Suppression de l'index existant...");
    try {
      await session.run("DROP INDEX article_embeddings IF EXISTS");
      console.log("✅ Index supprimé\n");
    } catch (e) {
      console.log("⚠️  Index non trouvé ou déjà supprimé\n");
    }

    // Étape 2 : Attendre un moment
    console.log("⏳ Attente (2s)...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Étape 3 : Recréer l'index avec 384 dimensions
    console.log("⏳ Création du nouvel index avec 384 dimensions...");
    await session.run(`
      CREATE VECTOR INDEX article_embeddings
      FOR (a:Article) ON (a.embedding)
      OPTIONS {
        indexConfig: {
          \`vector.similarity_function\`: 'cosine',
          \`vector.dimensions\`: 384
        }
      }
    `);
    console.log("✅ Index créé avec succès\n");

    // Étape 4 : Afficher la confirmation
    console.log("📊 Vérification de l'index créé...");
    const result = await session.run(`
      SHOW INDEXES YIELD name, entityType, labelsOrTypes, properties, options
      WHERE name = 'article_embeddings'
      RETURN name, entityType, labelsOrTypes, properties, options
    `);

    if (result.records.length > 0) {
      const record = result.records[0];
      console.log(`   Index: ${record.get("name")}`);
      console.log(`   Type: ${record.get("entityType")}`);
      console.log(`   Labels: ${record.get("labelsOrTypes")}`);
      console.log(`   Properties: ${record.get("properties")}`);
      console.log(
        `   Options: ${JSON.stringify(record.get("options"), null, 2)}`
      );
    }

    console.log("\n✅ Index vectoriel recréé avec succès (384 dimensions)");
    console.log("\nVous pouvez maintenant relancer l'application Next.js");
  } catch (error) {
    console.error("❌ Erreur:", error);
    process.exit(1);
  } finally {
    await session.close();
    await driver.close();
  }
}

fixIndex();
