import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  buildCustomerSession,
  getPortalAccessDecision,
  type BackendProfile,
  type CustomerSession,
} from "@/lib/session";

export const ACCESS_COOKIE = "360w_portal_access";
export const REFRESH_COOKIE = "360w_portal_refresh";

type TokenPair = {
  access: string;
  refresh: string;
};

type SessionResolution =
  | {
      kind: "authenticated";
      session: CustomerSession;
      tokens?: Partial<TokenPair>;
    }
  | {
      kind: "redirect-employee";
      tokens?: Partial<TokenPair>;
    }
  | {
      kind: "unauthenticated";
      reason: "missing" | "invalid" | "expired";
    };

function getApiBaseUrl(): string {
  return (process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
}

export function getEmployeeAppUrl(): string | null {
  return process.env.EMPLOYEE_APP_URL ?? process.env.NEXT_PUBLIC_EMPLOYEE_APP_URL ?? null;
}

function getCookieSecure(): boolean {
  const explicit = process.env.AUTH_COOKIE_SECURE;
  if (explicit === "true") return true;
  if (explicit === "false") return false;
  return process.env.NODE_ENV === "production";
}

function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: getCookieSecure(),
    path: "/",
  };
}

export function applySessionCookies(response: NextResponse, tokens: Partial<TokenPair>): NextResponse {
  const options = getCookieOptions();

  if (tokens.access) {
    response.cookies.set(ACCESS_COOKIE, tokens.access, {
      ...options,
      maxAge: 60 * 5,
    });
  }

  if (tokens.refresh) {
    response.cookies.set(REFRESH_COOKIE, tokens.refresh, {
      ...options,
      maxAge: 60 * 60 * 24,
    });
  }

  return response;
}

export function clearSessionCookies(response: NextResponse): NextResponse {
  response.cookies.set(ACCESS_COOKIE, "", {
    ...getCookieOptions(),
    maxAge: 0,
  });
  response.cookies.set(REFRESH_COOKIE, "", {
    ...getCookieOptions(),
    maxAge: 0,
  });
  return response;
}

async function backendFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
}

async function fetchProfile(accessToken: string): Promise<Response> {
  return backendFetch("/api/profile/", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const response = await backendFetch("/api/auth/token/refresh/", {
    method: "POST",
    body: JSON.stringify({ refresh: refreshToken }),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { access?: string };
  return data.access ?? null;
}

function parseProfile(data: unknown): BackendProfile {
  return data as BackendProfile;
}

function getActiveTokensFromStore(store: Awaited<ReturnType<typeof cookies>>): Partial<TokenPair> {
  return {
    access: store.get(ACCESS_COOKIE)?.value,
    refresh: store.get(REFRESH_COOKIE)?.value,
  };
}

export async function resolveSessionFromTokens(tokens: Partial<TokenPair>): Promise<SessionResolution> {
  const accessToken = tokens.access;
  const refreshToken = tokens.refresh;

  if (!accessToken && !refreshToken) {
    return { kind: "unauthenticated", reason: "missing" };
  }

  let workingAccess = accessToken ?? null;
  let refreshedAccess: string | null = null;

  if (!workingAccess && refreshToken) {
    refreshedAccess = await refreshAccessToken(refreshToken);
    workingAccess = refreshedAccess;
  }

  if (!workingAccess) {
    return { kind: "unauthenticated", reason: "expired" };
  }

  let profileResponse = await fetchProfile(workingAccess);
  if (profileResponse.status === 401 && refreshToken) {
    refreshedAccess = await refreshAccessToken(refreshToken);
    if (!refreshedAccess) {
      return { kind: "unauthenticated", reason: "expired" };
    }
    workingAccess = refreshedAccess;
    profileResponse = await fetchProfile(workingAccess);
  }

  if (!profileResponse.ok) {
    return {
      kind: "unauthenticated",
      reason: profileResponse.status === 401 ? "expired" : "invalid",
    };
  }

  const profile = parseProfile(await profileResponse.json());
  const accessDecision = getPortalAccessDecision(profile);
  if (accessDecision.kind === "redirect-employee") {
    return {
      kind: "redirect-employee",
      tokens: refreshedAccess ? { access: refreshedAccess } : undefined,
    };
  }

  return {
    kind: "authenticated",
    session: buildCustomerSession(profile),
    tokens: refreshedAccess ? { access: refreshedAccess } : undefined,
  };
}

export async function resolveSessionFromCookies(): Promise<SessionResolution> {
  const store = await cookies();
  return resolveSessionFromTokens(getActiveTokensFromStore(store));
}

export async function loginCustomer(email: string, password: string): Promise<SessionResolution & { tokens?: Partial<TokenPair> }> {
  const loginResponse = await backendFetch("/api/auth/login/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (!loginResponse.ok) {
    const data = await loginResponse.json().catch(() => ({}));
    const message =
      (data as { error?: string; detail?: string }).error ??
      (data as { error?: string; detail?: string }).detail ??
      "Login failed.";
    throw new Error(message);
  }

  const loginData = (await loginResponse.json()) as {
    tokens?: TokenPair;
  };
  const tokens = loginData.tokens;

  if (!tokens?.access || !tokens.refresh) {
    throw new Error("Backend login did not return tokens.");
  }

  const sessionResolution = await resolveSessionFromTokens(tokens);
  if (sessionResolution.kind === "authenticated") {
    return {
      ...sessionResolution,
      tokens: {
        refresh: tokens.refresh,
        ...(sessionResolution.tokens ?? {}),
        access: sessionResolution.tokens?.access ?? tokens.access,
      },
    };
  }

  return {
    ...sessionResolution,
    tokens,
  };
}

export async function logoutCustomer(): Promise<void> {
  const store = await cookies();
  const accessToken = store.get(ACCESS_COOKIE)?.value;
  const refreshToken = store.get(REFRESH_COOKIE)?.value;

  if (!refreshToken) {
    return;
  }

  await backendFetch("/api/auth/logout/", {
    method: "POST",
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : undefined,
    body: JSON.stringify({ refresh_token: refreshToken }),
  }).catch(() => undefined);
}

export async function hasSessionCookies(): Promise<boolean> {
  const store = await cookies();
  return Boolean(store.get(ACCESS_COOKIE)?.value || store.get(REFRESH_COOKIE)?.value);
}

export async function buildBackendRequest(input: {
  path: string;
  method: string;
  search: string;
  body?: string;
  contentType?: string | null;
}): Promise<{
  response: Response;
  refreshedAccessToken?: string;
}> {
  const store = await cookies();
  const { access, refresh } = getActiveTokensFromStore(store);
  let accessToken = access ?? null;
  let refreshedAccessToken: string | undefined;

  if (!accessToken && refresh) {
    const refreshed = await refreshAccessToken(refresh);
    if (refreshed) {
      accessToken = refreshed;
      refreshedAccessToken = refreshed;
    }
  }

  if (!accessToken) {
    return {
      response: new Response(JSON.stringify({ detail: "Authentication required." }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    };
  }

  const send = async (token: string) =>
    backendFetch(`/api/${input.path}${input.search}`, {
      method: input.method,
      headers: {
        ...(input.contentType ? { "Content-Type": input.contentType } : {}),
        Authorization: `Bearer ${token}`,
      },
      body: input.body,
    });

  let response = await send(accessToken);
  if (response.status === 401 && refresh) {
    const refreshed = await refreshAccessToken(refresh);
    if (!refreshed) {
      return {
        response,
      };
    }

    accessToken = refreshed;
    refreshedAccessToken = refreshed;
    response = await send(accessToken);
  }

  return {
    response,
    refreshedAccessToken,
  };
}
