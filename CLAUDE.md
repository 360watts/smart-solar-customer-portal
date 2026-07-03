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
- `api/backend/` — generic authenticated proxy route(s) to the Django backend, keeping `API_BASE_URL` and tokens server-side

### Auth model
- `src/lib/session.ts` — `CustomerSession` / `SessionMembership` types and session helpers
- `src/lib/server-auth.ts` — server-side session/cookie reading (Route Handlers, Server Components)
- `src/lib/auth.ts` — client-side `AuthUser`/`AuthStatus` types, `AuthRequestError`
- `src/lib/tokens.ts` — JWT access/refresh token handling
- `src/contexts/AuthContext.tsx` — client auth context/provider consumed by portal pages
- Tokens are httpOnly cookies set by `api/auth/*` route handlers — the browser never sees raw JWTs; `API_BASE_URL` is only read server-side

### Data layer
- `src/lib/api.ts` — shared `axios` instance (`withCredentials: true`) plus response types (e.g. `SavingsData`) for backend payloads
- `src/lib/portalCache.ts` — client-side caching for portal data fetches
- `src/lib/careBooking.ts` + `src/lib/care/` — 360Care service booking flow
- `src/lib/hooks/` — shared data-fetching/UI hooks

### UI
- `src/components/layout/` — `PortalHeader.tsx`, `PortalSidebar.tsx` (shared portal chrome)
- `src/components/ui/` — reusable UI primitives (cards, gauges, KPI tiles, charts)
- `src/components/care/` — 360Care-specific components
- Charts via `chart.js` / `react-chartjs-2` (+ `chartjs-plugin-zoom`); animation via `framer-motion`; icons via `lucide-react`
- Fonts: DM Sans, JetBrains Mono, Syne (via `@fontsource/*`)
- Styling: Tailwind CSS v4

## Conventions

- Never call the Django backend directly from client components — go through `api/auth/*` or `api/backend/*` Route Handlers so `API_BASE_URL` and tokens stay server-side
- Prefer real API data over mocks in portal pages (recent history: mocks have been progressively replaced with live data across solar, savings, alerts pages)
- Guard against SSR/client hydration mismatches when reading session/auth state (see `ccbf3de fix(portal): address critical reviewer findings — alerts loaded race, SSR hydration, device Promise.all` in git history)
- Use `Promise.all` carefully for parallel device/API calls — a past bug involved unguarded parallel calls on the device page
- Type hints/interfaces for all API response shapes (see `SavingsData` in `src/lib/api.ts` as the pattern)

## Cross-Repo Context

Part of the 360Watts platform (see workspace-level `CLAUDE.md` in `360watts-data` for full platform picture):
- Backend: `smart-solar-django-backend` (Django REST API, Railway-hosted)
- Staff dashboard: `smart-solar-react-frontend`
- Mobile app: `smart-solar-fieldops-mobile`
- Forecast data ultimately comes from `360watts-data` → `solar_forecasting`/`360watts-ml-core` → Lambda inference → Django backend → this portal

## No auto-commit

Always confirm with the user before running `git commit` or `git push`.
