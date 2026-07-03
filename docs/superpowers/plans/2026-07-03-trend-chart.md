# Trend Chart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace plain bar charts on the Solar, History, and Consumption (Week view) pages with a shared `TrendChart` component that overlays a moving-average or self-sufficiency trend line, gradient bar fills, and peak/min markers — per `docs/superpowers/specs/2026-07-03-trend-chart-design.md`.

**Architecture:** New component `src/components/ui/TrendChart.tsx` built on react-chartjs-2's generic `<Chart type="bar">` (supports mixed bar+line datasets natively). Three pure, independently-testable helpers (`buildMovingAverage`, `normalizeSeriesLength`, `buildTrendChartData`) live at module scope in that file and are exported for tests. The existing `DataChart` component is untouched. Three pages are rewired to build `TrendChart` props instead of raw Chart.js `ChartData` for their bar-chart views only.

**Tech Stack:** Next.js 16 / React 19, Chart.js 4.5 + react-chartjs-2 5.3 (already installed, no new dependencies), Vitest 4 for tests, TypeScript.

---

## Execution Progress

**Status:** Implemented and verified.

**Last updated:** 2026-07-03

**Implementation summary:**
- Completed the shared `TrendChart` component in `src/components/ui/TrendChart.tsx`.
- Added focused helper/data-shaping tests in `src/components/ui/TrendChart.test.ts`.
- Wired `TrendChart` into:
  - `src/app/(portal)/solar/page.tsx` — 7-Day Generation History now uses one Generation bar series plus a 3-point moving average.
  - `src/app/(portal)/history/page.tsx` — Monthly Trends now uses `TrendChart` for both Energy and Savings modes.
  - `src/app/(portal)/consumption/page.tsx` — Week view now uses Consumption/Generation bars plus a self-sufficiency percentage line on the right axis; Day and Month remain on `DataChart`.
- `DataChart` was not modified.

**Task progress:**
- [x] Task 1: Pure helpers — `buildMovingAverage`, `normalizeSeriesLength`
  - Added positive-integer validation for moving-average windows after review.
  - Added dev-only mismatch warnings and empty-`bars` caller-error handling.
  - Added Vitest coverage for moving average, length normalization, warning behavior, and invalid windows.
- [x] Task 2: `buildTrendChartData` and `TrendChart` component shell
  - Used react-chartjs-2's generic `<Chart type="bar">`.
  - Explicitly registered `BarController` and `LineController`, required for the generic Chart component.
  - Mirrored `DataChart`'s lazy `chartjs-plugin-zoom` loading behavior and double-click reset.
  - Added discriminated trend config typing so self-sufficiency requires `values`.
  - Added runtime guard for missing self-sufficiency values.
  - Added tests for mixed dataset assembly, axes, trend modes, and tooltip value formatting.
- [x] Task 3: Peak/min marker plugin and delta tooltip
  - Added local per-instance Chart.js plugin via the `plugins` prop, not global registration.
  - Gated peak/min markers to single-series charts.
  - Clamped marker dots and labels inside `chartArea`.
  - Preserved original data indexes for marker lookup when non-finite values are present.
  - Added primary-series tooltip delta formatting and tests for positive, negative, zero-previous, non-finite, and non-primary cases.
  - Added `DataChart`-style tooltip title formatting for hour and weekday labels.
- [x] Task 4: Solar page wiring
  - Replaced `weeklyChartData` with `weeklyTrendData`.
  - Kept forecast charts on `DataChart`.
  - Also moved the page's date-window initialization into a `useState` initializer to clear the existing `react-hooks/purity` lint error from `Date.now()` during render.
- [x] Task 5: History page wiring
  - Replaced `energyChartData`/`savingsChartData` with `monthlyLabels`, `energyTrendBars`, and `savingsTrendBars`.
  - Energy mode keeps Generation as `bars[0]`, so the moving average tracks Generation.
  - Existing toggle UI and monthly table were left unchanged.
- [x] Task 6: Consumption Week view wiring
  - Added `weekTrend` alongside the existing `weekChart` field, matching the written plan.
  - Computed self-sufficiency as `generation / consumption * 100`, clamped to `0..100`, with `0` when consumption is `0`.
  - Week view renders `TrendChart`; Day/Month continue using `DataChart`.
  - Added a Week-only legend item for the dashed Self-Sufficiency line so the third series is explained.
- [x] Task 7: Verification
  - Completed fresh test, type-check, focused lint, and production build verification.

**Review and correction log:**
- Task 1 review found readonly `NODE_ENV` mutation in tests; fixed with `vi.stubEnv`/`vi.unstubAllEnvs`.
- Task 1 review found invalid moving-average window behavior; fixed with positive-integer validation.
- Task 2 review found self-sufficiency could be configured without values; fixed at type and runtime levels.
- Task 2 review found self-sufficiency tooltip values could inherit the chart's `kWh` unit; fixed so the right-axis dataset always formats as `%`.
- Task 2 review found a potential `react-hooks/set-state-in-effect` lint issue in zoom initialization; fixed by deriving initial state from the module-level zoom registration flag.
- Task 3 review found marker dots were not clamped although labels were; fixed by clamping dot coordinates with radius margin.
- Task 3 review found non-finite tooltip deltas and marker index drift after filtering; fixed by using `Number.isFinite` and preserving original dataset indexes.
- Task 6 review found the Week legend omitted Self-Sufficiency; fixed with a dashed amber legend item.
- Task 6 review initially suggested removing `weekChart` as stale, but the written plan says to keep it alongside `weekTrend`; implementation was updated back to the plan.

**Intentional deviations from the original checklist mechanics:**
- The original task template includes per-task `git commit` steps. Execution did not create per-task commits because the repo already had many unrelated staged/modified files and the user wanted spec + implementation folded together later.
- Subagent-driven development was used through Task 6 review. The final narrow cleanup and verification were completed directly because the workspace ran out of subagent credits.
- `TrendChart.tsx` imports tokens via `../../lib/tokens` rather than `@/lib/tokens`. The plan's repo context notes the alias exists, but Vitest in this repo does not resolve the alias for this test path; using the alias broke `TrendChart.test.ts`. The relative import keeps the implementation testable without changing global test config.
- Manual browser smoke testing from Task 7 Step 4 was not run in this execution pass. Automated verification below passed.

**Verification evidence:**
- `npm run test` — passed: 2 test files, 39 tests.
- `npx tsc --noEmit` — passed.
- Focused ESLint on changed files — passed:
  - `src/components/ui/TrendChart.tsx`
  - `src/components/ui/TrendChart.test.ts`
  - `src/app/(portal)/solar/page.tsx`
  - `src/app/(portal)/history/page.tsx`
  - `src/app/(portal)/consumption/page.tsx`
- `npm run build` — passed after network approval for Next.js Google font fetching.

**Remaining notes:**
- `npm run lint` repo-wide is noisy because of unrelated existing/generated files and pre-existing project lint issues. Focused lint on the touched files passed.
- `src/app/(portal)/history/page.tsx` still has a pre-existing warning for unused `buildMockRows`; it was not introduced by this work.
- The working tree contains many unrelated staged/modified files outside this TrendChart work. No staging or commit was performed by this execution.

---

## Repo context for the engineer picking this up

- Working directory: `/home/ubuntu/work/smart-solar-customer-portal`
- Run tests with `npm run test` (Vitest, `vitest run` — no config file, uses defaults, picks up any `*.test.ts`/`*.test.tsx`)
- Run type-check as part of `npm run build` (no standalone `tsc` script — use `npx tsc --noEmit` for a fast check without a full build)
- Lint with `npm run lint`
- The `@/` import alias resolves to `src/` (see any existing file, e.g. `src/lib/tokens.ts` is imported as `@/lib/tokens`)
- Color tokens live in `src/lib/tokens.ts`: `COLORS.primary` (`#2FBF71`, emerald), `COLORS.primaryMuted`, `COLORS.amber` (`#E9B949`), `COLORS.amberMuted`, `COLORS.muted`, `COLORS.load` (`#60a5fa`, blue — used for "Consumption"/"Load" series). `CHART_DEFAULTS` holds the shared grid/tick/tooltip styling `DataChart` uses — `TrendChart` should reuse the same tooltip base styling (dark OLED background `#0a0e18`, emerald border) for visual consistency, not invent its own.
- Read `src/components/ui/DataChart.tsx` in full before starting — `TrendChart` intentionally does NOT modify it, but should match its conventions (`"use client"`, lazy zoom-plugin registration pattern, `disableZoom` prop, double-click-to-reset-zoom) where applicable.
- **Git note:** `docs/superpowers/specs/2026-07-03-trend-chart-design.md` and this plan should stay with the implementation changes. The execution used one final commit scope rather than the per-task commit commands below, so the commit snippets are historical task checkpoints, not required final workflow.

---

### Task 1: Pure helpers — `buildMovingAverage`, `normalizeSeriesLength`

**Files:**
- Create: `src/components/ui/TrendChart.tsx` (helpers only in this task — component body comes in Task 2)
- Test: `src/components/ui/TrendChart.test.ts`

- [ ] **Step 1: Write the failing tests for `buildMovingAverage`**

Create `src/components/ui/TrendChart.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildMovingAverage, normalizeSeriesLength } from "./TrendChart";

describe("buildMovingAverage", () => {
  it("returns null for indices before the window is full", () => {
    const result = buildMovingAverage([10, 20, 30, 40, 50], 3);
    expect(result[0]).toBeNull();
    expect(result[1]).toBeNull();
  });

  it("computes the trailing mean once the window is full", () => {
    const result = buildMovingAverage([10, 20, 30, 40, 50], 3);
    expect(result[2]).toBeCloseTo(20); // mean(10,20,30)
    expect(result[3]).toBeCloseTo(30); // mean(20,30,40)
    expect(result[4]).toBeCloseTo(40); // mean(30,40,50)
  });

  it("returns an array the same length as the input", () => {
    const result = buildMovingAverage([1, 2, 3, 4, 5, 6, 7], 3);
    expect(result).toHaveLength(7);
  });

  it("defaults to a window of 3 when not specified", () => {
    const result = buildMovingAverage([10, 20, 30, 40]);
    expect(result[0]).toBeNull();
    expect(result[1]).toBeNull();
    expect(result[2]).toBeCloseTo(20);
  });

  it("handles a window equal to the array length (only the last index is non-null)", () => {
    const result = buildMovingAverage([5, 15, 25], 3);
    expect(result[0]).toBeNull();
    expect(result[1]).toBeNull();
    expect(result[2]).toBeCloseTo(15);
  });

  it("returns an all-null array when window exceeds array length", () => {
    const result = buildMovingAverage([5, 15], 3);
    expect(result).toEqual([null, null]);
  });

  it("returns an empty array for empty input", () => {
    expect(buildMovingAverage([], 3)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- TrendChart`
Expected: FAIL — `Cannot find module './TrendChart'` or `buildMovingAverage is not a function` (the file doesn't exist yet, or doesn't export it).

- [ ] **Step 3: Create `TrendChart.tsx` with `buildMovingAverage` and a stub `normalizeSeriesLength`**

Create `src/components/ui/TrendChart.tsx`:

```tsx
"use client";

export function buildMovingAverage(values: number[], window = 3): (number | null)[] {
  return values.map((_, i) => {
    if (i < window - 1) return null;
    let sum = 0;
    for (let j = i - window + 1; j <= i; j++) sum += values[j];
    return sum / window;
  });
}

export interface TrendChartSeries {
  label: string;
  values: number[];
  color: string;
}

export function normalizeSeriesLength(
  labels: string[],
  bars: TrendChartSeries[],
  trendValues?: number[],
): { labels: string[]; bars: TrendChartSeries[]; trendValues?: number[] } {
  if (bars.length === 0) {
    throw new Error("TrendChart: `bars` must contain at least one series.");
  }

  const lengths = [labels.length, ...bars.map((b) => b.values.length)];
  if (trendValues) lengths.push(trendValues.length);
  const minLength = Math.min(...lengths);

  const mismatched = lengths.some((l) => l !== lengths[0]);
  if (mismatched && process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.warn(
      "TrendChart: mismatched array lengths passed — clamping to shortest.",
      { labelsLength: labels.length, barLengths: bars.map((b) => b.values.length), trendValuesLength: trendValues?.length },
    );
  }

  return {
    labels: labels.slice(0, minLength),
    bars: bars.map((b) => ({ ...b, values: b.values.slice(0, minLength) })),
    trendValues: trendValues ? trendValues.slice(0, minLength) : undefined,
  };
}
```

- [ ] **Step 4: Run tests to verify `buildMovingAverage` passes**

Run: `npm run test -- TrendChart`
Expected: PASS for all 7 `buildMovingAverage` tests.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-07-03-trend-chart-design.md docs/superpowers/plans/2026-07-03-trend-chart.md src/components/ui/TrendChart.tsx src/components/ui/TrendChart.test.ts
git commit -m "feat(trend-chart): add buildMovingAverage helper"
```

- [ ] **Step 6: Write the failing tests for `normalizeSeriesLength`**

Append to `src/components/ui/TrendChart.test.ts`:

```ts
describe("normalizeSeriesLength", () => {
  it("returns inputs unchanged when all lengths already match", () => {
    const result = normalizeSeriesLength(
      ["Mon", "Tue", "Wed"],
      [{ label: "Generation", values: [1, 2, 3], color: "#2FBF71" }],
    );
    expect(result.labels).toEqual(["Mon", "Tue", "Wed"]);
    expect(result.bars[0].values).toEqual([1, 2, 3]);
  });

  it("clamps labels and bar values to the shortest array", () => {
    const result = normalizeSeriesLength(
      ["Mon", "Tue", "Wed", "Thu"],
      [{ label: "Generation", values: [1, 2, 3], color: "#2FBF71" }],
    );
    expect(result.labels).toEqual(["Mon", "Tue", "Wed"]);
    expect(result.bars[0].values).toEqual([1, 2, 3]);
  });

  it("clamps trendValues to the shortest length alongside labels/bars", () => {
    const result = normalizeSeriesLength(
      ["Mon", "Tue", "Wed"],
      [{ label: "Generation", values: [1, 2, 3], color: "#2FBF71" }],
      [10, 20, 30, 40],
    );
    expect(result.trendValues).toEqual([10, 20, 30]);
  });

  it("clamps across multiple bar series independently", () => {
    const result = normalizeSeriesLength(
      ["Mon", "Tue", "Wed"],
      [
        { label: "Consumption", values: [5, 6], color: "#60a5fa" },
        { label: "Generation", values: [1, 2, 3], color: "#2FBF71" },
      ],
    );
    expect(result.labels).toEqual(["Mon", "Tue"]);
    expect(result.bars[0].values).toEqual([5, 6]);
    expect(result.bars[1].values).toEqual([1, 2]);
  });

  it("throws when bars is an empty array", () => {
    expect(() => normalizeSeriesLength(["Mon"], [])).toThrow(
      "TrendChart: `bars` must contain at least one series.",
    );
  });

  it("warns in development when lengths mismatch, and does not warn when they match", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    normalizeSeriesLength(["Mon", "Tue"], [{ label: "Generation", values: [1, 2], color: "#2FBF71" }]);
    expect(warnSpy).not.toHaveBeenCalled();

    normalizeSeriesLength(["Mon", "Tue", "Wed"], [{ label: "Generation", values: [1, 2], color: "#2FBF71" }]);
    expect(warnSpy).toHaveBeenCalledOnce();
    warnSpy.mockRestore();
  });
});
```

Add `vi` to the existing import line at the top of the file:

```ts
import { describe, expect, it, vi } from "vitest";
```

- [ ] **Step 7: Run tests to verify they fail or pass**

Run: `npm run test -- TrendChart`
Expected: the empty-`bars` throw test and the clamping tests should already PASS against the Step 3 implementation (it was written ahead of TDD strictness here since the logic is simple) — if any fail, fix `normalizeSeriesLength` until all pass. Confirm all `normalizeSeriesLength` tests are green before moving on.

- [ ] **Step 8: Commit**

```bash
git add src/components/ui/TrendChart.tsx src/components/ui/TrendChart.test.ts
git commit -m "feat(trend-chart): add normalizeSeriesLength helper"
```

---

### Task 2: `buildTrendChartData` and the `TrendChart` component shell

**Files:**
- Modify: `src/components/ui/TrendChart.tsx`
- Test: `src/components/ui/TrendChart.test.ts`

- [ ] **Step 1: Write the failing tests for `buildTrendChartData`**

Append to `src/components/ui/TrendChart.test.ts`:

```ts
import { buildTrendChartData, type TrendChartProps } from "./TrendChart";

describe("buildTrendChartData", () => {
  const baseProps: TrendChartProps = {
    labels: ["Mon", "Tue", "Wed", "Thu"],
    bars: [{ label: "Generation kWh", values: [10, 15, 8, 20], color: "#2FBF71" }],
  };

  it("produces one bar dataset per series and no line dataset when trend is omitted", () => {
    const result = buildTrendChartData(baseProps);
    expect(result.datasets).toHaveLength(1);
    expect(result.datasets[0].type).toBe("bar");
    expect(result.datasets[0].label).toBe("Generation kWh");
  });

  it("adds a moving-average line dataset on the primary (left) axis sharing the bars' axis id", () => {
    const result = buildTrendChartData({
      ...baseProps,
      trend: { mode: "moving-average", window: 3 },
    });
    expect(result.datasets).toHaveLength(2);
    const line = result.datasets.find((d) => d.type === "line")!;
    expect(line).toBeDefined();
    expect(line.data).toEqual([null, null, 11, 43 / 3]);
    expect(line.yAxisID).toBe(result.datasets[0].yAxisID ?? "y");
  });

  it("uses trend.values directly for self-sufficiency mode, on a secondary axis id", () => {
    const result = buildTrendChartData({
      ...baseProps,
      trend: { mode: "self-sufficiency", values: [80, 65, 90, 100] },
    });
    const line = result.datasets.find((d) => d.type === "line")!;
    expect(line.data).toEqual([80, 65, 90, 100]);
    expect(line.yAxisID).toBe("ySelfSufficiency");
  });

  it("moving-average always tracks bars[0] even with multiple bar series", () => {
    const result = buildTrendChartData({
      labels: ["Mon", "Tue", "Wed", "Thu"],
      bars: [
        { label: "Generation kWh", values: [10, 15, 8, 20], color: "#2FBF71" },
        { label: "Consumption kWh", values: [5, 5, 5, 5], color: "#60a5fa" },
      ],
      trend: { mode: "moving-average", window: 3 },
    });
    expect(result.datasets).toHaveLength(3); // 2 bars + 1 line
    const line = result.datasets.find((d) => d.type === "line")!;
    expect(line.data).toEqual([null, null, 11, 43 / 3]); // averages Generation, not Consumption
  });

  it("throws when bars is empty (propagated from normalizeSeriesLength)", () => {
    expect(() => buildTrendChartData({ labels: [], bars: [] })).toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- TrendChart`
Expected: FAIL — `buildTrendChartData` is not exported yet.

- [ ] **Step 3: Implement `buildTrendChartData` and supporting types**

Add to `src/components/ui/TrendChart.tsx` (after `normalizeSeriesLength`):

```tsx
import type { ChartData, ChartDataset } from "chart.js";

export interface TrendChartTrendConfig {
  mode: "moving-average" | "self-sufficiency";
  label?: string;
  values?: number[];
  window?: number;
  color?: string;
}

export interface TrendChartProps {
  labels: string[];
  bars: TrendChartSeries[];
  trend?: TrendChartTrendConfig;
  unit?: "kWh" | "kW" | "₹" | "%";
  height?: number;
  disableZoom?: boolean;
}

const PRIMARY_Y_AXIS_ID = "y";
const SELF_SUFFICIENCY_Y_AXIS_ID = "ySelfSufficiency";

function toRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function gradientBackgroundFactory(color: string) {
  return (context: { chart: { ctx: CanvasRenderingContext2D; chartArea?: { top: number; bottom: number } } }) => {
    const { chart } = context;
    const { ctx, chartArea } = chart;
    if (!chartArea) return toRgba(color, 0.25); // fallback before first layout pass
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, toRgba(color, 0.85));
    gradient.addColorStop(1, toRgba(color, 0.15));
    return gradient;
  };
}

export function buildTrendChartData(props: TrendChartProps): ChartData<"bar" | "line"> {
  const { trend } = props;
  const trendValuesForNormalize = trend?.mode === "self-sufficiency" ? trend.values : undefined;
  const { labels, bars, trendValues } = normalizeSeriesLength(props.labels, props.bars, trendValuesForNormalize);

  const barDatasets: ChartDataset<"bar" | "line">[] = bars.map((series) => ({
    type: "bar" as const,
    label: series.label,
    data: series.values,
    backgroundColor: gradientBackgroundFactory(series.color) as unknown as string,
    borderColor: series.color,
    borderWidth: 1,
    borderRadius: 6,
    yAxisID: PRIMARY_Y_AXIS_ID,
  }));

  if (!trend) {
    return { labels, datasets: barDatasets };
  }

  const isSelfSufficiency = trend.mode === "self-sufficiency";
  const lineData = isSelfSufficiency
    ? (trendValues ?? [])
    : buildMovingAverage(bars[0].values, trend.window ?? 3);

  const lineDataset: ChartDataset<"bar" | "line"> = {
    type: "line" as const,
    label: trend.label ?? (isSelfSufficiency ? "Self-Sufficiency" : "Trend"),
    data: lineData,
    borderColor: trend.color ?? "#F0F6FF",
    backgroundColor: "transparent",
    borderWidth: 2,
    borderDash: isSelfSufficiency ? [4, 4] : undefined,
    pointRadius: 0,
    pointHoverRadius: 4,
    tension: 0.3,
    yAxisID: isSelfSufficiency ? SELF_SUFFICIENCY_Y_AXIS_ID : PRIMARY_Y_AXIS_ID,
  };

  return { labels, datasets: [...barDatasets, lineDataset] };
}
```

Note: `bars[0].values` in the `moving-average` branch is safe because `normalizeSeriesLength` (called above via the destructured `bars`) already throws if `props.bars` was empty, before this line is reached.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- TrendChart`
Expected: PASS for all `buildTrendChartData` tests.

- [ ] **Step 5: Add the component shell that renders `buildTrendChartData` via react-chartjs-2's generic `Chart`**

Add to the top of `src/components/ui/TrendChart.tsx` (imports) and the component at the bottom:

```tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import { CHART_DEFAULTS } from "@/lib/tokens";

// `TrendChart` uses react-chartjs-2's GENERIC `Chart` component (not the typed
// `Bar`/`Line` wrappers `DataChart.tsx` uses), because it renders a mixed
// bar+line chart. The typed wrappers auto-register their own controller
// internally (see react-chartjs-2's `createTypedChart`), which is why
// `DataChart.tsx`'s registration list doesn't need to list BarController/
// LineController explicitly — but the generic `Chart` component does NOT
// auto-register anything, so both controllers must be registered here or
// Chart.js throws `"bar" is not a registered controller` at render time.
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
  Filler,
  Tooltip,
  Legend,
);

// Same lazy zoom-plugin pattern as DataChart.tsx: chartjs-plugin-zoom imports
// hammerjs, which touches `document` at module init — unsafe to import
// top-level in Next.js. Registered once, lazily, after mount.
let zoomRegistered = false;
const zoomOptions = {
  pan: { enabled: true, mode: "x" as const },
  zoom: {
    wheel: { enabled: true, speed: 0.08 },
    pinch: { enabled: true },
    mode: "x" as const,
  },
  limits: { x: { minRange: 2 } },
};

export default function TrendChart({
  labels,
  bars,
  trend,
  unit,
  height = 200,
  disableZoom = false,
}: TrendChartProps) {
  const chartRef = useRef<ChartJS>(null);
  const [zoomReady, setZoomReady] = useState(false);

  useEffect(() => {
    if (disableZoom) return;
    if (zoomRegistered) { setZoomReady(true); return; }
    import("chartjs-plugin-zoom").then((m) => {
      ChartJS.register(m.default);
      zoomRegistered = true;
      setZoomReady(true);
    });
  }, [disableZoom]);

  const data = buildTrendChartData({ labels, bars, trend, unit, height, disableZoom });
  const hasSelfSufficiencyAxis = trend?.mode === "self-sufficiency";

  const handleDoubleClick = () => {
    if (chartRef.current) (chartRef.current as any).resetZoom?.();
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 24, bottom: 20 } },
    plugins: {
      legend: { display: false },
      tooltip: { ...CHART_DEFAULTS.tooltip } as any,
      ...(!disableZoom && zoomReady ? { zoom: zoomOptions } : {}),
    },
    scales: {
      x: {
        grid: { color: CHART_DEFAULTS.grid.color },
        ticks: CHART_DEFAULTS.tick,
        border: { display: false },
      },
      y: {
        grid: { color: CHART_DEFAULTS.grid.color },
        ticks: CHART_DEFAULTS.tick,
        border: { display: false },
      },
      ...(hasSelfSufficiencyAxis
        ? {
            ySelfSufficiency: {
              position: "right" as const,
              min: 0,
              max: 100,
              grid: { display: false },
              ticks: { ...CHART_DEFAULTS.tick, callback: (v: number) => `${v}%` },
              border: { display: false },
            },
          }
        : {}),
    },
  };

  return (
    <div style={{ position: "relative" }}>
      {!disableZoom && zoomReady && (
        <div className="absolute top-0 right-0 z-10 text-[11px] text-white/20 font-mono select-none pointer-events-none">
          scroll to zoom · drag to pan · dbl-click to reset
        </div>
      )}
      <div style={{ height }} onDoubleClick={handleDoubleClick}>
        <Chart ref={chartRef as any} type="bar" data={data} options={options as any} />
      </div>
    </div>
  );
}
```

Note: the `plugins` prop (peak/min marker plugin, added in Task 3) is wired onto this same `<Chart>` element — Task 3, Step 2 shows the exact diff to add it here.

- [ ] **Step 6: Verify the app builds with the new component (not yet wired into any page)**

Run: `npx tsc --noEmit`
Expected: no errors referencing `TrendChart.tsx`.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/TrendChart.tsx src/components/ui/TrendChart.test.ts
git commit -m "feat(trend-chart): add buildTrendChartData and TrendChart component shell"
```

---

### Task 3: Peak/min marker plugin and delta tooltip

**Files:**
- Modify: `src/components/ui/TrendChart.tsx`

No new unit tests in this task — per the spec, the peak/min plugin and tooltip rendering are Chart.js-canvas-drawing concerns, consistent with the codebase's existing testing depth (no rendering tests exist for `DataChart` either). Implement directly, then verify via `npx tsc --noEmit` and a manual dev-server check in Task 6's verification pass.

- [ ] **Step 1: Add the peak/min plugin, scoped to a single chart instance**

Add to `src/components/ui/TrendChart.tsx`, above the `TrendChart` component:

```tsx
import type { Plugin } from "chart.js";

function buildPeakMinPlugin(primarySeries: TrendChartSeries): Plugin<"bar" | "line"> {
  return {
    id: "peakMinMarkers",
    afterDatasetsDraw(chart) {
      const meta = chart.getDatasetMeta(0); // primary bar series is always dataset 0
      if (!meta?.data?.length) return;
      const values = primarySeries.values;
      if (values.length === 0) return;

      let maxIndex = 0;
      let minIndex = 0;
      values.forEach((v, i) => {
        if (v > values[maxIndex]) maxIndex = i;
        if (v < values[minIndex]) minIndex = i;
      });
      if (maxIndex === minIndex) return; // all values equal — nothing distinguishing to mark

      const { ctx, chartArea } = chart;
      ctx.save();
      ctx.font = "600 11px 'DM Sans', system-ui, sans-serif";
      ctx.textAlign = "center";

      const maxEl = meta.data[maxIndex] as unknown as { x: number; y: number };
      const maxLabelY = Math.max(maxEl.y - 12, chartArea.top + 12);
      ctx.fillStyle = "#E9B949";
      ctx.fillText(values[maxIndex].toFixed(1), maxEl.x, maxLabelY);

      const minEl = meta.data[minIndex] as unknown as { x: number; y: number };
      const belowFits = minEl.y + 16 <= chartArea.bottom;
      const minLabelY = belowFits ? minEl.y + 16 : Math.max(minEl.y - 8, chartArea.top + 12);
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillText(values[minIndex].toFixed(1), minEl.x, minLabelY);

      ctx.restore();
    },
  };
}
```

- [ ] **Step 2: Wire the plugin into the component, gated on single-series**

Modify the `TrendChart` component body from Task 2, Step 5 — add before the `return`:

```tsx
  const plugins = bars.length === 1 ? [buildPeakMinPlugin(bars[0])] : [];
```

And update the `<Chart>` call to pass it:

```tsx
      <Chart ref={chartRef as any} type="bar" data={data} options={options as any} plugins={plugins} />
```

- [ ] **Step 3: Add the delta tooltip callback**

Replace the `tooltip: { ...CHART_DEFAULTS.tooltip } as any` line in `options.plugins` (from Task 2 Step 5) with:

```tsx
      tooltip: {
        ...CHART_DEFAULTS.tooltip,
        callbacks: {
          label: (context: any) => {
            const value = typeof context.parsed.y === "number" ? context.parsed.y : null;
            if (value === null) return `${context.dataset.label}: —`;
            const isPercent = context.dataset.yAxisID === "ySelfSufficiency";
            const suffix = isPercent ? "%" : unit ? ` ${unit}` : "";
            return `${context.dataset.label}: ${value.toFixed(1)}${suffix}`;
          },
          afterLabel: (context: any) => {
            // Only annotate the primary bar series (dataset 0) with a vs-previous delta.
            if (context.datasetIndex !== 0) return "";
            const idx = context.dataIndex;
            if (idx === 0) return "";
            const values = bars[0].values;
            const prev = values[idx - 1];
            const curr = values[idx];
            if (!prev) return ""; // skip when previous value is 0 — avoids a misleading +Infinity%
            const pct = ((curr - prev) / prev) * 100;
            const sign = pct >= 0 ? "+" : "";
            return `vs. previous: ${sign}${pct.toFixed(0)}%`;
          },
        },
      } as any,
```

- [ ] **Step 4: Verify types**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/TrendChart.tsx
git commit -m "feat(trend-chart): add peak/min marker plugin and delta tooltip"
```

---

### Task 4: Wire Solar page's 7-Day Generation History

**Files:**
- Modify: `src/app/(portal)/solar/page.tsx:223-237` (the `weeklyChartData` `useMemo`), `:345` (the render call)

- [ ] **Step 1: Replace `weeklyChartData` to produce `TrendChart` props instead of raw `ChartData`**

In `src/app/(portal)/solar/page.tsx`, replace the existing block (originally lines 223-237):

```tsx
  const weeklyChartData = useMemo(() => {
    const rows = data?.dailyRows ?? [];
    if (rows.length === 0) return null;
    return {
      labels: rows.map((r) => fmtDay(r.period_start)),
      datasets: [{
        label: "Generation kWh",
        data: rows.map((r) => parseFloat(Number(r.pv_gen_kwh).toFixed(1))),
        backgroundColor: COLORS.primaryMuted,
        borderColor: COLORS.primary,
        borderWidth: 1,
        borderRadius: 6,
      }],
    };
  }, [data?.dailyRows]);
```

with:

```tsx
  const weeklyTrendData = useMemo(() => {
    const rows = data?.dailyRows ?? [];
    if (rows.length === 0) return null;
    return {
      labels: rows.map((r) => fmtDay(r.period_start)),
      bars: [{
        label: "Generation kWh",
        values: rows.map((r) => parseFloat(Number(r.pv_gen_kwh).toFixed(1))),
        color: COLORS.primary,
      }],
    };
  }, [data?.dailyRows]);
```

- [ ] **Step 2: Update the import and render call**

Add the `TrendChart` import near the top of the file (alongside the existing `DataChart` import at line 7):

```tsx
import TrendChart from "@/components/ui/TrendChart";
```

Replace the render block (originally around line 342-349):

```tsx
        {loading ? (
          <SkeletonPulse className="h-44 w-full rounded-xl" />
        ) : weeklyChartData ? (
          <DataChart type="bar" data={weeklyChartData} height={180} />
        ) : (
          <div className="h-44 flex items-center justify-center text-white/30 text-base">
            No generation data available
          </div>
        )}
```

with:

```tsx
        {loading ? (
          <SkeletonPulse className="h-44 w-full rounded-xl" />
        ) : weeklyTrendData ? (
          <TrendChart
            labels={weeklyTrendData.labels}
            bars={weeklyTrendData.bars}
            trend={{ mode: "moving-average", window: 3 }}
            unit="kWh"
            height={180}
          />
        ) : (
          <div className="h-44 flex items-center justify-center text-white/30 text-base">
            No generation data available
          </div>
        )}
```

- [ ] **Step 3: Verify no leftover references to the old variable name**

Run: `grep -n "weeklyChartData" "src/app/(portal)/solar/page.tsx"`
Expected: no output (all renamed to `weeklyTrendData`).

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(portal)/solar/page.tsx"
git commit -m "feat(trend-chart): wire Solar page's 7-Day Generation History to TrendChart"
```

---

### Task 5: Wire History page's Monthly Trends (energy + savings toggle)

**Files:**
- Modify: `src/app/(portal)/history/page.tsx:121-155` (the `energyChartData`/`savingsChartData` objects), `:249-253` (the render call)

- [ ] **Step 1: Replace `energyChartData`/`savingsChartData` with `TrendChart`-shaped data**

In `src/app/(portal)/history/page.tsx`, replace the existing block (originally lines 121-155):

```tsx
  const energyChartData = {
    labels: safeRows.map((r) => r.month.slice(0, 3)),
    datasets: [
      {
        label: "Generation kWh",
        data: safeRows.map((r) => r.gen),
        backgroundColor: COLORS.primaryMuted,
        borderColor: COLORS.primary,
        borderWidth: 1,
        borderRadius: 6,
      },
      {
        label: "Consumption kWh",
        data: safeRows.map((r) => r.con),
        backgroundColor: COLORS.amberMuted,
        borderColor: COLORS.amber,
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const savingsChartData = {
    labels: safeRows.map((r) => r.month.slice(0, 3)),
    datasets: [
      {
        label: "Savings ₹",
        data: safeRows.map((r) => r.savings),
        backgroundColor: COLORS.primaryMuted,
        borderColor: COLORS.primary,
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };
```

with:

```tsx
  const monthlyLabels = safeRows.map((r) => r.month.slice(0, 3));

  const energyTrendBars = [
    { label: "Generation kWh", values: safeRows.map((r) => r.gen), color: COLORS.primary },
    { label: "Consumption kWh", values: safeRows.map((r) => r.con), color: COLORS.amber },
  ];

  const savingsTrendBars = [
    { label: "Savings ₹", values: safeRows.map((r) => r.savings), color: COLORS.primary },
  ];
```

Note: `energyTrendBars` intentionally puts Generation first (`bars[0]`) — per the spec, `moving-average` always tracks `bars[0]`, and Generation is the page's primary metric for the "energy" toggle.

- [ ] **Step 2: Update the import and render call**

Add the `TrendChart` import near the top of the file (alongside the existing `DataChart` import at line 7):

```tsx
import TrendChart from "@/components/ui/TrendChart";
```

Replace the render block (originally lines 249-253):

```tsx
        <DataChart
          type="bar"
          data={chartView === "energy" ? energyChartData : savingsChartData}
          height={220}
        />
```

with:

```tsx
        <TrendChart
          labels={monthlyLabels}
          bars={chartView === "energy" ? energyTrendBars : savingsTrendBars}
          trend={{ mode: "moving-average", window: 3 }}
          unit={chartView === "energy" ? "kWh" : "₹"}
          height={220}
        />
```

- [ ] **Step 3: Verify no leftover references to the old variable names**

Run: `grep -n "energyChartData\|savingsChartData" "src/app/(portal)/history/page.tsx"`
Expected: no output.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(portal)/history/page.tsx"
git commit -m "feat(trend-chart): wire History page's Monthly Trends to TrendChart"
```

---

### Task 6: Wire Consumption page's Week view with self-sufficiency trend

**Files:**
- Modify: `src/app/(portal)/consumption/page.tsx:37-49` (`ConsumptionData` interface), `:154-165` (the data-building return block), `:179-181` (chart-type/data selection), `:236-242` (the render block)

- [ ] **Step 1: Add a `weekTrend` field to `ConsumptionData` alongside the existing `weekChart`**

In `src/app/(portal)/consumption/page.tsx`, modify the `ConsumptionData` interface (originally lines 37-49):

```tsx
interface ConsumptionData {
  // KPIs
  consumptionKwh: number;
  generationKwh: number;
  selfConsumptionPct: number;
  gridImportKwh: number;
  // Chart data per view
  dayChart: ChartData;
  weekChart: ChartData;
  weekTrend: { labels: string[]; consumption: number[]; generation: number[]; selfSufficiency: number[] } | null;
  monthChart: ChartData;
  // Load forecast
  forecastChart: ChartData;
}
```

Note: `weekChart` (the plain `ChartData` shape) is kept for now to minimize the diff to the data-fetch block, but is no longer read by the render code after Step 3 below — `weekTrend` is the field the Week view actually uses. `weekChart` continues to exist only because `buildAggChart` also builds `monthChart`, which is unaffected. (Do not remove `buildAggChart`'s use for `monthChart`.)

- [ ] **Step 2: Compute `weekTrend` in the data-fetch block**

In the same file, in the `return { ... }` block (originally lines 154-165), add a `weekTrend` computation. Insert this just above the `return` statement:

```tsx
      const weekTrend = weekRows.length
        ? (() => {
            const labels = weekRows.map((r: { period_start?: string }) =>
              new Date(r.period_start ?? "").toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
            );
            const consumption = weekRows.map((r: { load_kwh?: number }) => Number(r.load_kwh) || 0);
            const generation = weekRows.map((r: { pv_gen_kwh?: number }) => Number(r.pv_gen_kwh) || 0);
            const selfSufficiency = generation.map((gen, i) => {
              const con = consumption[i];
              if (con === 0) return 0;
              return Math.min(100, Math.max(0, (gen / con) * 100));
            });
            return { labels, consumption, generation, selfSufficiency };
          })()
        : null;
```

Then add `weekTrend,` to the returned object, alongside the existing `weekChart:` line (originally line 162):

```tsx
        weekChart:     weekRows.length  ? buildAggChart(weekRows,  (ts) => new Date(ts).toLocaleDateString("en-IN", { weekday: "short", day: "numeric" })) : { labels: [], datasets: [] },
        weekTrend,
```

- [ ] **Step 3: Update the import and the Week-view render branch**

Add the `TrendChart` import near the top of the file (alongside the existing `DataChart` import at line 10):

```tsx
import TrendChart from "@/components/ui/TrendChart";
```

Replace the chart-type/data selection (originally lines 179-181):

```tsx
  const chartData = view === "Day" ? data?.dayChart : view === "Week" ? data?.weekChart : data?.monthChart;
  // Day = line (power over time), Week = bars (daily totals), Month = line (trend over months)
  const chartType: "line" | "bar" = view === "Week" ? "bar" : "line";
```

with:

```tsx
  const chartData = view === "Day" ? data?.dayChart : view === "Month" ? data?.monthChart : undefined;
  // Day = line (power over time), Week = TrendChart (daily totals + self-sufficiency), Month = line (trend over months)
  const chartType: "line" = "line"; // only used for Day/Month, which stay on DataChart
```

Replace the render block (originally lines 236-242):

```tsx
        {loading && !data ? (
          <div className="h-56 rounded-xl bg-white/[0.04] animate-pulse" />
        ) : !chartData || chartData.labels.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-base text-white/40">No data available for this period.</div>
        ) : (
          <DataChart type={chartType} data={chartData} height={220} />
        )}
```

with:

```tsx
        {loading && !data ? (
          <div className="h-56 rounded-xl bg-white/[0.04] animate-pulse" />
        ) : view === "Week" ? (
          !data?.weekTrend || data.weekTrend.labels.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-base text-white/40">No data available for this period.</div>
          ) : (
            <TrendChart
              labels={data.weekTrend.labels}
              bars={[
                { label: "Consumption kWh", values: data.weekTrend.consumption, color: COLORS.load },
                { label: "Generation kWh", values: data.weekTrend.generation, color: COLORS.primary },
              ]}
              trend={{ mode: "self-sufficiency", values: data.weekTrend.selfSufficiency, label: "Self-Sufficiency" }}
              unit="kWh"
              height={220}
            />
          )
        ) : !chartData || chartData.labels.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-base text-white/40">No data available for this period.</div>
        ) : (
          <DataChart type={chartType} data={chartData} height={220} />
        )}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. If `weekRows` row types cause implicit-`any` complaints in the Step 2 map callbacks, check how `weekRows` is typed earlier in the same function (search for `const weekRows` in the file) and match its element type in the callback parameter annotations instead of leaving them untyped.

- [ ] **Step 5: Verify no leftover references to the old bar-chart path for Week**

Run: `grep -n "chartType\|view === \"Week\"" "src/app/(portal)/consumption/page.tsx"`
Expected: `chartType` only appears in its declaration and the Day/Month `<DataChart type={chartType} .../>` call — not in any bar-chart context.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(portal)/consumption/page.tsx"
git commit -m "feat(trend-chart): wire Consumption page's Week view to TrendChart with self-sufficiency trend"
```

---

### Task 7: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm run test`
Expected: all tests pass, including the new `TrendChart.test.ts` suite and the pre-existing `src/lib/session.test.ts`.

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: no new errors introduced by this work. (If pre-existing unrelated lint errors are present elsewhere in the repo, as has been the case historically on this page — e.g. `page.tsx`'s `react-hooks/set-state-in-effect` warnings — confirm they are unchanged in count/location, not newly introduced by these changes.)

- [ ] **Step 3: Run a full production build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, all routes generate including `/solar`, `/history`, `/consumption`.

- [ ] **Step 4: Manual smoke check in dev server**

Run: `npm run dev`, then visit:
- `/solar` — confirm the 7-Day Generation History chart shows bars with a solid trend line, gradient fills, and peak/min value labels.
- `/history` — toggle between "Energy (kWh)" and "Savings (₹)"; confirm the energy view shows 2 bar series (Generation, Consumption) with a trend line tracking only Generation, and the savings view shows 1 series with peak/min markers.
- `/consumption` — switch to "Week" view; confirm 2 bar series (Consumption, Generation) plus a dashed self-sufficiency % line on a right-hand axis reading 0–100%. Switch to "Day" and "Month" views and confirm they are unchanged (still line charts via `DataChart`).

Stop the dev server (`Ctrl+C`) once confirmed.

- [ ] **Step 5: Final commit (if Step 4 surfaced any fixes)**

If Step 4 required any code fixes, commit them:

```bash
git add -A
git commit -m "fix(trend-chart): address issues found in manual verification"
```

If no fixes were needed, this step is a no-op — all work is already committed from Tasks 1-6.

---

## Self-review notes (from plan authoring)

- **Spec coverage:** every spec section maps to a task — pure helpers → Task 1, `buildTrendChartData`/component shell → Task 2, gradient fills (in Task 2's `gradientBackgroundFactory`) → Task 2, peak/min + tooltip delta → Task 3, per-page wiring table rows → Tasks 4-6, testing section → Tasks 1-2 (helpers) + Task 7 (build/lint/manual), error handling section → covered by `normalizeSeriesLength`'s throw/clamp/warn behavior (Task 1) and the unchanged empty-state gates in each page (Tasks 4-6).
- **Real discrepancy found and resolved during planning:** the spec's original per-page wiring table said History's "energy" view was a single bar series — the actual code (`energyChartData`, `history/page.tsx:121-141`) has 2 series (Generation, Consumption). This was a real spec gap (not just a plan-writing detail), so the spec document itself was patched (see the two edits to `docs/superpowers/specs/2026-07-03-trend-chart-design.md` made just before this plan was written) to define that `moving-average` always tracks `bars[0]`, and the wiring table was corrected to show 2 series with Generation as `bars[0]`. Task 5, Step 1 reflects this.
- **Type consistency check:** `TrendChartSeries` (Task 1) → used identically in `TrendChartProps.bars` (Task 2) → used identically in all three page wiring tasks (Generation/Consumption/Savings series objects all have `{ label, values, color }`). `TrendChartTrendConfig.mode` values (`"moving-average" | "self-sufficiency"`) are used consistently in Tasks 4 (moving-average), 5 (moving-average), and 6 (self-sufficiency) — no drift.
