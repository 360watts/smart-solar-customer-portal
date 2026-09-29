# Commercial Redesign Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin the portal's shell, dashboard, and energy/analytics pages (Solar, Consumption, History) onto the existing Figma `--ds-*` design system, dark-first, without changing any data-fetching, calculations, or backend contracts.

**Architecture:** Extend `src/styles/design-system-tokens.css` and `src/components/design-system/DesignSystem.tsx` (the existing, currently-demo-only Figma design system) with dark-mode ramps, energy semantic tokens, elevation/spacing tokens, and five new primitives (`Card`, `Skeleton`, `EmptyState`, `ErrorState`, `Tooltip`). Build two new shared components (`PageHeader`, a consolidated `MetricCard`) and re-skin `PortalSidebar`, `MobileTabBar`, `EnergyFlowDiagram`, and four pages (`dashboard`, `solar`, `consumption`, `history`) to use them. `globals.css` (the "Solar Noir" system) is never modified — untouched pages (Savings, Alerts, Device, Care, Help, Weather, Profile) keep using it exactly as today.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind 4 (CSS-first tokens), Framer Motion, Chart.js + react-chartjs-2, Vitest + Testing Library.

## Global Constraints

- No backend/API changes. All values shown must come from data already fetched by the page (`useSiteQuery`, `portalApi`, `AuthContext`). If a value the design calls for isn't currently available, omit it from the UI and leave a `// requires backend support` comment — never fabricate it.
- No new chart/data logic. Only presentation, styling, and trivial toggles over data the page already has.
- Do not modify `src/app/globals.css` or any "Solar Noir" (`--primary`, `--foreground`, `--sidebar-*`, `.glass*`, etc.) token — those keep serving Savings, Alerts, Device, Care, Help, Weather, Profile unchanged.
- All new/changed styling lives under `[data-ds-scope]` in `src/styles/design-system-tokens.css` and `src/components/design-system/DesignSystem.tsx`.
- `--ds-*` tokens (and their JS mirror in `src/lib/tokens.ts`) are the single source of truth for both UI and Chart.js colors — Chart.js renders to `<canvas>` and cannot read CSS custom properties, so `lib/tokens.ts` keeps literal hex values that must stay in sync with `design-system-tokens.css` (enforced by a comment, not code, since there is no build-time CSS-to-JS token pipeline in this repo).
- Relabeling is UI-copy-only: "History" page's nav label becomes "Analytics", "Device" page's nav label becomes "Equipment" — routes/filenames (`/history`, `/device`) do not change.
- Routes/pages out of scope (Savings, Alerts, Device, Care, Help, Weather, Profile) get zero page-body changes this phase; they may only be reachable through the re-skinned nav.
- Existing data-fetching/business-logic blocks in every touched page (`useSiteQuery` calls, PR/solar-day math, alert/device aggregation, forecast fetch logic) are not modified — only JSX/markup/styling.

---

## File Structure

New files:
- `src/styles/design-system-tokens.css` — **modified**, not created (add dark ramps, energy tokens, elevation/spacing/shadow tokens)
- `src/components/design-system/DesignSystem.tsx` — **modified** (add `Card`, `Skeleton`, `EmptyState`, `ErrorState`, `Tooltip`)
- `src/components/layout/PageHeader.tsx` — **new** (site name/capacity/status/live/notifications/profile-entry header)
- `src/components/layout/PageHeader.test.tsx` — **new**
- `src/components/ui/MetricCard.tsx` — **modified** (add `variant: "simple" | "detailed"`, absorbing dashboard's local `DetailedKpiCard`)
- `src/components/ui/MetricCard.test.tsx` — **new**
- `src/components/layout/PortalSidebar.tsx` — **modified** (regroup nav, ds-scope styling)
- `src/components/layout/MobileTabBar.tsx` — **modified** (tab set, ds-scope styling)
- `src/lib/tokens.ts` — **modified** (COLORS mirrors new `--ds-solar/grid/battery/consumption` hex values)
- `src/components/ui/EnergyFlowDiagram.tsx` — **modified** (hex literals → `COLORS` imports)
- `src/components/ui/HourlyGenerationChart.tsx` — **modified** (verify/align with updated `getChartDefaults`)
- `src/app/(portal)/dashboard/page.tsx` — **modified** (adopt `PageHeader`, plant-status line, consolidated `MetricCard`, ds `Skeleton`/`EmptyState`/`ErrorState`)
- `src/app/(portal)/solar/page.tsx` — **modified** (adopt `PageHeader`, `MetricCard`, ds chart theming)
- `src/app/(portal)/consumption/page.tsx` — **modified** (adopt `PageHeader`, ds re-skin)
- `src/app/(portal)/history/page.tsx` — **modified** (adopt `PageHeader`, ds re-skin, "Analytics" label)

---

### Task 1: Design tokens — dark ramps, energy semantics, elevation/spacing/shadow

**Files:**
- Modify: `src/styles/design-system-tokens.css`

**Interfaces:**
- Produces: CSS custom properties `--ds-primary-dark-900..100`, `--ds-cta-dark-900..100`, `--ds-success/warning/error/info-dark-*` (used only inside the dark selector below, not as new public names — see note), `--ds-solar`, `--ds-grid`, `--ds-battery`, `--ds-consumption` (+ light/dark values), `--ds-surface-0/1/2`, `--ds-shadow-sm/md/lg`, `--ds-space-1..8`. Later tasks (2, 3, 4, 6-13) consume these by name.

- [ ] **Step 1: Add dark-mode ramp overrides**

Append inside the existing `[data-ds-scope][data-ds-theme="dark"]` block (after `--ds-border: #40444d;`) in `src/styles/design-system-tokens.css`:

```css
  /* Dark-mode ramps for primary/cta/success/warning/error/info — the Figma
     sheets only specify light-mode ramps, so these are a considered
     extension: same base hues, deepened toward neutral-900 on the dark end
     and lightened toward white on the light end, so contrast holds in dark
     UI the way the light ramps do in light UI. Not lifted from Figma. */
  --ds-primary-900: #def2e4; --ds-primary-800: #bde5c9; --ds-primary-700: #9dd7af;
  --ds-primary-600: #7cca94; --ds-primary: #5bbd79; --ds-primary-400: #499761;
  --ds-primary-300: #377149; --ds-primary-200: #244c30; --ds-primary-100: #122618;

  --ds-cta-900: #fce3d3; --ds-cta-800: #fac8a6; --ds-cta-700: #f7ac7a;
  --ds-cta-600: #f5914d; --ds-cta: #f27521; --ds-cta-400: #c15e1a;
  --ds-cta-300: #914614; --ds-cta-200: #612f0d; --ds-cta-100: #301707;

  --ds-success-900: #d2e8de; --ds-success-800: #a5d0bd; --ds-success-700: #79b99d;
  --ds-success-600: #4ca17c; --ds-success: #1f8a5b; --ds-success-400: #196e49;
  --ds-success-300: #135337; --ds-success-200: #0c3724; --ds-success-100: #061c12;

  --ds-warning-900: #fbf1db; --ds-warning-800: #f6e3b6; --ds-warning-700: #f2d592;
  --ds-warning-600: #edc76d; --ds-warning: #e9b949; --ds-warning-400: #ba943a;
  --ds-warning-300: #8c6f2c; --ds-warning-200: #5d4a1d; --ds-warning-100: #2f250f;

  --ds-error-900: #f3cdcd; --ds-error-800: #e79c9c; --ds-error-700: #dc6a6a;
  --ds-error-600: #d03939; --ds-error: #c40707; --ds-error-400: #9d0606;
  --ds-error-300: #750404; --ds-error-200: #4e0303; --ds-error-100: #270101;

  --ds-info-900: #d3dbe0; --ds-info-800: #a7b8c1; --ds-info-700: #7c94a3;
  --ds-info-600: #507184; --ds-info: #244d65; --ds-info-400: #1d3e51;
  --ds-info-300: #162e3d; --ds-info-200: #0e1f28; --ds-info-100: #070f14;

  /* Elevation surfaces: page -> card -> elevated/popover */
  --ds-surface-0: #101214;
  --ds-surface-1: #16181b;
  --ds-surface-2: #1e2125;

  --ds-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --ds-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.45);
  --ds-shadow-lg: 0 12px 28px rgba(0, 0, 0, 0.5);
```

- [ ] **Step 2: Add energy semantic tokens (light + dark) and spacing scale to the base `[data-ds-scope]` block and the dark override block**

In the base `[data-ds-scope] { ... }` block (light mode), add after the Info ramp (after line with `--ds-info-100: #d3dbe0;`):

```css
  /* Energy semantics — distinct from generic success/warning/error so
     solar/grid/battery/consumption read as domain concepts, not status. */
  --ds-solar: var(--ds-primary);       /* generation = brand green */
  --ds-grid: var(--ds-info);           /* grid = informational blue */
  --ds-battery: #7c5cbf;               /* new hue: purple, distinct from cta-orange */
  --ds-battery-100: #ece5f7;
  --ds-consumption: var(--ds-neutral-600);

  --ds-space-1: 4px; --ds-space-2: 8px; --ds-space-3: 12px; --ds-space-4: 16px;
  --ds-space-5: 20px; --ds-space-6: 24px; --ds-space-7: 32px; --ds-space-8: 48px;

  --ds-surface-0: #ffffff;
  --ds-surface-1: #ffffff;
  --ds-surface-2: #f7f8f9;
  --ds-shadow-sm: 0 1px 2px rgba(21, 23, 26, 0.06);
  --ds-shadow-md: 0 4px 12px rgba(21, 23, 26, 0.08);
  --ds-shadow-lg: 0 12px 28px rgba(21, 23, 26, 0.12);
```

In the `[data-ds-scope][data-ds-theme="dark"]` block, add (after the elevation tokens from Step 1):

```css
  --ds-solar: var(--ds-primary);
  --ds-grid: var(--ds-info);
  --ds-battery: #9b82d6;
  --ds-battery-100: #2a2340;
  --ds-consumption: var(--ds-neutral-400);
```

- [ ] **Step 3: Verify no build errors**

Run: `npm run build` from `c:\Office Projects\smart-solar-customer-portal`
Expected: build succeeds (this is a CSS-only change; no component references these new tokens yet, so nothing can fail at this point besides a syntax error in the CSS file).

- [ ] **Step 4: Commit**

```bash
git add src/styles/design-system-tokens.css
git commit -m "feat(design-system): add dark ramps, energy semantics, and elevation tokens"
```

---

### Task 2: Sync `lib/tokens.ts` COLORS with the new ds energy tokens

**Files:**
- Modify: `src/lib/tokens.ts`

**Interfaces:**
- Consumes: hex literals decided in Task 1 (`--ds-solar` → `var(--ds-primary)` → `#5bbd79`/dark `#5bbd79` is the same value both themes since it's `var(--ds-primary)`; `--ds-grid` → `var(--ds-info)` → light `#244d65` / dark `#244d65` same value too; `--ds-battery` → light `#7c5cbf` / dark `#9b82d6`; `--ds-consumption` → `var(--ds-neutral-600)` → light `#565b66` / dark `#565b66`).
- Produces: `COLORS.solar`, `COLORS.grid`, `COLORS.battery`, `COLORS.consumption` (dark-theme values, since the portal's default/primary theme is dark) — consumed by Task 8 (`EnergyFlowDiagram`) and Task 9 (`HourlyGenerationChart`) and any chart in Tasks 10-13.

- [ ] **Step 1: Update `COLORS` object**

In `src/lib/tokens.ts`, replace the `// Energy type colors` block (lines 20-24):

```typescript
  // Energy type colors — mirrors --ds-solar/--ds-grid/--ds-battery/--ds-consumption
  // in src/styles/design-system-tokens.css (dark-theme values; Chart.js/SVG
  // need literal hex, not CSS vars, so these must be kept in sync by hand).
  solar: "#5bbd79",
  battery: "#9b82d6",
  grid: "#244d65",
  load: "#565b66",
```

Keep `load` as the existing key name (it's referenced elsewhere as `COLORS.load` for the consumption/load series) but now sourced from the same value as `--ds-consumption`.

- [ ] **Step 2: Run the existing token-consuming test to confirm nothing broke**

Run: `npx vitest run src/components/ui/TrendChart.test.ts`
Expected: PASS (this test exercises `getChartDefaults`/`COLORS` indirectly; it should be unaffected since only color values changed, not shape).

- [ ] **Step 3: Commit**

```bash
git add src/lib/tokens.ts
git commit -m "feat(design-system): sync chart COLORS with ds energy tokens"
```

---

### Task 3: New design-system primitives — Card, Skeleton, EmptyState, ErrorState, Tooltip

**Files:**
- Modify: `src/components/design-system/DesignSystem.tsx`
- Test: `src/components/design-system/DesignSystem.test.tsx` (new)

**Interfaces:**
- Produces:
  - `Card({ elevation?: 0 | 1 | 2; className?: string; children }): JSX.Element`
  - `Skeleton({ className?: string; height?: number | string; width?: number | string }): JSX.Element`
  - `EmptyState({ icon?: LucideIcon; title: string; message: string; action?: { label: string; onClick: () => void } }): JSX.Element`
  - `ErrorState({ title?: string; message: string; onRetry?: () => void }): JSX.Element`
  - `Tooltip({ label: string; children: React.ReactNode }): JSX.Element`
- Consumes: `--ds-surface-0/1/2`, `--ds-shadow-sm/md/lg`, `--ds-border`, `--ds-radius-sm/lg`, `--ds-text-heading/body`, `--ds-neutral-*` from Task 1; existing `Heading`/`Text`/`Button` from the same file.

- [ ] **Step 1: Write the failing tests**

Create `src/components/design-system/DesignSystem.test.tsx`:

```tsx
// @vitest-environment jsdom
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { Card, Skeleton, EmptyState, ErrorState, Tooltip } from "./DesignSystem";

describe("DesignSystem new primitives", () => {
  afterEach(cleanup);

  it("Card renders children", () => {
    render(<Card>Hello</Card>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("Skeleton renders a placeholder element with no text content", () => {
    const { container } = render(<Skeleton height={20} width={100} />);
    expect(container.firstChild).toBeInTheDocument();
    expect(container.textContent).toBe("");
  });

  it("EmptyState renders title, message, and optional action", () => {
    const onClick = vi.fn();
    render(<EmptyState title="No alerts" message="Everything is operating normally." action={{ label: "Refresh", onClick }} />);
    expect(screen.getByText("No alerts")).toBeInTheDocument();
    expect(screen.getByText("Everything is operating normally.")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Refresh"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("ErrorState renders message and calls onRetry", () => {
    const onRetry = vi.fn();
    render(<ErrorState message="The monitoring service could not be reached." onRetry={onRetry} />);
    expect(screen.getByText("The monitoring service could not be reached.")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Try again"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("Tooltip renders its trigger children", () => {
    render(<Tooltip label="Info"><span>Trigger</span></Tooltip>);
    expect(screen.getByText("Trigger")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/design-system/DesignSystem.test.tsx`
Expected: FAIL — `Card`, `Skeleton`, `EmptyState`, `ErrorState`, `Tooltip` are not exported from `./DesignSystem`.

- [ ] **Step 3: Implement the five components**

Append to `src/components/design-system/DesignSystem.tsx` (after the existing `BottomNav` function, before end of file):

```tsx
// ─── Card ────────────────────────────────────────────────────────────────────

export function Card({
  elevation = 1, className = "", children,
}: { elevation?: 0 | 1 | 2; className?: string; children: React.ReactNode }) {
  const shadow = elevation === 0 ? "none" : elevation === 1 ? "var(--ds-shadow-sm)" : "var(--ds-shadow-md)";
  const bg = elevation === 2 ? "var(--ds-surface-2)" : "var(--ds-surface-1)";
  return (
    <div
      className={className}
      style={{
        background: bg,
        border: "1px solid var(--ds-border)",
        borderRadius: "var(--ds-radius-lg)",
        boxShadow: shadow,
        padding: "var(--ds-space-5)",
      }}
    >
      {children}
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

export function Skeleton({
  className = "", height = 16, width = "100%",
}: { className?: string; height?: number | string; width?: number | string }) {
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{
        height, width,
        borderRadius: "var(--ds-radius-sm)",
        background: "var(--ds-neutral-200)",
      }}
      aria-hidden="true"
    />
  );
}

// ─── Empty / Error states ────────────────────────────────────────────────────

export function EmptyState({
  icon: Icon = Info, title, message, action,
}: { icon?: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; title: string; message: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="flex flex-col items-center text-center gap-2" style={{ padding: "var(--ds-space-7) var(--ds-space-4)" }}>
      <Icon size={28} style={{ color: "var(--ds-neutral-400)" }} />
      <Heading level="h6" weight="semibold">{title}</Heading>
      <Text size="sm" style={{ color: "var(--ds-neutral-500)", maxWidth: 320 }}>{message}</Text>
      {action && (
        <Button variant="outline" size="sm" className="mt-2" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong", message, onRetry,
}: { title?: string; message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center text-center gap-2" style={{ padding: "var(--ds-space-7) var(--ds-space-4)" }}>
      <AlertTriangle size={28} style={{ color: "var(--ds-error)" }} />
      <Heading level="h6" weight="semibold">{title}</Heading>
      <Text size="sm" style={{ color: "var(--ds-neutral-500)", maxWidth: 320 }}>{message}</Text>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

export function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className="absolute z-10 whitespace-nowrap"
          style={{
            ...font, bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)",
            background: "var(--ds-neutral-900)", color: "#fff", fontSize: 12, fontWeight: 500,
            padding: "4px 8px", borderRadius: "var(--ds-radius-sm)",
          }}
        >
          {label}
        </span>
      )}
    </span>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/design-system/DesignSystem.test.tsx`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/design-system/DesignSystem.tsx src/components/design-system/DesignSystem.test.tsx
git commit -m "feat(design-system): add Card, Skeleton, EmptyState, ErrorState, Tooltip"
```

---

### Task 4: Consolidated `MetricCard` (absorbs dashboard's local `DetailedKpiCard`)

**Files:**
- Modify: `src/components/ui/MetricCard.tsx`
- Test: `src/components/ui/MetricCard.test.tsx` (new)

**Interfaces:**
- Produces:
  ```typescript
  interface MetricCardProps {
    variant?: "simple" | "detailed"; // default "simple"
    title: string;
    value: number | string;
    icon: LucideIcon;
    suffix?: string;
    delay?: number;
    // simple-variant only:
    trend?: { direction: "up" | "down" | "neutral"; value: string };
    // detailed-variant only:
    tone?: "primary" | "solar" | "grid" | "battery" | "consumption" | "info";
    badge?: string;
    badgeTone?: "neutral" | "good" | "warn";
    bigDecimals?: number;
    progressPct?: number;
    progressLabel?: string;
    progressValueLabel?: string;
    cornerLabel?: string;
    cornerValue?: string;
    rows?: { label: string; value: string }[];
    footer?: string;
    loading?: boolean;
  }
  export default function MetricCard(props: MetricCardProps): JSX.Element
  ```
- Consumes: `--ds-surface-1`, `--ds-border`, `--ds-radius-lg`, `--ds-space-*`, `--ds-solar/grid/battery/consumption/info` from Task 1; `Skeleton` from Task 3 (for `loading` state).

- [ ] **Step 1: Write the failing tests**

Create `src/components/ui/MetricCard.test.tsx`:

```tsx
// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, it, expect } from "vitest";
import { Zap } from "lucide-react";
import MetricCard from "./MetricCard";

describe("MetricCard", () => {
  afterEach(cleanup);

  it("simple variant renders title and value", () => {
    render(<MetricCard title="Generation" value={1284} suffix="kWh" icon={Zap} />);
    expect(screen.getByText("Generation")).toBeInTheDocument();
    expect(screen.getByText("kWh")).toBeInTheDocument();
  });

  it("detailed variant renders badge, rows, and footer", () => {
    render(
      <MetricCard
        variant="detailed"
        title="System Capacity"
        value={12.5}
        icon={Zap}
        tone="solar"
        badge="Installed"
        badgeTone="good"
        progressPct={92}
        progressLabel="System health"
        rows={[{ label: "Peak Today", value: "9.8 kW" }, { label: "Headroom", value: "2.7 kW" }]}
        footer="All monitored devices are online and reporting."
      />
    );
    expect(screen.getByText("System Capacity")).toBeInTheDocument();
    expect(screen.getByText("Installed")).toBeInTheDocument();
    expect(screen.getByText("Peak Today")).toBeInTheDocument();
    expect(screen.getByText("9.8 kW")).toBeInTheDocument();
    expect(screen.getByText("All monitored devices are online and reporting.")).toBeInTheDocument();
  });

  it("detailed variant shows a skeleton and no value text while loading", () => {
    render(<MetricCard variant="detailed" title="Today's Generation" value={0} icon={Zap} loading />);
    expect(screen.queryByText("Today's Generation")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/ui/MetricCard.test.tsx`
Expected: FAIL — current `MetricCard` has no `variant`, `tone`, `badge`, `rows`, `footer`, or `loading` props.

- [ ] **Step 3: Implement the consolidated component**

Replace the full contents of `src/components/ui/MetricCard.tsx`:

```tsx
"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUp, ArrowDown, Minus, LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/design-system/DesignSystem";

type Tone = "primary" | "solar" | "grid" | "battery" | "consumption" | "info";
type BadgeTone = "neutral" | "good" | "warn";

const TONE_VAR: Record<Tone, string> = {
  primary: "var(--ds-primary)",
  solar: "var(--ds-solar)",
  grid: "var(--ds-grid)",
  battery: "var(--ds-battery)",
  consumption: "var(--ds-consumption)",
  info: "var(--ds-info)",
};

const BADGE_TONE_VAR: Record<BadgeTone, string> = {
  neutral: "var(--ds-neutral-500)",
  good: "var(--ds-success)",
  warn: "var(--ds-warning)",
};

interface MetricCardProps {
  variant?: "simple" | "detailed";
  title: string;
  value: number | string;
  icon: LucideIcon;
  suffix?: string;
  delay?: number;
  // simple-variant only
  trend?: { direction: "up" | "down" | "neutral"; value: string };
  // detailed-variant only
  tone?: Tone;
  badge?: string;
  badgeTone?: BadgeTone;
  bigDecimals?: number;
  progressPct?: number;
  progressLabel?: string;
  progressValueLabel?: string;
  cornerLabel?: string;
  cornerValue?: string;
  rows?: { label: string; value: string }[];
  footer?: string;
  loading?: boolean;
}

export default function MetricCard({
  variant = "simple",
  title,
  value,
  icon: Icon,
  suffix = "",
  delay = 0,
  trend,
  tone = "primary",
  badge,
  badgeTone = "neutral",
  bigDecimals = 1,
  progressPct,
  progressLabel,
  progressValueLabel,
  cornerLabel,
  cornerValue,
  rows,
  footer,
  loading = false,
}: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [pulseKey, setPulseKey] = useState(0);
  const mounted = React.useRef(false);
  const toneColor = TONE_VAR[tone];

  useEffect(() => {
    if (typeof value === "number") {
      const start = performance.now();
      const numValue = value;
      const duration = 1200;
      const animate = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(Number((numValue * easeOut).toFixed(variant === "detailed" ? bigDecimals : 0)));
        if (progress < 1) requestAnimationFrame(animate);
      };
      const id = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(id);
    }
  }, [value, variant, bigDecimals]);

  useEffect(() => {
    if (mounted.current) setPulseKey((k) => k + 1);
    else mounted.current = true;
  }, [value]);

  if (variant === "detailed" && loading) {
    return (
      <div style={{ background: "var(--ds-surface-1)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-lg)", padding: "var(--ds-space-5)" }}>
        <Skeleton height={14} width="50%" className="mb-3" />
        <Skeleton height={32} width="70%" className="mb-3" />
        <Skeleton height={6} width="100%" />
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, delay: delay * 0.07 }}
        style={{
          background: "var(--ds-surface-1)",
          border: "1px solid var(--ds-border)",
          borderRadius: "var(--ds-radius-lg)",
          padding: "var(--ds-space-5)",
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `color-mix(in srgb, ${toneColor} 16%, transparent)` }}>
              <Icon size={16} style={{ color: toneColor }} />
            </span>
            <span className="text-sm font-medium" style={{ color: "var(--ds-text-body)" }}>{title}</span>
          </div>
          {badge && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: BADGE_TONE_VAR[badgeTone], background: `color-mix(in srgb, ${BADGE_TONE_VAR[badgeTone]} 14%, transparent)` }}>
              {badge}
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-1.5 mb-1">
          <motion.span
            key={pulseKey}
            initial={{ color: toneColor }}
            animate={{ color: "var(--ds-text-heading)" }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 30, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
          >
            {typeof value === "number" ? displayValue.toFixed(bigDecimals) : value}
          </motion.span>
          {suffix && <span className="text-sm font-medium" style={{ color: "var(--ds-neutral-400)" }}>{suffix}</span>}
          {cornerLabel && cornerValue && (
            <span className="ml-auto text-xs" style={{ color: "var(--ds-neutral-400)" }}>{cornerLabel}: {cornerValue}</span>
          )}
        </div>

        {progressPct != null && (
          <div className="my-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs" style={{ color: "var(--ds-neutral-400)" }}>{progressLabel}</span>
              {progressValueLabel && <span className="text-xs font-semibold" style={{ color: toneColor }}>{progressValueLabel}</span>}
            </div>
            <div className="w-full rounded-full overflow-hidden" style={{ height: 5, background: "var(--ds-neutral-100)" }}>
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, progressPct))}%`, background: toneColor }} />
            </div>
          </div>
        )}

        {rows && rows.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            {rows.map((row) => (
              <div key={row.label} className="min-w-0">
                <p className="text-xs truncate" style={{ color: "var(--ds-neutral-400)" }}>{row.label}</p>
                <p className="text-sm font-semibold truncate" style={{ fontFamily: "var(--font-jetbrains-mono), monospace", color: "var(--ds-text-heading)" }}>{row.value}</p>
              </div>
            ))}
          </div>
        )}

        {footer && <p className="text-xs mt-3" style={{ color: "var(--ds-neutral-400)" }}>{footer}</p>}
      </motion.div>
    );
  }

  // ── simple variant (existing behavior, ds-token styling) ──
  const trendIcon = trend?.direction === "up" ? ArrowUp : trend?.direction === "down" ? ArrowDown : Minus;
  const TrendIcon = trendIcon;
  const trendColor = trend?.direction === "up" ? "var(--ds-success)" : trend?.direction === "down" ? "var(--ds-error)" : "var(--ds-neutral-400)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30, delay: delay * 0.07 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      style={{ background: "var(--ds-surface-1)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-lg)", padding: "var(--ds-space-5)", cursor: "pointer" }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: "var(--ds-neutral-400)" }}>{title}</p>
          <div className="flex items-baseline gap-2">
            <motion.span
              key={pulseKey}
              initial={{ color: toneColor }}
              animate={{ color: "var(--ds-text-heading)" }}
              transition={{ duration: 1.1, ease: "easeOut" }}
              style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 28, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
            >
              {typeof value === "number" ? displayValue : value}
              {suffix && <span className="text-lg font-semibold ml-1" style={{ color: "var(--ds-neutral-400)" }}>{suffix}</span>}
            </motion.span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: `color-mix(in srgb, ${toneColor} 16%, transparent)` }}>
          <Icon size={24} style={{ color: toneColor }} />
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-sm" style={{ color: trendColor }}>
          <TrendIcon size={16} />
          <span>{trend.value}</span>
        </div>
      )}
    </motion.div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/ui/MetricCard.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/MetricCard.tsx src/components/ui/MetricCard.test.tsx
git commit -m "feat(ui): consolidate MetricCard with simple/detailed variants on ds tokens"
```

---

### Task 5: New `PageHeader` component

**Files:**
- Create: `src/components/layout/PageHeader.tsx`
- Test: `src/components/layout/PageHeader.test.tsx`

**Interfaces:**
- Produces:
  ```typescript
  interface PageHeaderProps {
    siteName: string;
    capacityKwp?: number | null;       // omit rendering the capacity chip when null/undefined
    status: "operational" | "degraded" | "attention" | "offline";
    lastUpdatedLabel?: string | null;  // e.g. "10:42 AM" — omit the chip when null/undefined
    isLive?: boolean;
    notificationCount?: number;
    onNotificationsClick?: () => void;
  }
  export default function PageHeader(props: PageHeaderProps): JSX.Element
  ```
- Consumes: `--ds-surface-0/1`, `--ds-border`, `--ds-text-heading/body`, `--ds-success/warning/error/neutral` from Task 1; `Avatar` from existing `DesignSystem.tsx`; `useAuth()` is NOT called inside this component — callers pass already-resolved data, keeping this component a pure presentation piece reusable by Dashboard/Solar/Consumption/History (Tasks 10-13).

- [ ] **Step 1: Write the failing tests**

Create `src/components/layout/PageHeader.test.tsx`:

```tsx
// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, it, expect } from "vitest";
import PageHeader from "./PageHeader";

describe("PageHeader", () => {
  afterEach(cleanup);

  it("renders site name and operational status", () => {
    render(<PageHeader siteName="Chennai Manufacturing" status="operational" />);
    expect(screen.getByText("Chennai Manufacturing")).toBeInTheDocument();
    expect(screen.getByText("Operational")).toBeInTheDocument();
  });

  it("omits the capacity chip when capacityKwp is not provided", () => {
    render(<PageHeader siteName="Site A" status="operational" />);
    expect(screen.queryByText(/kWp/)).not.toBeInTheDocument();
  });

  it("renders the capacity chip when capacityKwp is provided", () => {
    render(<PageHeader siteName="Site A" status="operational" capacityKwp={250} />);
    expect(screen.getByText("250 kWp")).toBeInTheDocument();
  });

  it("maps each status to distinct label text", () => {
    const { rerender } = render(<PageHeader siteName="Site A" status="degraded" />);
    expect(screen.getByText("Degraded")).toBeInTheDocument();
    rerender(<PageHeader siteName="Site A" status="attention" />);
    expect(screen.getByText("Attention Required")).toBeInTheDocument();
    rerender(<PageHeader siteName="Site A" status="offline" />);
    expect(screen.getByText("Offline")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/layout/PageHeader.test.tsx`
Expected: FAIL — `./PageHeader` does not exist.

- [ ] **Step 3: Implement `PageHeader`**

Create `src/components/layout/PageHeader.tsx`:

```tsx
"use client";

import React from "react";
import { Bell } from "lucide-react";

type Status = "operational" | "degraded" | "attention" | "offline";

const STATUS_META: Record<Status, { label: string; color: string }> = {
  operational: { label: "Operational", color: "var(--ds-success)" },
  degraded: { label: "Degraded", color: "var(--ds-warning)" },
  attention: { label: "Attention Required", color: "var(--ds-warning)" },
  offline: { label: "Offline", color: "var(--ds-error)" },
};

interface PageHeaderProps {
  siteName: string;
  capacityKwp?: number | null;
  status: Status;
  lastUpdatedLabel?: string | null;
  isLive?: boolean;
  notificationCount?: number;
  onNotificationsClick?: () => void;
}

export default function PageHeader({
  siteName,
  capacityKwp,
  status,
  lastUpdatedLabel,
  isLive = false,
  notificationCount = 0,
  onNotificationsClick,
}: PageHeaderProps) {
  const meta = STATUS_META[status];
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3"
      style={{ padding: "var(--ds-space-4) 0", borderBottom: "1px solid var(--ds-border)" }}
    >
      <div className="flex flex-wrap items-center gap-3 min-w-0">
        <span className="text-lg font-bold truncate" style={{ fontFamily: "var(--font-inter), sans-serif", color: "var(--ds-text-heading)" }}>
          {siteName}
        </span>
        {capacityKwp != null && (
          <span className="text-sm shrink-0" style={{ color: "var(--ds-neutral-400)" }}>
            {capacityKwp} kWp
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 text-sm font-medium shrink-0" style={{ color: meta.color }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} aria-hidden="true" />
          {meta.label}
        </span>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {isLive && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--ds-success)" }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--ds-success)" }} aria-hidden="true" />
            Live
          </span>
        )}
        {lastUpdatedLabel && (
          <span className="text-xs" style={{ color: "var(--ds-neutral-400)" }}>
            Updated {lastUpdatedLabel}
          </span>
        )}
        <button
          onClick={onNotificationsClick}
          aria-label="Notifications"
          className="relative w-9 h-9 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg"
          style={{ color: "var(--ds-neutral-400)" }}
        >
          <Bell size={16} />
          {notificationCount > 0 && (
            <span
              className="absolute top-1 right-1.5 w-2 h-2 rounded-full"
              style={{ background: "var(--ds-error)" }}
              aria-label={`${notificationCount} unread notifications`}
            />
          )}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/layout/PageHeader.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/PageHeader.tsx src/components/layout/PageHeader.test.tsx
git commit -m "feat(layout): add PageHeader component"
```

---

### Task 6: Re-skin `PortalSidebar` — regroup nav, apply ds tokens

**Files:**
- Modify: `src/components/layout/PortalSidebar.tsx`

**Interfaces:**
- Consumes: `--ds-surface-0/1`, `--ds-border`, `--ds-primary`, `--ds-text-heading/body` from Task 1. Keeps existing `useAuth`, `useTheme`, `useSiteQuery`/`portalApi.getSiteIncidents` badge logic (lines 89-105 of the current file) unchanged.

- [ ] **Step 1: Regroup `NAV_GROUPS`**

In `src/components/layout/PortalSidebar.tsx`, replace lines 29-55 (`const NAV_GROUPS: ... = [ ... ];`):

```typescript
// Grouped per the commercial IA: Overview -> Energy -> Performance ->
// Operations -> Support. Routes/filenames are unchanged; only grouping and
// a few nav labels differ from the underlying page (History -> "Analytics",
// Device -> "Equipment") per the redesign spec.
const NAV_GROUPS: { label: string | null; items: NavItem[] }[] = [
  { label: null, items: [{ href: "/dashboard", icon: LayoutDashboard, label: "Overview" }] },
  {
    label: "Energy",
    items: [
      { href: "/solar", icon: Sun, label: "Solar" },
      { href: "/consumption", icon: Zap, label: "Consumption" },
    ],
  },
  {
    label: "Performance",
    items: [
      { href: "/history", icon: TrendingUp, label: "Analytics" },
      { href: "/savings", icon: PiggyBank, label: "Savings" },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/alerts", icon: AlertCircle, label: "Alerts" },
      { href: "/device", icon: Cpu, label: "Equipment" },
      { href: "/care", icon: ShieldCheck, label: "360Care" },
    ],
  },
  {
    label: "Support",
    items: [
      { href: "/help", icon: HelpCircle, label: "Help & Support" },
      { href: "/weather", icon: Cloud, label: "Weather" },
    ],
  },
];
```

(This keeps every existing route reachable — Savings moved under Performance, Weather moved under Support per the approved spec's "de-emphasize, don't remove" instruction — without adding or deleting any `NavItem`.)

- [ ] **Step 2: Wrap the sidebar root in `data-ds-scope` and swap surface tokens**

Replace the opening of the returned `<motion.aside>` (around line 108-113):

```tsx
  return (
    <motion.aside
      data-ds-scope=""
      animate={{ width: collapsed ? 72 : 212 }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className="hidden md:flex flex-col h-full shrink-0 overflow-hidden"
      style={{ background: "var(--ds-surface-0)", borderRight: "1px solid var(--ds-border)" }}
    >
```

Replace every other `var(--sidebar-background)` / `var(--sidebar-accent)` / `var(--sidebar-border)` occurrence in this file (header border at line 116, nav scrollbar at line 157, footer popover background/border at lines 244 and 83-in-MobileTabBar-N/A, hover backgrounds at lines 190/193/251/259/269/286/305) with `var(--ds-surface-0)` (background) / `var(--ds-surface-2)` (accent/hover) / `var(--ds-border)` (border) respectively. Replace `var(--glow-green)` scrollbar/active-row tint (lines 157, 186) with `var(--ds-primary)`. Replace `var(--primary)` gradient stops (lines 294, 310) with `var(--ds-primary)`, and `#007a55` with `var(--ds-primary-700)`. Replace `text-foreground`/`text-foreground/70`/`text-foreground/80` Tailwind utility classes with inline `style={{ color: "var(--ds-text-heading)" }}` / `"var(--ds-text-body)"` as appropriate, and `text-emerald-400` with inline `style={{ color: "var(--ds-primary)" }}`.

- [ ] **Step 3: Manual verification**

Run: `npm run dev`, open `/dashboard`, confirm:
- Sidebar renders 5 groups (Overview / Energy / Performance / Operations / Support) with all 9 original routes present and clickable.
- Active-route highlight, collapse/expand animation, and the Alerts badge count still work exactly as before.
- Toggle light/dark via the profile popover — sidebar recolors correctly in both.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/PortalSidebar.tsx
git commit -m "feat(layout): re-skin PortalSidebar onto ds tokens with commercial IA grouping"
```

---

### Task 7: Re-skin `MobileTabBar` — tab set and ds tokens

**Files:**
- Modify: `src/components/layout/MobileTabBar.tsx`

**Interfaces:**
- Consumes: `--ds-surface-0`, `--ds-border`, `--ds-primary`, `--ds-text-body` from Task 1.

- [ ] **Step 1: Update `TABS`/`MORE_ITEMS`**

Replace lines 21-36:

```typescript
// Four highest-traffic destinations get a permanent tab; everything else
// lives behind "More". "Energy" routes to Solar (the primary generation
// view) — Consumption is one tap away via the sidebar's Energy group and
// via the dashboard's quick-nav tiles; a literal "/energy" route does not
// exist and this phase does not add one.
const TABS: TabItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/solar", icon: Sun, label: "Energy" },
  { href: "/history", icon: TrendingUp, label: "Analytics" },
  { href: "/alerts", icon: AlertCircle, label: "Alerts" },
];

const MORE_ITEMS: TabItem[] = [
  { href: "/consumption", icon: Zap, label: "Consumption" },
  { href: "/weather", icon: Cloud, label: "Weather" },
  { href: "/savings", icon: PiggyBank, label: "Savings" },
  { href: "/device", icon: Cpu, label: "Equipment" },
  { href: "/care", icon: ShieldCheck, label: "360Care" },
  { href: "/profile", icon: User, label: "Profile" },
  { href: "/help", icon: HelpCircle, label: "Help" },
];
```

- [ ] **Step 2: Swap tokens**

Replace `var(--sidebar-background)` / `var(--sidebar-border)` (lines 69, 83, 122-124) with `var(--ds-surface-0)` / `var(--ds-border)`. Replace `text-emerald-400` classes (lines 105, 135, 147) with inline `style={{ color: "var(--ds-primary)" }}` merged into the existing conditional style prop, and `var(--glow-green)` (line 107) with `var(--ds-primary)`. Replace `text-foreground`/`text-foreground/60`/`text-foreground/75` with `var(--ds-text-body)` / `color-mix(in srgb, var(--ds-text-body) 60%, transparent)` as appropriate.

- [ ] **Step 3: Manual verification**

Run: `npm run dev`, resize to mobile width (or use device toolbar), confirm:
- 4 tabs read Overview / Energy / Analytics / Alerts; tapping Energy opens `/solar`, Analytics opens `/history`.
- "More" sheet lists Consumption, Weather, Savings, Equipment, 360Care, Profile, Help — all 7 routes present and working.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/MobileTabBar.tsx
git commit -m "feat(layout): re-skin MobileTabBar onto ds tokens with updated tab set"
```

---

### Task 8: Re-skin `EnergyFlowDiagram` colors

**Files:**
- Modify: `src/components/ui/EnergyFlowDiagram.tsx`

**Interfaces:**
- Consumes: `COLORS.solar`, `COLORS.battery`, `COLORS.grid`, `COLORS.load` from Task 2 (`src/lib/tokens.ts`).

- [ ] **Step 1: Import COLORS and replace the four hardcoded hex constants**

Add near the top of `src/components/ui/EnergyFlowDiagram.tsx` (after `import React from "react";`):

```typescript
import { COLORS } from "@/lib/tokens";
```

Replace lines 69-72:

```typescript
  const sCol  = COLORS.solar;
  const bCol  = charging  ? COLORS.solar : COLORS.battery;
  const gCol  = gridDisconnected ? "#F87171" : exporting ? COLORS.battery : COLORS.grid;
  const hCol  = COLORS.load;
```

(Behavior preserved exactly: solar node stays the "solar" hue; battery node still flips between the "charging from solar" hue and its own hue on discharge; grid node still uses a hardcoded red for the disconnected state — that's an error/critical signal, not an energy-type color, so it is intentionally left as a literal red rather than mapped to a ds semantic token, since no `--ds-error`-equivalent literal exists yet in `lib/tokens.ts` and adding one is out of scope for a pure color-swap task.)

- [ ] **Step 2: Manual verification**

Run: `npm run dev`, open `/dashboard`, confirm the energy flow diagram renders with the same visual layout/animation as before, just recolored consistently with the new tokens (compare against a screenshot taken before this task if unsure).

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/EnergyFlowDiagram.tsx
git commit -m "feat(ui): point EnergyFlowDiagram colors at ds-synced COLORS constants"
```

---

### Task 9: Verify `HourlyGenerationChart` picks up the updated chart theme

**Files:**
- Modify (only if a hardcoded color is found): `src/components/ui/HourlyGenerationChart.tsx`

**Interfaces:**
- Consumes: `getChartDefaults()` (Task 2) and `COLORS` (Task 2).

- [ ] **Step 1: Grep for hardcoded hex colors in this file**

Run: `grep -n "#[0-9a-fA-F]\{6\}" "src/components/ui/HourlyGenerationChart.tsx"`

If any hex literal appears that represents solar/grid/battery/consumption (as opposed to structural chrome already covered by `getChartDefaults`), replace it with the matching `COLORS.*` import from `@/lib/tokens`, following the same pattern as Task 8 Step 1.

- [ ] **Step 2: Manual verification**

Run: `npm run dev`, open `/dashboard`, confirm the hourly chart's bar/line colors match the dashboard's new energy-flow color semantics (solar bars green, load/consumption line in the consumption hue).

- [ ] **Step 3: Commit (only if Step 1 found something to change)**

```bash
git add src/components/ui/HourlyGenerationChart.tsx
git commit -m "feat(ui): align HourlyGenerationChart colors with ds energy tokens"
```

---

### Task 10: Re-skin the Dashboard page

**Files:**
- Modify: `src/app/(portal)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `PageHeader` (Task 5), `MetricCard` with `variant="detailed"` (Task 4), `Card`/`Skeleton`/`EmptyState`/`ErrorState` (Task 3), re-skinned `EnergyFlowDiagram` (Task 8).
- Preserves: the entire `useSiteQuery`/`DashboardData` computation block (lines 1-657 worth of fetch/compute logic) — this task only touches JSX from the `Header row` down (around line ~660 onward) and the `DetailedKpiCard` definition/usages.

- [ ] **Step 1: Replace the local `DetailedKpiCard` component with the shared `MetricCard`**

Delete the local `DetailedKpiCard` function and its `KpiStatRow`/`DetailedKpiCardProps`/`KPI_COLOR_MAP` definitions (the block starting `// ─── Detailed KPI Card ───` through the end of that function, roughly lines 90-360 — read the file to find the exact closing brace before the next section comment). Add to the imports at the top of the file:

```typescript
import MetricCard from "@/components/ui/MetricCard";
import PageHeader from "@/components/layout/PageHeader";
import { EmptyState, ErrorState } from "@/components/design-system/DesignSystem";
```

- [ ] **Step 2: Replace the three `<DetailedKpiCard ...>` call sites**

In the KPI grid block (around lines 884-955), replace each call. First call (System Capacity):

```tsx
                  <MetricCard
                    variant="detailed"
                    title="System Capacity"
                    icon={Sun}
                    tone="solar"
                    badge={capacityKwp > 0 ? "Installed" : undefined}
                    badgeTone="good"
                    value={capacityKwp}
                    suffix="kWp"
                    progressPct={healthPct}
                    progressLabel="System health"
                    progressValueLabel={healthLabel}
                    rows={[
                      { label: "Peak Today", value: `${peakTodayKw.toFixed(1)} kW` },
                      { label: "Headroom", value: `${headroomKw.toFixed(1)} kW` },
                    ]}
                    footer={healthFooter}
                    loading={loading}
                    delay={0}
                  />
```

Second call (Today's Generation):

```tsx
                  <MetricCard
                    variant="detailed"
                    title="Today's Generation"
                    icon={Zap}
                    tone="solar"
                    badge="Today"
                    badgeTone="neutral"
                    value={todayGenKwh}
                    suffix="kWh"
                    progressPct={potentialPct}
                    progressLabel="Of estimated daily potential"
                    cornerLabel="forecast"
                    cornerValue={todayForecastKwh != null ? `${todayForecastKwh.toFixed(1)} kWh` : undefined}
                    rows={[
                      { label: "This Month", value: `${monthGenKwh.toFixed(0)} kWh` },
                      { label: "CO₂ Avoided", value: `${co2AvoidedKg} kg` },
                    ]}
                    footer={'"Today" is the live 6 AM–6 AM solar day; monthly figures use calendar days. Generation is compared against a flat ~5 peak-sun-hour/day estimate for this system\'s capacity.'}
                    loading={loading}
                    delay={1}
                  />
```

Third call (Performance Ratio) — keep `<AlertsSection>` between them unchanged:

```tsx
                  <MetricCard
                    variant="detailed"
                    title="Performance Ratio"
                    icon={Activity}
                    tone="info"
                    badge={prRating.label}
                    badgeTone={prRating.tone}
                    value={prPct}
                    bigDecimals={0}
                    suffix="%"
                    progressPct={prPct}
                    progressLabel="Actual vs expected output"
                    rows={[
                      { label: "Today's Yield", value: `${todayGenKwh.toFixed(1)} kWh` },
                      { label: "Capacity", value: `${capacityKwp.toFixed(1)} kWp` },
                    ]}
                    footer={
                      d?.performanceRatio != null
                        ? "7-day average of actual output vs. a physics-modelled irradiance baseline (IEC 61724-1 PR)."
                        : "Estimate only — actual vs. baseline PR unavailable, showing generation vs. a flat capacity heuristic instead."
                    }
                    loading={loading}
                    delay={3}
                  />
```

- [ ] **Step 3: Replace the `Greeting`/`LiveClock` header block with `PageHeader`**

Find the JSX block that currently renders `<Greeting .../>` and `<LiveClock />` (near the top of the page's return statement, before the "Error banner" section at line 709). Replace it with:

```tsx
        <PageHeader
          siteName={d?.siteName ?? "Your Site"}
          capacityKwp={d?.capacityKwp ?? null}
          status={
            !d ? "offline"
              : d.alertsCounts.critical > 0 ? "attention"
              : d.devices.some((dev) => dev.status === "offline") ? "degraded"
              : "operational"
          }
          isLive={!isFlowFrozen}
          notificationCount={d?.activeAlerts ?? 0}
        />
```

(This reuses `isFlowFrozen`, computed earlier in the same component from `d?.isTelemetryFresh`/device status, and `d.alertsCounts`/`d.devices`, both already part of `DashboardData` — no new data source.) Remove the now-unused `Greeting`/`LiveClock` function definitions only if nothing else in the file references them; otherwise leave them defined but unused-import-clean (run lint in Step 5 to confirm).

- [ ] **Step 4: Replace the error banner and any bare "no data" branches with `ErrorState`/`EmptyState`**

Replace the "Error banner" block (lines 710-719):

```tsx
      {error && (
        <ErrorState
          message={error}
          onRetry={refresh}
        />
      )}
```

If the file has a distinct "no site selected" branch elsewhere in the return statement (search for `noSite` from the `useSiteQuery` return), wrap it with `EmptyState` similarly, e.g. `<EmptyState title="No site selected" message="Choose a site to see its dashboard." />` — only if such a branch already exists; do not add a new one if it doesn't.

- [ ] **Step 5: Lint and type-check**

Run: `npm run lint && npx tsc --noEmit`
Expected: no errors. Fix any unused-import or type errors surfaced by the `DetailedKpiCard` removal (e.g. `LucideIcon` import may now be unused if nothing else in the file needs it — remove it only if confirmed unused).

- [ ] **Step 6: Manual verification**

Run: `npm run dev`, open `/dashboard`:
- Header shows site name, capacity (if available), status pill, live indicator, notification count matching the alerts badge.
- All three KPI cards render identically in content to before (same numbers, badges, progress bars, footers), just re-skinned.
- Loading state shows skeletons with no layout shift; forcing an error (e.g. temporarily throw in the fetcher) shows the new `ErrorState` with a working "Try again" button.

- [ ] **Step 7: Commit**

```bash
git add src/app/\(portal\)/dashboard/page.tsx
git commit -m "feat(dashboard): adopt PageHeader, MetricCard, and ds EmptyState/ErrorState"
```

---

### Task 11: Re-skin the Solar page

**Files:**
- Modify: `src/app/(portal)/solar/page.tsx`

**Interfaces:**
- Consumes: `PageHeader` (Task 5), `MetricCard` `variant="detailed"` (Task 4), `ErrorState`/`EmptyState` (Task 3).
- Preserves: `SolarData`/`ForecastRow`/`DailyRow`/`TelRow` fetch and derivation logic entirely.

- [ ] **Step 1: Read the page's current KPI/header rendering block**

Run: `grep -n "GlassCard\|return (\|loading ?\|error" "src/app/(portal)/solar/page.tsx" | head -40` to locate the exact header and KPI JSX (this page was not fully read during planning past line 80; the implementer must locate the equivalent "top KPI row" and "page title" blocks before editing, since exact line numbers weren't captured in this plan).

- [ ] **Step 2: Add `PageHeader`**

Add to imports: `import PageHeader from "@/components/layout/PageHeader";` and `import { useAuth } from "@/contexts/AuthContext";` (if not already imported — check first). At the top of the page's returned JSX, insert:

```tsx
        <PageHeader
          siteName={user?.site_name ?? "Your Site"}
          status={solarData.currentOutputKw != null && solarData.currentOutputKw > 0 ? "operational" : "operational"}
        />
```

If `user.site_name` does not exist on the `AuthContext` user shape, use whatever field the page already displays as a title today (check the existing page-title JSX found in Step 1) instead of inventing a new one — do not add a new API call for the site name.

- [ ] **Step 3: Replace any KPI card markup with `MetricCard`**

Wherever the page currently renders Generation / Peak Output / Performance Ratio (and Specific Yield/Availability only if already computed — check `SolarData` fields from the interface at the top of the file: `todayGenKwh`, `currentOutputKw`, `peakKw`, `performanceRatio` are available; Specific Yield/Availability are NOT in this interface, so do not add cards for them — mark `// requires backend support` in a comment instead), replace with:

```tsx
<MetricCard variant="detailed" title="Generation" icon={Sun} tone="solar" value={solarData.todayGenKwh ?? 0} suffix="kWh" loading={loading} />
<MetricCard variant="detailed" title="Peak Output" icon={TrendingUp} tone="solar" value={solarData.peakKw ?? 0} suffix="kW" loading={loading} />
<MetricCard variant="detailed" title="Performance Ratio" icon={Activity} tone="info" value={solarData.performanceRatio ?? 0} bigDecimals={0} suffix="%" loading={loading} />
{/* Specific Yield and Availability: requires backend support — not present in SolarData */}
```

Adjust the exact prop names to match the page's real local variable names discovered in Step 1 if they differ from the interface shown at the top of the file.

- [ ] **Step 4: Re-skin the `TrendChart` via existing `getChartDefaults`**

No code change needed here beyond confirming the page already calls `getChartDefaults(theme)` from `@/lib/tokens` (it does, per the file's imports) — this task's chart re-skin is already covered by Task 2's token sync. Verify visually in Step 6.

- [ ] **Step 5: Lint and type-check**

Run: `npm run lint && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Manual verification**

Run: `npm run dev`, open `/solar`:
- `PageHeader` renders above the existing content.
- KPI cards show the same numeric values as before the change (compare against current production values).
- Chart colors match the new solar/expected semantics; day/week/month range controls still work.

- [ ] **Step 7: Commit**

```bash
git add src/app/\(portal\)/solar/page.tsx
git commit -m "feat(solar): adopt PageHeader and MetricCard on ds tokens"
```

---

### Task 12: Re-skin the Consumption page

**Files:**
- Modify: `src/app/(portal)/consumption/page.tsx`

**Interfaces:**
- Consumes: `PageHeader` (Task 5), `MetricCard` (Task 4), `Card` (Task 3) for the Energy Mix / Load Profile containers if they aren't already using a card wrapper.

- [ ] **Step 1: Read the page's current structure**

Run: `grep -n "GlassCard\|return (\|Energy Mix\|Load Profile\|loading ?" "src/app/(portal)/consumption/page.tsx" | head -40` to find the KPI section and the Energy Mix / Load Profile visual blocks.

- [ ] **Step 2: Add `PageHeader`**

Same pattern as Task 11 Step 2 — add the import and insert `<PageHeader siteName={...} status="operational" />` above the existing content, sourcing `siteName` from whatever the page currently displays as its title (do not invent a new field).

- [ ] **Step 3: Re-skin KPI values with `MetricCard`**

For whatever consumption/solar-contribution/grid-import/grid-export/self-consumption values the page already computes (found in Step 1), replace their card markup with `MetricCard variant="detailed"` using `tone="consumption"` for consumption, `tone="solar"` for solar contribution, `tone="grid"` for grid import/export, exactly mirroring the pattern in Task 11 Step 3 — only for fields that already exist in this page's local state/interfaces. Do not add fields that aren't already computed.

- [ ] **Step 4: Wrap Energy Mix / Load Profile visuals**

If these are currently rendered inside a `GlassCard` (Solar Noir), replace with `Card` from `@/components/design-system/DesignSystem` (Task 3) with `elevation={1}`, keeping the inner chart/donut markup and its data untouched.

- [ ] **Step 5: Lint and type-check**

Run: `npm run lint && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Manual verification**

Run: `npm run dev`, open `/consumption`:
- `PageHeader` present, KPI values unchanged from before the re-skin, Energy Mix and Load Profile visuals render inside the new `Card` styling.
- Day/week/month/custom range controls still function.

- [ ] **Step 7: Commit**

```bash
git add src/app/\(portal\)/consumption/page.tsx
git commit -m "feat(consumption): adopt PageHeader, MetricCard, and Card on ds tokens"
```

---

### Task 13: Re-skin the History ("Analytics") page

**Files:**
- Modify: `src/app/(portal)/history/page.tsx`

**Interfaces:**
- Consumes: `PageHeader` (Task 5), existing `TrendChart`/`ButtonGroup`/`Tag` (from `DesignSystem.tsx`, already implemented) for the period selector.

- [ ] **Step 1: Read the page's current structure**

Run: `grep -n "GlassCard\|return (\|7D\|30D\|ButtonGroup\|TrendChart\|table" "src/app/(portal)/history/page.tsx" | head -40` to locate the period selector, chart, and any existing summary table.

- [ ] **Step 2: Add `PageHeader` with "Analytics" framing**

Same pattern as Task 11 Step 2. The page's route stays `/history`; only the `PageHeader`/visible copy on this page should say "Analytics" where the current UI says "History", matching the sidebar's relabeled nav item from Task 6. Do not rename the file or route.

- [ ] **Step 3: Re-skin the period selector with `ButtonGroup`**

If the page currently renders its own custom day/week/month buttons (not the ds `ButtonGroup`), replace that markup with:

```tsx
import { ButtonGroup } from "@/components/design-system/DesignSystem";
// ...
<ButtonGroup options={["7D", "30D", "3M", "12M", "Custom"]} value={selectedRange} onChange={setSelectedRange} />
```

Wire `value`/`onChange` to whatever state variable the page already uses to track the selected range (found in Step 1) — do not introduce a new state variable if one already exists; rename only if necessary to match, and update all its usages in the file consistently.

- [ ] **Step 4: Re-skin the chart and any existing summary table**

Chart color re-skin is already covered by Task 2 (via `getChartDefaults`) — verify visually. If the page already renders a tabular summary below the chart, wrap it in `Card` (Task 3) and restyle its cell text colors to `var(--ds-text-heading)`/`var(--ds-neutral-400)`. If no summary table exists in the current page, do not add one — note in the PR/commit message that this is a deferred future-phase gap.

- [ ] **Step 5: Lint and type-check**

Run: `npm run lint && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Manual verification**

Run: `npm run dev`, open `/history`:
- `PageHeader` present with "Analytics" framing.
- Period selector still switches ranges and refetches/re-renders the chart correctly.
- No console errors from the `ButtonGroup` state wiring.

- [ ] **Step 7: Commit**

```bash
git add src/app/\(portal\)/history/page.tsx
git commit -m "feat(history): adopt PageHeader and ds ButtonGroup, frame page as Analytics"
```

---

## Self-Review Notes

- **Spec coverage:** Section 1 (tokens/components) → Tasks 1-3. Section 2 (shell/PageHeader) → Tasks 5-7. Section 3 (dashboard) → Tasks 4, 8-10. Section 4 (solar/consumption/history) → Tasks 11-13. Guardrails (no backend changes, no new chart logic, no forced UI) are called out per-task and in Global Constraints.
- **Known gap flagged explicitly, not silently skipped:** Solar page's "Specific Yield"/"Availability" KPIs and History's summary table are only built if the existing page already supports them — Tasks 11 and 13 both instruct the implementer to verify via `grep`/reading the file first, since this plan was written without the full contents of `solar/page.tsx` (lines 80+), `consumption/page.tsx`, and `history/page.tsx` in context. This is a deliberate, bounded risk: the discovery steps (Task 11 Step 1, Task 12 Step 1, Task 13 Step 1) are mandatory before any edit in those tasks.
- **Type consistency:** `MetricCard`'s `tone` prop (`"primary" | "solar" | "grid" | "battery" | "consumption" | "info"`) is used identically across Tasks 4, 10, 11, 12. `PageHeader`'s `status` union (`"operational" | "degraded" | "attention" | "offline"`) is used identically across Tasks 5 and 10.
