import { NextRequest, NextResponse } from "next/server";
import {
  getClientKey,
  limit,
  rateLimitHeaders,
} from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 10 req/min par IP/UA
    const key = getClientKey(req.headers);
    const rl = limit(key, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessayez plus tard." },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    const body = await req.json();
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim();
    const role = String(body?.role || "").trim();
    const message = String(body?.message || "").trim();

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Nom invalide." }, { status: 400 });
    }
    if (!/.+@.+\..+/.test(email)) {
      return NextResponse.json({ error: "E-mail invalide." }, { status: 400 });
    }
    if (!message || message.length < 10) {
      return NextResponse.json(
        { error: "Message trop court." },
        { status: 400 },
      );
    }

    // Envoi vers Telegram si configuré
    // Support des deux conventions de variables (local/prod)
    const tgToken = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_KEY;
    const tgChatId = process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_GROUP_ID;
    if (tgToken && tgChatId) {
      try {
        // Telegram limite à ~4096 caractères par message
        const maxLen = 3800;
        const safeMessage =
          message.length > maxLen ? message.slice(0, maxLen) + "…" : message;
        const text = `Nouveau contact JurisBénin\nNom: ${name}\nEmail: ${email}\nRôle: ${role}\nMessage:\n${safeMessage}`;
        const url = `https://api.telegram.org/bot${tgToken}/sendMessage`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: tgChatId,
            text,
            disable_web_page_preview: true,
          }),
        });
        if (!res.ok) {
          const errTxt = await res.text();
          console.warn("telegram sendMessage failed:", errTxt);
        }
      } catch (e) {
        console.warn("contact telegram forward failed", e);
      }
    } else {
      // Telegram non configuré: accepter la requête sans forward
      console.warn(
        "contact: TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID non configurés; aucun envoi effectué",
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in /api/contact:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
