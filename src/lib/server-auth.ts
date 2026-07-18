import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  buildCustomerSession,
  getPortalAccessDecision,
  validateProfile,
  type BackendProfile,
  type CustomerSession,
} from "@/lib/session";

/**
 * Reject cross-origin state-changing requests to cookie-authenticated BFF
 * routes. SameSite=Lax cookies already block most cross-site form/fetch
 * submissions, but this is explicit defense-in-depth per the security review
 * (NEXT-CSRF-001) rather than relying solely on cookie attributes.
 *
 * Modern browsers send `Origin` on every same-origin POST/PUT/PATCH/DELETE
 * fetch, so an absent-or-mismatched Origin on a state-changing request is
 * treated as untrusted. Falls back to `Referer` only if `Origin` is missing
 * entirely (some non-fetch navigations omit it).
 */
export function isSameOriginRequest(request: Request): boolean {
  const requestOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  if (origin) return origin === requestOrigin;

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin === requestOrigin;
    } catch {
      return false;
    }
  }

  // Neither header present — reject rather than assume same-origin.
  return false;
}

export const ACCESS_COOKIE = "360w_portal_access";
export const REFRESH_COOKIE = "360w_portal_refresh";
// Caches the CustomerSession JSON for the lifetime of the access token.
// Avoids a backend /api/profile/ round-trip on every page load while the token is fresh.
const SESSION_CACHE_COOKIE = "360w_portal_session";
const SESSION_CACHE_MAX_AGE = 60 * 4; // 4 min — slightly less than the 5 min access token TTL

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
  const url = process.env.API_BASE_URL ?? "";
  if (!url) {
    throw new Error("API_BASE_URL environment variable is not set.");
  }
  return url.replace(/\/$/, "");
}

export function getEmployeeAppUrl(): string | null {
  return process.env.EMPLOYEE_APP_URL ?? null;
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

export function applySessionCookies<T = unknown>(
  response: NextResponse<T>,
  tokens: Partial<TokenPair>,
): NextResponse<T> {
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

export function clearSessionCookies<T = unknown>(response: NextResponse<T>): NextResponse<T> {
  response.cookies.set(ACCESS_COOKIE, "", { ...getCookieOptions(), maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, "", { ...getCookieOptions(), maxAge: 0 });
  return response;
}

// ── JWT helpers ───────────────────────────────────────────────────────────────

/** Decode the JWT payload (no signature verification — just inspect the exp claim). */
function decodeJwtExp(token: string): number | null {
  try {
    const part = token.split(".")[1];
    const decoded = JSON.parse(Buffer.from(part, "base64url").toString()) as { exp?: unknown };
    return typeof decoded.exp === "number" ? decoded.exp : null;
  } catch {
    return null;
  }
}

/** True when the access token won't expire for at least 10 more seconds. */
function isTokenFresh(token: string): boolean {
  const exp = decodeJwtExp(token);
  return exp !== null && exp > Math.floor(Date.now() / 1000) + 10;
}

// ── Session cache cookie helpers ──────────────────────────────────────────────

export function applySessionCache<T = unknown>(
  response: NextResponse<T>,
  session: CustomerSession,
): NextResponse<T> {
  response.cookies.set(SESSION_CACHE_COOKIE, JSON.stringify(session), {
    ...getCookieOptions(),
    maxAge: SESSION_CACHE_MAX_AGE,
  });
  return response;
}

export function clearSessionCache<T = unknown>(response: NextResponse<T>): NextResponse<T> {
  response.cookies.set(SESSION_CACHE_COOKIE, "", { ...getCookieOptions(), maxAge: 0 });
  return response;
}

// ── Backend fetch helpers ──────────────────────────────────────────────────────

const BACKEND_TIMEOUT_MS = 10_000;

async function backendFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);
  try {
    return await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchProfile(accessToken: string): Promise<Response> {
  return backendFetch("/api/profile/", {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// ── Refresh token singleton ────────────────────────────────────────────────────
// Prevents the token-refresh race: when multiple parallel requests (Promise.all
// in portal pages) hit an expired access token simultaneously, only one refresh
// call is made. All callers share the same in-flight promise.
// The singleton is cleared immediately after resolution so the next expiry cycle
// triggers a fresh refresh.

let _refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = backendFetch("/api/auth/token/refresh/", {
    method: "POST",
    body: JSON.stringify({ refresh: refreshToken }),
  })
    .then(async (res) => {
      if (!res.ok) return null;
      const data = (await res.json()) as { access?: string };
      return data.access ?? null;
    })
    .catch(() => null)
    .finally(() => {
      _refreshPromise = null;
    });

  return _refreshPromise;
}

function getActiveTokensFromStore(
  store: Awaited<ReturnType<typeof cookies>>,
): Partial<TokenPair> {
  return {
    access: store.get(ACCESS_COOKIE)?.value,
    refresh: store.get(REFRESH_COOKIE)?.value,
  };
}

// ── Session resolution ─────────────────────────────────────────────────────────

export async function resolveSessionFromTokens(
  tokens: Partial<TokenPair>,
): Promise<SessionResolution> {
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

  let profile: BackendProfile;
  try {
    profile = validateProfile(await profileResponse.json());
  } catch {
    return { kind: "unauthenticated", reason: "invalid" };
  }

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
  const { access, refresh } = getActiveTokensFromStore(store);

  // Fast path: access token still fresh → read cached session, skip the backend call.
  if (access && isTokenFresh(access)) {
    const raw = store.get(SESSION_CACHE_COOKIE)?.value;
    if (raw) {
      try {
        const session = JSON.parse(raw) as CustomerSession;
        return { kind: "authenticated", session };
      } catch {
        // Corrupt cookie — fall through to full resolution below.
      }
    }
  }

  return resolveSessionFromTokens({ access, refresh });
}

// ── Login ──────────────────────────────────────────────────────────────────────

export async function loginCustomer(
  email: string,
  password: string,
): Promise<SessionResolution & { tokens?: Partial<TokenPair> }> {
  let loginResponse: Response;
  try {
    loginResponse = await backendFetch("/api/auth/login/", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  } catch (err) {
    // Network-level failure (timeout, DNS, Railway down) — not a credential error.
    const isTimeout = err instanceof Error && err.name === "AbortError";
    throw Object.assign(
      new Error(isTimeout ? "Login timed out. Please try again." : "Cannot reach the server. Please try again later."),
      { isNetworkError: true },
    );
  }

  if (!loginResponse.ok) {
    const data = await loginResponse.json().catch(() => ({}));
    const message =
      (data as { error?: string; detail?: string }).error ??
      (data as { error?: string; detail?: string }).detail ??
      "Login failed.";
    throw new Error(message);
  }

  const loginData = (await loginResponse.json()) as { tokens?: TokenPair };
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

  return { ...sessionResolution, tokens };
}

// ── Registration (invite-only — see api/views/auth.py register_user) ───────────

export async function registerCustomerFromInvite(data: {
  invite_token: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}): Promise<SessionResolution & { tokens?: Partial<TokenPair> }> {
  let registerResponse: Response;
  try {
    registerResponse = await backendFetch("/api/auth/register/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "AbortError";
    throw Object.assign(
      new Error(isTimeout ? "Registration timed out. Please try again." : "Cannot reach the server. Please try again later."),
      { isNetworkError: true },
    );
  }

  if (!registerResponse.ok) {
    const responseData = await registerResponse.json().catch(() => ({}));
    const message =
      (responseData as { error?: string; detail?: string }).error ??
      (responseData as { error?: string; detail?: string }).detail ??
      "Registration failed.";
    throw new Error(message);
  }

  const registerData = (await registerResponse.json()) as { tokens?: TokenPair };
  const tokens = registerData.tokens;

  if (!tokens?.access || !tokens.refresh) {
    throw new Error("Backend registration did not return tokens.");
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

  return { ...sessionResolution, tokens };
}

// ── Password setup (staff-created accounts — see api/password_setup.py) ───────

export async function getPasswordSetupInfo(
  token: string,
): Promise<{ email: string; first_name: string; expires_at: string } | null> {
  const response = await backendFetch(`/api/auth/password-setup/${token}/`, { method: "GET" });
  if (!response.ok) return null;
  return (await response.json()) as { email: string; first_name: string; expires_at: string };
}

export async function completePasswordSetup(
  token: string,
  password: string,
): Promise<SessionResolution & { tokens?: Partial<TokenPair> }> {
  let response: Response;
  try {
    response = await backendFetch(`/api/auth/password-setup/${token}/`, {
      method: "POST",
      body: JSON.stringify({ password }),
    });
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "AbortError";
    throw Object.assign(
      new Error(isTimeout ? "Request timed out. Please try again." : "Cannot reach the server. Please try again later."),
      { isNetworkError: true },
    );
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message =
      (data as { error?: string; detail?: string }).error ??
      (data as { error?: string; detail?: string }).detail ??
      "Unable to set password.";
    throw new Error(message);
  }

  const setupData = (await response.json()) as { tokens?: TokenPair };
  const tokens = setupData.tokens;

  if (!tokens?.access || !tokens.refresh) {
    throw new Error("Backend did not return session tokens.");
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

  return { ...sessionResolution, tokens };
}

// ── Logout ─────────────────────────────────────────────────────────────────────

export async function logoutCustomer(): Promise<void> {
  const store = await cookies();
  const accessToken = store.get(ACCESS_COOKIE)?.value;
  const refreshToken = store.get(REFRESH_COOKIE)?.value;

  if (!refreshToken) return;

  // Best-effort token blacklist — use `refresh` (not `refresh_token`) per SimpleJWT spec.
  await backendFetch("/api/auth/logout/", {
    method: "POST",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    body: JSON.stringify({ refresh: refreshToken }),
  }).catch(() => undefined);
}

export async function hasSessionCookies(): Promise<boolean> {
  const store = await cookies();
  return Boolean(store.get(ACCESS_COOKIE)?.value || store.get(REFRESH_COOKIE)?.value);
}

// ── BFF proxy request builder ──────────────────────────────────────────────────

// Headers from Django responses that are safe and useful to forward to the client.
const FORWARDED_RESPONSE_HEADERS = [
  "cache-control",
  "x-request-id",
  "x-ratelimit-limit",
  "x-ratelimit-remaining",
  "x-ratelimit-reset",
  "retry-after",
];

export async function buildBackendRequest(input: {
  path: string;
  method: string;
  search: string;
  body?: string;
  contentType?: string | null;
  forwardHeaders?: Record<string, string>;
}): Promise<{
  response: Response;
  refreshedAccessToken?: string;
  forwardHeaders: Record<string, string>;
  /** True only when the 401 means the JWT itself has expired/invalid (clear cookies). */
  tokenExpired?: boolean;
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

  // GET /site-invites/<token>/ is AllowAny on the Django side — an invitee
  // clicking a link/QR code has no session yet, so this must reach the
  // backend without a token instead of being short-circuited to a 401 here.
  const isPublicPath = input.method === "GET" && /^site-invites\/[^/]+\/?$/.test(input.path);

  if (!accessToken && !isPublicPath) {
    // No usable token at all — the session has genuinely expired.
    return {
      response: new Response(JSON.stringify({ detail: "Authentication required." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
      forwardHeaders: {},
      tokenExpired: true,
    };
  }

  const send = (token: string | null) =>
    backendFetch(`/api/${input.path}${input.search}`, {
      method: input.method,
      headers: {
        ...(input.contentType ? { "Content-Type": input.contentType } : {}),
        ...(input.forwardHeaders ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: input.body,
    });

  let response = await send(accessToken);

  if (response.status === 401 && refresh) {
    const refreshed = await refreshAccessToken(refresh);
    if (!refreshed) {
      // Refresh failed — token is genuinely expired.
      return { response, forwardHeaders: {}, tokenExpired: true };
    }
    accessToken = refreshed;
    refreshedAccessToken = refreshed;
    response = await send(accessToken);

    if (response.status === 401) {
      // Still 401 after a successful token refresh — the endpoint is denying access
      // to this specific resource (should ideally be 403), not expiring the session.
      // Return 403 so the BFF does NOT clear session cookies.
      return {
        response: new Response(JSON.stringify({ detail: "Access denied." }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }),
        refreshedAccessToken,
        forwardHeaders: {},
        tokenExpired: false,
      };
    }
  }

  // Collect safe Django response headers to forward to the client.
  const forwardHeaders: Record<string, string> = {};
  for (const header of FORWARDED_RESPONSE_HEADERS) {
    const value = response.headers.get(header);
    if (value) forwardHeaders[header] = value;
  }

  return { response, refreshedAccessToken, forwardHeaders, tokenExpired: false };
}
