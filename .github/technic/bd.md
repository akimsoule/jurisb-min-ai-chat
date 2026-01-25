# Modèle Logique de Données (MLD)

Ce document décrit le **modèle logique de données** du SaaS juridique béninois.
L’architecture repose sur une **séparation stricte des responsabilités** :

- **PostgreSQL (Neon) via Prisma** : données structurées, transactionnelles et financières
- **Neo4j** : graphe juridique et embeddings utilisés par le LLM (RAG)

> 📍 **Chemin du fichier** : `.github/technic/bd.md`

---

## 1. Vue d’ensemble de l’architecture données

```text
                    Next.js (Server Components)
                               │
               ┌───────────────┴───────────────┐
               │                               │
      Neon PostgreSQL (Prisma)               Neo4j
   (transactions, sécurité)        (graphe juridique + RAG)
```

Objectif :

- **fiabilité financière et sécurité** côté PostgreSQL
- **raisonnement juridique et sémantique** côté Neo4j

---

## 2. Modèle Relationnel – PostgreSQL (Neon + Prisma)

### 2.1 Table `User`

| Champ      | Type      | Description             |
| ---------- | --------- | ----------------------- |
| id         | UUID      | Identifiant utilisateur |
| email      | string    | Email unique            |
| role       | enum      | `USER` / `ADMIN`        |
| credits    | integer   | Solde de crédits (>= 0) |
| created_at | timestamp | Date de création        |
| updated_at | timestamp | Dernière mise à jour    |

Contraintes :

- `email` UNIQUE
- `credits >= 0`

---

### 2.2 Table `ProcessedStripeEvent`

Table critique pour l’idempotence Stripe.

| Champ        | Type      | Description           |
| ------------ | --------- | --------------------- |
| id           | UUID      | Identifiant interne   |
| event_id     | string    | ID Stripe (`evt_...`) |
| user_id      | UUID      | Utilisateur concerné  |
| processed_at | timestamp | Date de traitement    |

Contraintes :

- `event_id` UNIQUE

---

### 2.3 Table `CreditTransaction` (optionnelle mais recommandée)

Permet l’audit et la traçabilité.

| Champ      | Type      | Description                   |
| ---------- | --------- | ----------------------------- |
| id         | UUID      | Identifiant                   |
| user_id    | UUID      | Utilisateur                   |
| delta      | integer   | +X ou -1                      |
| reason     | string    | `STRIPE_PURCHASE`, `LLM_CALL` |
| created_at | timestamp | Date                          |

---

### 2.4 Règles transactionnelles (PostgreSQL)

- Toute mise à jour de crédits se fait dans une **transaction ACID**
- Stripe webhook :
  - INSERT `ProcessedStripeEvent`
  - UPDATE `User.credits`
- Appel LLM :
  - Vérification `credits >= 1`
  - Décrément atomique

Toute violation est considérée comme **bug critique**.

---

## 3. Modèle Graphe – Neo4j (Droit béninois)

### 3.1 Nœud `Article`

```text
(:Article)
```

| Propriété      | Type          | Description          |
| -------------- | ------------- | -------------------- |
| id             | string (UUID) | Identifiant unique   |
| titre_loi      | string        | Titre de la loi      |
| numero_article | string        | Numéro officiel      |
| contenu        | text          | Texte juridique      |
| metadata       | JSON          | Source, date, statut |
| embedding      | vector<float> | Embedding sémantique |

---

### 3.2 Nœud `Loi`

```text
(:Loi)
```

| Propriété         | Type   | Description          |
| ----------------- | ------ | -------------------- |
| id                | string | Identifiant          |
| titre             | string | Titre officiel       |
| code              | string | Code juridique       |
| date_promulgation | date   | Date                 |
| statut            | string | En vigueur / abrogée |

---

### 3.3 Relations Juridiques

```text
(:Article)-[:APPARTIENT_A]->(:Loi)
(:Article)-[:MODIFIE]->(:Article)
(:Article)-[:ABROGE]->(:Article)
(:Article)-[:CITE]->(:Article)
```

Ces relations permettent :

- l’analyse d’impact juridique
- la navigation normative
- l’enrichissement du contexte RAG

---

## 4. RAG & LLM – Séparation des responsabilités

- **Neo4j** :

  - similarité cosinus sur `embedding`
  - récupération des articles pertinents
  - navigation graphe (citations, modifications)

- **PostgreSQL** :
  - vérification du quota utilisateur
  - audit des appels LLM

Le LLM n’a **aucun accès direct** aux données PostgreSQL.

---

## 5. Contraintes Globales de Sécurité

- Aucun paiement ou crédit côté client
- Stripe Webhooks = source de vérité
- Vérification de signature Stripe obligatoire
- Middleware serveur pour le contrôle des crédits

---

## 6. Référencement dans la documentation principale

Dans le fichier principal (`README.md` ou équivalent) :

```markdown
📘 **Modèle logique de données**  
Voir le document : [Modèle logique de données](.github/technic/bd.md)
```

---

## 7. Objectif du Modèle

Garantir :

- sécurité financière
- cohérence juridique
- traçabilité complète
- séparation claire entre logique métier et raisonnement LLM
