import type { CustomerSession, SessionMembership } from "@/lib/session";

export type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "session_expired";

export interface AuthUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string | null;
  memberships: SessionMembership[];
  site_id: string | null;
  plan_type: string | null;
  subscription_status: string | null;
}

export interface AuthSessionResponse {
  status: AuthStatus;
  session: CustomerSession | null;
  employeeAppUrl?: string | null;
  message?: string;
}

export class AuthRequestError extends Error {
  status: number;
  employeeAppUrl?: string | null;

  constructor(message: string, status: number, employeeAppUrl?: string | null) {
    super(message);
    this.name = "AuthRequestError";
    this.status = status;
    this.employeeAppUrl = employeeAppUrl ?? null;
  }
}

function mapSessionUser(session: CustomerSession): AuthUser {
  return {
    ...session.user,
    site_id: session.activeSiteId,
  };
}

async function parseAuthResponse(response: Response): Promise<AuthSessionResponse> {
  const data = (await response.json().catch(() => ({}))) as Partial<AuthSessionResponse>;

  if (!response.ok) {
    throw new AuthRequestError(
      data.message ?? "Authentication request failed.",
      response.status,
      data.employeeAppUrl,
    );
  }

  return {
    status: data.status ?? "unauthenticated",
    session: data.session ?? null,
    employeeAppUrl: data.employeeAppUrl ?? null,
    message: data.message,
  };
}

export async function loadSession(): Promise<AuthSessionResponse> {
  const signal = AbortSignal.timeout(8_000);
  try {
    const response = await fetch("/api/auth/session", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      signal,
    });
    return parseAuthResponse(response);
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      throw new AuthRequestError("Session check timed out.", 504);
    }
    throw err;
  }
}

export async function loginWithPassword(
  email: string,
  password: string,
): Promise<AuthUser> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = (await response.json().catch(() => ({}))) as {
    message?: string;
    session?: CustomerSession;
    employeeAppUrl?: string | null;
  };

  if (!response.ok || !data.session) {
    // Preserve employeeAppUrl so the login page can offer the staff app redirect.
    throw new AuthRequestError(
      data.message ?? "Login failed.",
      response.status,
      data.employeeAppUrl,
    );
  }

  return mapSessionUser(data.session);
}

export async function registerWithInvite(data: {
  invite_token: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}): Promise<AuthUser> {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const responseData = (await response.json().catch(() => ({}))) as {
    message?: string;
    session?: CustomerSession;
  };

  if (!response.ok || !responseData.session) {
    throw new AuthRequestError(responseData.message ?? "Registration failed.", response.status);
  }

  return mapSessionUser(responseData.session);
}

export async function logoutSession(): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "same-origin",
  });
}

export function getUserFromSession(session: CustomerSession | null): AuthUser | null {
  return session ? mapSessionUser(session) : null;
}
