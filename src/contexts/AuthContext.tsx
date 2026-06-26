"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAccessToken,
  setTokens,
  clearTokens,
  isAuthenticated,
} from "@/lib/auth";
import api from "@/lib/api";

interface User {
  id: number;
  name: string;
  email: string;
  plan: string;
  site_id: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      api
        .get("/api/portal/profile/")
        .then((res) => setUser(res.data))
        .catch(() => clearTokens())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email: string, password: string) {
    const res = await api.post("/api/token/", { email, password });
    setTokens(res.data.access, res.data.refresh);
    const profile = await api.get("/api/portal/profile/");
    setUser(profile.data);
    router.push("/");
  }

  function logout() {
    clearTokens();
    setUser(null);
    router.push("/auth/login");
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
