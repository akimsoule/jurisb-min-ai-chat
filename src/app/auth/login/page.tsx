import Link from "next/link";
import { Scale } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
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
          <p className="text-base-content/60">Connectez-vous à votre compte</p>
        </div>

        {/* Form Component (Client Component) */}
        <LoginForm />

        <p className="mt-6 text-center text-sm text-base-content/60">
          Pas encore de compte ?{" "}
          <Link
            href="/auth/signup"
            className="text-primary hover:underline font-medium"
          >
            S'inscrire
          </Link>
        </p>
      </div>
    </main>
  );
}
