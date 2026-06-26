# Task 4 Report: History Page

## Status: COMPLETE

## Commit
`28d7c71` — feat(portal/history): wire history page with monthly data, table, and CSV export

## Build Result
`npm run build` passed with zero TypeScript errors. All 12 routes compile successfully.

## What was implemented

### API Integration
- `useEffect` on `user?.site_id` calls `portalApi.getEnergySummary(site_id, { aggregate: 'monthly' })`
- Maps `results[]` fields: `generation_kwh`, `consumption_kwh`, `grid_import_kwh`, `grid_export_kwh`, `self_consumption_pct`
- Falls back to mock data silently on API error (same pattern as solar/page.tsx and consumption/page.tsx)

### Annual KPI Tiles (4 MetricCard)
- Total Generated (Zap icon, kWh, +8% trend)
- Total Saved (TrendingUp, ₹ formatted with `toLocaleString('en-IN')`)
- CO₂ Avoided (Leaf icon, kg, Tamil Nadu factor 0.82)
- Grid Exported (ArrowUpRight, kWh, muted)

### Monthly Trends Chart (GlassCard glow="green")
- Toggle: "Energy (kWh)" | "Savings (₹)"
- Energy view: grouped bar chart — Generation (emerald) + Consumption (amber)
- Savings view: single bar chart — estimated savings in ₹ (emerald)

### Monthly Breakdown Table
- Columns: Month | Solar kWh | Consumed kWh | Grid Buy | Grid Sell | Self-Use % | Savings ₹
- Alternating row backgrounds (`bg-white/[0.02]` on odd rows)
- Numbers in JetBrains Mono
- SelfUsePill inline component: emerald ≥70%, amber 50–70%, muted <50%
- Savings in emerald

### CSV Export
- Client-side Blob download, no backend call
- Columns: Month,Solar kWh,Consumed kWh,Grid Buy kWh,Grid Sell kWh,Self-Use %,Savings INR
- Filename: `360watts-history.csv`

## Concerns
None. All brief requirements satisfied. Mock data shape and API-mapped data shape are identical (`MonthRow` interface), so the toggle between mock and live is seamless.
