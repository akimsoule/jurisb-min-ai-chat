"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth/server";
import { OPEN_MODE } from "../config";

interface User {
  id: string;
  email: string;
  name: string;
  credits: number;
  plan: string;
}

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Récupère l'utilisateur depuis le SessionStorage ou une API
    const fetchUser = async () => {
      try {
        // Appelle une route API pour récupérer l'utilisateur courant
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération de l'utilisateur:",
          error,
        );
      } finally {
        setIsLoading(false);
      }
    };

    !OPEN_MODE && fetchUser();
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    setUser(null);
    router.push("/auth/login");
    router.refresh();
  }, [router]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: handleLogout,
  };
}
