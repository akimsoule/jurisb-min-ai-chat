#!/bin/bash

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
POSTGRES_CONTAINER="jurisbenin-postgres"
NEO4J_CONTAINER="jurisbenin-neo4j"
REDIS_CONTAINER="jurisbenin-redis"
NETWORK="jurisbenin-network"

# Fonction d'aide
usage() {
  echo -e "${BLUE}Usage: $0 {start|stop|reset}${NC}"
  echo ""
  echo "Commandes :"
  echo "  start   - Démarrer tous les services Docker (idempotent)"
  echo "  stop    - Arrêter tous les services Docker"
  echo "  reset   - Réinitialiser tous les services (supprime les données)"
  echo ""
}

# ==================== FONCTIONS ====================

start_services() {
  echo -e "${BLUE}🚀 Démarrage des services Docker (idempotent)...${NC}"
  echo ""

  # Créer le réseau s'il n'existe pas
  if ! docker network inspect $NETWORK &> /dev/null; then
    echo -e "${YELLOW}📡 Création du réseau $NETWORK...${NC}"
    docker network create $NETWORK
  fi

  # ==================== PostgreSQL ====================
  echo -e "${YELLOW}🐘 PostgreSQL...${NC}"

  if docker ps -a --format '{{.Names}}' | grep -q "^${POSTGRES_CONTAINER}$"; then
    if docker ps --format '{{.Names}}' | grep -q "^${POSTGRES_CONTAINER}$"; then
      echo -e "${GREEN}✓ PostgreSQL est déjà en cours d'exécution${NC}"
    else
      echo -e "${YELLOW}▶️  Redémarrage de PostgreSQL...${NC}"
      docker start $POSTGRES_CONTAINER
      sleep 3
    fi
  else
    echo -e "${YELLOW}📦 Création de PostgreSQL...${NC}"
    docker run -d \
      --name $POSTGRES_CONTAINER \
      --network $NETWORK \
      -p 5432:5432 \
      -e POSTGRES_USER=postgres \
      -e POSTGRES_PASSWORD=postgres \
      -e POSTGRES_DB=jurisbenin \
      -v postgres_data:/var/lib/postgresql/data \
      --health-cmd="pg_isready -U postgres" \
      --health-interval=10s \
      --health-timeout=5s \
      --health-retries=5 \
      postgres:16-alpine
    
    echo -e "${YELLOW}⏳ Attente du démarrage de PostgreSQL...${NC}"
    sleep 5
    
    # Attendre que PostgreSQL soit prêt
    for i in {1..30}; do
      if docker exec $POSTGRES_CONTAINER pg_isready -U postgres &> /dev/null; then
        echo -e "${GREEN}✓ PostgreSQL est prêt${NC}"
        break
      fi
      echo -e "${YELLOW}⏳ Attente... ($i/30)${NC}"
      sleep 1
    done
  fi

  # ==================== Neo4j ====================
  echo -e "${YELLOW}🔵 Neo4j...${NC}"

  if docker ps -a --format '{{.Names}}' | grep -q "^${NEO4J_CONTAINER}$"; then
    if docker ps --format '{{.Names}}' | grep -q "^${NEO4J_CONTAINER}$"; then
      echo -e "${GREEN}✓ Neo4j est déjà en cours d'exécution${NC}"
    else
      echo -e "${YELLOW}▶️  Redémarrage de Neo4j...${NC}"
      docker start $NEO4J_CONTAINER
      sleep 3
    fi
  else
    echo -e "${YELLOW}📦 Création de Neo4j...${NC}"
    docker run -d \
      --name $NEO4J_CONTAINER \
      --network $NETWORK \
      -p 7687:7687 \
      -p 7474:7474 \
      -e NEO4J_AUTH=neo4j/password \
      -e NEO4J_ACCEPT_LICENSE_AGREEMENT=yes \
      -v neo4j_data:/var/lib/neo4j/data \
      -v neo4j_logs:/var/lib/neo4j/logs \
      neo4j:5-enterprise
    
    echo -e "${YELLOW}⏳ Attente du démarrage de Neo4j...${NC}"
    sleep 10
    
    # Attendre que Neo4j soit prêt
    for i in {1..60}; do
      if docker exec $NEO4J_CONTAINER cypher-shell -u neo4j -p password "RETURN 1" &> /dev/null; then
        echo -e "${GREEN}✓ Neo4j est prêt${NC}"
        break
      fi
      echo -e "${YELLOW}⏳ Attente... ($i/60)${NC}"
      sleep 1
    done
  fi

  # ==================== Redis ====================
  echo -e "${YELLOW}🔴 Redis...${NC}"

  if docker ps -a --format '{{.Names}}' | grep -q "^${REDIS_CONTAINER}$"; then
    if docker ps --format '{{.Names}}' | grep -q "^${REDIS_CONTAINER}$"; then
      echo -e "${GREEN}✓ Redis est déjà en cours d'exécution${NC}"
    else
      echo -e "${YELLOW}▶️  Redémarrage de Redis...${NC}"
      docker start $REDIS_CONTAINER
      sleep 1
    fi
  else
    echo -e "${YELLOW}📦 Création de Redis...${NC}"
    docker run -d \
      --name $REDIS_CONTAINER \
      --network $NETWORK \
      -p 6379:6379 \
      -v redis_data:/data \
      redis:7-alpine
    
    sleep 2
    echo -e "${GREEN}✓ Redis est prêt${NC}"
  fi

  # ==================== Résumé ====================
  echo ""
  echo -e "${GREEN}=====================================${NC}"
  echo -e "${GREEN}✅ Tous les services sont en cours d'exécution${NC}"
  echo -e "${GREEN}=====================================${NC}"
  echo ""
  echo "📊 Services disponibles :"
  echo "  • PostgreSQL  : localhost:5432"
  echo "    - User: postgres"
  echo "    - Password: postgres"
  echo "    - Database: jurisbenin"
  echo ""
  echo "  • Neo4j       : localhost:7687 (Bolt)"
  echo "    - Browser: http://localhost:7474"
  echo "    - User: neo4j"
  echo "    - Password: password"
  echo ""
  echo "  • Redis       : localhost:6379"
  echo ""
  echo -e "${YELLOW}Commandes utiles :${NC}"
  echo "  • Voir les logs    : docker logs -f <container_name>"
  echo "  • Arrêter          : $0 stop"
  echo "  • Réinitialiser    : $0 reset"
  echo ""
}

stop_services() {
  echo -e "${BLUE}🛑 Arrêt des services Docker...${NC}"
  echo ""

  # Arrêter les conteneurs
  for container in $POSTGRES_CONTAINER $NEO4J_CONTAINER $REDIS_CONTAINER; do
    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
      echo -e "${YELLOW}Arrêt de $container...${NC}"
      docker stop $container
      echo -e "${GREEN}✓ $container arrêté${NC}"
    else
      echo -e "${YELLOW}⊘ $container n'est pas en cours d'exécution${NC}"
    fi
  done

  echo ""
  echo -e "${GREEN}✅ Tous les services sont arrêtés${NC}"
  echo ""
  echo -e "${YELLOW}Note :${NC} Les données sont préservées dans les volumes Docker."
  echo "Pour réinitialiser, exécutez : $0 reset"
  echo ""
}

reset_services() {
  echo -e "${BLUE}⚠️  Réinitialisation de tous les services Docker...${NC}"
  echo ""

  read -p "Êtes-vous sûr ? Cela supprimera toutes les données. (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Annulé."
    return
  fi

  # Arrêter les conteneurs
  for container in $POSTGRES_CONTAINER $NEO4J_CONTAINER $REDIS_CONTAINER; do
    if docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
      echo -e "${YELLOW}Arrêt et suppression de $container...${NC}"
      docker stop $container 2>/dev/null || true
      docker rm $container
      echo -e "${GREEN}✓ $container supprimé${NC}"
    fi
  done

  # Supprimer les volumes
  for volume in postgres_data neo4j_data neo4j_logs redis_data; do
    if docker volume inspect $volume &>/dev/null; then
      echo -e "${YELLOW}Suppression du volume $volume...${NC}"
      docker volume rm $volume
      echo -e "${GREEN}✓ Volume $volume supprimé${NC}"
    fi
  done

  echo ""
  echo -e "${GREEN}✅ Réinitialisation complète${NC}"
  echo ""
  echo "Vous pouvez maintenant relancer les services avec : $0 start"
  echo ""
}

# ==================== MAIN ====================

if [ $# -eq 0 ]; then
  usage
  exit 1
fi

case "$1" in
  start)
    start_services
    ;;
  stop)
    stop_services
    ;;
  reset)
    reset_services
    ;;
  *)
    echo -e "${RED}Commande inconnue: $1${NC}"
    echo ""
    usage
    exit 1
    ;;
esac
