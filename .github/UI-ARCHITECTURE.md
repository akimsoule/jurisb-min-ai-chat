# 🏗️ Architecture UI – Diagramme de Composants

## Vue d'Ensemble du Système UI

```
┌─────────────────────────────────────────────────────────────────────┐
│                         JurisBen UI Stack                            │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Next.js    │  │  React 19    │  │  Tailwind    │              │
│  │   16.1.1     │  │  Server/     │  │  CSS 4       │              │
│  │  App Router  │  │  Client      │  │  Utility-    │              │
│  │              │  │  Components  │  │  first       │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Arbre de Composants

```
app/page.tsx (Client Component)
│
├── 📊 État Local (useState)
│   ├── messages: Message[]
│   ├── isLoading: boolean
│   └── credits: number
│
├── 🎨 UI Components
│   │
│   ├── <Sidebar />
│   │   ├── Header
│   │   │   ├── Logo JurisBen
│   │   │   └── Bouton "Nouvelle conversation"
│   │   │
│   │   ├── Conversations List
│   │   │   └── {conversations.map(conv => ConversationItem)}
│   │   │
│   │   └── Footer
│   │       ├── Credits Display
│   │       ├── Bouton "Acheter crédits"
│   │       ├── Bouton "Paramètres"
│   │       └── Bouton "Déconnexion"
│   │
│   ├── Main Content Area
│   │   │
│   │   ├── {messages.length === 0 ? (
│   │   │    // Écran de Bienvenue
│   │   │    <>
│   │   │      <Logo Central />
│   │   │      <Titre Principal />
│   │   │      <Grille Codes Juridiques>
│   │   │        ├── Carte Code Foncier
│   │   │        ├── Carte Code Travail
│   │   │        ├── Carte Code Pénal
│   │   │        └── Carte Code Information
│   │   │      </Grille>
│   │   │    </>
│   │   │   ) : (
│   │   │    // Écran Conversation
│   │   │    <Messages Container>
│   │   │      {messages.map(msg => (
│   │   │        <MessageBubble
│   │   │          type={msg.type}
│   │   │          content={msg.content}
│   │   │          articles={msg.articles}
│   │   │          timestamp={msg.timestamp}
│   │   │        />
│   │   │      ))}
│   │   │
│   │   │      {isLoading && <Loader />}
│   │   │    </Messages Container>
│   │   │   )}
│   │   │
│   │   └── <QueryInput
│   │         onSubmit={handleSubmitQuery}
│   │         isLoading={isLoading}
│   │         suggestions={messages.length === 0 ? suggestions : []}
│   │       />
│   │
│   └── 🔧 Composants Utilitaires
│       ├── <Button />
│       └── utils: cn(), formatDate()
│
└── 🔌 Intégrations API
    └── POST /api/rag/query
```

---

## Flux de Données (Data Flow)

```
┌──────────────┐
│     User     │
└──────┬───────┘
       │ 1. Tape question
       ↓
┌──────────────────────┐
│   QueryInput.tsx     │
│                      │
│  [Textarea]  📤      │
└──────┬───────────────┘
       │ 2. onSubmit(query)
       ↓
┌──────────────────────────────────┐
│         app/page.tsx             │
│                                  │
│  handleSubmitQuery(query) {      │
│    1. setMessages([...old, user])│ ← Local State Update
│    2. setIsLoading(true)         │
│    3. fetch("/api/rag/query")    │ ← API Call
│    4. setMessages([...old, ai])  │ ← Response Update
│    5. setCredits(newBalance)     │ ← Credits Update
│    6. setIsLoading(false)        │
│  }                               │
└──────┬───────────────────────────┘
       │ 3. Re-render avec nouveaux messages
       ↓
┌──────────────────────┐
│  MessageBubble.tsx   │
│                      │
│  {messages.map(msg =>│
│    <Bubble />        │
│  )}                  │
└──────────────────────┘
       │
       ↓
┌──────────────────────┐
│   User voit réponse  │
│   + sources          │
└──────────────────────┘
```

---

## Communication API (Sequence Diagram)

```
User          QueryInput       page.tsx        API(/api/rag/query)      Neo4j       Groq
 │                │                │                    │                 │           │
 │ Tape question  │                │                    │                 │           │
 ├───────────────>│                │                    │                 │           │
 │                │ onSubmit()     │                    │                 │           │
 │                ├───────────────>│                    │                 │           │
 │                │                │ POST /api/rag/query│                 │           │
 │                │                ├───────────────────>│                 │           │
 │                │                │                    │ Embedding Search│           │
 │                │                │                    ├────────────────>│           │
 │                │                │                    │<────────────────┤           │
 │                │                │                    │ Articles (Top 5)│           │
 │                │                │                    │                 │           │
 │                │                │                    │ Generate Response           │
 │                │                │                    ├────────────────────────────>│
 │                │                │                    │<────────────────────────────┤
 │                │                │                    │ Response Text               │
 │                │                │                    │                 │           │
 │                │                │                    │ Deduct Credit   │           │
 │                │                │                    │ (DB Transaction)│           │
 │                │                │<───────────────────┤                 │           │
 │                │                │ { response,        │                 │           │
 │                │                │   articlesUsed,    │                 │           │
 │                │                │   creditsRemaining}│                 │           │
 │                │                │                    │                 │           │
 │                │<───────────────┤                    │                 │           │
 │                │ setState()     │                    │                 │           │
 │<───────────────┤                │                    │                 │           │
 │ Affiche réponse│                │                    │                 │           │
 │ + sources      │                │                    │                 │           │
```

---

## Structure de Données (Types)

### Message Interface

```typescript
interface Message {
  id: string; // Unique ID (timestamp)
  type: "user" | "assistant";
  content: string; // Question ou réponse
  articles?: Article[]; // Sources (seulement assistant)
  timestamp: Date;
}
```

### Article Interface

```typescript
interface Article {
  titre_loi: string; // Ex: "Code foncier et domanial"
  numero_article: string; // Ex: "45"
  similarity?: number; // Score 0-1 (ex: 0.92)
}
```

### Conversation Interface

```typescript
interface Conversation {
  id: string;
  title: string; // Auto-généré ou 1ère question
  lastMessage: string; // Aperçu
  timestamp: Date;
}
```

---

## États de l'Application (State Machine)

```
┌─────────────────┐
│  Initial State  │
│  messages: []   │
│  isLoading: false│
│  credits: 10     │
└────────┬────────┘
         │
         │ User pose question
         ↓
┌─────────────────┐
│  Loading State  │
│  messages: [user]│
│  isLoading: true │
│  credits: 10     │
└────────┬────────┘
         │
         │ API response OK
         ↓
┌─────────────────┐
│ Response State  │
│ messages: [user,│
│           ai]   │
│ isLoading: false│
│ credits: 9      │
└────────┬────────┘
         │
         │ User pose autre question
         ↓
      (loop)

         │ API response ERROR
         ↓
┌─────────────────┐
│   Error State   │
│  messages: [user│
│           error]│
│  isLoading: false│
│  credits: 10    │ (non déduits)
└─────────────────┘
```

---

## Hiérarchie CSS (Tailwind)

### Layout Principal

```css
.flex.h-screen.bg-slate-50
  ├──
  aside.w-72
  (Sidebar)
  │
  ├──
  .p-6.border-b
  (Header)
  │
  ├──
  .flex-1.overflow-y-auto
  (Conversations)
  │
  └──
  .p-4.border-t
  (Footer)
  │
  └──
  .flex-1.flex.flex-col
  (Main)
  ├──
  main.flex-1.overflow-y-auto
  │
  ├──
  .h-full
  (Welcome Screen)
  │
  └──
  .max-w-4xl.mx-auto.py-8.space-y-6
  (Messages)
  │
  └──
  .border-t.bg-white.p-6
  (Input Area);
```

### MessageBubble Styles

```css
User Message:
.bg-blue-600.text-white.rounded-2xl.px-5.py-4.shadow-sm

Assistant Message:
.bg-white.border.border-slate-200.rounded-2xl.px-5.py-4.shadow-sm
├── .prose.prose-sm (Content)
└── .mt-4.pt-4.border-t (Sources Section)
    └── .space-y-2
        └── .p-2.5.bg-slate-50.rounded-lg.hover:bg-slate-100 (Article)
```

### QueryInput Styles

```css
form.relative
└── .flex.items-end.gap-3.p-2.bg-white.border.rounded-2xl
    ├── textarea.flex-1.px-3.py-2.5 (auto-resize)
    └── button.w-10.h-10.rounded-xl (Submit)
        ├── .bg-blue-600 (active)
        └── .bg-slate-100 (disabled)
```

---

## Animations & Transitions

### Loader (3 points rebondissants)

```css
.flex.gap-2
  ├──
  .w-2.h-2.bg-slate-400.rounded-full.animate-bounce
  ├──
  .w-2.h-2.bg-slate-400.rounded-full.animate-bounce.delay-100
  └──
  .w-2.h-2.bg-slate-400.rounded-full.animate-bounce.delay-200;
```

### Button Loading Spinner

```html
<span className="animate-spin">
  <svg>
    <circle />
    <!-- rotation 360deg -->
    <path />
  </svg>
</span>
```

### Transitions

```css
/* Hover states */
.transition-colors    → 150ms color change
.transition-all       → 150ms all properties

/* Delays custom */
.delay-100 {
  animation-delay: 100ms;
}
.delay-200 {
  animation-delay: 200ms;
}
```

---

## Responsive Breakpoints (TODO)

```
Mobile (< 768px)
├── Sidebar: Overlay avec hamburger menu
├── Messages: Full width
└── Input: Full width, single column

Tablet (768px - 1024px)
├── Sidebar: Rétractable (icône toggle)
├── Messages: max-w-2xl
└── Input: 2 colonnes pour suggestions

Desktop (> 1024px)
├── Sidebar: Fixe 288px
├── Messages: max-w-4xl
└── Input: 4 colonnes pour suggestions
```

---

## Arborescence Fichiers Complète

```
jurisb-min-ai-chat/
│
├── app/
│   ├── layout.tsx                    (Root layout avec fonts)
│   ├── page.tsx                      ✨ Refonte (200 lignes)
│   ├── globals.css                   ✨ Modifié (animations)
│   │
│   ├── api/
│   │   ├── rag/query/route.ts        (RAG endpoint)
│   │   ├── webhooks/stripe/route.ts  (Stripe idempotence)
│   │   └── credits/
│   │       ├── balance/route.ts
│   │       └── purchase/route.ts
│   │
│   └── purchase/
│       ├── success/page.tsx
│       └── cancel/page.tsx
│
├── components/
│   ├── Sidebar.tsx                   ✨ Nouveau (185 lignes)
│   ├── MessageBubble.tsx             ✨ Nouveau (115 lignes)
│   ├── QueryInput.tsx                ✨ Nouveau (145 lignes)
│   ├── ChatInterface.tsx             (ancien, non utilisé)
│   │
│   └── ui/
│       └── Button.tsx                ✨ Nouveau (68 lignes)
│
├── lib/
│   ├── utils.ts                      ✨ Nouveau (cn, formatDate)
│   ├── db.ts                         (Prisma client)
│   ├── neo4j.ts                      (Neo4j driver + search)
│   ├── groq.ts                       (LLM integration)
│   ├── stripe.ts                     (Stripe SDK)
│   ├── credits.ts                    (ACID transactions)
│   └── middleware.ts                 (Auth + Credits check)
│
├── prisma/
│   └── schema.prisma                 (User, Events, Transactions)
│
├── .github/
│   ├── copilot-instructions.md       (Project rules)
│   ├── UI-DOCUMENTATION.md           ✨ Nouveau (doc technique)
│   ├── UI-GUIDE.md                   ✨ Nouveau (guide visuel)
│   ├── UI-IMPLEMENTATION-SUMMARY.md  ✨ Nouveau (résumé)
│   │
│   ├── template/                     (5 PNG mockups)
│   │   ├── template_1.png
│   │   ├── template_2.png
│   │   ├── template_3.png
│   │   ├── template_4.png
│   │   └── template_5.png
│   │
│   └── technic/
│       ├── bd.md                     (Modèle logique données)
│       ├── rag-flow.md               (Pipeline RAG)
│       └── architecture.md           (Architecture)
│
├── CHANGELOG.md                      ✨ Nouveau (versions)
├── TODO.md                           ✨ Nouveau (roadmap)
├── README.md                         (Doc principale)
├── DEPLOYMENT.md                     (Guide déploiement)
├── package.json
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
└── .env.local                        (Git ignored)
```

---

## Performance & Optimisations

### Actuelles

- ✅ Server Components par défaut (Next.js)
- ✅ Client Components uniquement où nécessaire (`"use client"`)
- ✅ Turbopack pour build rapide
- ✅ CSS optimisé (Tailwind purge automatique)
- ✅ Images optimisées (Next/Image - non utilisé encore)

### À Implémenter

- ⏳ Lazy loading conversations anciennes
- ⏳ Virtualisation liste messages (react-window)
- ⏳ Debounce auto-save drafts
- ⏳ Service Worker pour offline mode
- ⏳ Code splitting routes

---

## Sécurité UI

### Implémenté

- ✅ Aucune logique métier côté client
- ✅ Validation inputs (max-length, required)
- ✅ Protection XSS (React escape automatique)
- ✅ CORS configuré (Next.js)
- ✅ Pas de secrets en code

### À Ajouter

- ⏳ Rate limiting UI (disable après X requêtes)
- ⏳ CSRF tokens (NextAuth)
- ⏳ Content Security Policy headers
- ⏳ Sanitization Markdown (si implémenté)

---

## Accessibilité (WCAG AA)

### Conformité Actuelle

- ✅ Contraste texte/fond > 4.5:1
- ✅ Focus visible sur inputs
- ✅ Alt text icônes (lucide-react)
- ✅ États disabled visuellement distincts

### À Améliorer

- ⏳ Navigation clavier complète (Tab, Entrée, Échap)
- ⏳ ARIA labels sur composants interactifs
- ⏳ Annonces screen reader (nouveaux messages)
- ⏳ Skip links ("Aller au contenu")
- ⏳ Focus trap dans modals

---

## Internationalisation (i18n)

### Actuel

- Français uniquement (droit béninois)
- Dates formatées en FR (`formatDate()`)
- Textes hardcodés en français

### Futur (si expansion)

- ⏳ Next-intl ou react-i18next
- ⏳ Support anglais (interface)
- ⏳ Contenu juridique reste en français

---

## Métriques de Performance Cibles

| Métrique               | Cible      | Actuel | Statut |
| ---------------------- | ---------- | ------ | ------ |
| First Contentful Paint | < 1.5s     | TBD    | ⏳     |
| Time to Interactive    | < 3s       | TBD    | ⏳     |
| Lighthouse Score       | > 90       | TBD    | ⏳     |
| Bundle Size (JS)       | < 200KB    | TBD    | ⏳     |
| API Response Time      | < 3s (P95) | TBD    | ⏳     |

---

**Document généré le** : 12 janvier 2026  
**Version** : 1.0.0  
**Type** : Diagramme d'architecture UI
