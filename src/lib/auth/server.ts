"use server";

import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import * as bcrypt from "bcryptjs";
import { getUserByEmail, createUser } from "@/lib/db/neon";
import {
  AUTH_ERRORS,
  validateEmail,
  validatePassword,
} from "@/lib/auth/errors";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key"
);

interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    credits: number;
    plan: string;
  };
  error?: string;
  code?: string;
}

/**
 * Crée un token JWT signé
 */
async function createToken(userId: string, email: string) {
  const token = await new SignJWT({ userId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  return token;
}

/**
 * Vérifie et décrypte un token JWT
 */
export async function verifyToken(token: string) {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as { userId: string; email: string };
  } catch {
    return null;
  }
}

/**
 * Récupère la session utilisateur actuellement authentifiée
 */
export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return null;

  const payload = await verifyToken(token);
  return payload;
}

/**
 * Se connecter avec email et mot de passe
 */
export async function login(
  email: string,
  password: string
): Promise<AuthResult> {
  // Valide les champs
  if (!email || !password) {
    return {
      success: false,
      error: AUTH_ERRORS.MISSING_FIELDS.clientMessage,
      code: AUTH_ERRORS.MISSING_FIELDS.code,
    };
  }

  // Valide le format email
  if (!validateEmail(email)) {
    return {
      success: false,
      error: AUTH_ERRORS.INVALID_EMAIL.clientMessage,
      code: AUTH_ERRORS.INVALID_EMAIL.code,
    };
  }

  // Récupère l'utilisateur
  const user = await getUserByEmail(email);

  // Ne pas révéler si l'email existe ou non
  if (!user) {
    console.error("[LOGIN] User not found:", { email });
    return {
      success: false,
      error: AUTH_ERRORS.INVALID_CREDENTIALS.clientMessage,
      code: AUTH_ERRORS.INVALID_CREDENTIALS.code,
    };
  }

  // Vérifie le mot de passe
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    console.error("[LOGIN] Invalid password:", { email });
    return {
      success: false,
      error: AUTH_ERRORS.INVALID_CREDENTIALS.clientMessage,
      code: AUTH_ERRORS.INVALID_CREDENTIALS.code,
    };
  }

  try {
    // Crée un token JWT
    const token = await createToken(user.id, user.email);

    // Enregistre le token dans un cookie HTTP-only
    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 jours
    });

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        credits: user.credits,
        plan: user.plan,
      },
    };
  } catch (error) {
    console.error("[LOGIN] Error creating token or setting cookie:", error);
    return {
      success: false,
      error: AUTH_ERRORS.GENERIC_ERROR.clientMessage,
      code: AUTH_ERRORS.GENERIC_ERROR.code,
    };
  }
}

/**
 * S'inscrire avec email, mot de passe et nom
 */
export async function register(
  email: string,
  password: string,
  name: string
): Promise<AuthResult> {
  // Valide les données
  if (!email || !password || !name) {
    return {
      success: false,
      error: AUTH_ERRORS.MISSING_FIELDS.clientMessage,
      code: AUTH_ERRORS.MISSING_FIELDS.code,
    };
  }

  // Valide le format email
  if (!validateEmail(email)) {
    return {
      success: false,
      error: AUTH_ERRORS.INVALID_EMAIL.clientMessage,
      code: AUTH_ERRORS.INVALID_EMAIL.code,
    };
  }

  // Valide le mot de passe
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return {
      success: false,
      error:
        passwordValidation.error ||
        AUTH_ERRORS.PASSWORD_TOO_SHORT.clientMessage,
      code: AUTH_ERRORS.PASSWORD_TOO_SHORT.code,
    };
  }

  // Vérifie si l'utilisateur existe déjà
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    console.error("[REGISTER] Email already exists:", { email });
    return {
      success: false,
      error: AUTH_ERRORS.EMAIL_ALREADY_EXISTS.clientMessage,
      code: AUTH_ERRORS.EMAIL_ALREADY_EXISTS.code,
    };
  }

  try {
    // Hash le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crée l'utilisateur
    const user = await createUser(email, hashedPassword, name);
    if (!user) {
      console.error("[REGISTER] Failed to create user:", { email });
      return {
        success: false,
        error: AUTH_ERRORS.GENERIC_ERROR.clientMessage,
        code: AUTH_ERRORS.GENERIC_ERROR.code,
      };
    }

    // Crée un token JWT
    const token = await createToken(user.id, user.email);

    // Enregistre le token dans un cookie HTTP-only
    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 jours
    });

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        credits: user.credits,
        plan: user.plan,
      },
    };
  } catch (error) {
    console.error("[REGISTER] Unexpected error:", error);
    return {
      success: false,
      error: AUTH_ERRORS.GENERIC_ERROR.clientMessage,
      code: AUTH_ERRORS.GENERIC_ERROR.code,
    };
  }
}

/**
 * Se déconnecter
 */
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  return { success: true };
}

/**
 * Rafraîchit la session si nécessaire
 */
export async function refreshSession() {
  const session = await getSession();
  return session;
}
