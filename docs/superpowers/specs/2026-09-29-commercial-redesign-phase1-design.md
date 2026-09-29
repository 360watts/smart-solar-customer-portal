# Commercial Redesign — Phase 1: Design System, Shell, Dashboard, Energy/Analytics

## Context

The portal currently ships a live "Solar Noir" token system (`src/app/globals.css` — emerald/amber, DM Sans) used across every page, and a second, newer Figma-sourced design system (`src/styles/design-system-tokens.css`, `--ds-*` tokens + `src/components/design-system/DesignSystem.tsx`) that is only wired into a standalone `/theme` demo page today.

Goal: redesign the customer portal toward a premium, dark-first, commercial energy-management aesthetic (per the full brief supplied by the user — enterprise-grade, information-dense-but-calm, Linear/Stripe/Vercel-adjacent), building on the **existing Figma design system** rather than a from-scratch rewrite, and rolling it out incrementally rather than across the whole app at once.

## Phase 1 scope

In scope: Design System tokens/components, Application Shell (`PortalSidebar`, `MobileTabBar`, new `PageHeader`), Dashboard (`/dashboard`), Energy/Analytics pages (`/solar`, `/consumption`, `/history`).

Out of scope (stay on Solar Noir styling, untouched, until a later phase): Savings, Alerts, Device, 360Care, Help & Support, Weather, Profile.

The app will run two visual languages side by side during this phase — a redesigned nav/shell leading to some still-old-styled pages (Savings, Alerts, Device, Care, Help, Weather, Profile). This is accepted as normal for incremental rollout, not a defect.

Hard constraints carried through every section:
- Preserve existing routes and backend/API contracts — no new backend endpoints, no fabricated data.
- Preserve existing data-fetching/business-logic blocks in every page (`useSiteQuery` calls, PR/solar-day math, alert/device aggregation, billConfidence, etc.) — only markup/components/styling change.
- Relabel at the UI level only (History → "Analytics", Device → "Equipment" in nav copy); routes/filenames stay as-is.
- Any UI element that needs data the app doesn't currently have must be marked `// requires backend support` in code and omitted from the rendered UI — never faked.
- All new styling lives under `[data-ds-scope]` in `design-system-tokens.css` / `DesignSystem.tsx`; `globals.css` (Solar Noir) is not modified.
- `--ds-*` tokens become the single source of truth for both React component styling and Chart.js theming (`lib/tokens.ts`'s `getChartDefaults()`), to prevent palette drift between UI and charts.

## Section 1 — Design System

Extend `src/styles/design-system-tokens.css` and `src/components/design-system/DesignSystem.tsx`. Do not touch `globals.css`.

**Dark ramps.** Add `[data-ds-scope][data-ds-theme="dark"]` variants for `--ds-primary-*`, `--ds-cta-*`, `--ds-success-*`, `--ds-warning-*`, `--ds-error-*`, `--ds-info-*`. These are derived (hue-shifted toward the neutral-900 end, same approach already used for `--ds-bg`/`--ds-card`/`--ds-text-*`/`--ds-border`), documented in a comment as a considered extension rather than a value lifted from the Figma file (which is light-only).

**Energy semantic tokens** (new): `--ds-solar` (maps to the primary green ramp), `--ds-grid` (maps to the info blue ramp), `--ds-battery` (a new, distinct amber/purple hue — must not reuse `--ds-cta` orange, to avoid clashing visually with CTA buttons), `--ds-consumption` (maps to the neutral ramp). Both light and dark variants. `lib/tokens.ts`'s `COLORS`/`getChartDefaults()` are updated to read these instead of maintaining a separate ad hoc palette.

**Elevation / spacing / shadow tokens** (new, none currently exist in the ds set): `--ds-surface-0/1/2` (page background → card → elevated/popover), `--ds-shadow-sm/md/lg` (restrained, not decorative), a small spacing scale `--ds-space-1` through `--ds-space-8`.

**New components** in `DesignSystem.tsx` (only what's missing — Button, Tag, ProgressBar/Circle, Switch, Checkbox, Radio, Input, Textarea, Avatar, Snackbar, MenuItem, TabBar, BottomNav already exist and are reused as-is):
- `Card` — wraps `--ds-surface-*` elevation levels, replaces ad hoc `GlassCard`-style usage for ds-scoped pages.
- `Skeleton` — loading placeholder matching final layout shape (no full-screen spinners).
- `EmptyState` — icon + message + optional action, for "no alerts"/"no data" style states.
- `ErrorState` — message + retry action, no stack traces.
- `Tooltip` — for chart hover and info-icon affordances.

All new components stay self-contained: read only `--ds-*` tokens, never the Solar Noir `--primary`/`--foreground`/etc., consistent with the existing design of `DesignSystem.tsx`.

## Section 2 — Application Shell

**`src/components/layout/PortalSidebar.tsx`** — re-skinned in place. Same collapsible framer-motion mechanics and `NAV_GROUPS` data shape; only the grouping/labels and visual tokens change:

- **Overview** — Dashboard (`/dashboard`)
- **Energy** — Solar (`/solar`), Consumption (`/consumption`)
- **Performance** — "Analytics" label → `/history` route (unchanged)
- **Operations** — "Equipment" label → `/device` route (unchanged), Alerts (`/alerts`), 360Care (`/care`) — these remain in nav even though their destination pages aren't restyled this phase; this is nav-only grouping/labeling, zero page changes.
- **Support** — Help & Support (`/help`)
- Savings and Weather keep their existing routes and remain reachable, but are visually de-emphasized (e.g. moved to a secondary/overflow area) rather than sitting in primary nav — not removed.
- Wrapped in `[data-ds-scope]`, restyled with ds tokens.

**New `PageHeader` component** (`src/components/layout/PageHeader.tsx`, does not exist today) — site name, capacity, operational-status pill, live/last-updated indicator, notification bell, profile entry point. Every field is sourced from existing data already available to the pages that use it (`AuthContext`, existing `useSiteQuery` results); any field without a current data source (e.g. plant capacity, if not present in the API) is rendered conditionally/omitted, never hardcoded or invented. Used by Dashboard and the three Energy/Analytics pages this phase; other pages keep their current inline headers until a later migration.

**`src/components/layout/MobileTabBar.tsx`** — re-skinned to ds tokens. Primary tabs updated to Overview / Energy / Analytics / Alerts (Alerts tab included for parity even though its page isn't restyled this phase — it opens the existing, currently-unstyled page, which is acceptable). "More" sheet carries the rest of the routes, unchanged set.

`AssistantMount`/the floating AI widget is not modified this phase — placement and behavior already match the "subtle floating entry point" requirement.

## Section 3 — Dashboard (`src/app/(portal)/dashboard/page.tsx`)

Data-fetching and computed-values block (the single `useSiteQuery` call, PR calculation, solar-day math, device/alert aggregation) is unchanged. Only markup and the components it renders change:

- Adopt `PageHeader` at the top, replacing the current ad hoc `Greeting`/`LiveClock` block.
- New small "plant status" component directly under `PageHeader`, using operational language (`Operational` / `Degraded` / `Attention Required` / `Offline`) driven from existing `hardwareHealth`/incidents data already fetched on this page — no new calls.
- `EnergyFlowDiagram.tsx` — re-skinned onto `--ds-*` tokens (solar/grid/battery/consumption semantics from Section 1); SVG structure and props unchanged.
- KPI row: consolidate the page-local `DetailedKpiCard` and the separate `MetricCard.tsx` into a single shared `MetricCard` (fixes existing duplication), styled with ds tokens, tabular JetBrains Mono numerals, trend indicator, optional sparkline. This consolidated `MetricCard` is reused by the Energy/Analytics pages in Section 4.
- `AlertsSection.tsx` — visual re-skin only (colors/typography); counts logic unchanged since the Alerts page itself is out of scope.
- `HourlyGenerationChart.tsx` — re-skinned via the updated `getChartDefaults()`; no chart-type or data changes.
- `RecommendationsCard` and the quick-nav tile row — visual re-skin only, behavior unchanged.
- Replace ad hoc loading/empty/no-data markup with the new `Skeleton`/`EmptyState`/`ErrorState` components, matched to final layout to avoid layout shift.

## Section 4 — Energy / Analytics

Same rule throughout: markup/component re-skin only; existing data-fetching, calculations, and API calls are preserved as-is. Each page adopts `PageHeader` and the new `Skeleton`/`EmptyState`/`ErrorState` components in its `loading.tsx`/`error.tsx` boundaries.

**Solar (`src/app/(portal)/solar/page.tsx`)**
- KPI row using the shared `MetricCard`: Generation, Peak Output, Performance Ratio, Specific Yield/Availability — only for fields the page already computes. Any field the page cannot currently derive is marked `// requires backend support` in code and left out of the rendered UI.
- Main chart: `TrendChart.tsx` re-skinned (ds tokens, dashed "Expected" series, solar=green) via `getChartDefaults()`; existing day/week/month range controls unchanged.

**Consumption (`src/app/(portal)/consumption/page.tsx`)**
- Energy Mix (Solar vs Grid %) and Load Profile (by time of day) visuals re-skinned in place using whatever component currently renders them; only extracted into a shared component if already duplicated elsewhere (YAGNI — no premature abstraction).
- Existing day/week/month/custom range controls kept, restyled.

**History → "Analytics" in nav copy (`src/app/(portal)/history/page.tsx`)**
- `TrendChart` re-skinned with ds tokens.
- Metric-toggle added using the existing ds `ButtonGroup`/`Tag` components only if trivial given the page's current data shape — not a new data-fetching feature.
- Period selector (7D/30D/3M/12M/Custom) restyled with `ButtonGroup`.
- Existing summary table (if present) restyled with ds tokens; if no summary table currently exists, it is not invented this phase — noted as a future-phase gap instead.

## Out of scope / explicitly deferred

- Savings, Alerts, Device, 360Care, Help & Support, Weather, Profile pages — remain on Solar Noir styling.
- Reports (brief §18) — no existing page/data for this; not built this phase.
- Any new backend endpoint or fabricated data field.
- Removing or replacing the Solar Noir token system — it keeps serving the untouched pages.

## Testing / verification

- Visual check of Dashboard, Solar, Consumption, History pages and the shell (sidebar collapsed/expanded, mobile tab bar) in both light and dark mode.
- Confirm untouched pages (Savings, Alerts, Device, Care, Help, Weather, Profile) render unaffected — Solar Noir tokens/classes untouched.
- Confirm chart colors in `HourlyGenerationChart`/`TrendChart` match the new `--ds-solar/grid/battery/consumption` tokens in both themes.
- Confirm no new network calls were introduced (diff `lib/api.ts` / `useSiteQuery` usages) — Phase 1 is markup/styling only.
- Keyboard navigation and focus states on sidebar, `PageHeader`, and new ds components (`Card`, `EmptyState`, `ErrorState`).
- `prefers-reduced-motion` respected in any transitions touched (sidebar collapse already exists; verify PageHeader/status pill don't add unguarded motion).
