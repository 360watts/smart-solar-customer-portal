# Data calls moved off the Vercel BFF proxy — direct to `api.360watts.com` (2026-09)

## Why

This app's `src/app/api/backend/[...path]/route.ts` proxied **every** dashboard/
solar/consumption/history/alerts/device/support/booking call from the browser
through a Next.js Route Handler — i.e. a Vercel serverless function. No
`preferredRegion` was set anywhere, so it ran in Vercel's default region
(`iad1`, US). That meant **real-time generation data and customer PII passed
through a US server on every single portal page load** — an MNRE
data-residency violation (`smart-solar-django-backend/docs/
DATA_RESIDENCY_MNRE_COMPLIANCE_2026-09.md`), and a much bigger one than the
already-known-and-fixed AI-chat-via-OpenRouter issue: that one was gated by a
kill switch and optional; this fired unconditionally on ordinary use.

The staff dashboard (`smart-solar-react-frontend`, a Vite SPA) never had this
problem — it always called `api.360watts.com` directly from the browser. This
migration brings the customer portal in line with that, for data calls only.

## What changed

**Data reads/writes (`src/lib/api.ts`, `src/lib/hooks/useAssistantStream.ts`)**
now call `NEXT_PUBLIC_API_BASE_URL` (`api.360watts.com`) directly from the
browser with `Authorization: Bearer <token>`, not through this app's server.
`src/app/api/backend/` is deleted.

**Auth (login/refresh/logout/register/password-setup) is unchanged** —
still server-mediated via `src/app/api/auth/*` and `src/lib/server-auth.ts`.
The refresh token still never leaves this server's own httpOnly cookie. Only
the short-lived (~55 min) **access** token is now also handed to the browser
(`GET /api/auth/session` and the login/register/set-password routes return it
in the JSON body alongside the existing cookie-setting), held in a plain
in-memory module variable (`src/lib/apiToken.ts` — never localStorage,
sessionStorage, or a cookie), and attached by `src/lib/api.ts`'s request
interceptor.

### Why auth stayed server-side (the surgical-fix reasoning)

A full migration to Django's own cross-origin cookie auth
(`api/cookie_auth.py::CookieJWTAuthentication`, already built and proven by
the staff app) was considered and is the architecturally "purer" end state.
It was **not** done here because it touches a materially larger, already
hardened surface: `src/proxy.ts` (edge middleware doing redirect-based
gating), the session-cache cookie (avoids a `/api/profile/` round-trip per
page load), refresh-token-rotation persistence (a bug class already fought
and fixed once — see the comments in `server-auth.ts` referencing a ~10-minute
forced-logout incident), and the employee-account redirect check. Rewriting
all of that under time pressure risked a customer-facing incident (broken
dashboards, mass logouts) to fix a compliance problem that this narrower
change already fully solves — the login flow itself carries only credentials
and a profile summary, not generation data, so keeping it server-mediated is
a much lower residency stake than the bulk telemetry traffic that has now
moved.

**Blast-radius note on the exposed access token:** it's a 55-minute-lived JWT,
never persisted client-side. An XSS bug could steal it for its remaining
lifetime; it cannot mint a new session (no refresh capability) or survive a
page reload. This is a smaller exposure than the alternative of storing the
refresh token in the browser, and the same reduced-risk shape the staff
frontend's in-memory CSRF token already uses.

## What to verify before/after deploying

- [ ] `CORS_ALLOWED_ORIGINS` on the backend includes this app's real production
      origin (`https://www.360watts.com` or whatever it resolves to) —
      **ops step, not done by this change**. `CORS_ALLOW_CREDENTIALS=True` is
      already set; Bearer-header requests don't need cookies at all for the
      data calls, only `Authorization` needs to be an allowed CORS header
      (already is, via `django-cors-headers`' defaults / `CORS_ALLOW_HEADERS`).
- [ ] `NEXT_PUBLIC_API_BASE_URL` set in the deployment environment, matching
      `API_BASE_URL` (see `.env.example`) — the build fails loudly
      (`next.config.ts`) if it's missing.
- [ ] The CSP `connect-src` in `next.config.ts` includes
      `NEXT_PUBLIC_API_BASE_URL` — done in this change, but re-check if that
      env var ever changes.
- [ ] Cross-browser check, **Safari/iOS specifically** — this app's login
      cookies stay same-origin (unaffected by this change) so there's no new
      third-party-cookie risk, but this is the first time the app does
      cross-origin `fetch` at all; confirm no unexpected CORS/preflight issue
      in Safari.
- [ ] A real end-to-end smoke test: log in, view the dashboard, let the tab
      sit past the ~55-minute access-token TTL, confirm a subsequent action
      triggers the silent refresh-and-retry (`src/lib/api.ts::handle401`) —
      look for a `POST /api/auth/session` call in the network tab followed by
      the original request succeeding, no visible reload or re-login.

## Deferred, not done in this pass

- **Cache-Control on `forecast`/`energy-summary`** — this app's
  `next.config.ts` used to add `Cache-Control: public, max-age=...` on those
  two proxied paths so Cloudflare could cache them at the edge. That rule is
  removed (the paths it matched no longer exist), but the equivalent header
  hasn't been added on the Django views yet. Low value — two low-traffic
  read endpoints — but worth doing directly on `site_forecast` /
  `site_energy_summary` (`smart-solar-django-backend/api/views/`) rather than
  re-introducing a Vercel-side rule.
- **Full migration to `CookieJWTAuthentication`** (removing `server-auth.ts`'s
  server-mediated login/refresh entirely) — the architecturally cleaner end
  state, deferred per the reasoning above. Revisit once there's time for a
  proper cross-browser QA pass on the auth flow specifically.
