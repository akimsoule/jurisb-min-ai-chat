"use client";

import { useState } from "react";
import { Heart, X } from "lucide-react";

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AMOUNTS = [
  { value: 500, label: "$5" },
  { value: 1000, label: "$10" },
  { value: 2000, label: "$20" },
  { value: 5000, label: "$50" },
  { value: 10000, label: "$100" },
  { value: 25000, label: "$250" },
];

export default function DonateModal({
  isOpen,
  onClose,
}: Readonly<DonateModalProps>) {
  const [selectedAmount, setSelectedAmount] = useState(1000);
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleDonate = async () => {
    setLoading(true);
    try {
      const amount = customAmount
        ? Number.parseFloat(customAmount) * 100
        : selectedAmount;

      const response = await fetch("/api/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();

      if (data.url) {
        globalThis.location.href = data.url;
      }
    } catch (error) {
      console.error("Donation error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-base-100 rounded-2xl shadow-xl max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-base-200 rounded-lg transition-colors"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-full bg-error/10 flex items-center justify-center">
            <Heart className="w-6 h-6 text-error" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Soutenir JurisBénin</h2>
            <p className="text-sm text-base-content/70">
              Votre don maintient l'accès gratuit au droit
            </p>
          </div>
        </div>

        {/* Preset Amounts (USD) */}
        <div className="mb-4">
          <p className="block text-sm font-medium mb-2">
            Choisir un montant (USD)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PRESET_AMOUNTS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => {
                  setSelectedAmount(preset.value);
                  setCustomAmount("");
                }}
                className={`btn ${
                  selectedAmount === preset.value && !customAmount
                    ? "btn-primary"
                    : "btn-outline"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Amount (USD) */}
        <div className="mb-6">
          <label
            htmlFor="donate-custom-amount"
            className="block text-sm font-medium mb-2"
          >
            Ou un montant personnalisé ($)
          </label>
          <input
            type="number"
            min="1"
            step="0.01"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="Ex: 15.50"
            id="donate-custom-amount"
            className="input input-bordered w-full"
          />
        </div>

        {/* Description */}
        <div className="bg-base-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-base-content/80">
            🇧🇯 JurisBénin rend le droit béninois accessible à tous gratuitement.
            Votre soutien (en USD) nous aide à :
          </p>
          <ul className="text-sm text-base-content/70 mt-2 space-y-1 ml-4">
            <li>• Maintenir les serveurs</li>
            <li>• Enrichir la base juridique</li>
            <li>• Améliorer l'IA juridique</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button onClick={onClose} className="btn btn-outline flex-1">
            Annuler
          </button>
          <button
            onClick={handleDonate}
            disabled={loading || (!selectedAmount && !customAmount)}
            className="btn btn-primary flex-1 gap-2"
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <>
                <Heart className="w-4 h-4" />
                Donner
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
