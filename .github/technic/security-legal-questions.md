# Sécurité du Pipeline RAG - Questions Juridiques Uniquement

## Vue d'ensemble

Le système SaaS Juridique Béninois est conçu pour ne répondre **exclusivement** qu'aux questions relatives au droit béninois. Plusieurs mécanismes de sécurité sont mis en place pour garantir cette spécialisation.

## Mécanismes de Sécurité

### 1. Validation Côté Client

**Fichier :** `src/components/chat/ChatInterface.tsx`

- **Fonction :** `isLegalQuestion(question: string)`
- **Rôle :** Validation immédiate avant envoi de la requête
- **Critères :**
  - Détection de mots-clés juridiques béninois (loi, code, article, etc.)
  - Vérification que c'est bien une question (commence par "est-ce que", "peut-on", etc.)
  - Refus automatique des questions non juridiques

### 2. Validation Côté Serveur

**Fichier :** `src/app/api/ask/route.ts`

- **Fonction :** `isLegalQuestion(question: string)`
- **Rôle :** Double validation côté serveur
- **Action :** Rejet HTTP 400 avec message d'erreur si question non juridique

### 3. Prompt Système Strict

**Fichier :** `src/lib/services/groq.ts`

- **Instructions explicites :**
  - Ne répondre qu'aux questions relatives au droit béninois
  - Refuser les questions d'autres pays
  - Refuser les questions non juridiques
  - Utiliser uniquement le contexte fourni

### 4. Recherche Vectorielle Contrôlée

**Fichier :** `src/lib/services/neo4j.ts`

- **Base de données :** Neo4j avec uniquement des textes juridiques béninois
- **Recherche :** Similarité cosinus sur embeddings
- **Filtrage :** Score minimum de pertinence (0.65)

### 5. Détection de Refus LLM

**Fichier :** `src/app/api/ask/route.ts`

- **Fonction :** `llmIsDenyingLegalBasis(text: string)`
- **Rôle :** Détecte si le LLM refuse de répondre
- **Patterns :** "aucune disposition", "aucun article", etc.

## Flux de Sécurité

```text
Question Utilisateur
        │
        ▼
Validation Client (isLegalQuestion)
        │
        ▼
Validation Serveur (isLegalQuestion)
        │   ✗ Question rejetée (HTTP 400)
        ▼
Recherche Vectorielle (Neo4j)
        │
        ▼
Génération LLM (Prompt strict)
        │
        ▼
Validation Réponse (llmIsDenyingLegalBasis)
        │   ✗ Réponse rejetée
        ▼
Réponse Utilisateur
```

## Mots-clés Juridiques Détectés

Le système reconnaît automatiquement les questions contenant ces termes :

- **Droit civil :** loi, code, article, contrat, propriété, succession, mariage, divorce, enfant, famille
- **Droit pénal :** pénal, procédure, judiciaire, tribunal, juridiction, responsabilité
- **Droit du travail :** travail, travailleur, employeur, syndicat, grève, licenciement
- **Droit commercial :** commerce, entreprise, société, banque, crédit
- **Droit public :** administration, fonction publique, impôt, taxe
- **Droit international :** extradition, asile, étranger, immigration, nationalité

## Réponses de Rejet

### Côté Client

> "Cette plateforme ne traite que des questions relatives au droit béninois. Veuillez reformuler votre question."

### Côté Serveur (HTTP 400)

> "Cette plateforme ne traite que des questions relatives au droit béninois. Veuillez reformuler votre question."

### LLM (Aucune base légale)

> "Aucune disposition légale béninoise pertinente n'a été trouvée dans la base juridique actuelle."

## Tests de Sécurité

### Questions Acceptées ✅

- "Quel est l'article du code pénal sur le vol ?"
- "Peut-on divorcer au Bénin sans juge ?"
- "Quelles sont les conditions pour créer une société au Bénin ?"

### Questions Rejetées ❌

- "Comment faire une omelette ?"
- "Quel temps fait-il à Paris ?"
- "Comment fonctionne un moteur de voiture ?"
- "Quel est l'article 123 du code pénal français ?"

## Maintenance

### Mise à Jour des Mots-clés

Les listes de mots-clés dans `isLegalQuestion()` doivent être maintenues pour couvrir :

- Nouveaux textes législatifs
- Évolutions du langage juridique
- Termes techniques émergents

### Monitoring

Surveiller les logs pour :

- Questions rejetées (validation client/serveur)
- Réponses LLM de refus
- Tentatives de contournement

## Conformité RGPD

Le système ne stocke que les questions validées comme juridiques, préservant ainsi la vie privée des utilisateurs pour les questions non pertinentes.
