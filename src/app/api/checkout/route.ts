import { NextRequest, NextResponse } from "next/server";
import { Stripe } from "stripe";
import { getSession } from "@/lib/auth/server";
import { AUTH_ERRORS } from "@/lib/auth/errors";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-12-15.clover",
});

/**
 * POST /api/checkout
 * Endpoint pour créer une session de checkout Stripe
 *
 * Requête:
 * {
 *   "planId": "pro",
 *   "successUrl": "...",
 *   "cancelUrl": "..."
 * }
 *
 * Réponse:
 * {
 *   "sessionId": "...",
 *   "url": "..."
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Vérifie l'authentification
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: AUTH_ERRORS.UNAUTHORIZED.clientMessage },
        { status: 401 },
      );
    }

    const { planId, successUrl, cancelUrl } = await req.json();

    if (!planId) {
      return NextResponse.json(
        { error: "L'identifiant du plan est requis" },
        { status: 400 },
      );
    }

    const PLANS: Record<
      string,
      { name: string; credits: number; price: number }
    > = {
      starter: { name: "Starter", credits: 100, price: 999 },
      pro: { name: "Pro", credits: 500, price: 2499 },
      expert: { name: "Expert", credits: 1500, price: 4999 },
    };

    const plan = PLANS[planId];
    if (!plan) {
      return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
    }

    // Crée la session Stripe avec les métadonnées utilisateur
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `JurisBénin - ${plan.name} (${plan.credits} crédits)`,
            },
            unit_amount: plan.price,
          },
          quantity: 1,
        },
      ],
      success_url:
        successUrl ||
        `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        cancelUrl ||
        `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/checkout/cancel`,
      metadata: {
        userId: session.userId,
        planId,
        credits: plan.credits.toString(),
      },
      client_reference_id: session.userId,
    });

    return NextResponse.json(
      {
        sessionId: checkoutSession.id,
        url: checkoutSession.url,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[CHECKOUT] Error creating session:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la session de paiement" },
      { status: 500 },
    );
  }
}
