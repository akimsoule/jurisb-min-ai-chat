# JurisBénin - SaaS Juridique Béninois

Un assistant juridique intelligent spécialisé dans le droit béninois, utilisant l'IA pour fournir des réponses fiables et traçables basées sur les textes de loi.

## 🚀 Démarrage rapide

### Prérequis
- Node.js 18+
- PostgreSQL (Neon recommandé)
- Neo4j (AuraDB recommandé)
- Comptes API : Groq, HuggingFace, Stripe

### Installation

1. **Cloner le repository**
   ```bash
   git clone https://github.com/akimsoule/jurisb-min-ai-chat.git
   cd jurisb-min-ai-chat
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configuration des variables d'environnement**

   Copier le fichier d'exemple :
   ```bash
   cp .env.example .env.local
   ```

   Remplir `.env.local` avec vos clés API et configurations de développement.

4. **Configuration de la base de données**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```

   Ouvrir [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration des environnements

### Fichiers d'environnement

- **`.env.local`** - Variables pour le développement local
- **`.env.production`** - Variables pour la production (Vercel)
- **`.env.example`** - Template avec toutes les variables nécessaires

### Variables importantes

#### Base de données
```env
DATABASE_URL="postgresql://..."  # PostgreSQL (Neon)
NEO4J_URI="neo4j+s://..."       # Neo4j (AuraDB)
```

#### APIs IA
```env
GROQ_API_KEY="gsk_..."          # Groq API
HUGGINGFACE_API_KEY="hf_..."    # HuggingFace API
```

#### Authentification & Paiement
```env
JWT_SECRET="your-secret"        # Secret JWT
NEXTAUTH_URL="http://localhost:3000"  # URL NextAuth
STRIPE_SECRET_KEY="sk_test_..." # Stripe (test en dev)
```

## 🏗️ Architecture

### Technologies
- **Frontend** : Next.js 16, React 19, TypeScript
- **Styling** : Tailwind CSS, DaisyUI, shadcn/ui
- **Base de données** : PostgreSQL (Neon) + Neo4j (Graphe)
- **IA** : Groq, Mastra Framework
- **Paiement** : Stripe
- **Déploiement** : Vercel

### Structure du projet
```
src/
├── app/              # Next.js App Router
├── components/       # Composants React
│   ├── ai-elements/  # Composants UI IA (réserve)
│   ├── auth/         # Authentification
│   ├── chat/         # Interface de chat
│   └── ui/           # Composants de base
├── lib/              # Utilitaires et services
│   ├── services/     # APIs externes
│   ├── db/          # Connexions BD
│   └── security/    # Authentification
└── mastra/          # Configuration Mastra
    ├── agents/      # Agents IA
    ├── database/    # Config Neo4j
    └── tools/       # Outils IA
```

## 📜 Scripts disponibles

```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run start        # Serveur de production
npm run lint         # Vérification ESLint
```

## 🚀 Déploiement

### Vercel (Recommandé)

1. **Connecter le repository** sur Vercel
2. **Variables d'environnement** : Copier le contenu de `.env.production` dans les variables Vercel
3. **Build & Deploy** : Vercel gère automatiquement le déploiement

### Variables de production

Toutes les variables sensibles doivent être configurées dans :
- **Vercel Dashboard** > Project Settings > Environment Variables
- **OU** fichier `.env.production` (non commité)

## 🔒 Sécurité

- ✅ **Rate limiting** : Protection contre les abus
- ✅ **Variables d'environnement** : Séparées par environnement
- ✅ **Authentification JWT** : Sécurisée
- ✅ **Validation des entrées** : Protection XSS/CSRF
- ✅ **Clés API** : Jamais commitées (fichiers `.env*` ignorés)

## 📚 API Routes

- `POST /api/ask` - Questions juridiques (RAG)
- `POST /api/chat` - Chat en streaming (Mastra)
- `POST /api/auth/*` - Authentification
- `POST /api/checkout` - Paiements Stripe
- `POST /api/webhooks/stripe` - Webhooks Stripe

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/amazing-feature`)
3. Commit les changements (`git commit -m 'Add amazing feature'`)
4. Push la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.

## 📞 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Contacter l'équipe de développement
