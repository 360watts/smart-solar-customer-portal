"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sun, TrendingUp, Zap, CloudSun, Activity, type LucideIcon } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import DataChart from "@/components/ui/DataChart";
import TrendChart, { type ChartGapBand } from "@/components/ui/TrendChart";
import { COLORS } from "@/lib/tokens";
import { portalApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteQuery } from "@/lib/hooks/useSiteQuery";
import { TTL } from "@/lib/portalCache";
import { formatHourLabel, formatDayLabel, getSiteHour, isInSolarDayWindow, SITE_TIMEZONE } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

type RegimeType = "Night" | "Ramp-Up" | "Peak" | "Ramp-Down" | "Overcast" | null;

interface ForecastRow {
  forecast_for: string;
  p10_kw: number;
  p50_kw: number;
  p90_kw: number;
  physics_baseline_kw: number;
  regime: string;
}

interface DailyRow {
  period_start: string;
  pv_gen_kwh: number;
  load_kwh: number;
  grid_export_kwh: number;
}

interface TelRow {
  timestamp: string;
  pv1_power_w?: number;
  pv2_power_w?: number;
  pv_today_kwh?: number;
}

interface SolarData {
  todayGenKwh: number | null;
  currentOutputKw: number | null;
  peakKw: number | null;
  performanceRatio: number | null;
  regime: RegimeType;
  forecastRows: ForecastRow[];
  dailyRows: DailyRow[];
  telRows: TelRow[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function pvKw(row: TelRow): number {
  return ((Number(row.pv1_power_w) || 0) + (Number(row.pv2_power_w) || 0)) / 1000;
}

// Matches the staff dashboard's chart label format exactly (SiteDataPanel's
// fmt()): 2-digit hour/minute, always in the site's own timezone
// (Coimbatore) rather than the viewing device's — e.g. "03:00 PM".
const fmtHour = formatHourLabel;

function fmtDay(iso: string): string {
  return formatDayLabel(iso);
}

/** Calendar-day comparisons pinned to site-local time — a browser in a
 * different timezone must still see "today"/"tomorrow" as Coimbatore's
 * calendar day, not its own. */
function siteDateParts(iso: string): { y: number; m: number; d: number } {
  const parts = new Date(iso).toLocaleDateString("en-CA", { timeZone: SITE_TIMEZONE }).split("-");
  return { y: Number(parts[0]), m: Number(parts[1]), d: Number(parts[2]) };
}

function isToday(iso: string): boolean {
  const target = siteDateParts(iso);
  const now = siteDateParts(new Date().toISOString());
  return target.y === now.y && target.m === now.m && target.d === now.d;
}

/** Average actual PV kW for telemetry rows falling within the same site-local hour as `hourIso`. */
function actualKwForHour(hourIso: string, telRows: TelRow[]): number | null {
  const targetDate = siteDateParts(hourIso);
  const targetHour = getSiteHour(hourIso);
  const matching = telRows.filter((row) => {
    const d = siteDateParts(row.timestamp);
    return d.y === targetDate.y && d.m === targetDate.m && d.d === targetDate.d
      && getSiteHour(row.timestamp) === targetHour;
  });
  if (matching.length === 0) return null;
  const sum = matching.reduce((s, row) => s + pvKw(row), 0);
  return parseFloat((sum / matching.length).toFixed(2));
}

/** Site-local (Coimbatore) calendar date, `daysFromNow` days out, as "YYYY-MM-DD". */
function siteISODate(daysFromNow: number): string {
  return new Date(Date.now() + daysFromNow * 86_400_000).toLocaleDateString("en-CA", { timeZone: SITE_TIMEZONE });
}

function isTomorrow(iso: string): boolean {
  const target = siteDateParts(iso);
  const tom = new Date();
  tom.setDate(tom.getDate() + 1);
  const tomParts = siteDateParts(tom.toISOString());
  return target.y === tomParts.y && target.m === tomParts.m && target.d === tomParts.d;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function RegimeBadge({ regime }: { regime: RegimeType }) {
  if (!regime || regime === "Night") return null;
  const styles: Record<string, { bg: string; color: string }> = {
    Peak:        { bg: "rgba(47,191,113,0.15)", color: "#2FBF71" },
    "Ramp-Up":   { bg: "rgba(251,191,36,0.12)", color: "#FBB824" },
    "Ramp-Down": { bg: "rgba(148,163,184,0.12)", color: "#94A3B8" },
    Overcast:    { bg: "rgba(100,116,139,0.15)", color: "#9CA3AF" },
  };
  const s = styles[regime] ?? { bg: "color-mix(in srgb, var(--foreground) 8%, transparent)", color: "#94A3B8" };
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}30` }}>
      {regime}
    </span>
  );
}

function SkeletonPulse({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-foreground/[0.06] ${className}`} />;
}

function KpiCard({
  label, value, unit, icon: Icon, sub, delay = 0,
}: {
  label: string; value: number | null; unit: string;
  icon: LucideIcon; sub?: string; delay?: number;
}) {
  // "fresh reading" pulse — flares once per value change, not on first mount
  const [pulseKey, setPulseKey] = useState(0);
  const mounted = React.useRef(false);
  useEffect(() => {
    if (mounted.current) {
      setPulseKey((k) => k + 1);
    } else {
      mounted.current = true;
    }
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 26, delay: delay * 0.07 }}
      className="glass border border-border rounded-2xl p-5"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <Icon size={17} className="text-emerald-400" />
        </div>
        {sub && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-foreground/5 text-muted-foreground">
            {sub}
          </span>
        )}
      </div>
      <motion.div
        key={pulseKey}
        initial={{ color: "#2FBF71" }}
        animate={{ color: "var(--foreground)" }}
        transition={{ duration: 1.1, ease: "easeOut" }}
        className="stat-number text-3xl mb-0.5"
      >
        {value != null ? (
          <>
            {value % 1 === 0 ? value : value.toFixed(1)}
            <span className="text-base font-normal text-muted-foreground ml-1">{unit}</span>
          </>
        ) : (
          <span className="text-2xl text-muted-foreground">—</span>
        )}
      </motion.div>
      <p className="text-sm text-muted-foreground mt-1 font-medium uppercase tracking-wider flex items-center gap-1.5">
        {label}
        <span className="relative inline-flex w-1.5 h-1.5">
          <motion.span
            key={pulseKey}
            className="absolute inline-flex w-full h-full rounded-full bg-emerald-400"
            initial={{ opacity: 0.7, scale: 1 }}
            animate={{ opacity: 0, scale: 2.6 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
          <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-emerald-400/70" />
        </span>
      </p>
    </motion.div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SolarPage() {
  const { user } = useAuth();
  const [forecastRange, setForecastRange] = useState<"today" | "tomorrow">("today");
  const [{ todayISO, weekAgoISO }] = useState(() => {
    const now = new Date();
    return {
      todayISO: now.toISOString().slice(0, 10),
      weekAgoISO: new Date(now.getTime() - 7 * 864e5).toISOString().slice(0, 10),
    };
  });

  const { data, loading, error } = useSiteQuery<SolarData>(
    user?.site_id,
    async (siteId, signal) => {
      const [forecastRes, dailyRes, telRes] = await Promise.all([
        // No params defaults to "today, UTC calendar date" server-side (see
        // site_forecast in forecasting.py) — the Tomorrow toggle had nothing
        // to show because tomorrow's rows were never fetched at all, even
        // though the forecast job populates 48h ahead. Request an explicit
        // range covering both site-local calendar days instead.
        portalApi.getForecast(siteId, {
          start_date: `${siteISODate(0)}T00:00:00+05:30`,
          end_date: `${siteISODate(1)}T23:59:59+05:30`,
        }, signal),
        // Daily array without summary=true gives per-day rows with period_start + pv_gen_kwh
        portalApi.getEnergySummary(siteId, { granularity: "daily", start: weekAgoISO, end: todayISO }, signal),
        // 1-day window → raw/5-min rows; telemetry returns a plain array
        portalApi.getTelemetry(siteId, { days: 1 }, signal),
      ]);

      const forecastRows: ForecastRow[] = Array.isArray(forecastRes.data)
        ? forecastRes.data
        : (forecastRes.data?.results ?? []);

      // energy-summary daily: may be { rows: [] } or plain array depending on version
      const rawDaily = dailyRes.data?.rows ?? dailyRes.data?.results ?? dailyRes.data;
      const dailyRows: DailyRow[] = Array.isArray(rawDaily) ? rawDaily : [];

      // telemetry: plain array
      const telRows: TelRow[] = Array.isArray(telRes.data) ? telRes.data : [];

      // Current output: last telemetry row
      const lastRow = telRows[telRows.length - 1];
      const currentOutputKw = lastRow ? parseFloat(pvKw(lastRow).toFixed(2)) : null;

      // Today's generation: inverter daily accumulator from last row
      const todayGenKwh = lastRow?.pv_today_kwh != null
        ? parseFloat(Number(lastRow.pv_today_kwh).toFixed(1))
        : null;

      // Peak: max solar kW seen today
      const peakKw = telRows.length > 0
        ? parseFloat(Math.max(...telRows.map(pvKw)).toFixed(2)) || null
        : null;

      // Performance ratio: today gen / (capacity × peak sun hours)
      // Use 5 peak sun hours as approximate for Coimbatore
      const capacityKwp = 5.0; // fallback; ideally from site metadata
      const performanceRatio = todayGenKwh != null && todayGenKwh > 0
        ? Math.min(100, Math.round((todayGenKwh / (capacityKwp * 5)) * 100))
        : null;

      // Current regime from most-recent non-Night forecast row
      const activeRegime = [...forecastRows].reverse().find((r) => r.regime && r.regime !== "Night");
      const regime = (activeRegime?.regime as RegimeType) ?? null;

      return { todayGenKwh, currentOutputKw, peakKw, performanceRatio, regime, forecastRows, dailyRows, telRows };
    },
    { cacheKey: `solar:${user?.site_id}`, ttl: TTL.realtime, autoRefreshSec: 60 },
  );

  // Gap bands for the 7-day generation chart — fetched in a parallel effect
  // over the same weekAgoISO..todayISO window used by the daily-energy query
  // above, rather than folded into that hook's fetcher (this data has its
  // own independent failure mode — a missing gaps response shouldn't blank
  // out the generation chart itself).
  const [gapBands, setGapBands] = useState<ChartGapBand[]>([]);

  useEffect(() => {
    const siteId = user?.site_id;
    if (!siteId) return;
    let cancelled = false;

    portalApi.getSiteDataQualityGaps(siteId, weekAgoISO, todayISO)
      .then((gaps) => {
        if (cancelled) return;
        setGapBands(gaps.map((g) => ({
          tsStart: g.tsStart, tsEnd: g.tsEnd, category: g.category,
          incidentType: g.incidentType, severity: g.severity,
        })));
      })
      .catch(() => {
        if (!cancelled) setGapBands([]);
      });

    return () => { cancelled = true; };
  }, [user?.site_id, weekAgoISO, todayISO]);

  // ── Derived chart data ───────────────────────────────────────────────────────

  const forecastChartData = useMemo(() => {
    const rows = (data?.forecastRows ?? []).filter((r) =>
      forecastRange === "today" ? isInSolarDayWindow(r.forecast_for) : isTomorrow(r.forecast_for),
    );
    if (rows.length === 0) return null;

    const now = new Date();
    // Actual generation only exists for today, and only up to the current
    // hour — future hours (including all of "tomorrow") stay null so the
    // line simply stops at "now" instead of drawing a misleading flat/zero
    // tail into hours that haven't happened yet.
    const actualData = forecastRange === "today"
      ? rows.map((r) => {
          const hour = new Date(r.forecast_for);
          if (hour > now) return null;
          return actualKwForHour(r.forecast_for, data?.telRows ?? []);
        })
      : rows.map(() => null);

    return {
      labels: rows.map((r) => fmtHour(r.forecast_for)),
      datasets: [
        { label: "P90 (Optimistic)",    data: rows.map((r) => Number(r.p90_kw) || 0),              borderColor: "transparent",             backgroundColor: COLORS.p90,               fill: "+1",  tension: 0.4, pointRadius: 0 },
        { label: "P50 (Median)",        data: rows.map((r) => Number(r.p50_kw) || 0),              borderColor: COLORS.primary,            backgroundColor: "transparent",            borderWidth: 2,   tension: 0.4, pointRadius: 0 },
        { label: "P10 (Conservative)",  data: rows.map((r) => Number(r.p10_kw) || 0),              borderColor: COLORS.p10,               backgroundColor: "transparent",            borderDash: [4, 4], borderWidth: 1.5, tension: 0.4, pointRadius: 0 },
        { label: "Physics Baseline",    data: rows.map((r) => Number(r.physics_baseline_kw) || 0), borderColor: "rgba(47,191,113,0.25)",   backgroundColor: "transparent",            borderDash: [4, 4], borderWidth: 1.5, tension: 0.4, pointRadius: 0 },
        { label: "Actual",              data: actualData,                                          borderColor: COLORS.solar,              backgroundColor: "transparent",            borderWidth: 2.5, tension: 0.3, pointRadius: 0, spanGaps: false },
      ],
    };
  }, [data?.forecastRows, data?.telRows, forecastRange]);

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

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-end justify-between"
      >
        <div>
          <p className="text-sm text-muted-foreground uppercase tracking-[0.18em] font-medium mb-1.5">Solar Generation</p>
          <h1 className="page-title leading-none">
            Today&apos;s Performance
          </h1>
        </div>
        {data?.regime && <RegimeBadge regime={data.regime} />}
      </motion.div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-base" style={{ color: "var(--destructive)" }}>
          {error}
        </div>
      )}

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonPulse key={i} className="h-32 rounded-2xl" />)
        ) : (
          <>
            <KpiCard label="Today's Generation" value={data?.todayGenKwh ?? null} unit="kWh" icon={Zap}       delay={0} />
            <KpiCard label="Current Output"      value={data?.currentOutputKw ?? null} unit="kW"  icon={Sun}       delay={1} />
            <KpiCard label="Peak Today"          value={data?.peakKw ?? null}          unit="kW"  icon={TrendingUp} sub="highest" delay={2} />
            <KpiCard label="Performance Ratio"   value={data?.performanceRatio ?? null} unit="%"  icon={CloudSun}  delay={3} />
          </>
        )}
      </div>

      {/* Forecast chart */}
      <GlassCard glow="green">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Activity size={16} className="text-emerald-400" />
            <div>
              <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                Generation Forecast
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">Probabilistic — P10 / P50 / P90 bands</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-foreground/[0.04] rounded-xl p-1">
            {(["today", "tomorrow"] as const).map((r) => (
              <button key={r} onClick={() => setForecastRange(r)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all capitalize ${
                  forecastRange === r
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "text-muted-foreground hover:text-muted-foreground"
                }`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-4">
          {[
            { label: "P50 Median",       color: COLORS.primary,             dash: false },
            { label: "P90 Optimistic",   color: COLORS.p90,                 dash: false },
            { label: "P10 Conservative", color: COLORS.p10,                 dash: true  },
            { label: "Physics Baseline", color: "rgba(47,191,113,0.35)",   dash: true  },
            ...(forecastRange === "today" ? [{ label: "Actual", color: COLORS.solar, dash: false }] : []),
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-5 h-px" style={{
                background: l.dash ? "transparent" : l.color,
                borderTop: l.dash ? `1.5px dashed ${l.color}` : undefined,
              }} />
              <span className="text-xs text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>

        {loading ? (
          <SkeletonPulse className="h-52 w-full rounded-xl" />
        ) : forecastChartData ? (
          <DataChart type="line" data={forecastChartData} height={280} />
        ) : (
          <div className="h-52 flex items-center justify-center text-muted-foreground text-base">
            No forecast data for {forecastRange}
          </div>
        )}
      </GlassCard>

      {/* Weekly history */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-5">
          <TrendingUp size={16} className="text-emerald-400" />
          <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            7-Day Generation History
          </h2>
        </div>
        {loading ? (
          <SkeletonPulse className="h-64 w-full rounded-xl" />
        ) : weeklyTrendData ? (
          <TrendChart labels={weeklyTrendData.labels} bars={weeklyTrendData.bars} trend={{ mode: "moving-average", window: 3 }} unit="kWh" height={320} gapBands={gapBands} />
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-base">
            No generation data available
          </div>
        )}
      </GlassCard>
    </div>
  );
}
