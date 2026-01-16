import { defineConfig } from "prisma/config";
import { loadEnvConfig } from "@next/env";

// Charge les variables d'environnement depuis la racine du projet
// Cela inclut .env, .env.local, .env.development, etc.
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Utilise maintenant la variable chargée depuis .env.local
    url: process.env.DATABASE_URL,
  },
});
