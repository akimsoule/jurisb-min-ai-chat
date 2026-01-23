"use client";

import { useState } from "react";
import Link from "next/link";
import { Scale } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("citoyen");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const validateEmail = (val: string) => /.+@.+\..+/.test(val);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (name.trim().length < 2) {
      setError("Votre nom doit contenir au moins 2 caractères.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Adresse e-mail invalide.");
      return;
    }
    if (message.trim().length < 10) {
      setError("Votre message doit contenir au moins 10 caractères.");
      return;
    }
    if (!consent) {
      setError("Merci de confirmer votre souhait de participer.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Erreur lors de l'envoi, réessayez plus tard.");
        return;
      }
      setSuccess("Merci ! Nous vous recontactons très vite.");
      setName("");
      setEmail("");
      setRole("citoyen");
      setMessage("");
      setConsent(false);
    } catch (err) {
      console.error("contact submit error", err);
      setError("Impossible d'envoyer le message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-base-100 flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-6 flex justify-center">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Scale className="w-6 h-6 text-primary" />
        </div>
      </div>

      {/* Back link */}
      <div className="mb-12 text-center">
        <Link
          href="/"
          className="text-primary hover:underline text-sm font-medium"
        >
          ← Retour
        </Link>
      </div>

      <div className="w-full max-w-sm">
        {/* Logo / Title */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">JurisBénin</h1>
          <p className="text-base-content/60">Participer au projet</p>
        </div>

        {error && (
          <div className="alert alert-error mb-4">
            <span className="text-sm">{error}</span>
          </div>
        )}
        {success && (
          <div className="alert alert-success mb-4">
            <span className="text-sm">{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium">
              Nom complet
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input input-bordered w-full"
              placeholder="Ex: John Smith"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input input-bordered w-full"
              placeholder="vous@exemple.com"
              required
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium">
              Rôle / Intérêt
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="select select-bordered w-full"
            >
              <option value="juriste">Juriste</option>
              <option value="dev">Développeur</option>
              <option value="designer">Designer</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium">
              Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="textarea textarea-bordered w-full"
              rows={5}
              placeholder="Expliquez comment vous souhaitez participer..."
              required
            />
          </div>

          <div className="form-control overflow-x-hidden">
            <label className="cursor-pointer label justify-start gap-3">
              <input
                type="checkbox"
                className="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span className="label-text whitespace-normal break-words line-clamp-2">
                Je souhaite participer activement au projet JurisBénin.
              </span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? "Envoi..." : "Envoyer"}
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-base-content/60">
            Retour à l’accueil ? {""}
            <Link href="/" className="text-primary hover:underline font-medium">
              Accueil
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
