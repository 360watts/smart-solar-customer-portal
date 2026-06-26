# Task 1 Report: Fix API Client — src/lib/api.ts

## Changes Made

### 1. `src/lib/api.ts` — Replaced portalApi export

**Removed broken endpoints:**
- `getSiteOverview`, `getEnergyReadings`, `getForecast`, `getAlerts`, `getDeviceStatus`, `getWeather`, `getProfile` (old stubs with wrong URLs)

**Added correct endpoints** matching Django backend pattern `/api/sites/<siteId>/<resource>/`:
- `getTelemetry(siteId, params)` → `/api/sites/{siteId}/telemetry/`
- `getEnergySummary(siteId, params)` → `/api/sites/{siteId}/energy-summary/`
- `getHistory(siteId, params)` → `/api/sites/{siteId}/history/`
- `getForecast(siteId)` → `/api/sites/{siteId}/forecast/`
- `getLoadForecast(siteId)` → `/api/sites/{siteId}/load-forecast/`
- `getWeather(siteId)` → `/api/sites/{siteId}/weather/`
- `getSiteAlerts(siteId)` → `/api/sites/{siteId}/alerts/`
- `acknowledgeAlert(alertId)` → `/api/alerts/{alertId}/acknowledge/`
- `getGatewayStatus(siteId)` → `/api/sites/{siteId}/gateway-status/`
- `getEquipment(siteId)` → `/api/sites/{siteId}/equipment/`
- `getHardwareHealth(siteId, days?)` → `/api/sites/{siteId}/hardware-health/`
- `getProfile()` → `/api/profile/`
- `updateProfile(data)` → `/api/profile/`
- `getSite(siteId)` → `/api/sites/{siteId}/`

All endpoints return `Promise<AxiosResponse>` as required.

### 2. `src/contexts/AuthContext.tsx` — Fixed profile endpoint URLs

**Changed 2 occurrences:**
- Line 43: `/api/portal/profile/` → `/api/profile/` (in useEffect hook)
- Line 55: `/api/portal/profile/` → `/api/profile/` (in login function)

## Build Result

✅ **SUCCESS**
- TypeScript compilation: Passed
- Next.js build: Completed successfully in 6.9s
- No type errors or warnings related to changes
- All 12 static pages generated successfully

## Constraints Met

✅ Did NOT change axios instance, interceptors, or auth token logic
✅ Did NOT add any other files
✅ TypeScript compiles without errors
✅ No new dependencies added

## Commit

```
f95116c fix(portal): correct API client endpoint URLs to match Django backend
```

## Summary

Task complete. All endpoints now correctly route to the Django backend following the `/api/sites/<siteId>/<resource>/` pattern. Build verified.
