"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getUserFromSession,
  loadSession,
  loginWithPassword,
  logoutSession,
  type AuthStatus,
  type AuthUser,
} from "@/lib/auth";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  status: "loading",
  login: async () => {},
  logout: async () => {},
  refreshSession: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function refreshSession() {
    setLoading(true);
    try {
      const result = await loadSession();
      setUser(getUserFromSession(result.session));
      setStatus(result.status);
    } catch {
      setUser(null);
      setStatus("unauthenticated");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshSession();
  }, []);

  async function login(email: string, password: string) {
    const nextUser = await loginWithPassword(email, password);
    setUser(nextUser);
    setStatus("authenticated");
    router.push("/");
    router.refresh();
  }

  async function logout() {
    await logoutSession();
    setUser(null);
    setStatus("unauthenticated");
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <AuthContext.Provider value={{ user, loading, status, login, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
