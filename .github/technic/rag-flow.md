# Pipeline RAG – SaaS Juridique Béninois

Ce document décrit le **pipeline Retrieval-Augmented Generation (RAG)** utilisé pour le SaaS juridique béninois.
Il complète le modèle de données (.github/technic/bd.md) et explique comment les questions utilisateurs sont traitées.

---

## 1. Vue d’ensemble du pipeline

```text
Utilisateur
   │
   ▼
Next.js App (Server Components)
   │
   ▼
Middleware crédit (PostgreSQL)
   │   Vérifie user.credits >=1
   ▼
Neo4j Graph + Vector Search
   │   Recherche articles pertinents via embeddings
   ▼
Groq Cloud SDK LLM
   │   Génère réponse basée sur le contexte Neo4j
   ▼
Décrément du crédit (PostgreSQL)
   │
   ▼
Réponse à l'utilisateur
```

---

## 2. Étapes détaillées

### 2.1 Vérification des crédits
- Middleware côté serveur.
- Lit `user.credits` dans PostgreSQL.
- Si crédits < 1 → **rejeter la requête**.

### 2.2 Récupération du contexte
- Requête Neo4j via `neo4j-driver`.
- Similarité cosinus sur les embeddings.
- Navigation graphe pour relations :
  - `MODIFIE`
  - `ABROGE`
  - `CITE`
- Retourne un ensemble d’articles pertinents au format JSON.

### 2.3 Génération LLM
- Appel Groq Cloud SDK avec :
  - contexte Neo4j
  - instruction pour répondre strictement selon la loi béninoise
  - format de sortie conforme au prompt principal

### 2.4 Post-traitement & crédit
- Après génération, décrémente 1 crédit.
- Enregistre la transaction dans PostgreSQL (`CreditTransaction`).
- Audit optionnel pour traçabilité.

---

## 3. Sécurité & Robustesse
- Vérification des signatures Stripe pour achats.
- Idempotence pour événements Stripe (`processed_events`).
- Transactions ACID PostgreSQL pour toute opération sur les crédits.
- Neo4j = seule source pour le contexte juridique.

---

## 4. Références
- Modèle logique de données : [.github/technic/bd.md](.github/technic/bd.md)
- Prompt principal : README.md ou doc principale
- Sécurité des transactions : Stripe Webhooks et idempotence

