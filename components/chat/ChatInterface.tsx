"use client";

import { useState, useRef, useEffect } from "react";
import { Send, X, AlertTriangle, Plus } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);
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

    setError(null);

    const userMessage: Message = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: input }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "Une erreur est survenue");
        return;
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-a`,
        role: "assistant",
        content: data.answer,
        sources: data.sources,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Chat error", err);
      setError("Impossible de récupérer la réponse. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleResetChat = () => {
    if (confirm("Êtes-vous sûr de vouloir réinitialiser le chat ?")) {
      setMessages([]);
      setInput("");
      setError(null);
    }
  };

  return (
    <div className="drawer">
      <input id="app-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col min-h-screen w-full">
        <Header />
        <div className="flex flex-col flex-1 bg-base-100">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto pb-48">
            {messages.length === 0 ? (
              <EmptyState onSuggestedQuestion={handleSuggestedQuestion} />
            ) : (
              <div className="mx-auto max-w-3xl px-4 pt-24 py-8 sm:px-6 space-y-6">
                {error && (
                  <div className="alert alert-error shadow-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}
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

          {/* Fixed Input Area + Disclaimer */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-base-100 border-t border-base-300 shadow-lg">
            {/* Input Area */}
            <div className="px-4 py-6 sm:px-6">
              <div className="mx-auto max-w-3xl">
                {/* Input Form */}
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-3"
                >
                  {/* Reset Button (Light) */}
                  <button
                    type="button"
                    onClick={handleResetChat}
                    className="flex-shrink-0 w-10 h-10 rounded-full bg-base-200 hover:bg-base-300 text-base-content/70 hover:text-base-content flex items-center justify-center transition-colors"
                    title="Réinitialiser le chat"
                  >
                    <Plus className="w-5 h-5" />
                  </button>

                  {/* Textarea */}
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
                    className="flex-1 px-4 py-3 resize-none outline-none text-base-content placeholder-base-content/50 bg-base-100 border border-base-300 rounded-lg"
                    rows={2}
                  />

                  {/* Send Button (Dark) */}
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="flex-shrink-0 w-10 h-10 rounded-full bg-base-content hover:bg-base-content/90 disabled:bg-base-content/30 text-base-100 flex items-center justify-center transition-colors disabled:opacity-60"
                    title="Envoyer"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>

            {/* Disclaimer bottom bar */}
            <div className="border-t border-base-300 bg-base-200 px-4 py-2">
              <p className="text-xs text-base-content/50 text-center flex items-center justify-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-base-content/50" />
                JurisBénin est un assistant IA. Les réponses sont à titre
                informatif et ne remplacent pas l'avis d'un avocat. La base de
                données est actuellement constituée de lois de 2025.
              </p>
            </div>
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
