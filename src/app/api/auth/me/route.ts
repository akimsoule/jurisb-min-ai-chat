import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";
import { getUserById } from "@/lib/db/neon";
import { AUTH_ERRORS } from "@/lib/auth/errors";

/**
 * GET /api/auth/me
 * Récupère les informations de l'utilisateur actuellement authentifié
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: AUTH_ERRORS.UNAUTHORIZED.clientMessage },
        { status: 401 }
      );
    }

    const user = await getUserById(session.userId);

    if (!user) {
      return NextResponse.json(
        { error: AUTH_ERRORS.SESSION_INVALID.clientMessage },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Erreur API /auth/me:", error);
    return NextResponse.json(
      { error: AUTH_ERRORS.GENERIC_ERROR.clientMessage },
      { status: 500 }
    );
  }
}
