import { NextRequest, NextResponse } from "next/server";
import { Stripe } from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-12-15.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

/**
 * POST /api/webhooks/stripe
 * Endpoint pour recevoir les webhooks Stripe
 *
 * Gère notamment:
 * - checkout.session.completed (ajout de crédits après paiement)
 * - payment_intent.failed (paiement échoué)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // TODO: Implémenter l'idempotence en vérifiant si event.id a été traité

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Checkout session completed:", session.id);

        // TODO:
        // 1. Récupérer l'utilisateur
        // 2. Extraire les crédits depuis session.metadata.credits
        // 3. Ajouter les crédits au compte utilisateur (transaction atomique)
        // 4. Enregistrer event.id dans processed_events pour l'idempotence

        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("Payment failed:", paymentIntent.id);

        // TODO: Notifier l'utilisateur du paiement échoué

        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Error in /api/webhooks/stripe:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
