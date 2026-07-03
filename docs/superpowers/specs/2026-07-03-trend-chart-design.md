# Trend Chart Design — shared `TrendChart` component

**Date:** 2026-07-03
**Scope:** Replace plain bar charts with bar+trend-line combo charts on `solar/page.tsx`, `history/page.tsx`, and `consumption/page.tsx` (Week view only). Overview page is explicitly out of scope.

## Problem

Three pages render bar-only charts via the shared `DataChart` component (Chart.js/react-chartjs-2):

- `solar/page.tsx` — 7-Day Generation History (1 series, kWh)
- `history/page.tsx` — Monthly Trends, toggles between Energy (kWh) and Savings (₹) (1 series)
- `consumption/page.tsx` — Load Profile, Week view (2 series: Consumption, Generation; Day/Month views already use line charts and are unchanged)

Plain bars show discrete totals but no trend/direction at a glance, no comparison context, and no visual distinction between "measured" and "derived" values.

## Architecture

New component: `src/components/ui/TrendChart.tsx`.

`DataChart` is **not modified** — it only supports `ChartData<"line"> | ChartData<"bar">` (a single chart type for the whole chart), which can't express a mixed bar+line combo. `TrendChart` uses react-chartjs-2's generic `<Chart type="bar">` internally instead, building a `ChartData<"bar" | "line">` where each dataset declares its own `type`. This keeps `DataChart`'s existing call sites (Solar/Weather forecast lines, Consumption Day/Month views) completely unaffected.

### Props

```ts
interface TrendChartSeries {
  label: string;
  values: number[];
  color: string;
}

interface TrendChartTrendConfig {
  mode: "moving-average" | "self-sufficiency";
  label?: string;
  values?: number[];      // required for self-sufficiency; ignored/computed for moving-average
  window?: number;        // moving-average only, default 3
  color?: string;
}

interface TrendChartProps {
  labels: string[];
  bars: TrendChartSeries[];        // any number of series; component makes no assumption about count
  trend?: TrendChartTrendConfig;
  unit?: "kWh" | "kW" | "₹" | "%";
  height?: number;
  disableZoom?: boolean;
}
```

### Pure helpers (exported, unit-testable without rendering Chart.js)

Defined at module scope in `TrendChart.tsx`, exported for tests:

- `buildMovingAverage(values: number[], window = 3): (number | null)[]`
  Returns an array the same length as `values`. Indices `< window - 1` are `null` (not omitted, not shortened) — Chart.js renders `null` as a gap and this keeps index alignment with `labels`/tooltips intact. From index `window - 1` onward, each entry is the mean of the trailing `window` values.

- `normalizeSeriesLength(labels: string[], bars: TrendChartSeries[], trendValues?: number[]): { labels, bars, trendValues }`
  Clamps all arrays to the shortest length among `labels` and every `bars[i].values` (and `trendValues` if present). If any mismatch is found, calls `console.warn` in development only (`process.env.NODE_ENV !== "production"`) naming the offending series — silent in production, but a page wiring a wrong-length array won't go unnoticed during development. **`bars` must contain at least one series** — `TrendChart` is a bar-chart-with-trend-overlay, not a bare line chart; a page that wants a line-only chart should keep using `DataChart`. Passing an empty `bars` array is a caller error, not a supported empty-state — `normalizeSeriesLength`/`buildTrendChartData` may throw or `console.error` in development in that case rather than silently rendering nothing.

- `buildTrendChartData(props: TrendChartProps): ChartData<"bar" | "line">`
  Assembles the final Chart.js dataset array: one `type: "bar"` dataset per `bars[i]` with a scriptable gradient `backgroundColor`, plus one `type: "line"` dataset for `trend` (if present) using `buildMovingAverage` when `mode === "moving-average"` and `trend.values` directly when `mode === "self-sufficiency"`. **`moving-average` always averages `bars[0]`** (the first/primary series) — with 2+ bar series, later series are rendered as bars only, with no trend overlay of their own. This resolves what would otherwise be ambiguous for History's Monthly Trends "energy" view (2 series: Generation, Consumption) — the trend line there tracks Generation only, matching the page's own primary metric.

### Self-sufficiency formula

`self-sufficiency % = generation / consumption * 100`, clamped to `[0, 100]`, and `0` when `consumption === 0` (avoids `Infinity`/`NaN`). This reads as "what % of load was solar-covered" — matches the business meaning needed for the Consumption page (it is *not* inverter self-consumption, which would require export data the page doesn't have). Computed by the page (`consumption/page.tsx`) from its existing per-day generation/consumption arrays and passed in as `trend.values`; `TrendChart` does not compute this itself, since the formula is page-specific business logic, not a generic charting concern.

### Axis handling

- `mode: "moving-average"` — trend line shares the primary (left) Y axis with the bars; same unit, so no visual distortion.
- `mode: "self-sufficiency"` — trend line uses a secondary right-hand axis, fixed `0–100` range, since mixing a percentage with kWh/₹ values on one axis would misrepresent both.

## Visual details

- **Gradient bar fills:** scriptable `backgroundColor` per Chart.js's documented pattern — a callback receiving `context`, returning a `context.chart.ctx.createLinearGradient(...)` (full-opacity series color at the bar's top fading to ~15% opacity at its base) once `context.chart.chartArea` is available, and a flat translucent fallback color before the chart area is measured (first paint). No `beforeDraw` plugin needed.
- **Peak/min markers:** implemented as a small local Chart.js plugin object registered only on `TrendChart`'s own chart instance (not global `ChartJS.register`, to avoid affecting `DataChart`/other charts). Auto-disabled unless `bars.length === 1` — with 2+ series "peak" is ambiguous and the markers would clutter the chart. Draws a dot + value label above the max bar (amber, matching `COLORS.amber` already used in these pages) and below the min bar (muted white). Label positions are clamped inside `chart.chartArea` (never drawn above `chartArea.top` or below `chartArea.bottom`) — for the min label specifically, if the lowest bar is near-zero/zero-height there may not be room below it, in which case the label flips to sit just *inside* the top of that bar rather than clipping off the visible canvas. The chart's own top/bottom layout padding is increased slightly (via `options.layout.padding`) to give both labels room in the common case.
- **Tooltip:** extends `DataChart`'s existing callback pattern (title uses 📅/⏱ icons already; reused verbatim). Adds a delta line computed from the same primary series used for peak/min markers: `vs. previous: +12%`. Skipped entirely when the previous value is `0` (avoids a misleading `+∞%`/undefined-looking delta). **Unit formatting for the trend line's own tooltip/axis is independent of the bars' `unit` prop:** when `trend.mode === "self-sufficiency"`, the trend dataset's tooltip and its (secondary) axis are always formatted as `%`, regardless of what `unit` was passed for the bars (e.g. Consumption passes `unit: "kWh"` for its bars, but the dashed self-sufficiency line still reads `62%`, never `62 kWh`). When `trend.mode === "moving-average"`, the trend line uses the same `unit` as the bars, since it shares their axis and meaning.
- **Trend line style:** 2px width, no point markers except on hover, ~70% opacity. Dashed specifically for `self-sufficiency` (visually marks it as a derived/secondary-axis metric, distinct from measured kWh); solid for `moving-average`.

## Per-page wiring

| Page | `bars` | `trend` | `unit` |
|---|---|---|---|
| `solar/page.tsx` (7-Day Generation) | 1 series: generation kWh | `{ mode: "moving-average", window: 3 }` | `"kWh"` |
| `history/page.tsx` (Monthly Trends, "energy" toggle) | 2 series: Generation kWh (`bars[0]`), Consumption kWh (`bars[1]`) | `{ mode: "moving-average", window: 3 }` — tracks Generation only, per `bars[0]` rule above | `"kWh"` |
| `history/page.tsx` (Monthly Trends, "savings" toggle) | 1 series: Savings ₹ | `{ mode: "moving-average", window: 3 }` | `"₹"` |
| `consumption/page.tsx` (Week view only) | 2 series: Consumption, Generation | `{ mode: "self-sufficiency", values: <computed> }` | `"kWh"` |

Day and Month views on `consumption/page.tsx` are unchanged (still `DataChart type="line"`).

## Error handling

- Fewer data points than `window` (moving-average): leading points are `null` per `buildMovingAverage`, not omitted — chart renders bars normally with the trend line starting partway through, no crash, no empty state needed.
- Mismatched array lengths across `labels`/`bars`/`trend.values`: `normalizeSeriesLength` clamps to the shortest and `console.warn`s in development. Never throws.
- No data at all: unchanged — pages already have an empty-state (`"No data available for this period"`) one level above the chart, gating on `chartData.labels.length === 0` before ever rendering `TrendChart`.

## Testing

No existing test suite covers `DataChart` or these three pages (confirmed: no matching `*.test.tsx`). Scope:

- New Vitest file `src/components/ui/TrendChart.test.ts` (or `.tsx` if needed for type inference) covering the three exported pure helpers directly — `buildMovingAverage` (window boundary, exact averages, `null` leading values), `normalizeSeriesLength` (clamping + warn behavior), `buildTrendChartData` (correct dataset count/types/axis assignment for both trend modes). No Chart.js rendering involved, so these are fast, deterministic unit tests.
- No new tests for page-level wiring or the peak/min/gradient Chart.js plugin rendering — consistent with the codebase's current testing depth for chart-adjacent UI.

## Out of scope

- Overview page (`(portal)/page.tsx`) — explicitly excluded by the user.
- `DataChart` component itself — untouched, no behavior change for its other consumers (Solar/Weather forecast line charts, Consumption Day/Month line charts).
- Any new charting library/dependency — Chart.js's built-in mixed-chart support is sufficient.
