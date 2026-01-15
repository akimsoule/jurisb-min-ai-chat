import { BookOpen, Copy, Check } from "lucide-react";
import { useState } from "react";

interface Source {
  title: string;
  article: string;
}

interface ChatMessageProps {
  readonly message: {
    role: "user" | "assistant";
    content: string;
    sources?: Source[];
    timestamp: Date;
  };
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (message.role === "user") {
    return (
      <div className="flex justify-end mb-6">
        <div className="max-w-md lg:max-w-lg">
          <div className="rounded-lg bg-base-200 px-4 py-3 text-sm text-base-content">
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 mb-6">
      {/* Avatar */}
      <div className="h-8 w-8 flex-shrink-0 rounded-full bg-base-300" />

      {/* Content */}
      <div className="flex-1 max-w-lg lg:max-w-2xl">
        {/* Main Message */}
        <div className="prose prose-sm max-w-none text-base-content text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-4 space-y-2 bg-base-200 rounded-lg p-3">
            <h4 className="font-medium text-xs text-base-content flex items-center gap-2">
              <BookOpen className="w-3 h-3" />
              Fondement légal
            </h4>
            <ul className="space-y-1">
              {message.sources.map((source, idx) => (
                <li key={idx} className="text-xs text-base-content/80">
                  <p className="font-medium text-base-content">
                    {source.title}
                  </p>
                  <p className="text-base-content/70">{source.article}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="mt-3">
          <button
            onClick={handleCopy}
            className="text-xs text-base-content/60 hover:text-base-content/80 flex items-center gap-1 transition-colors"
            title="Copier"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                Copié
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Copier
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
