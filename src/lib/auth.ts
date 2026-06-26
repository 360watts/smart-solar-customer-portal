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
}

export interface AuthSessionResponse {
  status: AuthStatus;
  session: CustomerSession | null;
  employeeAppUrl?: string | null;
  message?: string;
}

export class AuthRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthRequestError";
    this.status = status;
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
  const response = await fetch("/api/auth/session", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });

  return parseAuthResponse(response);
}

export async function loginWithPassword(email: string, password: string): Promise<AuthUser> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = (await response.json().catch(() => ({}))) as {
    message?: string;
    session?: CustomerSession;
  };

  if (!response.ok || !data.session) {
    throw new AuthRequestError(data.message ?? "Login failed.", response.status);
  }

  return mapSessionUser(data.session);
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
