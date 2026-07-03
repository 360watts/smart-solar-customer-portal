# Security Review: 360watts Customer Portal

Date: 2026-07-03

## Executive Summary

No critical vulnerability was found in the reviewed Next.js customer portal code. The strongest security posture is the server-side BFF model: raw access and refresh tokens are stored in `HttpOnly` cookies and backend calls go through Next.js route handlers, so the browser does not receive `API_BASE_URL` or JWTs.

The main production gaps are defense-in-depth issues around missing global security headers, CSRF protections for cookie-authenticated state-changing routes, and broad backend proxy routing. Route protection works for current portal paths, but the protection is split between `src/proxy.ts` and the portal layout, which makes future route additions easy to misconfigure.

## Positive Findings

- JWTs are not stored in `localStorage` or `sessionStorage`; client code uses same-origin requests and `withCredentials`.
- Session cookies are configured as `HttpOnly`, `SameSite=Lax`, and `Secure` in production by default.
- Public route `/dashboard` redirects unauthenticated users to `/auth/login` in local smoke testing.
- Backend access is centralized through `/api/backend/[...path]`, keeping `API_BASE_URL` server-side.
- `.env` exists locally but is not tracked; `.env.example` is the only env file listed by `git ls-files`.
- No `dangerouslySetInnerHTML`, `eval`, `new Function`, `document.write`, or obvious DOM HTML injection sink was found in `src/`.

## Findings

### 1. Missing Global Security Headers

Rule ID: NEXT-HEADERS-001  
Severity: Medium  
Location: `next.config.ts:17-38`

Evidence:

```ts
const nextConfig: NextConfig = {
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/api/backend/sites/:siteId/forecast/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=900, stale-while-revalidate=60" }],
      },
```

Runtime smoke test of `http://localhost:3000/` also showed `X-Powered-By: Next.js` and did not show app-level `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, or frame protection headers.

Impact: If an XSS or content injection bug appears later, the browser has fewer layers to limit script execution, framing, MIME confusion, referrer leakage, or unnecessary browser APIs.

Fix: Add global headers in `next.config.ts` and set `poweredByHeader: false`. Start with:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY` or CSP `frame-ancestors 'none'`
- `Permissions-Policy` limiting unused browser capabilities
- A CSP tailored to current Next.js/font/image/script needs

False positive notes: Some of these may be set by a CDN or hosting edge layer in production. They are not visible in app code or the local runtime response.

### 2. Cookie-Authenticated Mutations Lack Explicit CSRF Origin/Token Checks

Rule ID: NEXT-CSRF-001  
Severity: Medium  
Location: `src/app/api/auth/login/route.ts:11`, `src/app/api/auth/logout/route.ts:5`, `src/app/api/backend/[...path]/route.ts:68-84`

Evidence:

```ts
export async function POST(request: Request) {
```

```ts
export async function POST() {
```

```ts
export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handleRequest(request, context);
}
export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handleRequest(request, context);
}
export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handleRequest(request, context);
}
export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handleRequest(request, context);
}
```

Impact: `SameSite=Lax` is a good baseline, but explicit CSRF protection is still recommended for cookie-authenticated state-changing endpoints. Same-site subdomain compromise, browser edge cases, or future cookie setting changes could allow unwanted authenticated mutations such as alert acknowledgement, profile update, password change, or logout.

Fix: Add an origin check or CSRF token requirement for state-changing route handlers. A minimal server-side origin check should compare `Origin` or `Referer` against the app origin for `POST`, `PUT`, `PATCH`, and `DELETE`.

Mitigation: Keep `SameSite=Lax` or stricter, keep cookies `HttpOnly`, and avoid widening CORS. Do not switch JWTs to browser storage.

False positive notes: If the upstream Django API enforces CSRF or strict origin validation, that mitigates part of the risk, but the BFF route handlers currently do not show this protection.

### 3. Generic Backend Proxy Exposes All Authenticated Backend API Paths

Rule ID: NEXT-BFF-001  
Severity: Medium  
Location: `src/app/api/backend/[...path]/route.ts:128-152`, `src/lib/server-auth.ts:411-420`

Evidence:

```ts
path: params.path.join("/"),
method: request.method,
search: request.nextUrl.search,
body,
contentType: request.headers.get("content-type"),
```

```ts
backendFetch(`/api/${input.path}${input.search}`, {
  method: input.method,
  headers: {
    ...(input.contentType ? { "Content-Type": input.contentType } : {}),
    ...(input.forwardHeaders ?? {}),
    Authorization: `Bearer ${token}`,
  },
  body: input.body,
});
```

Impact: Any authenticated customer can attempt any backend `/api/...` path through the BFF. Backend authorization should still be the primary control, but a broad proxy increases blast radius if a backend endpoint has weak role checks, exposes staff-only data, or accepts unsafe methods.

Fix: Add a BFF allowlist of customer-facing endpoint patterns and allowed methods. Reject everything else with `404` or `403` before calling Django.

Mitigation: Keep backend authorization strict, audit backend endpoints for customer/staff separation, and log rejected/unknown proxy paths once an allowlist exists.

False positive notes: This may be intentional during rapid development, and backend permissions may be strong. For production, the BFF should still narrow its exposed surface.

### 4. Route Protection Is Split and Future Routes Can Be Missed

Rule ID: NEXT-ROUTING-001  
Severity: Medium  
Location: `src/proxy.ts:15-28`, `src/proxy.ts:72-85`, `src/app/(portal)/layout.tsx:18-20`

Evidence:

```ts
function isProtectedPath(pathname: string): boolean {
  return [
    "/dashboard",
    "/solar",
    "/consumption",
    "/history",
    "/savings",
    "/weather",
    "/alerts",
    "/device",
    "/care",
    "/profile",
  ].some((path) => pathname === path || pathname.startsWith(`${path}/`));
}
```

```ts
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/auth/login",
    "/solar/:path*",
    ...
  ],
};
```

```ts
if (!(await hasSessionCookies())) {
  redirect("/auth/login");
}
```

Impact: Current protected routes are covered, but route protection depends on manually keeping two path lists in sync with the `(portal)` route group. If a new portal page is added and not added to `src/proxy.ts`, the layout only checks for cookie presence, not backend-valid authentication.

Fix: Make the portal layout perform full session resolution, or move all portal URLs under a shared prefix such as `/portal/*` so a single matcher protects the full authenticated surface.

Mitigation: Add a test that enumerates portal routes and asserts unauthenticated redirects. Add a comment near new portal route creation docs requiring proxy matcher updates.

False positive notes: The current known routes redirect correctly in local smoke testing. This is a maintainability/security regression risk for future routes.

### 5. Session Cache Cookie Is Trusted Without Integrity Checking on Fast Path

Rule ID: NEXT-SESSION-001  
Severity: Low to Medium  
Location: `src/lib/server-auth.ts:270-279`

Evidence:

```ts
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
```

Impact: The session cache is `HttpOnly`, but a user can still set arbitrary cookies for their own browser. If a future route bypasses proxy validation, this fast path could trust a forged session cache paired with a syntactically fresh-looking access token. Current protected routes are largely mitigated by `src/proxy.ts`, which resolves the session against the backend.

Fix: Sign the session cache cookie with an HMAC, encrypt it, or replace it with an opaque server-side cache key. Alternatively, only use the cache for display optimization after a backend-verified request, not for authentication decisions.

Mitigation: Keep middleware/proxy validation on every protected route, and avoid using cached session data for authorization.

False positive notes: Current routing makes exploitation unlikely for known routes, because `src/proxy.ts` validates tokens with the backend before protected pages are reached.

### 6. Login Endpoint Has No App-Level Rate Limit or Brute-Force Guard

Rule ID: NEXT-AUTH-001  
Severity: Low to Medium  
Status: **Verified mitigated at the backend (2026-07-03) — no action needed.**  
Location: `src/app/api/auth/login/route.ts:11-25`

Evidence:

```ts
const { email, password } = (await request.json()) as {
  email?: string;
  password?: string;
};
...
const result = await loginCustomer(email, password);
```

The Next.js BFF itself has no app-level rate limit, as originally flagged. However, `loginCustomer` calls the Django backend's `POST /api/auth/login/`, which is decorated with `@ratelimit(key='ip', rate='5/m', block=True)` (`smart-solar-django-backend/api/views/auth.py:306-309`). Confirmed by direct inspection of the backend repo — this is not inferred or assumed.

Impact: None currently — brute-force attempts are blocked at 5/minute per IP by the backend before they reach the point of a credential check, regardless of the BFF layer being unprotected on its own.

Fix: No fix required. If the backend rate limit is ever removed or its `rate`/`key` changed, re-flag this at the BFF layer as defense-in-depth.

False positive notes: N/A — resolved as verified-mitigated, not a false positive.

## Routing Assessment

- Public marketing route `/` is public as expected.
- `/auth/login` redirects authenticated users to `/dashboard`.
- Current portal routes are listed in `src/proxy.ts` and unauthenticated `/dashboard` returns a 307 redirect to `/auth/login` in local smoke testing.
- API auth routes are intentionally public where required for login/session/logout.
- `/api/backend/[...path]` requires a valid access token or refresh path before forwarding, but it is a broad proxy and should be allowlisted before production hardening is considered complete.

## Recommended Fix Order

1. Add global security headers and disable `X-Powered-By`.
2. Add CSRF origin checks for state-changing route handlers.
3. Add an allowlist for `/api/backend/[...path]` customer endpoints and methods.
4. Replace portal layout cookie-presence check with full session validation or consolidate portal routes under one protected prefix.
5. Sign or remove trust from the session cache cookie fast path.
6. Confirm backend/edge login rate limiting and document where it is enforced.

## Verification Commands Run

- `rg` scans for route handlers, cookie/session code, DOM XSS sinks, env usage, and public/client exposure.
- `git ls-files .env .env.example` confirmed only `.env.example` is tracked.
- `curl -I http://localhost:3000/` checked runtime response headers.
- `curl -I http://localhost:3000/dashboard` confirmed unauthenticated redirect to `/auth/login`.
- `curl -I http://localhost:3000/api/auth/session` confirmed unauthenticated session response clears session cookies.
