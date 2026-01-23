import { Scale, BookOpen, MessageCircle } from "lucide-react";

interface EmptyStateProps {
  readonly onSuggestedQuestion?: (question: string) => void;
}

export default function EmptyState({ onSuggestedQuestion }: EmptyStateProps) {
  const suggestions = [
    "Comment obtenir la nationalité béninoise ?",
    "Quels sont mes droits en tant que client (coopérateur) d'une institution de microfinance ?",
    "Comment créer une association ou une organisation non gouvernementale (ONG) au Bénin ?",
    "Quelles sont les conditions pour qu'un étranger puisse résider et travailler légalement au Bénin ?",
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full pt-20 py-12">
      <div className="text-center space-y-8 max-w-2xl mx-auto px-4">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Scale className="w-6 h-6 text-primary" />
          </div>
        </div>

        {/* Title & Subtitle */}
        <div>
          <h1 className="text-4xl font-bold text-base-content mb-2">
            JurisBénin
          </h1>
          <p className="text-lg text-base-content/70">
            Votre assistant juridique basé sur l'IA pour le droit béninois
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col items-center gap-2 p-4">
            <MessageCircle className="w-6 h-6 text-base-content/60" />
            <p className="text-base-content text-sm">Questions juridiques</p>
            <p className="text-xs text-base-content/70">
              Posez vos questions sur le droit béninois
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 p-4">
            <BookOpen className="w-6 h-6 text-base-content/60" />
            <p className="text-base-content text-sm">Réponses sourcées</p>
            <p className="text-xs text-base-content/70">
              Chaque réponse fondée sur les textes légaux
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 p-4">
            <Scale className="w-6 h-6 text-base-content/60" />
            <p className="text-base-content text-sm">Droit béninois</p>
            <p className="text-xs text-base-content/70">
              Expertise exclusive en législation béninoise
            </p>
          </div>
        </div>

        {/* Suggested Questions */}
        {onSuggestedQuestion && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {suggestions.map((question) => (
              <button
                key={question}
                onClick={() => onSuggestedQuestion(question)}
                className="btn btn-lg justify-center items-center text-center h-auto min-h-[4rem] py-5 px-6 normal-case font-normal"
              >
                <BookOpen className="w-5 h-5 flex-shrink-0 text-base-content/60" />
                <span className="line-clamp-2 flex-1 text-xs">{question}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
