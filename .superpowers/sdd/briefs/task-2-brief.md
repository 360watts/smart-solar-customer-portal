# Task 2: Solar Page — /solar

## What to build

Rewrite `src/app/(portal)/solar/page.tsx` to be a premium, production-grade solar forecast page that connects to live API data via `portalApi` (already fixed in Task 1), with graceful mock-data fallback when the API is unavailable.

## Design system (match exactly)

- Dark OLED background `#060A10`, glass cards (`glass` / `GlassCard` component)
- Emerald accent `#2FBF71` for solar, blue `#60a5fa` for load references, amber `#E9B949` for warnings
- Fonts: Unbounded (display/stats via `var(--font-display)`), DM Sans (body), JetBrains Mono (numbers)
- Framer Motion spring animations: `stiffness: 280, damping: 28`, staggered entry `delay: i * 0.08`
- `MetricCard` component for KPI tiles (already exists at `src/components/ui/MetricCard.tsx`)
- `GlassCard` component for content cards (already exists at `src/components/ui/GlassCard.tsx`)
- `DataChart` component for charts (already exists at `src/components/ui/DataChart.tsx`)
- `StatusPill` component for status badges (already exists at `src/components/ui/StatusPill.tsx`)
- `COLORS` tokens from `src/lib/tokens.ts`

## Data sourcing

Use `portalApi` from `src/lib/api.ts`. The `siteId` comes from `user.site_id` via `useAuth()` from `src/contexts/AuthContext.tsx`.

**Data fetch pattern** (use for all data on this page):
```typescript
const [data, setData] = useState(MOCK_DATA);
const [loading, setLoading] = useState(false);
const { user } = useAuth();

useEffect(() => {
  if (!user?.site_id) return;
  setLoading(true);
  Promise.all([
    portalApi.getForecast(user.site_id),
    portalApi.getEnergySummary(user.site_id, { date: 'today' }),
    portalApi.getTelemetry(user.site_id, { days: 7 }),
  ])
    .then(([forecastRes, summaryRes, telemetryRes]) => {
      // map to local state
    })
    .catch(() => { /* silently keep mock data */ })
    .finally(() => setLoading(false));
}, [user?.site_id]);
```

**API response shapes to expect:**
- `getForecast` → `{ results: [{ forecast_for, predicted_kw, p10_kw, p50_kw, p90_kw, physics_baseline_kw, regime }] }`
- `getEnergySummary` → `{ generation_kwh, consumption_kwh, self_consumption_pct }` 
- `getTelemetry` → `{ results: [{ ts, actual_solar_kw, pv_today_kwh }] }` (daily aggregated)

## What to display

### 1. Hero KPI row (4 MetricCard tiles)
- **Today's Generation** — `summary.generation_kwh` kWh, trend "+12% vs avg" (mock static trend ok)
- **Current Output** — latest `actual_solar_kw` kW from telemetry
- **Peak Today** — max of today's telemetry `actual_solar_kw`, label "at 12:15 PM" (static ok)
- **Performance Ratio** — static 87%, trend "Good"

### 2. Probabilistic Forecast Chart (GlassCard glow="green")
Header: "Generation Forecast" + "Probabilistic — P10 / P50 / P90 bands" subtitle + Today/Tomorrow toggle + StatusPill "Live"

Chart: DataChart type="line" showing:
- P90 (Optimistic) — fill area, emerald muted
- P50 (Median) — solid emerald line, borderWidth 2
- P10 (Conservative) — dashed grey line
- Physics baseline — dashed emerald/20 line

Show legend row above chart with colored lines.

### 3. Regime badge
A small pill below the forecast title showing the current regime from the latest forecast slot: "Night" | "Ramp-Up" | "Peak" | "Ramp-Down" | "Overcast". Color: emerald for Peak/Ramp-Up, amber for Overcast, muted for Night.

### 4. 7-Day History bar chart (GlassCard)
Header: "7-Day History"
DataChart type="bar" showing daily generation kWh for the last 7 days. Labels: Mon–Sun. Use emerald colors.

## Mock data (fallback — keep existing mock arrays, just map API data over them when available)

Keep the existing `forecastData` and `weeklyData` mock objects from the current file as the initial state. When API responds, replace with real data mapped to the same shape.

## Loading state

When `loading === true`, show skeleton shimmer on KPI cards (can use opacity-50 + animate-pulse on the card container).

## Constraints

- Single file: `src/app/(portal)/solar/page.tsx` only
- No new components or dependencies
- `npm run build` must pass
- Keep the Today/Tomorrow toggle (toggle just re-fetches or shows different slice of forecast data)
- Page must render correctly even with no API (mock fallback)
