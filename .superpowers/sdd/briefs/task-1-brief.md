# Task 1: Fix API Client — src/lib/api.ts

## What to build

Replace the broken `portalApi` stub in `src/lib/api.ts` with a complete, correctly-routed API client that maps to the actual Django backend endpoints.

## Current state

`src/lib/api.ts` exports a `portalApi` object with wrong placeholder URLs like `/api/portal/sites/${siteId}/overview/`. These don't match the real backend.

The axios instance itself (base, interceptors, auth token injection, 401 refresh) is correct — do NOT touch it.

## Correct backend URL patterns

All site-scoped endpoints: `/api/sites/<siteId>/<resource>/`

Replace `portalApi` with this exact interface (all return `Promise<AxiosResponse>`):

```typescript
export const portalApi = {
  getTelemetry: (siteId: string, params?: { days?: number; aggregate?: string }) =>
    api.get(`/api/sites/${siteId}/telemetry/`, { params }),

  getEnergySummary: (siteId: string, params?: { date?: string; aggregate?: string }) =>
    api.get(`/api/sites/${siteId}/energy-summary/`, { params }),

  getHistory: (siteId: string, params?: { aggregate?: string }) =>
    api.get(`/api/sites/${siteId}/history/`, { params }),

  getForecast: (siteId: string) =>
    api.get(`/api/sites/${siteId}/forecast/`),

  getLoadForecast: (siteId: string) =>
    api.get(`/api/sites/${siteId}/load-forecast/`),

  getWeather: (siteId: string) =>
    api.get(`/api/sites/${siteId}/weather/`),

  getSiteAlerts: (siteId: string) =>
    api.get(`/api/sites/${siteId}/alerts/`),

  acknowledgeAlert: (alertId: string) =>
    api.post(`/api/alerts/${alertId}/acknowledge/`),

  getGatewayStatus: (siteId: string) =>
    api.get(`/api/sites/${siteId}/gateway-status/`),

  getEquipment: (siteId: string) =>
    api.get(`/api/sites/${siteId}/equipment/`),

  getHardwareHealth: (siteId: string, days?: number) =>
    api.get(`/api/sites/${siteId}/hardware-health/`, { params: { days } }),

  getProfile: () =>
    api.get(`/api/profile/`),

  updateProfile: (data: Record<string, unknown>) =>
    api.put(`/api/profile/`, data),

  getSite: (siteId: string) =>
    api.get(`/api/sites/${siteId}/`),
};
```

## Also fix: AuthContext profile URL

`src/contexts/AuthContext.tsx` calls `api.get("/api/portal/profile/")` in two places — change both to `api.get("/api/profile/")`.

## Constraints

- Do NOT change the axios instance, interceptors, or auth token logic
- Do NOT add any other files
- TypeScript must compile: run `npm run build` and confirm success
- No new dependencies

## Files to edit

1. `src/lib/api.ts` — replace `portalApi` export
2. `src/contexts/AuthContext.tsx` — fix the `/api/portal/profile/` calls
