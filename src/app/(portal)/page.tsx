"use client";

import { formatHourLabel } from "@/lib/utils";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sun, Home, Zap, ArrowRight, TrendingUp, AlertTriangle, Activity, RefreshCw } from "lucide-react";
import StatusPill from "@/components/ui/StatusPill";
import GlassCard from "@/components/ui/GlassCard";
import EnergyFlowDiagram from "@/components/ui/EnergyFlowDiagram";
import HourlyGenerationChart, { type HourlyPoint } from "@/components/ui/HourlyGenerationChart";
import { useAuth } from "@/contexts/AuthContext";
import { portalApi } from "@/lib/api";
import { useSiteQuery } from "@/lib/hooks/useSiteQuery";
import { TTL } from "@/lib/portalCache";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  isOnline: boolean;
  capacityKwp: number;
  siteName: string;
  peakTodayKw: number;
  co2AvoidedKg: number;
  performanceRatio: number | null;
  hourly: HourlyPoint[];
  nowIndex: number;
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function AnimatedNumber({ value, decimals = 1, suffix = "" }: { value: number; decimals?: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const duration = 1400;
    function tick(now: number) {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setDisplay(value * ease);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value]);
  return <>{display.toFixed(decimals)}{suffix}</>;
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
  return <span className="text-xs text-white/55 font-mono">{time || "••:••"}</span>;
}

// ─── KPI Tile ─────────────────────────────────────────────────────────────────
function KpiTile({
  label, value, unit, icon: Icon, color, trend, delay = 0,
}: {
  label: string; value: number; unit: string; icon: React.ElementType;
  color: "green" | "amber" | "blue" | "red"; trend?: string; delay?: number;
}) {
  const cm = {
    green: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    amber: { text: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-400/20"  },
    blue:  { text: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-400/20"   },
    red:   { text: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-400/20"    },
  }[color];
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 28, delay: delay * 0.08 }}
      whileHover={{ y: -3, transition: { type: "spring", stiffness: 400, damping: 20 } }}
      className={`glass border ${cm.border} rounded-2xl p-5 cursor-default`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${cm.bg} flex items-center justify-center`}>
          <Icon size={18} className={cm.text} />
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cm.bg} ${cm.text}`}>{trend}</span>
        )}
      </div>
      <div className="stat-number text-3xl text-white mb-0.5">
        <AnimatedNumber value={value} decimals={value % 1 === 0 ? 0 : 1} />
        <span className="text-base font-normal text-white/60 ml-1">{unit}</span>
      </div>
      <p className="text-xs text-white/60 mt-1 font-medium uppercase tracking-wider">{label}</p>
    </motion.div>
  );
}

// ─── Self-consumption arc ─────────────────────────────────────────────────────
function SelfUseArc({ pct }: { pct: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg viewBox="0 0 130 130" className="w-full h-full">
      <circle cx="65" cy="65" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10" />
      <motion.circle
        cx="65" cy="65" r={r} fill="none" stroke="#2FBF71" strokeWidth="10" strokeLinecap="round"
        strokeDasharray={circ} initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        transform="rotate(-90 65 65)"
        style={{ filter: "drop-shadow(0 0 6px rgba(47,191,113,0.6))" }}
      />
      <text x="65" y="70" textAnchor="middle" fill="#F0F6FF" fontSize="22" fontWeight="800"
        fontFamily="var(--font-display),system-ui">{pct}%</text>
    </svg>
  );
}

// ─── No-site banner ───────────────────────────────────────────────────────────
function NoSiteBanner() {
  return (
    <GlassCard className="border-amber-500/20">
      <p className="text-sm text-amber-300 font-medium">No site linked to your account.</p>
      <p className="text-xs text-white/55 mt-1">
        Contact your 360Watts installer to link your solar site.
      </p>
    </GlassCard>
  );
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonPulse({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`} />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function OverviewPage() {
  const { user, status } = useAuth();

  const { data, loading, isStale, error, noSite, refresh } = useSiteQuery<DashboardData>(
    user?.site_id,
    async (siteId, signal) => {
      const summary = await portalApi.getPortalOverview(
        siteId,
        { date: new Date().toISOString().slice(0, 10) },
        signal,
      );
      signal.throwIfAborted();

      const payload = summary.data.data;

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
      const ltRaw = (rt.latest_telemetry ?? null) as Record<string, number> | null;
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
        const h = new Date(r.ts).getHours();
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
          hour: formatHourLabel(new Date(new Date().setHours(h, 0, 0, 0)).toISOString()),
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

      // Alerts
      const alertsList: Array<{ status?: string; resolved?: boolean }> = Array.isArray(payload.alerts)
        ? payload.alerts as never[]
        : [];
      const activeAlerts = alertsList.filter(
        (a) => a.status !== "resolved" && !a.resolved,
      ).length;

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
        isOnline,
        capacityKwp,
        siteName,
        peakTodayKw,
        co2AvoidedKg,
        performanceRatio,
        hourly,
        nowIndex,
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

  const flowData = d
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
    <div className="relative space-y-6 bg-sun-glow">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <p className="text-xs text-white/55 uppercase tracking-[0.2em] font-medium mb-2">
            Solar Dashboard · {d?.siteName ?? "Loading…"}
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-none tracking-tight">
            <Greeting name={firstName} />
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {d ? (
            <StatusPill
              status={d.isOnline ? "active" : "inactive"}
              label={d.isOnline ? "System online" : "System offline"}
              animated={d.isOnline}
            />
          ) : (
            <SkeletonPulse className="w-28 h-6" />
          )}
          <LiveClock />
          {isStale && (
            <button onClick={refresh} title="Refresh data"
              className="text-white/30 hover:text-white/60 transition-colors">
              <RefreshCw size={13} />
            </button>
          )}
        </div>
      </motion.div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl
          bg-red-500/10 border border-red-500/20 text-sm text-red-300">
          <span>{error}</span>
          <button onClick={refresh}
            className="text-xs underline underline-offset-2 opacity-70 hover:opacity-100">
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
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs uppercase tracking-[0.18em] font-medium" style={{ color: "#2FBF71" }}>
              Live Output
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
                <span className="stat-number text-6xl glow-text-green">
                  <AnimatedNumber value={d?.currentSolarKw ?? 0} decimals={1} />
                </span>
                <span className="text-xl text-white/45 font-light">kW</span>
              </div>
              <p className="text-white/55 text-sm mb-8">
                Peak today:{" "}
                <span className="text-white/55">
                  {d?.peakTodayKw.toFixed(1) ?? "—"} kW
                </span>
              </p>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Today's yield",  value: `${d?.todayGenKwh.toFixed(1) ?? "—"} kWh`, accent: "rgba(47,191,113,0.7)" },
                  { label: "This month",     value: `${d?.monthGenKwh.toFixed(0) ?? "—"} kWh`, accent: "rgba(255,255,255,0.18)" },
                  { label: "CO₂ avoided",   value: `${d?.co2AvoidedKg ?? "—"} kg`,            accent: "rgba(255,255,255,0.18)" },
                ].map((s) => (
                  <div key={s.label}
                    className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5"
                    style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-1 h-5 rounded-full shrink-0" style={{ background: s.accent }} />
                      <span className="text-xs text-white/60 whitespace-nowrap">{s.label}</span>
                    </div>
                    <span className="text-sm font-bold whitespace-nowrap tabular-nums"
                      style={{
                        color: s.accent === "rgba(47,191,113,0.7)" ? "#2FBF71" : "rgba(255,255,255,0.6)",
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

        <div className="hidden sm:block w-px bg-white/6 self-stretch" />

        {/* Right — energy flow */}
        <div className="min-w-0" style={{ flex: "7" }}>
          <p className="text-xs uppercase tracking-[0.18em] font-medium mb-3" style={{ color: "#2FBF71" }}>
            Live Energy Flow
          </p>
          {flowData ? (
            <EnergyFlowDiagram data={flowData} />
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
            <KpiTile label="System Capacity"   value={d?.capacityKwp ?? 0}     unit="kWp" icon={Sun}           color="green" delay={0} />
            <KpiTile label="Today's Generation" value={d?.todayGenKwh ?? 0}     unit="kWh" icon={Zap}           color="amber" delay={1} />
            <KpiTile label="Active Alerts"      value={d?.activeAlerts ?? 0}    unit=""    icon={AlertTriangle} color="red"   delay={2} />
            <KpiTile
              label="Performance Ratio"
              value={d?.performanceRatio ?? Math.round((d?.todayGenKwh ?? 0) / Math.max(d?.capacityKwp ?? 1, 1) / 5 * 100)}
              unit="%" icon={Activity} color="blue" delay={3}
            />
          </>
        )}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Self-use ring */}
        <GlassCard>
          <p className="text-xs text-white/60 uppercase tracking-widest font-medium mb-4">Self-Consumption</p>
          {loading ? (
            <SkeletonPulse className="w-32 h-32 mx-auto rounded-full" />
          ) : (
            <>
              <div className="w-32 h-32 mx-auto">
                <SelfUseArc pct={Math.round(d?.selfUsePct ?? 0)} />
              </div>
              <p className="text-center text-xs text-white/55 mt-3">
                {Math.round(d?.selfUsePct ?? 0)}% powered by solar today
              </p>
            </>
          )}
        </GlassCard>

        {/* Hourly chart */}
        <GlassCard className="md:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs text-white/60 uppercase tracking-widest font-medium">Energy Overview</p>
            <span className="text-xs text-white/55">Today</span>
          </div>
          <HourlyGenerationChart points={d?.hourly ?? []} nowIndex={d?.nowIndex} />
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
              className="glass rounded-xl p-4 flex items-center justify-between group cursor-pointer hover:border-white/15 transition-colors"
            >
              <span className="text-sm font-medium text-white/50 group-hover:text-white/80 transition-colors">
                {nav.label}
              </span>
              <ArrowRight size={14} className="text-white/45 group-hover:text-white/50 transition-colors" />
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
