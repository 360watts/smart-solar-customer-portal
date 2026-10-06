@AGENTS.md

# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Overview

`smart-solar-customer-portal` is the customer-facing web app for the 360Watts solar platform. Next.js 16 (App Router) + React 19 + TypeScript, deployed on Vercel. It talks to the `smart-solar-django-backend` REST API (never directly to the database) and renders live solar generation, consumption, savings, device health, weather, and 360Care service data for logged-in customers.

Note: `AGENTS.md` (auto-loaded above) warns that this Next.js version has breaking changes vs. training data — check `node_modules/next/dist/docs/` before relying on remembered Next.js APIs/conventions.

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # ESLint
npm test         # Vitest (npm run test -- --watch for watch mode)
```

## Environment

Copy `.env.example` to `.env.local` (gitignored). Key vars:
- `API_BASE_URL` — Django backend base URL, **server-only**, never exposed to the browser
- `EMPLOYEE_APP_URL` — optional; staff users logging in here get redirected to the staff app
- `AUTH_COOKIE_SECURE` — set `"false"` for local HTTP dev; defaults to `true`/secure in production

## Architecture

### Routing (`src/app/`)
- `(portal)/` — authenticated route group: `page.tsx` (overview) plus `solar/`, `consumption/`, `savings/`, `device/`, `weather/`, `alerts/`, `history/`, `profile/`, `care/`, each with its own `layout.tsx`/`page.tsx`
- `auth/login/` — login flow
- `unauthorized/` — shown when a staff account hits the customer portal (redirects via `EMPLOYEE_APP_URL`)
- `api/auth/` — Next.js route handlers that proxy auth (login, refresh, logout) to the Django backend and set httpOnly cookies
- ~~`api/backend/`~~ — **removed 2026-09**, see `docs/DIRECT_API_MIGRATION_2026-09.md`. It proxied every data call through this app's own server, which on Vercel meant a US serverless function handling real-time generation data + PII on every page load — an MNRE data-residency violation. Data calls now go straight from the browser to `api.360watts.com`.

### Auth model
- `src/lib/session.ts` — `CustomerSession` / `SessionMembership` types and session helpers
- `src/lib/server-auth.ts` — server-side session/cookie reading (Route Handlers, Server Components). Login/refresh/logout/register/password-setup are still fully server-mediated (unchanged by the 2026-09 migration) — only the resulting **access token** is also handed to the browser (see below), the refresh token never leaves this server's httpOnly cookie.
- `src/lib/auth.ts` — client-side `AuthUser`/`AuthStatus` types, `AuthRequestError`
- `src/lib/apiToken.ts` — in-memory (not persisted) store for the browser-side access token used by `src/lib/api.ts` to call the Django API directly
- `src/lib/tokens.ts` — JWT access/refresh token handling
- `src/contexts/AuthContext.tsx` — client auth context/provider consumed by portal pages; seeds/clears `apiToken.ts` on login/refresh/logout
- The refresh token is an httpOnly cookie set by `api/auth/*` route handlers, never sent to the browser. The short-lived access token (~55 min) *is* sent to the browser in the `api/auth/*` JSON response bodies, held only in the `apiToken.ts` module var — never localStorage/sessionStorage/a cookie.

### Data layer
- `src/lib/api.ts` — shared `axios` instance pointed at `NEXT_PUBLIC_API_BASE_URL` (`api.360watts.com` directly, not this app), attaches `Authorization: Bearer` from `apiToken.ts` via a request interceptor, and on a 401 calls `GET /api/auth/session` once to refresh the token before retrying (`handle401`, unit-tested in `api.handle401.test.ts`) — plus response types (e.g. `SavingsData`) for backend payloads
- `src/lib/portalCache.ts` — client-side caching for portal data fetches
- `src/lib/careBooking.ts` + `src/lib/care/` — 360Care service booking flow
- `src/lib/hooks/` — shared data-fetching/UI hooks (`useAssistantStream.ts` also calls the Django API directly now, same pattern)

### UI
- `src/components/layout/` — `PortalSidebar.tsx` (shared portal chrome)
- `src/components/ui/` — reusable UI primitives (cards, gauges, KPI tiles, charts)
- `src/components/care/` — 360Care-specific components
- Charts via `chart.js` / `react-chartjs-2` (+ `chartjs-plugin-zoom`); animation via `framer-motion`; icons via `lucide-react`
- Fonts: DM Sans, JetBrains Mono, Syne (via `@fontsource/*`)
- Styling: Tailwind CSS v4

## Conventions

- **Data reads/writes call the Django backend directly** from client components via `src/lib/api.ts` / `useAssistantStream.ts` (`NEXT_PUBLIC_API_BASE_URL`) — this reversed a prior "always proxy through this server" rule after that proxy was found to route real generation data through a US Vercel function (`docs/DIRECT_API_MIGRATION_2026-09.md`). **Auth stays server-mediated** — login/refresh/logout/register/password-setup go through `api/auth/*` Route Handlers, which is where the refresh token and `API_BASE_URL` (server-only var) stay; never read `API_BASE_URL` or the refresh-token cookie from a client component.
- Prefer real API data over mocks in portal pages (recent history: mocks have been progressively replaced with live data across solar, savings, alerts pages)
- Guard against SSR/client hydration mismatches when reading session/auth state (see `ccbf3de fix(portal): address critical reviewer findings — alerts loaded race, SSR hydration, device Promise.all` in git history)
- Use `Promise.all` carefully for parallel device/API calls — a past bug involved unguarded parallel calls on the device page
- Type hints/interfaces for all API response shapes (see `SavingsData` in `src/lib/api.ts` as the pattern)

## Cross-Repo Context

Part of the 360Watts platform (see workspace-level `CLAUDE.md` in `360watts-data` for full platform picture):
- Backend: `smart-solar-django-backend` (Django REST API at `api.360watts.com`; self-hosted on AWS Mumbai `ap-south-1` since 2026-09-08 — moved off Railway for MNRE data-residency compliance)
- Staff dashboard: `smart-solar-react-frontend`
- Mobile app: `smart-solar-fieldops-mobile`
- Forecast data ultimately comes from `360watts-data` → `solar_forecasting`/`360watts-ml-core` → Lambda inference → Django backend → this portal

## Production Fault Log

Faults, root causes and fixes are recorded in [`FAULT_LOG.md`](./FAULT_LOG.md) at the repo root (create it with the first entry).

**Workflow:** discover fault → open GitHub Issue → fix (reference the issue # in commits) → append an entry to `FAULT_LOG.md` → close the issue.

## Shared workflow rules (all 360watts repos)

Keep this block identical in every repo's CLAUDE.md. When you change it, change it everywhere.

- **No auto-commit or deploy:** confirm with the user before `git commit`, `git push`, merging to main, or deploying.
- **No AI attribution in commits:** leave `Co-Authored-By: Claude ...` lines out of commit messages.
- **Test scenario document for every new feature:** `docs/test-scenarios/<feature>.md`, written before the tests.
  - Contents: given / when / then rows grouped by area, a type (unit / integration / live), a priority (P0–P3) and a status (`planned` → `written` → `passing` → `live-verified`).
  - Include the edge cases found in design review, and a live-verification section.
  - Update the Status column in the same change that adds or fixes a test.
  - Example: `smart-solar-django-backend/docs/test-scenarios/inverter-settings-history.md`.
