import { Check } from "lucide-react";

interface CheckoutStatusProps {
  readonly status: "loading" | "success" | "error";
  readonly message?: string;
}

export default function CheckoutStatus({
  status,
  message,
}: CheckoutStatusProps) {
  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <span className="loading loading-spinner loading-lg text-primary mb-4"></span>
        <p className="text-base-content/70">Traitement du paiement...</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="alert alert-success">
        <Check className="w-6 h-6" />
        <span>{message || "Crédits ajoutés avec succès !"}</span>
      </div>
    );
  }

  return (
    <div className="alert alert-error">
      <span>{message || "Erreur lors du traitement du paiement"}</span>
    </div>
  );
}
