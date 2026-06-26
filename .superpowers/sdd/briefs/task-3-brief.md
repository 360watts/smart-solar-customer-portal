# Task 3: Consumption Page — /consumption

## What to build

Rewrite `src/app/(portal)/consumption/page.tsx` with live API data via `portalApi`, mock fallback, and a tariff overlay that shows TANGEDCO time-of-use bands.

## Design system (match exactly)

Same as Task 2 — dark OLED, glass cards, emerald/blue/amber accent, Unbounded display font, Framer Motion stagger, MetricCard/GlassCard/DataChart/StatusPill components, COLORS tokens.

## Data sourcing

```typescript
const { user } = useAuth();
// Fetch on mount
portalApi.getTelemetry(user.site_id, { days: 1 })      // hourly solar/load/grid
portalApi.getLoadForecast(user.site_id)                 // next 24h load P10/P50/P90
portalApi.getEnergySummary(user.site_id, { date: 'today' }) // daily totals
```

**API shapes:**
- `getTelemetry` → `{ results: [{ ts, actual_solar_kw, actual_load_kw, grid_import_kw }] }`
- `getLoadForecast` → `{ results: [{ ts, load_kw_p10, load_kw_p50, load_kw_p90 }] }`
- `getEnergySummary` → `{ generation_kwh, consumption_kwh, grid_import_kwh, self_consumption_pct }`

## What to display

### 1. Hero KPI row (3 MetricCard tiles)
- **Total Today** — `summary.consumption_kwh` kWh (icon: Home)
- **Solar-Powered** — `summary.generation_kwh` kWh + `summary.self_consumption_pct`% subtitle (icon: Sun, color: green trend)
- **Grid-Drawn** — `summary.grid_import_kwh` kWh + estimated cost `₹{(grid_import_kwh * 6.80).toFixed(0)}` subtitle (icon: Zap, amber tint)

### 2. Load Profile Chart (GlassCard glow="green")
Header: "Load Profile" + Day/Week/Month toggle buttons

DataChart type="line" (or "bar" for week/month) showing:
- Solar (emerald filled area)
- Load (blue line)
- Grid import (amber filled area)

**Time axis labels:** 24 hourly labels "12am" through "11pm"

**Day/Week/Month toggle:** Day uses telemetry data; Week and Month fall back to mock scaled data.

### 3. Tariff Band Overlay
Below the chart, show a horizontal strip (not on the chart itself — as a separate visual below the x-axis) indicating the 3 TANGEDCO tariff bands:

```
|←── Offpeak ₹4.20 ──→|←────────── Day ₹6.80 ──────────→|←── Peak ₹7.50 ──→|← Offpeak →|
  12am         6am               6am           6pm        6pm        10pm    10pm      12am
```

Implement as a flex div below the chart with 3 colored segments:
- Offpeak 10pm–6am (22:00–06:00): blue/40 background, "₹4.20/kWh"
- Day 6am–6pm (06:00–18:00): emerald/20 background, "₹6.80/kWh"  
- Peak 6pm–10pm (18:00–22:00): amber/40 background, "₹7.50/kWh"

Each segment shows: time range, rate label, band name.

### 4. Load Forecast Strip (GlassCard)
Header: "Load Forecast — Next 24h" + "P10/P50/P90" subtitle

DataChart type="line" with P10/P50/P90 hourly load forecast (similar to solar forecast chart but blue palette):
- P50 (Median): `#60a5fa` (blue-400), solid 2px
- P90 (High): `rgba(96,165,250,0.3)` filled area
- P10 (Low): `rgba(96,165,250,0.5)` dashed

### 5. Appliance Breakdown (GlassCard)
Header: "Estimated Breakdown"

Static mock bars showing estimated load split:
- AC: 45%, icon: Wind, emerald
- EV: 22%, icon: Car, blue
- Lights: 12%, icon: Lightbulb, amber
- Other: 21%, icon: Home, muted

Each row: icon + label + percentage bar (flex, animated width with Framer Motion) + value kWh

## Mock data (fallback)
Keep the existing mock `loadData` and `appliances` arrays from the current file as initial state. Wire API data over them on success.

## Constraints
- Single file: `src/app/(portal)/consumption/page.tsx` only
- No new components or dependencies
- `npm run build` must pass
- Tariff band strip must be a separate visual element below the chart (NOT drawn on the chart canvas)
