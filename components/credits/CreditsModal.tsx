"use client";

import { useState } from "react";
import { X, CreditCard, Check } from "lucide-react";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 9.99,
    credits: 100,
    description: "Parfait pour débuter",
  },
  {
    id: "pro",
    name: "Pro",
    price: 24.99,
    credits: 500,
    description: "Pour une utilisation régulière",
    popular: true,
  },
  {
    id: "expert",
    name: "Expert",
    price: 49.99,
    credits: 1500,
    description: "Pour les utilisateurs intensifs",
  },
];

interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreditsModal({ isOpen, onClose }: CreditsModalProps) {
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [loading, setLoading] = useState(false);

  const handleCheckout = async (planId: string) => {
    setLoading(true);
    // TODO: Intégrer Stripe Checkout
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-base-100 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-base-300">
          <div>
            <h2 className="text-2xl font-bold text-base-content">
              Acheter des crédits
            </h2>
            <p className="text-sm text-base-content/70 mt-1">
              Chaque question consomme 1 crédit
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-square btn-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Balance */}
        <div className="p-6 bg-base-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-content/70">Crédits actuels</p>
              <p className="text-2xl font-bold text-primary">45 crédits</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-base-content/70">Dépenses ce mois</p>
              <p className="text-2xl font-bold text-warning">15 crédits</p>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-base-content mb-4">
            Plans disponibles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`card border-2 transition-all cursor-pointer ${
                  selectedPlan === plan.id
                    ? "border-primary bg-primary/5"
                    : "border-base-300 hover:border-primary/50"
                }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                <div className="card-body p-4">
                  {plan.popular && (
                    <div className="badge badge-primary mb-2 w-fit">
                      Populaire
                    </div>
                  )}
                  <h4 className="card-title text-lg">{plan.name}</h4>
                  <p className="text-sm text-base-content/70">
                    {plan.description}
                  </p>

                  <div className="my-4">
                    <p className="text-3xl font-bold text-primary">
                      {plan.credits}
                    </p>
                    <p className="text-xs text-base-content/70">crédits</p>
                  </div>

                  <div className="text-right mb-4">
                    <p className="text-2xl font-bold text-base-content">
                      {plan.price.toFixed(2)}€
                    </p>
                  </div>

                  <button
                    onClick={() => handleCheckout(plan.id)}
                    disabled={loading}
                    className={`btn btn-block ${
                      selectedPlan === plan.id ? "btn-primary" : "btn-outline"
                    }`}
                  >
                    {loading ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        Acheter
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="p-6 bg-base-200 border-t border-base-300">
          <h3 className="font-semibold text-base-content mb-3">Avantages</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success flex-shrink-0" />
              <span>Crédits valables 1 an</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success flex-shrink-0" />
              <span>Pas d'engagement ni d'abonnement</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success flex-shrink-0" />
              <span>Paiement sécurisé par Stripe</span>
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-base-300 flex justify-end gap-2">
          <button onClick={onClose} className="btn btn-ghost">
            Annuler
          </button>
          <button
            onClick={() => handleCheckout(selectedPlan)}
            disabled={loading}
            className="btn btn-primary gap-2"
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Procéder au paiement
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
