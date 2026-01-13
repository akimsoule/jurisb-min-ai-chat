# 🎨 Guide de Style UI – JurisBen

## Vue d'ensemble

L'interface utilisateur de JurisBen suit une approche **Perplexity-inspired** avec :

- ✨ Design épuré et minimaliste
- 📚 Hiérarchie claire entre question, réponse et sources
- 🎯 Mise en valeur des citations juridiques
- 🚀 Expérience fluide de type "research assistant"

---

## 🏗️ Structure de l'Interface

```
┌─────────────────────────────────────────────────────────────┐
│  Sidebar (288px)          │  Main Content Area            │
│                            │                                │
│  ┌──────────────────┐     │  ┌──────────────────────────┐ │
│  │  🔷 JurisBen     │     │  │   Messages Area          │ │
│  │  Droit béninois  │     │  │   (Welcome ou Chat)      │ │
│  └──────────────────┘     │  │                          │ │
│                            │  │   ┌────────────────┐    │ │
│  [+ Nouvelle conversation] │  │   │ User Message   │    │ │
│                            │  │   └────────────────┘    │ │
│  📋 Conversations récentes │  │                          │ │
│  ┌──────────────────┐     │  │   ┌────────────────┐    │ │
│  │ 💬 Conversation 1│     │  │   │ AI Response    │    │ │
│  │ 💬 Conversation 2│     │  │   │ 📖 Sources (3) │    │ │
│  └──────────────────┘     │  │   └────────────────┘    │ │
│                            │  └──────────────────────────┘ │
│  ┌──────────────────┐     │                                │
│  │ 💳 Crédits: 10   │     │  ┌──────────────────────────┐ │
│  │ [Acheter]        │     │  │  Input Area              │ │
│  │ ⚙️  Paramètres    │     │  │  [Posez votre question] │ │
│  │ 🚪 Déconnexion   │     │  │  📤                      │ │
│  └──────────────────┘     │  └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Composants Créés

### 1. **Sidebar.tsx** – Navigation latérale

```tsx
<Sidebar
  conversations={[]}
  currentConversationId={undefined}
  onNewConversation={() => setMessages([])}
  credits={10}
/>
```

**Caractéristiques** :

- Logo JurisBen avec badge "JB"
- Bouton "Nouvelle conversation" (bleu primaire)
- Liste scrollable des conversations
- Footer fixe avec crédits + actions

---

### 2. **MessageBubble.tsx** – Bulles de message

#### Message Utilisateur :

```
                              ┌────────────────────────┐
                              │ Quelle est la loi sur  │
                              │ la propriété foncière? │
                              └────────────────────────┘
                                         🔵 User (droite)
```

#### Message Assistant :

```
┌────────────────────────────────────────┐
│ Selon le Code foncier et domanial...   │
│                                         │
│ 📖 Sources juridiques (2)               │
│ ┌────────────────────────────────────┐ │
│ │ Article 45                          │ │
│ │ Code foncier et domanial            │ │
│ │ Pertinence: 92%                  ↗  │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
    ⚪️ Assistant (gauche)
```

---

### 3. **QueryInput.tsx** – Zone de saisie intelligente

**États** :

#### A. Vide (suggestions affichées) :

```
┌──────────────────────────────────────────────┐
│ ✨ Quelles sont les conditions pour obtenir  │
│    un titre foncier au Bénin ?               │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ ✨ Quels sont mes droits en cas de           │
│    licenciement abusif ?                      │
└──────────────────────────────────────────────┘

┌────────────────────────────────────┐
│  Posez votre question juridique... │ 📤
└────────────────────────────────────┘
```

#### B. En cours de saisie :

```
┌────────────────────────────────────┐
│  Comment divorcer selon le droit   │
│  béninois ?                        │ 📤 (bleu)
└────────────────────────────────────┘
```

#### C. Chargement :

```
┌────────────────────────────────────┐
│  Comment divorcer selon le droit   │
│  béninois ?                        │ ⏳ (spinner)
└────────────────────────────────────┘
```

---

### 4. **Button.tsx** – Bouton réutilisable

**Variants** :

| Variant     | Style                            | Usage               |
| ----------- | -------------------------------- | ------------------- |
| `primary`   | Bleu (bg-blue-600) + texte blanc | Actions principales |
| `secondary` | Gris clair (bg-slate-100)        | Actions secondaires |
| `ghost`     | Transparent + hover gris         | Navigation, menus   |
| `outline`   | Bordure + fond blanc             | Actions tertiaires  |

**Exemple** :

```tsx
<Button variant="primary" size="md" loading={isLoading}>
  Envoyer la question
</Button>
```

---

## 🎨 Design Tokens

### Couleurs

```css
/* Primaire */
blue-600   → #2563eb  (Boutons CTA, messages user)
blue-700   → #1d4ed8  (Hover)

/* Neutres */
slate-900  → #0f172a  (Titres)
slate-600  → #475569  (Textes secondaires)
slate-400  → #94a3b8  (Icônes désactivées)
slate-200  → #e2e8f0  (Bordures)
slate-50   → #f8fafc  (Fonds secondaires)
white      → #ffffff  (Fonds principal)

/* Accents */
blue-50    → #eff6ff  (Hover items sélectionnés)
```

### Espacements

```css
Gap entre messages  → space-y-6  (24px)
Padding conteneur   → p-6        (24px) ou p-8 (32px)
Gap éléments inline → gap-3      (12px) ou gap-4 (16px)
```

### Border Radius

```css
Petits éléments  → rounded-lg   (8px)
Cartes           → rounded-xl   (12px)
Messages         → rounded-2xl  (16px)
```

### Ombres

```css
Messages         → shadow-sm
Input focus      → shadow-lg + ring-2 ring-blue-500/20
Boutons actifs   → shadow-md hover:shadow-lg
```

---

## 📱 États de l'Interface

### 1. Écran de Bienvenue (Aucun message)

```
        ┌─────────────────────────────────┐
        │         🔷 JurisBen             │
        │  Bienvenue sur JurisBen         │
        │                                 │
        │  Votre assistant juridique...   │
        └─────────────────────────────────┘

   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
   │ 📜 Code │  │ 👔 Code │  │ ⚖️ Code │  │ 📰 Code │
   │ foncier │  │ travail │  │ pénal   │  │ info    │
   └─────────┘  └─────────┘  └─────────┘  └─────────┘

        4 suggestions de questions affichées
```

### 2. Écran de Conversation (Avec messages)

```
   ┌─────────────────────────────────────────┐
   │                                          │ ↑
   │  [Message User 1]                        │ │
   │                                          │ │
   │  [Réponse Assistant 1 + Sources]        │ │ Scroll
   │                                          │ │
   │  [Message User 2]                        │ │
   │                                          │ │
   │  ⚪️⚪️⚪️ (Loading...)                      │ ↓
   └─────────────────────────────────────────┘

   ┌─────────────────────────────────────────┐
   │  [Input toujours visible]               │
   └─────────────────────────────────────────┘
```

---

## ⚙️ Fonctionnalités Interactives

### Auto-resize du Textarea

Le champ de saisie s'adapte automatiquement au contenu :

- 1 ligne par défaut
- Maximum 8 lignes (puis scroll interne)
- Reset après envoi

### Suggestions Cliquables

Au premier chargement, 4 questions suggérées :

1. "Quelles sont les conditions pour obtenir un titre foncier au Bénin ?"
2. "Quels sont mes droits en cas de licenciement abusif ?"
3. "Comment fonctionne la procédure de divorce ?"
4. "Quelles sont les sanctions pour le vol ?"

Au clic → Remplissage automatique + envoi

### Articles Cliquables

Dans les réponses assistant, chaque article affiché :

- Affiche : numéro, titre de loi, pertinence %
- Au survol : changement de couleur (hover:bg-slate-100)
- Au clic : ouverture du texte complet (TODO)

### Raccourcis Clavier

- `Entrée` → Envoyer la question
- `Maj + Entrée` → Nouvelle ligne
- `Échap` → Annuler (TODO)

---

## 🔧 Utilitaires Créés

### `lib/utils.ts`

#### 1. **cn()** – Merge de classes

```tsx
import { cn } from "@/lib/utils";

<div className={cn("base-class", isActive && "active-class", className)} />;
```

#### 2. **formatDate()** – Formatage dates FR

```tsx
formatDate(new Date()) → "À l'instant"
formatDate(date_2h_ago) → "Il y a 2h"
formatDate(date_3j_ago) → "Il y a 3j"
formatDate(date_old) → "15 déc."
```

---

## 🚀 Intégration API

### Flux de données complet

```typescript
1. User tape une question
   ↓
2. handleSubmitQuery() appelé
   ↓
3. Ajout message user localement
   ↓
4. POST /api/rag/query avec { query: "..." }
   ↓
5. Backend :
   - Vérifie crédits
   - Recherche articles Neo4j (embeddings)
   - Génère réponse Groq LLM
   - Déduit 1 crédit
   ↓
6. Réception { response, articlesUsed, creditsRemaining }
   ↓
7. Ajout message assistant + mise à jour crédits UI
```

---

## ✅ Checklist d'Implémentation

### Composants UI

- [x] Sidebar avec navigation
- [x] MessageBubble (user + assistant)
- [x] QueryInput avec auto-resize
- [x] Button réutilisable
- [x] Écran de bienvenue
- [x] Liste de messages scrollable
- [x] Loader animé (3 points)

### Fonctionnalités

- [x] Envoi de questions
- [x] Affichage réponses + sources
- [x] Gestion crédits (affichage)
- [x] Suggestions au démarrage
- [x] Raccourcis clavier
- [ ] Historique conversations (backend prêt)
- [ ] Authentification UI
- [ ] Achat crédits Stripe (frontend)
- [ ] Mode sombre
- [ ] Responsive mobile

### Optimisations

- [x] Animations CSS custom
- [x] Transitions douces
- [ ] Lazy loading conversations
- [ ] Virtualisation liste messages
- [ ] Markdown rendering
- [ ] Copy button sur réponses

---

## 📸 Captures d'Écran

Les maquettes de référence se trouvent dans :

```
.github/template/
├── template_1.png
├── template_2.png
├── template_3.png
├── template_4.png
└── template_5.png
```

---

## 🎯 Prochaines Étapes

### Court terme (Sprint 1)

1. ✅ Créer composants UI de base
2. ✅ Intégrer API RAG
3. ⏳ Tester flow complet avec vraies données
4. ⏳ Ajouter gestion d'erreurs UI

### Moyen terme (Sprint 2)

5. ⏳ Implémenter authentification (NextAuth)
6. ⏳ Historique conversations en DB
7. ⏳ Achat crédits Stripe (UI)
8. ⏳ Mode responsive mobile

### Long terme (Sprint 3+)

9. ⏳ Mode sombre
10. ⏳ Markdown dans réponses
11. ⏳ Export PDF des conversations
12. ⏳ Partage de réponses

---

## 📚 Ressources

- **Design inspiration** : [Perplexity.ai](https://www.perplexity.ai/)
- **Composants** : [shadcn/ui](https://ui.shadcn.com/)
- **Icônes** : [Lucide React](https://lucide.dev/)
- **Documentation technique** : [.github/technic/architecture.md](.github/technic/architecture.md)

---

**Version** : 1.0.0  
**Dernière MAJ** : 12 janvier 2026  
**Statut** : ✅ UI de base opérationnelle
