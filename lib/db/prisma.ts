import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL est manquant dans .env.local");
}

const prismaClientSingleton = () => {
  let adapter;

  // Détection de l'environnement (Local vs Neon)
  const isLocal =
    connectionString.includes("localhost") ||
    connectionString.includes("127.0.0.1");

  if (isLocal) {
    const pool = new Pool({ connectionString });
    adapter = new PrismaPg(pool);
  } else {
    // L'adaptateur demande désormais obligatoirement les options de formatage
    adapter = new PrismaNeonHttp(connectionString, {
      arrayMode: true,
      fullResults: true,
    });
  }

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? [
            // "query",
            "error",
            // "warn",
          ]
        : ["error"],
  });
};

// Singleton pour Next.js
declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
