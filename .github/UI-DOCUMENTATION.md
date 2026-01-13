# Interface Utilisateur JurisBen – Documentation

## Vue d'ensemble

L'interface utilisateur de JurisBen a été conçue avec une architecture modulaire s'inspirant explicitement du design de **Perplexity**, offrant une expérience épurée, professionnelle et centrée sur la lecture des réponses juridiques.

## Architecture des Composants

### 1. Composants UI de Base

#### **components/ui/Button.tsx**

Bouton réutilisable avec support de variants multiples :

- **Variants** : `primary`, `secondary`, `ghost`, `outline`
- **Tailles** : `sm`, `md`, `lg`
- **États** : loading, disabled
- **Utilisation** :

```tsx
<Button variant="primary" size="md" loading={isLoading}>
  Envoyer
</Button>
```

#### **lib/utils.ts**

Utilitaires pour le design système :

- `cn()` : Merge de classes Tailwind avec clsx + tailwind-merge
- `formatDate()` : Formatage de dates en français ("Il y a 2h", etc.)

### 2. Composants Métier

#### **components/Sidebar.tsx**

Barre latérale de navigation (288px de largeur) :

- **Header** : Logo JurisBen + bouton "Nouvelle conversation"
- **Liste de conversations** : Conversations récentes avec titre + aperçu
- **Footer** :
  - Affichage des crédits utilisateur
  - Bouton "Acheter des crédits"
  - Paramètres et Déconnexion

**Props** :

```tsx
interface SidebarProps {
  conversations?: Conversation[];
  currentConversationId?: string;
  onNewConversation?: () => void;
  onSelectConversation?: (id: string) => void;
  credits?: number;
}
```

#### **components/MessageBubble.tsx**

Bulles de message avec différenciation utilisateur/assistant :

- **Messages utilisateur** : Fond bleu (bg-blue-600), alignés à droite
- **Messages assistant** : Fond blanc avec bordure, alignés à gauche
- **Affichage des sources** : Section spéciale pour les articles juridiques cités
  - Icône livre
  - Titre de l'article
  - Titre de la loi
  - Score de pertinence (%)
  - Lien externe au clic

**Props** :

```tsx
interface MessageBubbleProps {
  type: "user" | "assistant";
  content: string;
  articles?: Article[];
  timestamp?: Date;
}
```

**Exemple de rendu d'article** :

```
📖 Sources juridiques (3)
┌─────────────────────────────────────────┐
│ Article 45                               │
│ Code foncier et domanial                 │
│ Pertinence: 92%                     ↗    │
└─────────────────────────────────────────┘
```

#### **components/QueryInput.tsx**

Zone de saisie sophistiquée avec suggestions :

- **Auto-resize** : Le textarea s'adapte au contenu (max 8 lignes)
- **Suggestions** : Affichage de questions suggérées au démarrage
- **États** : loading avec spinner, disabled
- **Raccourcis** :
  - `Entrée` → Envoyer
  - `Maj + Entrée` → Nouvelle ligne
- **Disclaimer** : Message juridique en bas d'écran

**Props** :

```tsx
interface QueryInputProps {
  onSubmit: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  suggestions?: string[];
}
```

### 3. Page Principale (app/page.tsx)

#### États de l'interface :

**A. Écran de bienvenue (messages.length === 0)** :

- Logo JurisBen centré
- Titre principal : "Bienvenue sur JurisBen"
- Grille de 4 cartes représentant les codes juridiques :
  - 📜 Code foncier
  - 👔 Code du travail
  - ⚖️ Code pénal
  - 📰 Code de l'information
- 4 suggestions de questions affichées en bas

**B. Écran de conversation (messages.length > 0)** :

- Liste des messages avec scroll
- Loader animé (3 points rebondissants) pendant l'attente
- Zone de saisie toujours visible en bas

#### Flux de données :

```typescript
const handleSubmitQuery = async (query: string) => {
  // 1. Ajouter message utilisateur
  setMessages([...messages, userMessage]);
  setIsLoading(true);

  // 2. Appeler API RAG
  const response = await fetch("/api/rag/query", {
    method: "POST",
    body: JSON.stringify({ query }),
  });

  // 3. Ajouter réponse assistant avec articles
  const data = await response.json();
  setMessages([...messages, assistantMessage]);

  // 4. Mettre à jour crédits
  setCredits(data.creditsRemaining);
};
```

## Design System

### Palette de couleurs

| Couleur          | Code Tailwind | Utilisation                |
| ---------------- | ------------- | -------------------------- |
| Bleu principal   | `blue-600`    | Boutons CTA, messages user |
| Bleu hover       | `blue-700`    | Hover états des boutons    |
| Slate foncé      | `slate-900`   | Titres, textes importants  |
| Slate moyen      | `slate-600`   | Textes secondaires         |
| Slate clair      | `slate-200`   | Bordures, séparateurs      |
| Slate très clair | `slate-50`    | Fonds secondaires          |
| Blanc            | `white`       | Fonds principal            |

### Typographie

- **Titres principaux** : `text-4xl font-bold`
- **Titres sections** : `text-lg font-semibold`
- **Texte corps** : `text-sm` ou `text-base`
- **Texte secondaire** : `text-xs text-slate-500`
- **Police** : Geist Sans (variable font)

### Espacements

- **Padding conteneur** : `p-6` ou `p-8`
- **Espacement vertical messages** : `space-y-6`
- **Gaps entre éléments** : `gap-3` ou `gap-4`
- **Border radius** :
  - Petits éléments : `rounded-lg` (8px)
  - Cartes : `rounded-xl` (12px)
  - Messages : `rounded-2xl` (16px)

### Ombres

- **Boutons actifs** : `shadow-md hover:shadow-lg`
- **Messages** : `shadow-sm`
- **Input focus** : `focus:ring-2 focus:ring-blue-500/20`

## Animations

### CSS Custom (app/globals.css)

```css
@layer utilities {
  .delay-100 {
    animation-delay: 100ms;
  }
  .delay-200 {
    animation-delay: 200ms;
  }

  /* Scrollbar styles */
  .scrollbar-thin {
    scrollbar-width: thin;
  }
  .scrollbar-thumb-slate-300 {
    scrollbar-color: rgb(203 213 225) transparent;
  }
}
```

### Animations Tailwind utilisées

- `animate-bounce` : Loader (3 points)
- `animate-spin` : Spinner des boutons
- `transition-colors` : Transitions douces
- `transition-all` : Transitions complètes
- `hover:*` : États de survol

## Responsive Design

| Breakpoint       | Tailwind | Adaptations                         |
| ---------------- | -------- | ----------------------------------- |
| Mobile (< 768)   | (défaut) | Sidebar rétractable (à implémenter) |
| Tablet (≥ 768)   | `md:`    | Grille 2 colonnes pour suggestions  |
| Desktop (≥ 1024) | `lg:`    | Sidebar fixe, max-width conteneur   |

## Accessibilité

✅ **Implémenté** :

- Boutons avec états disabled
- Focus visible sur inputs (`focus:ring-2`)
- Contraste texte conforme WCAG AA
- Alt text sur icônes (via lucide-react)

⏳ **À implémenter** :

- Navigation clavier complète
- ARIA labels sur composants interactifs
- Annonce screen reader des nouveaux messages

## Intégration API

### Endpoint principal : `/api/rag/query`

**Request** :

```json
{
  "query": "Quelles sont les conditions pour obtenir un titre foncier ?"
}
```

**Response** :

```json
{
  "response": "...",
  "articlesUsed": [
    {
      "titre_loi": "Code foncier et domanial",
      "numero_article": "45",
      "similarity": 0.92
    }
  ],
  "creditsRemaining": 9
}
```

## État de l'Implémentation

| Composant          | État | Notes                                 |
| ------------------ | ---- | ------------------------------------- |
| Sidebar            | ✅   | Prêt, liste conversations à connecter |
| MessageBubble      | ✅   | Complet avec affichage sources        |
| QueryInput         | ✅   | Auto-resize, suggestions, raccourcis  |
| Button             | ✅   | Tous variants implémentés             |
| Page principale    | ✅   | États bienvenue + conversation        |
| Intégration API    | ✅   | Connecté à `/api/rag/query`           |
| Système de crédits | ⏳   | Affichage OK, achat Stripe à tester   |
| Authentification   | ⏳   | NextAuth configuré, UI à créer        |
| Historique convos  | ⏳   | Backend prêt, UI à connecter          |
| Responsive mobile  | ⏳   | Sidebar rétractable à ajouter         |

## Prochaines Étapes

1. **Persistance des conversations** :

   - Sauvegarder messages en DB (PostgreSQL)
   - Charger historique au démarrage
   - Implémenter recherche dans conversations

2. **Authentification** :

   - Page de login/signup
   - Intégration NextAuth dans Sidebar
   - Protection routes avec middleware

3. **Amélioration UX** :

   - Mode sombre (toggle dans settings)
   - Sidebar rétractable sur mobile
   - Markdown rendering dans messages (bold, italics, listes)
   - Copier le contenu des réponses

4. **Optimisations** :
   - Lazy loading des conversations anciennes
   - Virtualisation de la liste de messages (react-window)
   - Debounce de la saisie pour auto-save drafts

## Commandes Utiles

```bash
# Développement
npm run dev           # Lancer serveur dev (http://localhost:3000)

# Build
npm run build         # Build production
npm start            # Lancer serveur production

# Linter & Format
npm run lint         # ESLint
npm run format       # Prettier (à configurer)

# Tests (à ajouter)
npm test             # Jest + React Testing Library
npm run test:e2e     # Playwright
```

## Références Design

- **Inspiration principale** : Perplexity (interface épurée, hiérarchie claire)
- **Composants UI** : shadcn/ui philosophy (copy-paste, customizable)
- **Icônes** : lucide-react
- **Animations** : Tailwind CSS native

---

**Dernière mise à jour** : 12 janvier 2026  
**Version** : 1.0.0  
**Auteur** : GitHub Copilot
