#!/bin/bash

# Script pour recréer l'index vectoriel Neo4j avec 384 dimensions
# Compatible avec le modèle Xenova/all-MiniLM-L6-v2

set -e

NEO4J_URI="${NEO4J_URI:-neo4j://localhost:7687}"
NEO4J_USER="${NEO4J_USER:-neo4j}"
NEO4J_PASSWORD="${NEO4J_PASSWORD:-password}"

echo "🔧 Recréation de l'index vectoriel Neo4j (384 dims)..."
echo ""
echo "Connexion: $NEO4J_URI"
echo "User: $NEO4J_USER"
echo ""

# Utiliser cypher-shell pour exécuter les commandes
cypher-shell -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" -a "$NEO4J_URI" << 'EOF'

// Étape 1 : Supprimer l'index existant
DROP INDEX article_embeddings IF EXISTS;

// Étape 2 : Attendre un moment
CALL apoc.util.sleep(2000);

// Étape 3 : Recréer l'index avec 384 dimensions
CREATE VECTOR INDEX article_embeddings
FOR (a:Article) ON (a.embedding)
OPTIONS {
  indexConfig: {
    `vector.similarity_function`: 'cosine',
    `vector.dimensions`: 384
  }
};

// Afficher la confirmation
SHOW INDEXES YIELD name, entityType, labelsOrTypes, properties, options
WHERE name = 'article_embeddings'
RETURN name, entityType, labelsOrTypes, properties, options;

EOF

echo ""
echo "✅ Index vectoriel recréé avec succès (384 dimensions)"
echo ""
echo "Vous pouvez maintenant relancer l'application Next.js"
