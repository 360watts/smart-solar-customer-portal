# Task 4: History Page — /history

## What to build

Rewrite `src/app/(portal)/history/page.tsx` with live API data (monthly energy summary), mock fallback, CSV export, and a clean annual overview.

## Design system
Same as Tasks 2–3 — dark OLED, glass cards, Unbounded font, Framer Motion, MetricCard/GlassCard/DataChart/StatusPill, COLORS tokens.

## Data sourcing

```typescript
portalApi.getEnergySummary(user.site_id, { aggregate: 'monthly' })
// → { results: [{ month, generation_kwh, consumption_kwh, grid_import_kwh, grid_export_kwh, self_consumption_pct }] }
// One object per month for the last 12 months

portalApi.getHistory(user.site_id, { aggregate: 'monthly' })
// → { results: [...] } (S3 archive, same shape, older data)
```

Use `getEnergySummary` as primary; fall back to mock if unavailable.

**Savings calculation:** `savings_inr = (generation_kwh * 0.75) * 6.80` (75% self-consumed at ₹6.80 avg rate — use this formula in both API-mapped and mock scenarios)

**CO₂:** `co2_kg = generation_kwh * 0.82` (Tamil Nadu grid emission factor)

## What to display

### 1. Annual Summary KPIs (4 MetricCard tiles)
Aggregate the 12 months:
- **Total Generated** — `sum(generation_kwh)` kWh (icon: Zap, green trend "+8% vs last year")
- **Total Saved** — `sum(savings_inr)` formatted as `₹{N}` (icon: TrendingUp, green)
- **CO₂ Avoided** — `sum(generation_kwh) * 0.82` formatted as `{N} kg` (icon: Leaf or Wind, green)
- **Grid Exported** — `sum(grid_export_kwh)` kWh (icon: ArrowUpRight, muted)

Use `toLocaleString('en-IN')` for Indian number formatting on the ₹ value.

### 2. Energy vs Savings toggle (GlassCard glow="green")
Header: "Monthly Trends" + "Energy (kWh)" / "Savings (₹)" toggle buttons

**Energy view:** DataChart type="bar" grouped bars — Generation (emerald) and Consumption (amber) per month, 12 labels Jan–Dec.

**Savings view:** DataChart type="bar" single dataset — estimated monthly savings in ₹ (emerald bars).

### 3. Monthly breakdown table (GlassCard)
Header row: Month | Solar kWh | Consumed kWh | Grid Buy | Grid Sell | Self-Use % | Savings ₹

Each data row styled with:
- Alternating subtle row backgrounds (`bg-white/[0.02]` on odd rows)
- Month name in white, numbers in JetBrains Mono
- Self-Use % shown as a small inline pill (emerald if ≥70%, amber if 50–70%, muted if <50%)
- Savings ₹ in emerald color

### 4. CSV Export button (top-right of history card)
A button with Download icon that triggers client-side CSV export of the 12-month table data.

CSV columns: Month,Solar kWh,Consumed kWh,Grid Buy kWh,Grid Sell kWh,Self-Use %,Savings INR

```typescript
function exportCSV(rows) {
  const header = 'Month,Solar kWh,Consumed kWh,Grid Buy kWh,Grid Sell kWh,Self-Use %,Savings INR';
  const lines = rows.map(r => `${r.month},${r.gen},${r.con},${r.buy},${r.sell},${r.selfUse},${r.savings}`);
  const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = '360watts-history.csv'; a.click();
  URL.revokeObjectURL(url);
}
```

## Mock data
Keep the existing `monthlyData` and `MONTHS` arrays as initial state (they are already correct shape). Wire API data over on success.

## Constraints
- Single file: `src/app/(portal)/history/page.tsx` only
- No new components or dependencies
- `npm run build` must pass
- CSV export must work client-side (no backend call)
