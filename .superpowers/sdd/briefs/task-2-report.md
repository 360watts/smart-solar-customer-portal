# Task 2 Report: Solar Page API Integration

## Status: COMPLETE

**Commit:** `35e9757` → `befb4b6` (Physics Baseline spec fix)
**Build:** PASS (TypeScript clean, all 12 pages generated)

## What was done

Rewrote `src/app/(portal)/solar/page.tsx` to:

1. **Live API integration** — calls `portalApi.getForecast`, `getEnergySummary`, `getTelemetry` in parallel via `Promise.all` inside `useEffect` keyed on `user?.site_id` from `useAuth()`.

2. **Mock fallback** — `MOCK_FORECAST` and `MOCK_WEEKLY` are the initial state; API errors are caught silently so the page always renders.

3. **Regime badge** — `RegimeBadge` component (inline, no new file) reads the latest slot's `regime` string from the forecast response. Colors: emerald for Peak/Ramp-Up, amber for Overcast, muted for Night.

4. **Loading state** — KPI row gets `opacity-50 animate-pulse` while `loading === true`.

5. **KPI mapping** — `generation_kwh` from summary, `actual_solar_kw` (latest) for current output, max of `actual_solar_kw` across telemetry rows for peak.

6. **7-Day history** — built from telemetry `pv_today_kwh` per day; labels derived from `ts` timestamps.

7. **Forecast chart** — `p10_kw`, `p50_kw`, `p90_kw` per slot mapped to existing chart dataset shape.

## Spec Gap Fix: Physics Baseline Dataset

**Commit:** `befb4b6`

Added 4th dataset (Physics Baseline) to solar forecast chart as a dashed, semi-transparent emerald line:

1. **Mock data** — Added to `MOCK_FORECAST.datasets`: `[0.0, 0.5, 1.1, 2.2, 3.2, 3.8, 4.0, 3.8, 3.1, 2.3, 1.3, 0.6, 0.0]` (curve below P50)
2. **API mapping** — Maps `physics_baseline_kw` from forecast response: `fResults.map((r) => Number(r.physics_baseline_kw) || 0)`
3. **Style** — Dashed line, `rgba(47, 191, 113, 0.2)` (semi-transparent emerald), 1.5px width, no fill
4. **Legend** — Added indicator with dashed line style in legend row

Build: **PASS** (no TypeScript errors, all 12 pages generated)

## Concerns

- `getTelemetry` with `days: 7` returns daily aggregates per the brief, but the actual backend may return 15-min rows; in that case `pv_today_kwh` on the last row per day would give the cumulative value — this should be verified against the real endpoint.
- Tomorrow toggle is wired to state but does not re-fetch (brief says "toggle just re-fetches or shows different slice" — the brief also marks static mock as acceptable for the toggle). A future task can add a `forecastRange` param to the API call when the backend supports it.
