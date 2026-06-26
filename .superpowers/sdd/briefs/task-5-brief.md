# Task 5: Alerts Page — /alerts

## What to build

Rewrite `src/app/(portal)/alerts/page.tsx` from a stub into a fully functional alert management page with live data, filtering, acknowledge action, and an "all clear" empty state.

## Design system
Same as previous tasks — dark OLED, glass cards, Unbounded font, Framer Motion, GlassCard/StatusPill, COLORS tokens.

## Data sourcing

```typescript
portalApi.getSiteAlerts(user.site_id)
// → { results: [{ id, alert_type, severity, title, message, device_serial, triggered_at, status, fault_code }] }

portalApi.acknowledgeAlert(alertId)
// → POST, no body needed
```

## What to display

### 1. Page header
Title: "Alerts" + subtitle "System health & notifications"

Summary bar (3 colored badge counts):
```
[🔴 2 Critical] [🟡 1 Warning] [🔵 3 Info]
```
Each badge: rounded pill, colored background, count + label. Dynamically computed from alert list.

### 2. Filter controls
Two filter groups side by side:
- **Status filter:** "All" | "Active" | "Resolved" — pill buttons, active state highlighted
- **Severity filter:** "All" | "Critical" | "Warning" | "Info" — same style

### 3. Alert list
Each alert card (GlassCard, no glow) shows:
- Left: severity icon (AlertTriangle for critical/warning, Info for info) with colored background circle matching severity
- Body: `title` (bold, white) + `message` (muted, smaller) + metadata row: device serial chip + time ago (e.g. "2h ago") + fault_code chip if present
- Right: StatusPill for status (active → `status="warning"`, resolved → `status="active"`) + Acknowledge button (only if status === "active")

**Acknowledge button:** On click, calls `portalApi.acknowledgeAlert(alert.id)` then optimistically updates that alert's status to "acknowledged" in local state.

**Severity colors:**
- critical: red `#EF4444`, bg `rgba(239,68,68,0.1)`
- warning: amber `#E9B949`, bg `rgba(233,185,73,0.1)`
- info: blue `#60a5fa`, bg `rgba(96,165,250,0.1)`

**Time ago:** Convert `triggered_at` ISO string to relative time: "2h ago", "3d ago", etc. Write a small inline `timeAgo(iso: string): string` helper.

### 4. Empty state
When the filtered list is empty AND we've loaded data, show:
```
  🟢 (large emerald circle with checkmark icon)
  "All Clear"
  "No alerts matching your filters"
```
Centered, animated fade-in.

## Mock data (initial state)
```typescript
const MOCK_ALERTS = [
  { id: "1", alert_type: "high_temperature", severity: "warning", title: "High Temperature", message: "Inverter temperature exceeded safe range (72°C)", device_serial: "EC19BE506BCE", triggered_at: new Date(Date.now() - 2*3600000).toISOString(), status: "active", fault_code: "INV-003" },
  { id: "2", alert_type: "low_generation", severity: "critical", title: "Low Generation", message: "PV output 45% below forecast for 3+ consecutive hours", device_serial: "EC19BE506BCE", triggered_at: new Date(Date.now() - 5*3600000).toISOString(), status: "active", fault_code: "PV-007" },
  { id: "3", alert_type: "communication_error", severity: "info", title: "Communication Delay", message: "Device data delayed by 8 minutes", device_serial: "EC19BE506BCE", triggered_at: new Date(Date.now() - 24*3600000).toISOString(), status: "resolved", fault_code: null },
];
```

Wire API data over mock on success.

## Constraints
- Single file: `src/app/(portal)/alerts/page.tsx` only
- No new components or dependencies
- Acknowledge must be optimistic (update local state immediately, no loading wait)
- `npm run build` must pass
