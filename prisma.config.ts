// Prisma v5+ Configuration
// DATABASE_URL doit être défini dans .env.local
// Prisma lit automatiquement la config depuis ce fichier

const config = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
};

export default config;
