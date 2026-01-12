# Architecture Technique – SaaS Juridique Béninois

Ce document complète le modèle de données et le pipeline RAG.
Il décrit l’architecture globale, incluant Frontend, Backend, bases de données et intégrations.

---

## 1. Vue générale

```text
               ┌───────────────┐
               │   Next.js App │
               │ Server Comp.  │
               └───────┬───────┘
                       │
          ┌────────────┴─────────────┐
          │                          │
  Neon PostgreSQL (Prisma)       Neo4j Graph DB
  - Users                       - Articles
  - Credits                     - Embeddings
  - Stripe Events               - Relations MODIFIE, CITE, ABROGE
  - Credit Transactions         - RAG Search
```

---

## 2. Frontend / Backend

- **Next.js (App Router)**
  - Server Components pour la récupération sécurisée de données.
  - Typage strict TypeScript.
  - UI : shadcn/ui + Tailwind CSS.

---

## 3. Base de données

### 3.1 PostgreSQL (Neon) via Prisma
- Données structurées et transactionnelles :
  - Users, crédits, achats Stripe, logs, audits
- Transactions ACID
- Idempotence Stripe

### 3.2 Neo4j
- Graphe juridique pour RAG :
  - Articles, Lois, relations
  - Embeddings vectoriels
- Exploitation par LLM Groq Cloud SDK

---

## 4. Pipeline RAG

- Voir document détaillé : [.github/technic/rag-flow.md](.github/technic/rag-flow.md)

---

## 5. Intégration LLM

- Groq Cloud SDK (Llama 3 ou Mixtral)
- Récupère contexte depuis Neo4j
- Génère réponse strictement conforme au droit béninois
- Middleware vérifie crédits et sécurité avant appel

---

## 6. Sécurité & Monétisation

- Stripe Checkout pour achats de crédits
- Idempotence & atomicité serveur pour Webhooks
- Middleware pour vérification des crédits avant chaque requête LLM
- Transactions PostgreSQL pour toutes modifications financières

---

## 7. Références

- Modèle logique de données : [.github/technic/bd.md](.github/technic/bd.md)
- Pipeline RAG : [.github/technic/rag-flow.md](.github/technic/rag-flow.md)
- Prompt principal : README.md ou documentation principale

