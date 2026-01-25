import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/credits
 * Endpoint pour vérifier et gérer les crédits de l'utilisateur
 *
 * Requête:
 * {
 *   "action": "check" | "consume"
 * }
 *
 * Réponse:
 * {
 *   "credits": 100,
 *   "monthly_usage": 45
 * }
 */
export async function GET(req: NextRequest) {
  try {
    // TODO: Récupérer les crédits depuis PostgreSQL
    // TODO: Vérifier l'authentification

    return NextResponse.json(
      {
        credits: 100,
        monthly_usage: 45,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in /api/credits:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json();

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      );
    }

    // TODO: Gérer les actions sur les crédits

    return NextResponse.json(
      {
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in /api/credits:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
