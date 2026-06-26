# Task 6: Device Page — /device

## What to build

Rewrite `src/app/(portal)/device/page.tsx` from a stub into a rich equipment status and health page with live gateway status, inverter telemetry snapshot, equipment specs, and hardware health indicators.

## Design system
Same as previous tasks — dark OLED, glass cards, Unbounded font, Framer Motion, GlassCard/StatusPill/MetricCard, COLORS tokens.

## Data sourcing

```typescript
portalApi.getGatewayStatus(user.site_id)
// → { is_online: bool, last_heartbeat: ISO, age_seconds: number, serial: string }

portalApi.getTelemetry(user.site_id)   // latest reading (no days param = just latest)
// → { results: [{ ts, inverter_temp_c, dc_temp_c, run_state, work_mode, battery_status, fault_code_1, fault_code_2, fault_code_3, fault_code_4, fault_code_5, battery_soc_percent, actual_solar_kw, actual_load_kw }] }

portalApi.getEquipment(user.site_id)
// → { inverters: [{ brand, model, capacity_kva, firmware_version, installed_date, warranty_expiry, is_active }], batteries: [{ brand, model, capacity_kwh, installed_date, warranty_expiry }], panels: [{ brand, model, capacity_wp, technology, installed_date, warranty_expiry }] }

portalApi.getHardwareHealth(user.site_id)
// → { signal_strength_dbm: number, device_temp_c: number, inverter_efficiency_pct: number, battery_efficiency_pct: number, solar_efficiency_pct: number }
```

## What to display

### 1. Gateway Status Card (GlassCard glow="green" if online, no glow if offline)
- Left: Cpu icon in emerald circle + "Deye Inverter Gateway" title + device serial from `gatewayStatus.serial`
- Right: StatusPill (`status="active"` if online, `status="error"` if offline)
- Details row: "Last seen: 2m ago" (timeAgo from `last_heartbeat`) | "Signal: ████░ -65 dBm" (signal bar visual) | firmware version

**Signal bar visual:** 5 bars, fill based on dBm threshold:
- ≥ -60: 5 bars (excellent), emerald
- -70 to -60: 4 bars, emerald
- -80 to -70: 3 bars, amber
- -90 to -80: 2 bars, amber
- < -90: 1 bar, red

### 2. Live Inverter Snapshot (GlassCard)
Header: "Live Status" + "Updated just now" timestamp

4-column grid of metric pills:
- Run State (e.g. "Normal", "Standby") — text from `run_state`
- Work Mode (e.g. "Sell First", "Zero Export") — text from `work_mode`
- Inverter Temp: `{inverter_temp_c}°C` — amber if > 65, red if > 75, else muted
- Battery SOC: `{battery_soc_percent}%` — with small inline arc progress bar

Active fault codes: if any `fault_code_1` through `fault_code_5` are non-null/non-zero, show a "Fault Codes" row with red pills for each.

### 3. Equipment Cards (3 sections — Inverter, Battery, Panels)
Each section: small header "Solar Panels" / "Inverter" / "Battery" with icon.

For each piece of equipment, a row showing:
- Brand + Model (bold)
- Capacity (kWp / kVA / kWh)
- Installed date
- Warranty: "Expires YYYY" — show in amber if < 1 year remaining, red if expired

### 4. Hardware Health (GlassCard)
Header: "Hardware Health"

3 rows (Solar / Inverter / Battery), each showing:
- Component name + icon
- Horizontal progress bar filled to `efficiency_pct`
- Color: emerald if ≥ 80%, amber if 60–80%, red if < 60%
- Percentage label on the right

### 5. Signal strength display
Already covered in Gateway Status Card above.

## Mock data
```typescript
const MOCK_GATEWAY = { is_online: true, last_heartbeat: new Date(Date.now() - 120000).toISOString(), age_seconds: 120, serial: "EC19BE506BCE" };
const MOCK_TELEMETRY = { inverter_temp_c: 58, dc_temp_c: 52, run_state: "Normal", work_mode: "Sell First", battery_status: "Charging", battery_soc_percent: 62, actual_solar_kw: 4.2, actual_load_kw: 3.8, fault_code_1: null, fault_code_2: null, fault_code_3: null, fault_code_4: null, fault_code_5: null };
const MOCK_EQUIPMENT = { inverters: [{ brand: "Deye", model: "SUN-12K-SG04LP3", capacity_kva: 12, firmware_version: "v1.0.15", installed_date: "2023-01-15", warranty_expiry: "2028-01-15", is_active: true }], batteries: [{ brand: "Deye", model: "RW-M6.1-1", capacity_kwh: 6.1, installed_date: "2023-01-15", warranty_expiry: "2033-01-15" }], panels: [{ brand: "Jinko", model: "Tiger Pro 530W", capacity_wp: 530, technology: "Mono PERC", installed_date: "2023-01-15", warranty_expiry: "2048-01-15" }] };
const MOCK_HEALTH = { signal_strength_dbm: -65, device_temp_c: 42, inverter_efficiency_pct: 94, battery_efficiency_pct: 87, solar_efficiency_pct: 91 };
```

## Constraints
- Single file: `src/app/(portal)/device/page.tsx` only
- No new components or dependencies
- `npm run build` must pass
- timeAgo helper inline (same pattern as alerts page uses)
