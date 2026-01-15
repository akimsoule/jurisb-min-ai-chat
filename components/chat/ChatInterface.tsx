"use client";

import { useState, useRef, useEffect } from "react";
import { Send, X, AlertTriangle } from "lucide-react";
import ChatMessage from "./ChatMessage";
import EmptyState from "./EmptyState";
import Header from "@/components/layout/Header";
import Link from "next/link";
// DaisyUI drawer pattern (left drawer)

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Array<{ title: string; article: string }>;
  timestamp: Date;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  // Modals supprimés au profit de pages dédiées
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Aucun portal nécessaire : les pages auth sont dédiées

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Réponse juridique concernant votre question sur "${input}". 
        
Voici les éléments applicables selon la législation béninoise :

• Les articles pertinents du Code civil
• Les dispositions spéciales du Code du travail
• Les jurisprudences récentes

Cette réponse est fondée sur les textes de loi en vigueur et ne constitue pas un avis juridique personnalisé.`,
        sources: [
          { title: "Code Civil du Bénin", article: "Article 1234" },
          { title: "Code du Travail", article: "Article 567" },
        ],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setLoading(false);
    }, 1000);
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div className="drawer">
      <input id="app-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col min-h-screen w-full">
        <Header />
        <div className="flex flex-col flex-1 bg-base-100">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <EmptyState onSuggestedQuestion={handleSuggestedQuestion} />
            ) : (
              <div className="mx-auto max-w-3xl px-4 pt-24 py-8 sm:px-6 space-y-6">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {loading && (
                  <div className="flex gap-4 items-start">
                    <div className="h-8 w-8 rounded-full bg-base-300 flex-shrink-0" />
                    <div className="flex gap-1 pt-2">
                      <div className="h-2 w-2 rounded-full bg-base-content/60 animate-bounce" />
                      <div
                        className="h-2 w-2 rounded-full bg-base-content/60 animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="h-2 w-2 rounded-full bg-base-content/60 animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="bg-base-100 px-4 py-6 sm:px-6 border-t border-base-300">
            <div className="mx-auto max-w-3xl">
              {/* Input Form */}
              <form
                onSubmit={handleSendMessage}
                className="relative border border-base-300 rounded-lg p-4 bg-base-100"
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e as any);
                    }
                  }}
                  placeholder="Posez une question..."
                  className="w-full px-0 py-2 pr-12 resize-none outline-none text-base-content placeholder-base-content/50 bg-base-100"
                  rows={2}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="absolute top-3 right-3 p-2 text-base-content/60 hover:text-primary disabled:opacity-50 transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
          {/* Disclaimer bottom bar */}
          <div className="border-t border-base-300 bg-base-200 px-6 py-3">
            <p className="text-sm text-base-content/60 text-center flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4 text-base-content/60" />
              JurisBénin est un assistant IA. Les réponses sont à titre
              informatif et ne remplacent pas l'avis d'un avocat.
            </p>
          </div>
        </div>
      </div>

      {/* Drawer side */}
      <div className="drawer-side z-[60]">
        <label
          htmlFor="app-drawer"
          aria-label="close sidebar"
          className="drawer-overlay"
        />
        <aside className="min-h-full w-72 bg-base-100 border-r border-base-300 flex flex-col shadow-lg">
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-base-300">
            <div className="text-xl font-bold">JurisBénin</div>
            <label
              htmlFor="app-drawer"
              className="p-2 text-base-content/70 hover:bg-base-200 rounded-lg"
              aria-label="Fermer le menu"
            >
              <X className="w-5 h-5" />
            </label>
          </div>
          <div className="flex-1" />
          {/* Buttons */}
          <div className="border-t border-base-300 p-4 flex flex-col gap-2 bg-base-100">
            <Link
              href="/auth/signup"
              className="btn btn-primary w-full"
              onClick={() => {
                const drawerInput = document.getElementById(
                  "app-drawer"
                ) as HTMLInputElement;
                if (drawerInput) drawerInput.checked = false;
              }}
            >
              Inscription
            </Link>
            <Link
              href="/auth/login"
              className="btn btn-outline btn-secondary w-full"
              onClick={() => {
                const drawerInput = document.getElementById(
                  "app-drawer"
                ) as HTMLInputElement;
                if (drawerInput) drawerInput.checked = false;
              }}
            >
              Connexion
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
