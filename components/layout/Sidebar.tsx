"use client";

import Link from "next/link";
import { Menu, ChevronLeft } from "lucide-react";

interface SidebarProps {
  readonly isOpen: boolean;
  readonly setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-72 bg-white border-r border-gray-200 z-40 flex flex-col shadow-lg will-change-transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header with Logo and Close Button */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 flex-shrink-0 bg-white">
          <div className="text-xl font-bold text-primary">JurisBénin</div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            aria-label="Fermer le menu"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom Section - Authentication Buttons */}
        <div className="border-t border-base-300 p-4 flex flex-col gap-2 flex-shrink-0 bg-base-100">
          <Link
            href="/auth/signup"
            className="btn btn-primary w-full"
            onClick={() => setIsOpen(false)}
          >
            Inscription
          </Link>
          <Link
            href="/auth/login"
            className="btn btn-outline btn-secondary w-full"
            onClick={() => setIsOpen(false)}
          >
            Connexion
          </Link>
        </div>
      </aside>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-4 left-4 z-50 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ${
          isOpen ? "hidden" : "block"
        }`}
        aria-label="Ouvrir le menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay */}
      <button
        className={`fixed inset-0 bg-black/30 z-30 transition-opacity duration-300 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setIsOpen(false);
          }
        }}
        aria-label="Fermer le menu"
        aria-hidden={!isOpen}
        type="button"
      />
    </>
  );
}
