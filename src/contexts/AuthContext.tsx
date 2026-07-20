"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

import {
  getUserFromSession,
  loadSession,
  loginWithPassword,
  logoutSession,
  type AuthStatus,
  type AuthUser,
  AuthRequestError,
} from "@/lib/auth";
import { cacheClear } from "@/lib/portalCache";

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

  // Stable logout ref so the axios interceptor closure doesn't go stale.
  const logoutRef = useRef<() => Promise<void>>(async () => {});

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

  async function logout() {
    await logoutSession();
    // router.push/refresh is a client-side transition, not a full reload —
    // portalCache's module-level store would otherwise survive into the next
    // session on this tab. Cache keys aren't scoped by account, so a
    // different user logging into a shared site here within the TTL window
    // could briefly see the previous session's cached data.
    cacheClear();
    setUser(null);
    setStatus("unauthenticated");
    router.push("/auth/login");
    router.refresh();
  }

  logoutRef.current = logout;

  // Wire up a global axios response interceptor so any BFF proxy 401
  // (session expired mid-use) automatically clears local state and redirects
  // to login — without requiring every page to handle it.
  useEffect(() => {
    const interceptorId = axios.interceptors.response.use(
      (response) => {
        // The BFF proxy sets this header when it clears session cookies on 401.
        if (response.headers["x-auth-status"] === "session-expired") {
          void logoutRef.current();
        }
        return response;
      },
      (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          const authStatus = error.response.headers["x-auth-status"];
          if (authStatus === "session-expired") {
            void logoutRef.current();
          }
        }
        return Promise.reject(error);
      },
    );

    return () => axios.interceptors.response.eject(interceptorId);
  }, []);

  useEffect(() => {
    void refreshSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(email: string, password: string) {
    const nextUser = await loginWithPassword(email, password);
    setUser(nextUser);
    setStatus("authenticated");
    router.push("/dashboard");
    router.refresh();
  }

  // Memoize the context value so consumers only re-render when something they
  // actually use changes, not on every parent render that recreates the object.
  const value = useMemo(
    () => ({ user, loading, status, login, logout, refreshSession }),
    // login/logout/refreshSession are defined in function scope so stable across renders;
    // only user/loading/status actually change at runtime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, loading, status],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
