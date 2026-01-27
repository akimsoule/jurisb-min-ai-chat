// Liste de mots vides français pour le filtrage des keywords
export const frenchStopWords = new Set([
  "le",
  "la",
  "les",
  "de",
  "du",
  "des",
  "et",
  "à",
  "un",
  "une",
  "dans",
  "sur",
  "par",
  "pour",
  "avec",
  "sans",
  "sous",
  "entre",
  "chez",
  "vers",
  "comment",
  "quoi",
  "qui",
  "que",
  "quand",
  "où",
  "pourquoi",
  "combien",
  "quel",
  "quelle",
  "quels",
  "quelles",
  "est",
  "sont",
  "était",
  "étaient",
  "sera",
  "seront",
  "être",
  "avoir",
  "faire",
  "dire",
  "aller",
  "voir",
  "savoir",
  "pouvoir",
  "vouloir",
  "venir",
  "passer",
  "mettre",
  "prendre",
  "donner",
  "trouver",
  "rendre",
  "savoir",
  "tenir",
  "falloir",
  "devoir",
  "pouvoir",
  "vouloir",
]);

// Configuration de l'application
export const OPEN_MODE = true;
export const WITH_LLM = true;

// Limites et seuils API
export const MAX_QUESTION_LENGTH = 500;
export const RATE_LIMIT = { max: 15, windowMs: 60_000 };
export const MIN_SIMILARITY_SCORE = 0.65;

// Messages de réponse
export const NO_RESULT_MESSAGE =
  "Aucune disposition légale béninoise pertinente n'a été trouvée dans la base juridique actuelle.";

export const UNVAILABLE_ANSWER_MESSAGE = "Réponse indisponible pour le moment.";

export const LLM_UNCERTAIN_MESSAGE = (articleCount: number) =>
  `Votre question nécessite une reformulation plus précise. ${articleCount} article(s) juridique(s) ont été trouvé(s) mais ne permettent pas de répondre clairement à votre demande. Veuillez reformuler votre question de manière plus spécifique.`;
