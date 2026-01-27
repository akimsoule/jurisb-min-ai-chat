import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getClientKey,
  limit,
  rateLimitHeaders,
} from "@/lib/security/rate-limit";

// Next.js App Router: garantir l'exécution côté Node (SDK Stripe non compatible Edge)
export const runtime = "nodejs";

// Initialisation Stripe avec vérification de la clé et sans apiVersion explicite
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  throw new Error("STRIPE_SECRET_KEY manquant");
}
const stripe = new Stripe(stripeKey);

/**
 * POST /api/donate
 * Créer une session Stripe Checkout pour les donations
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limit: 5 requêtes/min pour création de sessions
    const key = getClientKey(req.headers);
    const rl = limit(key, 5, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessayez plus tard." },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    const { amount } = await req.json();

    // Montant par défaut : 5€ (500 centimes)
    let donationAmount = amount && amount > 0 ? Number(amount) : 500;
    // Validation des bornes: min $1 (100), max $1000 (100000)
    if (!Number.isFinite(donationAmount)) donationAmount = 500;
    if (donationAmount < 100) donationAmount = 500;
    if (donationAmount > 100000) donationAmount = 100000;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Soutenir JurisBénin",
              description:
                "Votre don aide à maintenir et améliorer l'accès gratuit au droit béninois",
              images: [],
            },
            unit_amount: donationAmount,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/?donation=success`,
      cancel_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/?donation=cancelled`,
      metadata: {
        type: "donation",
      },
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error) {
    console.error("Donation session error:", error);
    return NextResponse.json(
      { error: "Impossible de créer la session de donation" },
      { status: 500 },
    );
  }
}
