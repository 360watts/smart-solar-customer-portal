# 360Care Page/Flow — Design Spec

## Goal
Bring the Flutter mobile app's 360Care feature (`solar_monitoring_app` / `develop/solar-v2`,
`lib/features/care/*.dart`) to the Next.js customer portal, reusing real backend data wherever
it exists and matching existing portal conventions (`useSiteQuery`, `portalApi`, `GlassCard`,
`StatusPill`, framer-motion).

## Decisions (confirmed with user)
1. **Membership + booking data**: no backend model exists for either. Membership card is
   static/mocked content. Service booking persists to `localStorage` only (mirrors the mobile
   app's `SharedPreferences` approach) — no new API routes.
2. **System health data**: reuse the real `GET /api/sites/{site_id}/hardware-health/` endpoint
   (`compute_hardware_health` in `smart-solar-django-backend/api/services/hardware_health.py`).
   It already returns the exact `SystemHealthData` shape the mobile app consumes: `overall_score`,
   `overall_status`, per-component (`inverter`/`battery`/`solar_panel`) `health_score`, `status`
   (0=excellent,1=needsAttention,2=critical), `age`, `specs`, `details`, `warranty`, `alert`, plus
   `installation` and `maintenance_tips`. Frontend must not invent its own scoring.
3. **Fault list**: derive from the real alerts endpoint (`GET /api/backend/sites/{id}/alerts/`,
   already used by `/alerts` page), filtered to active alerts for the current site, mapped to
   Panel/Inverter/Battery fault cards. If there are no active alerts, show the "no faults" general
   service card branch (matches Flutter behavior).
4. **Routing**: `/care` (main page) + `/care/health` (System Health Details, separate route, not
   a modal), matching the Flutter screen-to-screen navigation. Add a "360Care" entry to
   `PortalSidebar` nav.

## Data accuracy requirements
- Health gauge %, per-component status/specs/warranty/age/alert text must come verbatim from the
  `hardware-health` API response — no hardcoded numbers standing in for real fields.
- Fault cards must reflect actual active alerts for the authenticated user's site (via existing
  `useSiteQuery` + site-scoped `portalApi` calls), not static Flutter-spec sample faults.
- Only the membership card and the booking flow's persisted state are intentionally mocked/local,
  and this must be visually/structurally isolated so it's obvious which parts are live vs mocked
  (no fabricated numbers mixed into the live health data).

## Components
- `src/app/(portal)/care/page.tsx` — main page: membership card, health gauge summary +
  "View Details" link, fault/diagnostics section (or general-service card), Book Service CTA /
  Booked status card.
- `src/app/(portal)/care/health/page.tsx` — full system health details (3 components +
  installation block), sourced from same API.
- `src/components/care/MembershipCard.tsx`
- `src/components/care/HealthGaugeCard.tsx` (animated gauge, reused on both pages)
- `src/components/care/FaultCard.tsx` / `GeneralServiceCard.tsx`
- `src/components/care/BookServiceDialog.tsx` → `DateTimePickerDialog.tsx` → review step
- `src/components/care/ServiceBookedStatusCard.tsx`
- `src/lib/careBooking.ts` — localStorage read/write/cancel + booking ID generation
- `src/lib/api.ts` — add `getHardwareHealth` (already exists, confirm signature) and reuse
  existing `getAlerts`

## Out of scope
- Any Django backend changes (booking persistence, membership subscription model).
- Payment/checkout for service bookings.
