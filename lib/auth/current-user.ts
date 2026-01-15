"use server";

import { getSession } from "@/lib/auth/server";
import { getUserById } from "@/lib/db/neon";

/**
 * Récupère l'utilisateur actuellement authentifié
 */
export async function getCurrentUser() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const user = await getUserById(session.userId);
  return user;
}
