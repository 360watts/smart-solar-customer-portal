# Task 7: Weather Page — /weather

## What to build

Upgrade `src/app/(portal)/weather/page.tsx` from mock data to live API integration with a premium visual design — current conditions hero, GHI chart with actual vs forecast, 5-day solar score cards, and a solar resource quality arc.

## Design system
Same as previous tasks — dark OLED, glass cards, Unbounded font, Framer Motion, GlassCard/DataChart/StatusPill, COLORS tokens.

## Data sourcing

```typescript
portalApi.getWeather(user.site_id)
// → {
//     current: { obs_timestamp, ghi_wm2, temperature_c, humidity_pct, wind_speed_ms, cloud_cover_pct, fetched_at },
//     hourly_forecast: [{ forecast_for, ghi_wm2, temperature_c, humidity_pct, wind_speed_ms, cloud_cover_pct }]
//   }
```

## What to display

### 1. Current conditions hero (GlassCard glow="amber")
Large layout showing:
- **Temperature** in `stat-number` style: `{temperature_c}°C` (large, Unbounded font)
- **Condition label** derived from cloud_cover_pct: 
  - <20%: "Clear Sky" (Sun icon)
  - 20–50%: "Partly Cloudy" (CloudSun icon)  
  - 50–80%: "Mostly Cloudy" (Cloud icon)
  - >80%: "Overcast / Rain" (CloudRain icon)
- **6 metric chips** in a row below: GHI (W/m²) | Humidity (%) | Wind (m/s) | Feels Like (°C, = temp - wind/3) | Cloud Cover (%) | "Solar Quality" score

**Solar Quality Score:** `Math.min(100, Math.round(ghi_wm2 / 10))` — show as an arc gauge (reuse SelfUseArc pattern from overview page if you like, or a simpler horizontal bar).

### 2. GHI 24h Chart (GlassCard)
Header: "Solar Irradiance — Today" + "W/m²"

DataChart type="line" showing:
- Past hours (until current time): amber filled area from actual data
- Future hours: lighter amber dashed forecast data
- Single dataset is fine; color the line/fill amber (`#E9B949` / `rgba(233,185,73,0.15)`)

Extract hour labels from `hourly_forecast[].forecast_for` timestamps.

### 3. 5-day Forecast Cards (horizontal scrollable row)
Group the `hourly_forecast` array by calendar day (next 5 days). For each day:
- Day name (Today / Tomorrow / Mon etc.)
- Condition icon (derived from avg cloud_cover_pct of that day's hours)
- Temp range: `{min}°C – {max}°C`
- Avg GHI: `{avg} W/m²`
- Solar score bar (0–100, horizontal progress bar, amber color)

Cards should be in a flex-wrap or horizontal scroll row, each card a GlassCard-like tile ~140px wide.

### 4. Data source label
Small footnote at the bottom: "Weather data: Open-Meteo · Updated {timeAgo(current.fetched_at)}"

## Mock data (initial state)
Keep the existing `ghiData` chart data and `FORECAST` array from the current file. Wire API data over on success.

## Constraints
- Single file: `src/app/(portal)/weather/page.tsx` only
- No new components or dependencies
- `npm run build` must pass
- Solar quality score displayed visually (arc or horizontal bar — your choice)
