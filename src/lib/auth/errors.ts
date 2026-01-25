/**
 * Erreurs standardisées pour la sécurité
 * Les messages ne révèlent pas d'informations sensibles
 */

// Messages d'erreur standardisés (safe pour le client)
export const AUTH_ERRORS = {
  // Login
  INVALID_CREDENTIALS: {
    code: "INVALID_CREDENTIALS",
    clientMessage: "Email ou mot de passe incorrect",
    serverMessage: "Invalid email or password",
  },

  // Register
  EMAIL_ALREADY_EXISTS: {
    code: "EMAIL_ALREADY_EXISTS",
    clientMessage: "Cet email est déjà enregistré",
    serverMessage: "Email already registered",
  },

  PASSWORD_TOO_SHORT: {
    code: "PASSWORD_TOO_SHORT",
    clientMessage: "Le mot de passe doit contenir au moins 8 caractères",
    serverMessage: "Password too short",
  },

  MISSING_FIELDS: {
    code: "MISSING_FIELDS",
    clientMessage: "Tous les champs sont requis",
    serverMessage: "Missing required fields",
  },

  INVALID_EMAIL: {
    code: "INVALID_EMAIL",
    clientMessage: "Adresse email invalide",
    serverMessage: "Invalid email format",
  },

  // General
  GENERIC_ERROR: {
    code: "GENERIC_ERROR",
    clientMessage: "Une erreur s'est produite. Veuillez réessayer.",
    serverMessage: "An error occurred",
  },

  SESSION_INVALID: {
    code: "SESSION_INVALID",
    clientMessage: "Votre session a expiré. Veuillez vous reconnecter.",
    serverMessage: "Session invalid or expired",
  },

  UNAUTHORIZED: {
    code: "UNAUTHORIZED",
    clientMessage: "Vous n'êtes pas autorisé à accéder à cette ressource",
    serverMessage: "Unauthorized access",
  },
};

/**
 * Valide le format d'un email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valide le mot de passe
 */
export function validatePassword(password: string): {
  valid: boolean;
  error?: string;
} {
  if (!password) {
    return { valid: false, error: AUTH_ERRORS.MISSING_FIELDS.clientMessage };
  }

  if (password.length < 8) {
    return {
      valid: false,
      error: AUTH_ERRORS.PASSWORD_TOO_SHORT.clientMessage,
    };
  }

  return { valid: true };
}
