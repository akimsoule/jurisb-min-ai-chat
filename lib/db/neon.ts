import { createClient } from "@neondatabase/neon-js";

/**
 * Client Neon officiel avec Data API (PostgREST)
 * Note: On utilise uniquement le Data API pour les requêtes de base de données.
 * L'authentification applicative (login/register) est gérée séparément avec JWT.
 */
export const neon = createClient({
  auth: {
    url:
      process.env.NEON_AUTH_URL ||
      process.env.NEON_DATA_API_URL!.replace("/rest/v1", "/auth"),
    // Pas de gestion d'auth utilisateur ici - uniquement pour la connexion à Neon
  },
  dataApi: {
    url: process.env.NEON_DATA_API_URL!,
  },
});

/**
 * Récupère un utilisateur par email
 */
export async function getUserByEmail(email: string) {
  const { data, error } = await neon
    .from("users")
    .select("id, email, password, name, credits, plan, createdAt, updatedAt")
    .eq("email", email)
    .single();

  if (error) {
    console.error("getUserByEmail error:", error);
    return null;
  }

  return data;
}

/**
 * Crée un nouvel utilisateur
 */
export async function createUser(
  email: string,
  hashedPassword: string,
  name: string
) {
  const { data, error } = await neon
    .from("users")
    .insert({
      email,
      password: hashedPassword,
      name,
      credits: 0,
      plan: "Gratuit",
    })
    .select("id, email, name, credits, plan")
    .single();

  if (error) {
    console.error("createUser error:", error);
    return null;
  }

  return data;
}

/**
 * Met à jour les crédits d'un utilisateur
 */
export async function updateUserCredits(userId: string, credits: number) {
  const { data, error } = await neon
    .from("users")
    .update({ credits })
    .eq("id", userId)
    .select("id, email, credits")
    .single();

  if (error) {
    console.error("updateUserCredits error:", error);
    return null;
  }

  return data;
}

/**
 * Récupère les informations complètes d'un utilisateur
 */
export async function getUserById(userId: string) {
  const { data, error } = await neon
    .from("users")
    .select("id, email, name, credits, plan, createdAt, updatedAt")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("getUserById error:", error);
    return null;
  }

  return data;
}
