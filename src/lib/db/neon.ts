import prisma from "./prisma";

/**
 * Récupère un utilisateur par email
 */
export async function getUserByEmail(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return user;
  } catch (error) {
    console.error("getUserByEmail error:", error);
    return null;
  }
}

/**
 * Crée un nouvel utilisateur
 */
export async function createUser(
  email: string,
  hashedPassword: string,
  name: string
) {
  try {
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        credits: 0,
        plan: "Gratuit",
      },
    });
    return user;
  } catch (error) {
    console.error("createUser error:", error);
    return null;
  }
}

/**
 * Récupère les informations complètes d'un utilisateur
 */
export async function getUserById(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    return user;
  } catch (error) {
    console.error("getUserById error:", error);
    return null;
  }
}

/**
 * Met à jour les crédits d'un utilisateur
 */
export async function updateUserCredits(userId: string, credits: number) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { credits },
    });
    return user;
  } catch (error) {
    console.error("updateUserCredits error:", error);
    return null;
  }
}

/**
 * Ajoute des crédits à un utilisateur (transaction atomique)
 */
export async function addUserCredits(userId: string, amount: number) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          increment: amount,
        },
      },
    });
    return user;
  } catch (error) {
    console.error("addUserCredits error:", error);
    return null;
  }
}

/**
 * Enregistre un événement Stripe traité (pour l'idempotence)
 */
export async function recordStripeEvent(
  eventId: string,
  type: string,
  userId: string,
  amount: number,
  credits: number
) {
  try {
    const event = await prisma.stripeEvent.create({
      data: {
        eventId,
        type,
        userId,
        amount,
        credits,
        status: "completed",
      },
    });
    return event;
  } catch (error) {
    console.error("recordStripeEvent error:", error);
    return null;
  }
}

/**
 * Vérifie si un événement Stripe a déjà été traité
 */
export async function getStripeEvent(eventId: string) {
  try {
    const event = await prisma.stripeEvent.findUnique({
      where: { eventId },
    });
    return event;
  } catch (error) {
    console.error("getStripeEvent error:", error);
    return null;
  }
}
