# Task 3 Report — Consumption Page

## Status: COMPLETE

## Commit
`08789d8` — `feat(portal/consumption): wire consumption page with load forecast and tariff overlay`

## Build Result
`npm run build` passed — zero TypeScript errors, zero warnings. All 12 pages compiled successfully.

## What was implemented

### API integration
- `portalApi.getTelemetry(site_id, { days: 1 })` — maps `actual_solar_kw`, `actual_load_kw`, `grid_import_kw` into the Day load profile chart
- `portalApi.getLoadForecast(site_id)` — maps `load_kw_p10/p50/p90` into the forecast strip chart
- `portalApi.getEnergySummary(site_id, { date: 'today' })` — populates `consumption_kwh`, `generation_kwh`, `self_consumption_pct`, `grid_import_kwh` KPIs
- Mock fallback retained for all three; API errors are silently swallowed

### Sections delivered
1. **Hero KPI row** — 3 MetricCards: Total Today (Home icon), Solar-Powered (Sun icon, green trend), Grid-Drawn (Zap icon, amber tint with estimated cost)
2. **Load Profile Chart** (GlassCard glow="green") — Day/Week/Month toggle; Day=line (Solar/Load/Grid Import), Week/Month=bar mock data
3. **TANGEDCO Tariff Band strip** — rendered below the chart (not on canvas); 3 flex segments proportional to hours: Off-Peak 8h (blue), Day 12h (emerald), Peak 4h (amber); only shown in Day view
4. **Load Forecast Strip** (GlassCard) — P10/P50/P90 line chart, blue palette, P90 filled area, P10 dashed
5. **Appliance Breakdown** (GlassCard) — AC 45%, EV 22%, Lights 12%, Other 21%; Framer Motion animated bars, kWh values derived from live `consumptionKwh` total

### Design system
- Matches solar page pattern: dark OLED, glass cards, COLORS tokens, Unbounded display font, Framer Motion stagger

## Concerns
- None. All brief requirements are met. The tariff strip correctly orders Off-Peak → Day → Peak (12am starting from left), proportional to hours-per-segment.
