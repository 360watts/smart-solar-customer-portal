"use client";

import { getSiteHour, formatHourOfDay } from "@/lib/utils";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sun, Home, Zap, ArrowRight, TrendingUp, AlertTriangle, Activity, RefreshCw, type LucideIcon } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import AlertsSection from "@/components/ui/AlertsSection";
import CriticalAlertsBanner from "@/components/ui/CriticalAlertsBanner";
import EnergyFlowDiagram from "@/components/ui/EnergyFlowDiagram";
import HourlyGenerationChart, { type HourlyPoint } from "@/components/ui/HourlyGenerationChart";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import SkeletonPulse from "@/components/ui/SkeletonPulse";
import { useAuth } from "@/contexts/AuthContext";
import { portalApi } from "@/lib/api";
import { useSiteQuery } from "@/lib/hooks/useSiteQuery";
import { TTL } from "@/lib/portalCache";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Device {
  serial: string;
  label?: string;
  device_type?: string;
  status: "online" | "offline";
  alert_count: number;
}

interface DashboardData {
  currentSolarKw: number;
  currentLoadKw: number;
  currentGridKw: number;   // positive = import, negative = export
  batterySoc: number | null;
  todayGenKwh: number;
  todayConKwh: number;
  monthGenKwh: number;
  selfUsePct: number;
  activeAlerts: number;
  alertsCounts: { critical: number; warning: number; info: number };
  devices: Device[];
  isOnline: boolean;
  dataSource: string | null;
  isTelemetryFresh: boolean;
  capacityKwp: number;
  siteName: string;
  peakTodayKw: number;
  co2AvoidedKg: number;
  performanceRatio: number | null;
  hourly: HourlyPoint[];
  nowIndex: number;
  todayForecastKwh: number | null;
}

function deviceTypeLabel(deviceType?: string): string {
  if (deviceType === "energy_meter") return "Energy Meter IoT Gateway";
  return "Inverter IoT Gateway";
}

// ─── Greeting ────────────────────────────────────────────────────────────────
function Greeting({ name }: { name: string }) {
  const [greeting, setGreeting] = useState("Good morning");
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
  }, []);
  return <>{greeting}, <span className="glow-text-green">{name}.</span></>;
}

// ─── Live Clock ───────────────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    setTime(fmt());
    const id = setInterval(() => setTime(fmt()), 10_000);
    return () => clearInterval(id);
  }, []);
  return <span className="text-sm text-muted-foreground font-mono">{time || "••:••"}</span>;
}

// ─── Detailed KPI Card ─────────────────────────────────────────────────────────
// Matches the visual density of AlertsSection: icon+badge header, animated big
// number, a labeled progress bar, a 2-up stat breakdown, and a footer caption.
interface KpiStatRow { label: string; value: string; dot: string; glow: string }
interface DetailedKpiCardProps {
  label: string;
  icon: LucideIcon;
  color: "green" | "amber" | "blue";
  badge?: string;
  badgeTone?: "neutral" | "good" | "warn";
  bigValue: number;
  bigDecimals?: number;
  bigUnit: string;
  progressPct: number;
  progressLabel: string;
  progressValueLabel?: string;
  rows: KpiStatRow[];
  footer: string;
  loading: boolean;
  delay?: number;
  cornerLabel?: string;
  cornerValue?: string;
}

const KPI_COLOR_MAP = {
  green: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", hex: "#2FBF71", glow: "rgba(47,191,113,0.5)" },
  amber: { text: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-400/20",   hex: "#E9B949", glow: "rgba(233,185,73,0.5)" },
  blue:  { text: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-400/20",     hex: "#60a5fa", glow: "rgba(96,165,250,0.5)" },
} as const;

function DetailedKpiCard({
  label, icon: Icon, color, badge, badgeTone = "neutral",
  bigValue, bigDecimals = 1, bigUnit, progressPct, progressLabel, progressValueLabel,
  rows, footer, loading, delay = 0, cornerLabel, cornerValue,
}: DetailedKpiCardProps) {
  const cm = KPI_COLOR_MAP[color];
  const badgeStyle =
    badgeTone === "good" ? { background: "color-mix(in srgb, var(--primary) 15%, transparent)", color: "var(--primary)" } :
    badgeTone === "warn" ? { background: "color-mix(in srgb, var(--secondary) 15%, transparent)", color: "var(--secondary)" } :
    { background: "color-mix(in srgb, var(--foreground) 8%, transparent)", color: "var(--muted-foreground)" };
  const clampedPct = Math.min(100, Math.max(0, progressPct));

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 28, delay: delay * 0.08 }}
      whileHover={{ y: -3, transition: { type: "spring", stiffness: 400, damping: 20 } }}
      className={`glass border ${cm.border} rounded-2xl p-5 cursor-default h-full min-h-62 flex flex-col`}
    >
      {/* Header: icon + badge */}
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${cm.bg} flex items-center justify-center shrink-0`}>
          <Icon size={18} className={cm.text} />
        </div>
        {!loading && (badge || cornerValue) && (
          <div className="flex flex-col items-end gap-1">
            {badge && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider" style={badgeStyle}>
                {badge}
              </span>
            )}
            {cornerValue && (
              <span className="flex items-center gap-1 text-xs font-semibold tabular-nums" style={{ color: cm.hex }}>
                <TrendingUp size={11} />
                {cornerValue}
                {cornerLabel && <span className="font-normal text-muted-foreground">{cornerLabel}</span>}
              </span>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3 flex-1">
          <SkeletonPulse className="h-9 w-24" />
          <SkeletonPulse className="h-1.5 w-full rounded-full" />
          <SkeletonPulse className="h-8 w-full rounded-xl" />
        </div>
      ) : (
        <>
          {/* Big number */}
          <div className="stat-number text-3xl text-foreground mb-0.5">
            <AnimatedNumber value={bigValue} decimals={bigDecimals} />
            <span className="text-base font-normal text-muted-foreground ml-1">{bigUnit}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1 mb-3 font-medium uppercase tracking-wider">{label}</p>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="h-1.5 rounded-full bg-foreground/5 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: cm.hex, boxShadow: `0 0 6px ${cm.glow}` }}
                initial={{ width: 0 }}
                animate={{ width: `${clampedPct}%` }}
                transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-xs text-muted-foreground">{progressLabel}</span>
              <span className="text-xs font-semibold" style={{ color: cm.hex }}>{progressValueLabel ?? `${Math.round(clampedPct)}%`}</span>
            </div>
          </div>

          {/* Stat rows */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {rows.map((row) => (
              <div key={row.label} className="p-2.5 rounded-lg bg-foreground/[0.03] border border-border">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: row.dot, boxShadow: `0 0 5px ${row.glow}` }} />
                  <span className="text-xs text-muted-foreground truncate">{row.label}</span>
                </div>
                <span className="text-sm font-bold text-foreground tabular-nums" style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <p className="mt-auto min-h-12 rounded-lg border border-border bg-foreground/[0.035] px-2.5 py-2 text-xs text-muted-foreground leading-snug">{footer}</p>
        </>
      )}
    </motion.div>
  );
}

// ─── Self-consumption arc ─────────────────────────────────────────────────────
function SelfUseArc({ pct }: { pct: number }) {
  const r = 46;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const exportPct = 100 - pct;
  const exportDash = (exportPct / 100) * circ;
  return (
    <svg viewBox="0 0 116 116" className="w-full h-full">
      {/* track */}
      <circle cx="58" cy="58" r={r} fill="none" stroke="var(--border)" strokeWidth="11" />
      {/* export arc (cyan, behind) */}
      <motion.circle
        cx="58" cy="58" r={r} fill="none" stroke="#22d3ee" strokeWidth="11" strokeLinecap="butt"
        strokeDasharray={circ} initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - exportDash }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        transform="rotate(-90 58 58)"
        style={{ opacity: 0.45 }}
      />
      {/* self-use arc (green, foreground) */}
      <motion.circle
        cx="58" cy="58" r={r} fill="none" stroke="#2FBF71" strokeWidth="11" strokeLinecap="round"
        strokeDasharray={circ} initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        transform="rotate(-90 58 58)"
        style={{ filter: "drop-shadow(0 0 7px rgba(47,191,113,0.55))" }}
      />
      <text x="58" y="53" textAnchor="middle" fill="var(--foreground)" fontSize="20" fontWeight="800"
        fontFamily="var(--font-display),system-ui">{pct}%</text>
      <text x="58" y="70" textAnchor="middle" fill="var(--muted-foreground)" fontSize="9"
        fontFamily="var(--font-display),system-ui" letterSpacing="1">SELF-USE</text>
    </svg>
  );
}

// ─── Self-consumption card body ────────────────────────────────────────────────
function SelfConsumptionCard({ data, loading }: { data: DashboardData | null; loading: boolean }) {
  const pct         = Math.round(data?.selfUsePct ?? 0);
  const genKwh      = data?.todayGenKwh ?? 0;
  const selfUsedKwh = parseFloat((genKwh * pct / 100).toFixed(1));
  const exportedKwh = parseFloat((genKwh - selfUsedKwh).toFixed(1));
  const exportPct   = 100 - pct;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground uppercase tracking-widest font-medium">Self-Consumption</p>
        {!loading && data && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)", color: "var(--primary)" }}>
            Today
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          <SkeletonPulse className="w-28 h-28 mx-auto rounded-full" />
          <SkeletonPulse className="h-3 w-full rounded-full" />
          <SkeletonPulse className="h-8 w-full rounded-xl" />
          <SkeletonPulse className="h-8 w-full rounded-xl" />
        </div>
      ) : (
        <>
          {/* Ring */}
          <div className="w-28 h-28 mx-auto mb-4">
            <SelfUseArc pct={pct} />
          </div>

          {/* Segmented bar */}
          <div className="mb-4">
            <div className="flex rounded-full overflow-hidden h-1.5 bg-foreground/5">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "#2FBF71", boxShadow: "0 0 6px rgba(47,191,113,0.5)" }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
              />
              <motion.div
                className="h-full"
                style={{ background: "rgba(34,211,238,0.45)" }}
                initial={{ width: 0 }}
                animate={{ width: `${exportPct}%` }}
                transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-xs text-emerald-400/70 font-medium">Self-used {pct}%</span>
              <span className="text-xs text-cyan-400/60 font-medium">Exported {exportPct}%</span>
            </div>
          </div>

          {/* Stat rows */}
          <div className="space-y-1.5">
            {[
              { label: "Generated",  value: genKwh.toFixed(1),      unit: "kWh", dot: "#2FBF71",          glow: "rgba(47,191,113,0.5)"  },
              { label: "Self-used",  value: selfUsedKwh.toFixed(1), unit: "kWh", dot: "#34d399",          glow: "rgba(52,211,153,0.4)"  },
              { label: "Exported",   value: exportedKwh.toFixed(1), unit: "kWh", dot: "rgba(34,211,238,0.7)", glow: "rgba(34,211,238,0.3)" },
            ].map((row) => (
              <div key={row.label}
                className="flex items-center justify-between px-3 py-2 rounded-xl"
                style={{ background: "color-mix(in srgb, var(--foreground) 3%, transparent)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: row.dot, boxShadow: `0 0 5px ${row.glow}` }} />
                  <span className="text-sm text-muted-foreground">{row.label}</span>
                </div>
                <span className="text-sm font-bold tabular-nums"
                  style={{ fontFamily: "var(--font-jetbrains-mono),monospace", color: row.dot }}>
                  {row.value} <span className="font-normal opacity-60">{row.unit}</span>
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

// ─── No-site banner ───────────────────────────────────────────────────────────
function NoSiteBanner() {
  return (
    <GlassCard className="border-amber-500/20">
      <p className="text-base text-amber-300 font-medium">No site linked to your account.</p>
      <p className="text-sm text-muted-foreground mt-1">
        Contact your 360Watts installer to link your solar site.
      </p>
    </GlassCard>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function OverviewPage() {
  const { user, status } = useAuth();

  const { data, loading, isStale, error, noSite, refresh } = useSiteQuery<DashboardData>(
    user?.site_id,
    async (siteId, signal) => {
      const today = new Date().toISOString().slice(0, 10);
      const [summary, forecastRes] = await Promise.all([
        portalApi.getPortalOverview(siteId, { date: today }, signal),
        portalApi.getForecast(siteId, { date: today }, signal),
      ]);
      signal.throwIfAborted();

      const payload = summary.data.data;

      // Today's forecast total — sum P50 (median) rows for the site's local
      // calendar day. Rows are 15-min cadence, so divide kW by 4 for kWh.
      const forecastRows: Array<{ forecast_for: string; p50_kw?: number }> =
        Array.isArray(forecastRes.data) ? forecastRes.data
        : (forecastRes.data?.results ?? []);
      const siteToday = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
      const todayForecastKwh = forecastRows.length
        ? parseFloat(
            forecastRows
              .filter((r) => new Date(r.forecast_for).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) === siteToday)
              .reduce((sum, r) => sum + (Number(r.p50_kw) || 0) / 4, 0)
              .toFixed(1),
          )
        : null;

      // Telemetry rows — plain array, most-recent 96 rows ordered ascending
      // Fields in Watts: pv1_power_w, pv2_power_w, load_power_w, grid_power_w
      const rawRows: Array<{
        timestamp: string;
        pv1_power_w?: number;
        pv2_power_w?: number;
        load_power_w?: number;
        grid_power_w?: number;  // positive = import, negative = export
        battery_soc_percent?: number;
        actual_solar_kw?: number;
        actual_load_kw?: number;
        grid_power_kw?: number;
      }> = Array.isArray(payload.telemetry) ? payload.telemetry as never[] : [];

      // Normalise to kW for UI consumption
      const rows = rawRows.map((r) => ({
        ts:         r.timestamp,
        solarKw:    r.actual_solar_kw != null
          ? Number(r.actual_solar_kw)
          : ((Number(r.pv1_power_w) || 0) + (Number(r.pv2_power_w) || 0)) / 1000,
        loadKw:     r.actual_load_kw != null
          ? Number(r.actual_load_kw)
          : (Number(r.load_power_w) || 0) / 1000,
        gridKw:     r.grid_power_kw != null
          ? Number(r.grid_power_kw)
          : (Number(r.grid_power_w) || 0) / 1000,
        batterySoc: r.battery_soc_percent ?? null,
      }));

      // Use realtime latest_telemetry for live output — it's the absolute newest reading,
      // independent of the chart window. Fall back to chart's last row.
      const rt = (payload.realtime ?? {}) as Record<string, unknown>;
      const ltRawUnknown = (rt.latest_telemetry ?? null) as Record<string, unknown> | null;
      const ltRaw = ltRawUnknown as Record<string, number> | null;
      const dataSource = (rt.data_source ?? null) as string | null;
      // Telemetry can still be live via the backend's Deye Cloud fallback poll even
      // when every device is heartbeat-offline (RS-485/MQTT down) — don't conflate
      // "device offline" with "no live data". 15 min matches the platform's Deye
      // Cloud freshness window with headroom for the portal's own refresh interval.
      const TELEMETRY_FRESH_MS = 15 * 60 * 1000;
      const latestTelemetryAgeMs = ltRawUnknown?.timestamp
        ? Date.now() - new Date(String(ltRawUnknown.timestamp)).getTime()
        : null;
      const isTelemetryFresh = latestTelemetryAgeMs !== null && latestTelemetryAgeMs < TELEMETRY_FRESH_MS;
      const liveRow = ltRaw ? {
        solarKw:    ltRaw.actual_solar_kw != null
          ? Number(ltRaw.actual_solar_kw)
          : ((Number(ltRaw.pv1_power_w) || 0) + (Number(ltRaw.pv2_power_w) || 0)) / 1000,
        loadKw:     ltRaw.actual_load_kw != null
          ? Number(ltRaw.actual_load_kw)
          : (Number(ltRaw.load_power_w) || 0) / 1000,
        gridKw:     ltRaw.grid_power_kw != null
          ? Number(ltRaw.grid_power_kw)
          : (Number(ltRaw.grid_power_w) || 0) / 1000,
        batterySoc: ltRaw.battery_soc_percent ?? null,
      } : (rows.length > 0 ? rows[rows.length - 1] : null);

      const peakTodayKw = rows.length
        ? Math.max(...rows.map((r) => r.solarKw))
        : 0;

      // Aggregate 15-min rows to hourly averages for the bar chart
      const hourBuckets = new Map<number, { solar: number[]; load: number[]; grid: number[] }>();
      for (const r of rows) {
        // Bucket by the site's own timezone (Coimbatore), not the viewing
        // device's — a viewer outside IST would otherwise see rows grouped
        // into the wrong hour.
        const h = getSiteHour(r.ts);
        if (!hourBuckets.has(h)) hourBuckets.set(h, { solar: [], load: [], grid: [] });
        const b = hourBuckets.get(h)!;
        b.solar.push(r.solarKw);
        b.load.push(r.loadKw);
        b.grid.push(r.gridKw);
      }
      const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
      const hourly: HourlyPoint[] = Array.from(hourBuckets.entries())
        .sort(([a], [b]) => a - b)
        .map(([h, v]) => ({
          hour: formatHourOfDay(h),
          solar: parseFloat(avg(v.solar).toFixed(3)),
          load:  parseFloat(avg(v.load).toFixed(3)),
          grid:  parseFloat(avg(v.grid).toFixed(3)),
        }));

      // Priority for today's totals:
      //  1. Inverter's own daily accumulators (pv_today_kwh etc.) — reset at midnight,
      //     always current, no lag. Available in latest_telemetry after backend restart.
      //  2. site_daily_energy (energy_today) — accurate but lags ~1 day.
      //  3. Raw integration of chart rows — last resort; rows are 5-min cadence so
      //     divide by 12 (not 4) to convert W → kWh per interval.
      const todayTotals = (payload.energy_today ?? {}) as Record<string, unknown>;
      const invToday = ltRaw ?? {} as Record<string, number>;
      const todayGenKwh  = Number(invToday.pv_today_kwh)       || Number(todayTotals.pv_gen_kwh)     || parseFloat(rows.reduce((s, r) => s + r.solarKw / 12, 0).toFixed(2));
      const todayConKwh  = Number(invToday.load_today_kwh)     || Number(todayTotals.load_kwh)        || parseFloat(rows.reduce((s, r) => s + r.loadKw  / 12, 0).toFixed(2));
      const gridExportKwh = Number(invToday.grid_sell_today_kwh) || Number(todayTotals.grid_export_kwh) || 0;
      const selfUsePct   = todayGenKwh > 0
        ? Math.round(Math.min(100, ((todayGenKwh - gridExportKwh) / todayGenKwh) * 100))
        : 0;
      const performanceRatio: number | null = null;

      const monthTotals = (payload.energy_month ?? {}) as Record<string, unknown>;
      // site_daily_energy lags ~1 day; fall back to today's yield when month total
      // is missing (e.g. first day of a new month before the view refreshes).
      const monthGenKwh = Number(monthTotals.pv_gen_kwh) || parseFloat(todayGenKwh.toFixed(2));

      // CO₂ avoided: Indian grid factor 0.82 kg CO₂/kWh
      const co2AvoidedKg = Math.round(todayGenKwh * 0.82);

      // Alerts — sourced from the new Incident model, not the legacy Alert
      // model embedded in portal-overview. The heartbeat-check maintenance
      // cron (maintenance_tasks.py::_run_heartbeat_check) was migrated to
      // manage Incident exclusively — it no longer resolves Alert rows at
      // all, so Alert-derived counts can show stale criticals that already
      // cleared (confirmed live: a "Device Offline" Alert from days ago sat
      // active while the device's real heartbeat was seconds old) or miss
      // real open warnings if nothing's currently writing new Alert rows for
      // that type. Incident is also the Alerts page's own source of truth
      // (src/app/(portal)/alerts/page.tsx), so this keeps Overview and
      // Alerts consistent with each other.
      let activeAlerts = 0;
      let alertsCounts = { critical: 0, warning: 0, info: 0 };
      const deviceAlertMap = new Map<string, { count: number; severity: "critical" | "warning" | "info" }>();

      try {
        const activeDeviceSerials = new Set(
          (((rt.devices ?? []) as Array<{ device_serial: string }>)).map((d) => d.device_serial),
        );
        // Fetching "most recent N by ts_start" is the wrong query here: a
        // flapping device_offline incident that opens and auto-resolves
        // within a second (confirmed live: recurring every ~15-20 min on
        // this site) floods the recent-ts_start ordering with resolved
        // noise — 42 incidents for this one site in the last 24h alone —
        // which pushed a genuinely still-open incident from days earlier
        // completely out of the first 50 results. Filtering server-side by
        // status instead finds every open incident regardless of when it
        // started.
        const [activeRes, ackRes] = await Promise.all([
          portalApi.getSiteIncidents(siteId, { limit: 100, status: "active" }, signal),
          portalApi.getSiteIncidents(siteId, { limit: 100, status: "acknowledged" }, signal),
        ]);
        const openIncidents = [...activeRes.results, ...ackRes.results].filter(
          (i) =>
            // A soft-deleted device's incidents never get closed by the
            // maintenance cron (it only re-checks live devices) — exclude
            // them, or a removed device's stale incident inflates the count
            // forever.
            !i.deviceSerial || activeDeviceSerials.has(i.deviceSerial),
        );

        activeAlerts = openIncidents.length;
        for (const inc of openIncidents) {
          if (inc.severity === "critical") alertsCounts.critical++;
          else if (inc.severity === "warning") alertsCounts.warning++;
          else alertsCounts.info++;

          if (!inc.deviceSerial) continue;
          const existing = deviceAlertMap.get(inc.deviceSerial);
          const isCritical = inc.severity === "critical";
          deviceAlertMap.set(inc.deviceSerial, {
            count: (existing?.count ?? 0) + 1,
            severity: existing?.severity === "critical" || isCritical ? "critical" : "warning",
          });
        }
      } catch {
        // Leave everything at zero rather than falling back to the
        // legacy Alert list — a stale Alert row is exactly the bug this
        // replaces, so surfacing "no data" on failure is more honest than
        // reintroducing it as a fallback.
      }

      // Build devices array with status from realtime.devices (all devices on site)
      const devices: Device[] = (
        ((payload.realtime as Record<string, any>)?.devices ?? []) as Array<{
          device_serial: string;
          device_type?: string;
          is_online?: boolean;
        }>
      ).map((dev) => ({
        serial: dev.device_serial,
        label: deviceTypeLabel(dev.device_type),
        device_type: dev.device_type ?? "gateway",
        status: dev.is_online ? "online" : "offline",
        alert_count: deviceAlertMap.get(dev.device_serial)?.count ?? 0,
      }));

      // Gateway (rt already defined above)
      const site = (payload.site ?? {}) as Record<string, unknown>;
      const isOnline = Boolean(rt.is_online);
      const siteName = String(rt.site_name || site.display_name || "Your Site");
      const capacityKwp = Number(rt.solar_kwp || site.capacity_kw) || 0;

      const nowIndex = hourly.length > 0 ? hourly.length - 1 : 0;

      return {
        currentSolarKw: liveRow?.solarKw ?? 0,
        currentLoadKw:  liveRow?.loadKw  ?? 0,
        currentGridKw:  liveRow ? parseFloat(liveRow.gridKw.toFixed(2)) : 0,
        batterySoc:     liveRow?.batterySoc ?? null,
        todayGenKwh,
        todayConKwh,
        monthGenKwh,
        selfUsePct,
        activeAlerts,
        alertsCounts,
        devices,
        isOnline,
        dataSource,
        isTelemetryFresh,
        capacityKwp,
        siteName,
        peakTodayKw,
        co2AvoidedKg,
        performanceRatio,
        hourly,
        nowIndex,
        todayForecastKwh,
      };
    },
    {
      cacheKey: `dashboard:${user?.site_id}`,
      ttl: TTL.summary,
      autoRefreshSec: 60,
      isAuthResolved: status !== "loading",
    },
  );

  if (noSite) return <NoSiteBanner />;

  const firstName = user?.first_name || "there";
  const d = data;

  // All devices heartbeat-offline (RS-485/MQTT down). This does NOT necessarily
  // mean the readings are stale — the backend's Deye Cloud fallback poll can still
  // be delivering fresh telemetry directly from the inverter manufacturer's API
  // while the gateway itself is unreachable. Only freeze the UI when the telemetry
  // itself has actually gone stale; otherwise show it live with a "via cloud" note.
  const allDevicesOffline = !!d && d.devices.length > 0 && d.devices.every((dev) => dev.status === "offline");
  const isLiveViaCloudFallback = allDevicesOffline && !!d?.isTelemetryFresh;
  const isFlowFrozen = allDevicesOffline && !d?.isTelemetryFresh;

  const flowData = d && !isFlowFrozen
    ? {
        solarKw:    d.currentSolarKw,
        homeKw:     d.currentLoadKw,
        batteryKw:  0,
        batterySoc: d.batterySoc ?? 0,
        gridKw:     d.currentGridKw,
        loads:      [],
      }
    : null;

  return (
    <div className="relative bg-sun-glow">
      {/* Main content */}
      <div className="space-y-6">
        {/* Critical alerts banner */}
        {d && d.alertsCounts.critical > 0 && (
          <CriticalAlertsBanner
            criticalCount={d.alertsCounts.critical}
            offlineDevices={d.devices
              .filter((dev) => dev.status === "offline")
              .map((dev) => ({ serial: dev.serial, alert_count: dev.alert_count }))}
          />
        )}

        {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <p className="text-sm text-muted-foreground uppercase tracking-[0.2em] font-medium mb-2">
            Solar Dashboard · {d?.siteName ?? "Loading…"}
          </p>
          <h1 className="page-title leading-none">
            <Greeting name={firstName} />
          </h1>
        </div>
        <div className="flex flex-col items-end gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-3">
            <LiveClock />
            {isStale && (
              <button onClick={refresh} title="Refresh data"
                className="text-muted-foreground hover:text-muted-foreground transition-colors">
                <RefreshCw size={13} />
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl
          bg-red-500/10 border border-red-500/20 text-base" style={{ color: "var(--destructive)" }}>
          <span>{error}</span>
          <button onClick={refresh}
            className="text-sm underline underline-offset-2 opacity-70 hover:opacity-100">
            Retry
          </button>
        </div>
      )}

      {/* Hero stat + energy flow */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="flex flex-col sm:flex-row gap-8 items-start"
      >
        {/* Left — live output stats */}
        <div className="min-w-0" style={{ flex: "3" }}>
          <div className="flex items-center gap-2 mb-5">
            <div className={`w-1.5 h-1.5 rounded-full ${isFlowFrozen ? "bg-red-500" : isLiveViaCloudFallback ? "bg-amber-400 animate-pulse" : "bg-emerald-400 animate-pulse"}`} />
            <span
              className="text-sm uppercase tracking-[0.18em] font-medium"
              style={{ color: isFlowFrozen ? "var(--destructive)" : isLiveViaCloudFallback ? "var(--secondary)" : "var(--primary)" }}
            >
              {isFlowFrozen ? "Offline — Last Known" : isLiveViaCloudFallback ? "Live · Via Cloud" : "Live Output"}
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              <SkeletonPulse className="h-16 w-40" />
              <SkeletonPulse className="h-4 w-48" />
              <div className="space-y-2 mt-6">
                {[1, 2, 3].map((i) => <SkeletonPulse key={i} className="h-10 w-full rounded-xl" />)}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-2 mb-1">
                <span className={`stat-number text-6xl ${isFlowFrozen ? "text-muted-foreground" : "glow-text-green"}`}>
                  <AnimatedNumber value={d?.currentSolarKw ?? 0} decimals={1} />
                </span>
                <span className="text-xl text-muted-foreground font-light">kW</span>
              </div>
              <p className="text-muted-foreground text-base mb-8">
                {isFlowFrozen ? (
                  <span className="font-medium" style={{ color: "var(--destructive)" }}>Frozen at last reading before disconnect</span>
                ) : isLiveViaCloudFallback ? (
                  <span className="text-amber-300/80 font-medium">
                    Gateway offline — showing live data via inverter cloud
                  </span>
                ) : (
                  <>
                    Peak today:{" "}
                    <span className="text-muted-foreground">{d?.peakTodayKw.toFixed(1) ?? "—"} kW</span>
                  </>
                )}
              </p>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Today's yield",  value: `${d?.todayGenKwh.toFixed(1) ?? "—"} kWh`, isPrimary: true },
                  { label: "This month",     value: `${d?.monthGenKwh.toFixed(0) ?? "—"} kWh`, isPrimary: false },
                  { label: "CO₂ avoided",   value: `${d?.co2AvoidedKg ?? "—"} kg`,            isPrimary: false },
                ].map((s) => (
                  <div key={s.label}
                    className="flex items-center justify-between gap-3 rounded-xl bg-foreground/[0.04] border border-border px-4 py-2.5"
                    style={{ boxShadow: "inset 0 1px 0 color-mix(in srgb, var(--foreground) 4%, transparent)" }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-1 h-5 rounded-full shrink-0" style={{ background: s.isPrimary ? "color-mix(in srgb, var(--primary) 70%, transparent)" : "var(--muted)" }} />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">{s.label}</span>
                    </div>
                    <span className="text-base font-bold whitespace-nowrap tabular-nums"
                      style={{
                        color: s.isPrimary ? "var(--primary)" : "var(--muted-foreground)",
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                      }}>
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="hidden sm:block w-px bg-foreground/6 self-stretch" />

        {/* Right — energy flow */}
        <div className="min-w-0" style={{ flex: "7" }}>
          <p
            className="text-sm uppercase tracking-[0.18em] font-medium mb-3"
            style={{ color: isFlowFrozen ? "#f87171" : isLiveViaCloudFallback ? "#f0b429" : "#2FBF71" }}
          >
            {isFlowFrozen ? "Energy Flow Unavailable" : isLiveViaCloudFallback ? "Live Energy Flow · Via Cloud" : "Live Energy Flow"}
          </p>
          {loading ? (
            <SkeletonPulse className="h-48 w-full rounded-2xl" />
          ) : isFlowFrozen ? (
            <div className="h-48 w-full rounded-2xl border border-red-500/20 bg-red-500/5 flex flex-col items-center justify-center gap-2 text-center px-6">
              <AlertTriangle size={22} style={{ color: "var(--destructive)" }} />
              <p className="text-base font-medium" style={{ color: "var(--destructive)" }}>
                Both devices are offline — live flow can&apos;t be shown
              </p>
              <p className="text-sm text-muted-foreground">
                Figures on the left are the last reading before disconnect
              </p>
            </div>
          ) : flowData ? (
            <>
              <EnergyFlowDiagram data={flowData} />
              {isLiveViaCloudFallback && (
                <p className="text-sm text-amber-300/60 mt-2 flex items-center gap-1.5">
                  <AlertTriangle size={13} className="text-amber-400/60 shrink-0" />
                  Gateway devices are offline — this data is coming from the inverter
                  manufacturer&apos;s cloud, not the local gateway.
                </p>
              )}
            </>
          ) : (
            <SkeletonPulse className="h-48 w-full rounded-2xl" />
          )}
        </div>
      </motion.div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <SkeletonPulse key={i} className="h-32 rounded-2xl" />
          ))
        ) : (
          <>
            {(() => {
              const capacityKwp = d?.capacityKwp ?? 0;
              const peakTodayKw = d?.peakTodayKw ?? 0;
              const todayGenKwh = d?.todayGenKwh ?? 0;
              const monthGenKwh = d?.monthGenKwh ?? 0;
              const co2AvoidedKg = d?.co2AvoidedKg ?? 0;
              const todayForecastKwh = d?.todayForecastKwh ?? null;
              const headroomKw = Math.max(0, capacityKwp - peakTodayKw);
              const onlineDevices = d?.devices.filter((dev) => dev.status === "online").length ?? 0;
              const totalDevices = d?.devices.length ?? 0;
              const healthPct = totalDevices > 0
                ? Math.round((onlineDevices / totalDevices) * 100)
                : d?.isOnline
                  ? 100
                  : 0;
              const healthLabel =
                healthPct >= 100 ? "Healthy" :
                healthPct >= 70 ? "Degraded" :
                healthPct > 0 ? "Needs Review" :
                "Offline";
              const healthFooter =
                totalDevices === 0
                  ? "System health is based on the site connection state."
                  : healthPct >= 100
                    ? "All monitored devices are online and reporting."
                    : `${onlineDevices} of ${totalDevices} monitored devices are online.`;

              // ~5 peak-sun-hours/day is a reasonable Coimbatore reference for "a great day's yield".
              const dailyPotentialKwh = capacityKwp * 5;
              const potentialPct = dailyPotentialKwh > 0 ? (todayGenKwh / dailyPotentialKwh) * 100 : 0;

              const prPct = d?.performanceRatio ?? Math.round(potentialPct);
              const prRating =
                prPct >= 80 ? { label: "Excellent", tone: "good" as const } :
                prPct >= 60 ? { label: "Good", tone: "neutral" as const } :
                prPct >= 40 ? { label: "Fair", tone: "warn" as const } :
                { label: "Needs Review", tone: "warn" as const };

              return (
                <>
                  <DetailedKpiCard
                    label="System Capacity"
                    icon={Sun}
                    color="green"
                    badge={capacityKwp > 0 ? "Installed" : undefined}
                    badgeTone="good"
                    bigValue={capacityKwp}
                    bigUnit="kWp"
                    progressPct={healthPct}
                    progressLabel="System health"
                    progressValueLabel={healthLabel}
                    rows={[
                      { label: "Peak Today", value: `${peakTodayKw.toFixed(1)} kW`, dot: "#2FBF71", glow: "rgba(47,191,113,0.5)" },
                      { label: "Headroom", value: `${headroomKw.toFixed(1)} kW`, dot: "var(--muted)", glow: "transparent" },
                    ]}
                    footer={healthFooter}
                    loading={loading}
                    delay={0}
                  />
                  <DetailedKpiCard
                    label="Today's Generation"
                    icon={Zap}
                    color="amber"
                    badge="Today"
                    badgeTone="neutral"
                    bigValue={todayGenKwh}
                    bigUnit="kWh"
                    progressPct={potentialPct}
                    progressLabel="Of estimated daily potential"
                    cornerLabel="forecast"
                    cornerValue={todayForecastKwh != null ? `${todayForecastKwh.toFixed(1)} kWh` : undefined}
                    rows={[
                      { label: "This Month", value: `${monthGenKwh.toFixed(0)} kWh`, dot: "var(--muted)", glow: "transparent" },
                      { label: "CO₂ Avoided", value: `${co2AvoidedKg} kg`, dot: "#34d399", glow: "rgba(52,211,153,0.4)" },
                    ]}
                    footer="Generation compared against a clear-sky reference day for this system size."
                    loading={loading}
                    delay={1}
                  />
                  <AlertsSection
                    counts={d?.alertsCounts ?? { critical: 0, warning: 0, info: 0 }}
                    loading={loading}
                    delay={2}
                    impact={
                      d && (d.alertsCounts.critical ?? 0) > 0
                        ? `CRITICAL: ${d.devices.filter((dev) => dev.status === "offline").length} device${d.devices.filter((dev) => dev.status === "offline").length !== 1 ? "s" : ""} offline`
                        : undefined
                    }
                  />
                  <DetailedKpiCard
                    label="Performance Ratio"
                    icon={Activity}
                    color="blue"
                    badge={prRating.label}
                    badgeTone={prRating.tone}
                    bigValue={prPct}
                    bigDecimals={0}
                    bigUnit="%"
                    progressPct={prPct}
                    progressLabel="Actual vs expected output"
                    rows={[
                      { label: "Today's Yield", value: `${todayGenKwh.toFixed(1)} kWh`, dot: "#60a5fa", glow: "rgba(96,165,250,0.4)" },
                      { label: "Capacity", value: `${capacityKwp.toFixed(1)} kWp`, dot: "var(--muted)", glow: "transparent" },
                    ]}
                    footer="Performance ratio compares real output against theoretical maximum for your installed capacity."
                    loading={loading}
                    delay={3}
                  />
                </>
              );
            })()}
          </>
        )}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Self-consumption card */}
        <GlassCard>
          <SelfConsumptionCard data={d ?? null} loading={loading} />
        </GlassCard>

        {/* Hourly chart */}
        <GlassCard className="md:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-muted-foreground uppercase tracking-widest font-medium">Energy Overview</p>
            <span className="text-sm text-muted-foreground">Today</span>
          </div>
          <div className="flex-1 flex flex-col">
            <HourlyGenerationChart points={d?.hourly ?? []} nowIndex={d?.nowIndex} />
          </div>
        </GlassCard>
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Solar Forecast", href: "/solar",       icon: Sun       },
          { label: "Consumption",    href: "/consumption", icon: Home      },
          { label: "Bill History",   href: "/history",     icon: TrendingUp },
          { label: "Weather",        href: "/weather",     icon: Activity  },
        ].map((nav) => (
          <Link key={nav.href} href={nav.href} legacyBehavior={false}>
            <motion.div whileHover={{ y: -2 }}
              className="glass rounded-xl p-4 flex items-center justify-between group cursor-pointer hover:border-border transition-colors"
            >
              <span className="text-base font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {nav.label}
              </span>
              <ArrowRight size={14} className="text-muted-foreground group-hover:text-muted-foreground transition-colors" />
            </motion.div>
          </Link>
        ))}
      </div>
      </div>
    </div>
  );
}
