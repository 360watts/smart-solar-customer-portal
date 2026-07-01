# Customer Portal Data Loading Performance Plan

## Summary

Keep the secure BFF + `httpOnly` cookie auth model unchanged and improve perceived speed by reducing customer portal data fan-out. Start with two summary endpoints, measure, then expand to chart-heavy pages once the summary contract is stable.

This plan is backed by the current repo shape: the customer portal already routes data through `/api/backend/...`, uses `withCredentials: true`, has `useSiteQuery` for stale-while-revalidate and request deduplication, and has a generic Next.js BFF proxy that can forward new Django endpoints without changing auth.

References:
[Next.js Caching](https://nextjs.org/docs/app/getting-started/caching), [Next.js Loading UI](https://nextjs.org/docs/app/api-reference/file-conventions/loading), [web.dev stale-while-revalidate](https://web.dev/articles/stale-while-revalidate), [web.dev Optimize TTFB](https://web.dev/articles/optimize-ttfb), [Django Redis cache](https://docs.djangoproject.com/en/5.0/topics/cache/#redis)

## Key Changes

- Add only these first:
  - `GET /api/sites/{site_id}/portal-overview/`
  - `GET /api/sites/{site_id}/portal-device/`
- Add later, after measuring Phase 1:
  - `GET /api/sites/{site_id}/portal-solar/?date=YYYY-MM-DD&range=today|week|month`
  - `GET /api/sites/{site_id}/portal-consumption/?date=YYYY-MM-DD&range=today|week|month`
- Use versioned summary responses from day one:
  - `version`
  - `site_id`
  - `generated_at`
  - `data`
  - `partial_errors`
  - optional `cache` (includes `hit: bool`, `fragments: {key: bool}`)
- Compose each summary from smaller cached fragments instead of caching only the whole endpoint response.
- Keep summary endpoints page-specific. Do not create a universal `portal-everything` endpoint.

## Implementation Details

### Backend

- Add Django summary views for `portal-overview` and `portal-device`.
- Add a small portal cache helper using Django's cache abstraction with stampede protection (see below).
- Use cache keys that include `site_id`, and also `date`, `range`, `timezone`, and user/customer scope whenever the response varies by those values.
- Sub-cache TTLs:
  - `portal:site:{site_id}:metadata`: `30m`
  - `portal:site:{site_id}:equipment`: `60m`
  - `portal:site:{site_id}:realtime`: `10s–15s`
  - `portal:site:{site_id}:alerts`: `30s`
  - `portal:site:{site_id}:weather`: `10m–30m`
  - `portal:site:{site_id}:overview:{date}:{tz}`: `60s`
  - `portal:site:{site_id}:device`: `30s–60s`
  - Later: `portal:site:{site_id}:solar:{date}:{range}:{tz}` and `portal:site:{site_id}:load:{date}:{range}:{tz}`: `3m`
- Log for every summary call: endpoint, site id, elapsed ms, cache hit/miss, fragment hit/miss per key, DB query count, payload bytes.

#### Cache Backend

Use Redis in production from Phase 1. Local memory cache is per-process; in a multi-worker or multi-instance deployment (Railway + Vercel) each process has its own cold cache, defeating fragment reuse and making cache-hit latency inconsistent. Local memory is acceptable only for local development.

```python
# settings.py (production)
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": env("REDIS_URL", default="redis://127.0.0.1:6379/1"),
        "TIMEOUT": 300,
    }
}

# settings.py (development only)
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "portal-dev-cache",
    }
}
```

#### Cache Stampede Protection

High-frequency keys (`realtime`, `overview`) expire often. Without protection, many concurrent requests after TTL expiry all recompute the same expensive fragment simultaneously. Use `cache.add` as a lightweight distributed lock:

```python
import time
from django.core.cache import cache

LOCK_TTL_SECONDS = 10

def get_or_build_cached_fragment(key: str, ttl: int, builder):
    cached = cache.get(key)
    if cached is not None:
        return cached, True

    lock_key = f"lock:{key}"
    lock_acquired = cache.add(lock_key, "1", timeout=LOCK_TTL_SECONDS)

    if lock_acquired:
        try:
            value = builder()
            cache.set(key, value, timeout=ttl)
            return value, False
        finally:
            cache.delete(lock_key)

    # Another worker is rebuilding — wait briefly then reuse.
    time.sleep(0.05)
    cached = cache.get(key)
    if cached is not None:
        return cached, True

    # Safe fallback: compute rather than fail the request.
    value = builder()
    cache.set(key, value, timeout=ttl)
    return value, False
```

### BFF Proxy

The current BFF reads the full Django response body into memory with `response.text()` before sending anything to the client. Switch to streaming `response.body` instead. The `tokenExpired` flag is determined from the response status and headers inside `buildBackendRequest` before the body is touched, so streaming is safe and preserves all existing auth behavior.

```ts
// src/app/api/backend/[...path]/route.ts
const proxyResponse = new NextResponse(response.body, {
  status: response.status,
  headers: {
    "Content-Type": response.headers.get("content-type") ?? "application/json",
    "Cache-Control": "private, no-store",
    ...forwardHeaders,
  },
});

if (response.status === 401 && tokenExpired) {
  proxyResponse.headers.set("X-Auth-Status", "session-expired");
  return clearSessionCookies(proxyResponse);
}

return refreshedAccessToken
  ? applySessionCookies(proxyResponse, { access: refreshedAccessToken })
  : proxyResponse;
```

Keep `cache: "no-store"` in the server-side backend fetch — these are authenticated personalized responses.

### Frontend

- Add typed methods in `src/lib/api.ts`: `getPortalOverview`, `getPortalDevice`, and later `getPortalSolar`, `getPortalConsumption`.
- Migrate Overview to `getPortalOverview` through `useSiteQuery`.
- Migrate Device to `getPortalDevice` through `useSiteQuery`, removing the current direct local `Promise.allSettled` data load and avoiding mock/default fallback when cached real data exists.
- Keep existing `loading.tsx` route skeletons and `useSiteQuery` cache-first behavior.
- Prefetch Overview only after auth is resolved and a site id exists. Add hover or idle prefetch for likely next-route summaries later; do not prefetch every page immediately.

### Response Behavior

- Auth or site-membership failure returns `403` or `404`.
- Missing main site is a hard failure.
- Optional widget failure returns `null`, `[]`, or degraded fields plus `partial_errors`.
- Weather, forecast, or alerts failure must not blank the dashboard.

## Acceptance Criteria

### Overview
- After auth session resolves, page data comes from exactly **one** summary request. A second request is only acceptable if it is auth/session-related, not page-data-related.
- Main compressed summary payload: `≤ 100 KB` preferred, `150 KB` max.
- P95 Django summary response — Redis cache hit: `< 75 ms`; cache miss: `< 500 ms` preferred, `800 ms` max.
- DB query count — cache hit: `≤ 2`; cache miss: `≤ 10`.

### Device
- Navigation renders cached real data when present.
- Page does not fall back to mock/default data when cached real data exists.
- Compressed payload: `≤ 75 KB`.
- P95 cache hit: `< 75 ms`.
- DB query count — cache hit: `≤ 2`; cache miss: `≤ 8`.

### BFF
- Does not buffer backend JSON using `response.text()`.
- Streams `response.body` directly to the client.
- Preserves `401` cookie clearing and access-token refresh behavior unchanged.

### Backend
- Redis enabled in production from Phase 1.
- Fragment cache keys include site id, date, range, timezone, and permission scope where relevant.
- Optional widget failures never blank the page.
- Cache stampede protection exists for all fragments with TTL `≤ 60s`.

### Later Solar
- Chart/data requests reduce to one summary call.
- P95 cache-hit response: `< 75 ms`.
- Date/range scoped chart data does not leak across sites.

### Later Consumption
- Page data requests reduce to one summary call.
- Stale chart data may render for at most `3m`.

### Observability
- Every summary endpoint logs: endpoint, site id, elapsed ms, cache hit/miss, fragment hit/miss, DB query count, payload bytes.
- Frontend tracks page data-ready duration from auth-resolved to first data render.

## Test Plan

### Backend
- Site membership enforcement for both new summary endpoints.
- Summary response has `version: 1`, `site_id`, `generated_at`, `data`, `partial_errors`, and `cache`.
- Cache keys include site id and relevant scope fields.
- Optional widget errors produce partial payloads rather than full endpoint failure.
- Cache hit path avoids recomputing the cached fragment.
- Stampede protection: concurrent requests for the same expired key trigger only one rebuild.

### Frontend
- Overview renders from `portal-overview` payload.
- Device renders from `portal-device` payload and uses `useSiteQuery`.
- Cached data renders immediately on remount, with background refresh preserving stale-while-revalidate behavior.
- `401` from the BFF still flows through existing session/logout handling.
- No-site state still renders the existing no-site UI.

## Known Issues (fix before Phase 1 ships)

Four confirmed bugs found in the current frontend code. None block development of the summary endpoints, but all must be resolved before Phase 1 acceptance.

| # | File | Severity | Description |
|---|------|----------|-------------|
| 1 | `src/lib/hooks/useSiteQuery.ts:63` | **High** | `loading` initialises to `true` when `siteId === undefined` (auth not yet resolved), but no code path resets it to `false` if auth resolution fails and `siteId` stays `undefined` permanently. Result: infinite loading skeleton with no error state or recovery path when `refreshSession()` throws. Fix: call `setLoading(false)` when auth context signals unauthenticated, or propagate an `authError` flag. |
| 2 | `src/app/api/auth/session/route.ts:24` | **Medium** | `applySessionCache` fires unconditionally on every authenticated response, including fast-path cache hits that never touched the backend. The `SESSION_CACHE_COOKIE` TTL resets on every `/api/auth/session` call, making the intended 4-minute expiry window a rolling window that never expires during active use. The inline comment ("full backend resolution") is incorrect. Fix: only call `applySessionCache` when `result.tokens` is defined (i.e. a real backend round-trip occurred). |
| 3 | `src/app/(portal)/consumption/page.tsx:69` | **Low** | `hourLabel` duplicates the same `h % 12 \|\| 12` + am/pm expression already inlined in `solar/page.tsx:55`, `solar/page.tsx:64`, and `overview/page.tsx:217`. Fix: extract to `src/lib/utils.ts` as `formatHourLabel(ts: string): string`. |
| 4 | `src/app/(portal)/device/page.tsx:265` | **Low** | `setHealth` guard checks only `solar_efficiency_pct != null`; a backend response where that field is present but `inverter_efficiency_pct` or `battery_efficiency_pct` is null passes the guard, overwrites the mock, and renders 0% for those bars. Fix: guard all three fields, or default-merge the API response against the mock. |

## Assumptions

- **`httpOnly` cookies and the BFF auth path are non-negotiable.**
  `httpOnly` cookies cannot be read by JavaScript, so an XSS bug cannot steal tokens via `document.cookie` or `localStorage.getItem(...)`. The BFF proxy adds the `Authorization` header server-side — React never sees the raw JWT. This is the correct model for a customer energy portal:
  ```
  Browser → (httpOnly cookie) → Next.js BFF → (Authorization header) → Django API
  ```
  The CSRF trade-off is mitigated by `SameSite=Lax`, `Secure` in production, and the short 5-minute access-token lifetime already in place. `localStorage` or `sessionStorage` tokens are weaker and must not be introduced.

- Local memory cache is acceptable only for local development. **Redis is required for production Phase 1** so cache behavior is shared across workers/instances and cache-hit latency is consistent.
- The first implementation targets `portal-overview` and `portal-device` only.
- Pre-aggregated DB tables for chart-heavy data are a later optimization, not required for Phase 1. Raw query aggregation is acceptable until Solar/Consumption pages are migrated.
- Universal `portal-everything` endpoint: no. Page-specific summaries only.
