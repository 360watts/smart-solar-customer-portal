/**
 * In-memory store for the short-lived (~55 min) access token used to call
 * api.360watts.com directly from the browser (see src/lib/api.ts). Never
 * persisted (no localStorage/sessionStorage/cookie) — lost on refresh, which
 * is fine: AuthProvider re-seeds it from GET /api/auth/session on mount.
 *
 * The refresh token never leaves the Next.js server's own httpOnly cookie,
 * so an XSS bug can at most steal this token for its remaining lifetime
 * (minutes), not mint a new session — the same reduced-blast-radius pattern
 * the staff frontend's CSRF token uses (smart-solar-react-frontend/src/services/api.ts).
 */
let _token: string | null = null;

export function getApiToken(): string | null {
  return _token;
}

export function setApiToken(token: string | null): void {
  _token = token;
}

// Lets api.ts (no React access) tell AuthContext "the session is really gone"
// after a 401 survives a session-refresh retry, so AuthContext's existing
// logout()/redirect flow runs instead of duplicating it here.
let _onExpired: (() => void) | null = null;

export function onSessionExpired(handler: (() => void) | null): void {
  _onExpired = handler;
}

export function notifySessionExpired(): void {
  _onExpired?.();
}
