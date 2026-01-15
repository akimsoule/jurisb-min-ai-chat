"use client";

import { useState, useEffect } from "react";
import {
  Menu,
  User,
  ChevronDown,
  HelpCircle,
  LogOut,
  ShoppingCart,
  Sun,
  Moon,
} from "lucide-react";
import Link from "next/link";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

interface HeaderProps {
  readonly onCreditsClick?: () => void;
}

export default function Header({ onCreditsClick }: HeaderProps) {
  const { user, logout } = useCurrentUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Récupérer le thème du localStorage ou utiliser light par défaut
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.dataset.theme = savedTheme;
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.dataset.theme = newTheme;
    localStorage.setItem("theme", newTheme);
  };

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-base-100/80 backdrop-blur-md text-base-content border-b border-base-300 shadow-sm">
      <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Menu + Logo */}
          <div className="flex items-center gap-2 min-w-0">
            <label
              htmlFor="app-drawer"
              className="p-2 text-base-content/70 hover:bg-base-200 rounded-lg transition-colors"
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-5 h-5" />
            </label>
            <button
              type="button"
              onClick={() => globalThis.location.reload()}
              className="text-lg font-semibold truncate"
              aria-label="Recharger la page JurisBénin"
            >
              JurisBénin
            </button>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-base-content/70 hover:bg-base-200 rounded-lg transition-colors"
              aria-label="Changer de thème"
              title={theme === "light" ? "Mode sombre" : "Mode clair"}
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>

            {user ? (
              <div className="relative flex items-center gap-2">
                {/* Carte utilisateur desktop */}
                <div className="hidden sm:flex items-center gap-3 text-base-content px-3 py-2 min-w-[180px]">
                  <span className="h-10 w-10 rounded-full bg-primary text-primary-content flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </span>
                  <span className="flex flex-col items-start leading-tight">
                    <span className="text-sm font-semibold">{user.name}</span>
                    <span className="text-xs text-base-content/70">
                      {user.credits} crédits
                    </span>
                  </span>
                  <button
                    onClick={() => setDropdownOpen((o) => !o)}
                    className="p-2 rounded-full hover:bg-base-300 transition-colors"
                    aria-haspopup="menu"
                    aria-expanded={dropdownOpen}
                  >
                    <ChevronDown className="w-4 h-4 text-base-content/70" />
                  </button>
                </div>

                {/* Avatar compact mobile */}
                <button
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="sm:hidden h-10 w-10 rounded-full bg-primary text-primary-content flex items-center justify-center"
                  aria-haspopup="menu"
                  aria-expanded={dropdownOpen}
                  aria-label="Ouvrir le menu utilisateur"
                >
                  <User className="w-5 h-5" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-[110%] w-72 rounded-2xl bg-base-100 text-base-content shadow-xl p-4 space-y-4 z-50 border border-base-300">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-base font-semibold">{user.name}</p>
                        <p className="text-sm text-base-content/70">
                          {user.email}
                        </p>
                        <span className="inline-flex items-center px-3 py-1 mt-2 rounded-full bg-base-200 text-xs text-base-content/80">
                          {user.plan}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm text-base-content/70">
                        <span>Crédits restants</span>
                        <span>{user.credits}</span>
                      </div>
                      <div className="h-2 rounded-full bg-base-300 overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${Math.min(user.credits, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      <button
                        onClick={onCreditsClick}
                        className="btn btn-primary w-full mb-2"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Acheter des crédits
                      </button>

                      <button
                        onClick={handleLogout}
                        className="btn btn-outline btn-secondary"
                      >
                        <LogOut className="w-4 h-4" />
                        Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  className="p-2 text-base-content/70 hover:bg-base-200 rounded-full transition-colors"
                  title="Aide"
                >
                  <HelpCircle className="w-5 h-5" />
                </button>
                <Link
                  href="/auth/login"
                  className="btn btn-primary rounded-full"
                >
                  Connexion
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
