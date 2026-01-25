require('dotenv').config({ path: '.env.production' });
const neo4j = require('neo4j-driver');

async function showNeo4jStructure() {
  const uri = process.env.NEO4J_URI || "neo4j://localhost:7687";
  const user = process.env.NEO4J_USERNAME || "neo4j";
  const password = process.env.NEO4J_PASSWORD || "password";

  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  const session = driver.session();

  try {
    console.log('=== Structure de la base de données Neo4j ===\n');

    // Obtenir les labels de nœuds
    const labelsResult = await session.run('CALL db.labels()');
    const labels = labelsResult.records.map(record => record.get('label'));

    console.log('Labels de nœuds :');
    labels.forEach((label, index) => {
      console.log(`${index + 1}. ${label}`);
    });

    // Obtenir les types de relations
    const relTypesResult = await session.run('CALL db.relationshipTypes()');
    const relTypes = relTypesResult.records.map(record => record.get('relationshipType'));

    console.log('\nTypes de relations :');
    relTypes.forEach((type, index) => {
      console.log(`${index + 1}. ${type}`);
    });

    // Compter les nœuds par label
    console.log('\n=== Comptage des nœuds par label ===');
    for (const label of labels) {
      const countResult = await session.run(`MATCH (n:${label}) RETURN count(n) as count`);
      const count = countResult.records[0].get('count').toNumber();
      console.log(`${label}: ${count} nœuds`);
    }

    // Compter les relations par type
    console.log('\n=== Comptage des relations par type ===');
    for (const type of relTypes) {
      const countResult = await session.run(`MATCH ()-[r:${type}]->() RETURN count(r) as count`);
      const count = countResult.records[0].get('count').toNumber();
      console.log(`${type}: ${count} relations`);
    }

    // Schéma de visualisation (si disponible)
    console.log('\n=== Schéma de visualisation ===');
    try {
      const schemaResult = await session.run('CALL db.schema.visualization()');
      schemaResult.records.forEach(record => {
        console.log('Nœuds:', record.get('nodes').map(n => n.labels.join(':')));
        console.log('Relations:', record.get('relationships').map(r => r.type));
      });
    } catch (error) {
      console.log('Schéma non disponible ou erreur:', error.message);
    }

    // Exemples de propriétés des nœuds
    console.log('\n=== Exemples de propriétés des nœuds ===');
    for (const label of labels) {
      const exampleResult = await session.run(`MATCH (n:${label}) RETURN n LIMIT 1`);
      if (exampleResult.records.length > 0) {
        const node = exampleResult.records[0].get('n');
        console.log(`\nExemple de nœud ${label}:`);
        console.log(JSON.stringify(node.properties, null, 2));
      } else {
        console.log(`\nAucun nœud trouvé pour le label ${label}`);
      }
    }

  } catch (error) {
    console.error('Erreur lors de la récupération de la structure de Neo4j:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

showNeo4jStructure();