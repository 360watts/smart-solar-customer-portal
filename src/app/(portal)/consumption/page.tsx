"use client";

import { formatHourLabel } from "@/lib/utils";

import React, { useState } from "react";
import { Home, Sun, Zap, Wind, Car, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";
import GlassCard from "@/components/ui/GlassCard";
import MetricCard from "@/components/ui/MetricCard";
import DataChart from "@/components/ui/DataChart";
import { COLORS } from "@/lib/tokens";
import { portalApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteQuery } from "@/lib/hooks/useSiteQuery";
import { TTL } from "@/lib/portalCache";

// ── Types ────────────────────────────────────────────────────────────────────

interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderDash?: number[];
  borderRadius?: number;
  fill?: boolean | string;
  tension?: number;
  pointRadius?: number;
}

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

interface ConsumptionData {
  // KPIs
  consumptionKwh: number;
  generationKwh: number;
  selfConsumptionPct: number;
  gridImportKwh: number;
  // Chart data per view
  dayChart: ChartData;
  weekChart: ChartData;
  monthChart: ChartData;
  // Load forecast
  forecastChart: ChartData;
}

// ── Static config ─────────────────────────────────────────────────────────────

const appliances = [
  { name: "Air Conditioners", icon: Wind,      pct: 45, color: "text-emerald-400", colorHex: COLORS.primary },
  { name: "EV Charging",       icon: Car,       pct: 22, color: "text-blue-400",    colorHex: "#60a5fa"       },
  { name: "Lights",            icon: Lightbulb, pct: 12, color: "text-amber-400",   colorHex: COLORS.amber    },
  { name: "Other",             icon: Home,      pct: 21, color: "text-muted-foreground", colorHex: COLORS.muted },
];

const TARIFF_BANDS = [
  { label: "Off-Peak", rate: "₹4.20/kWh", time: "10pm – 6am", flex: 8,  bg: "rgba(96,165,250,0.15)",  border: "rgba(96,165,250,0.4)",  textColor: "#60a5fa"      },
  { label: "Day",      rate: "₹6.80/kWh", time: "6am – 6pm",  flex: 12, bg: "rgba(47,191,113,0.1)",   border: "rgba(47,191,113,0.3)",  textColor: COLORS.primary },
  { label: "Peak",     rate: "₹7.50/kWh", time: "6pm – 10pm", flex: 4,  bg: "rgba(233,185,73,0.15)",  border: "rgba(233,185,73,0.4)",  textColor: COLORS.amber   },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function hourLabel(ts: string): string {
  const d = new Date(ts);
  const h = d.getHours();
  return formatHourLabel(ts);
}


function buildDayChart(rows: Array<{ timestamp: string; pv1_power_w: number; pv2_power_w: number; load_power_w: number; grid_power_w: number }>): ChartData {
  return {
    labels: rows.map((r) => hourLabel(r.timestamp)),
    datasets: [
      { label: "Solar",       data: rows.map((r) => ((Number(r.pv1_power_w)||0) + (Number(r.pv2_power_w)||0)) / 1000), backgroundColor: COLORS.primaryMuted, borderColor: COLORS.primary, borderWidth: 1.5, fill: true,  tension: 0.4, pointRadius: 0 },
      { label: "Load",        data: rows.map((r) => (Number(r.load_power_w)||0) / 1000), backgroundColor: "transparent",       borderColor: "#60a5fa",      borderWidth: 1.5, fill: false, tension: 0.4, pointRadius: 0 },
      { label: "Grid Import", data: rows.map((r) => Math.max(0, (Number(r.grid_power_w)||0)) / 1000), backgroundColor: COLORS.amberMuted, borderColor: COLORS.amber, borderWidth: 1.5, fill: true, tension: 0.4, pointRadius: 0 },
    ],
  };
}

function buildAggChart(
  rows: Array<{ period_start?: string; pv_gen_kwh?: number; load_kwh?: number }>,
  labelFn: (ts: string) => string,
): ChartData {
  const labels = rows.map((r) => labelFn(r.period_start ?? ""));
  return {
    labels,
    datasets: [
      { label: "Consumption kWh", data: rows.map((r) => Number(r.load_kwh)    || 0), backgroundColor: "rgba(96,165,250,0.2)", borderColor: "#60a5fa",       borderWidth: 1, borderRadius: 6 },
      { label: "Generation kWh",  data: rows.map((r) => Number(r.pv_gen_kwh)  || 0), backgroundColor: COLORS.primaryMuted,     borderColor: COLORS.primary,  borderWidth: 1, borderRadius: 6 },
    ],
  };
}

function buildForecastChart(rows: Array<{ forecast_for: string; predicted_kw: number; p10_kw: number; p90_kw: number }>): ChartData {
  return {
    labels: rows.map((r) => hourLabel(r.forecast_for)),
    datasets: [
      { label: "P90 (High)",   data: rows.map((r) => Number(r.p90_kw)       || 0), borderColor: "transparent",          backgroundColor: "rgba(96,165,250,0.3)", fill: "+1",         tension: 0.4, pointRadius: 0 },
      { label: "P50 (Median)", data: rows.map((r) => Number(r.predicted_kw)  || 0), borderColor: "#60a5fa",              backgroundColor: "transparent",          borderWidth: 2,     tension: 0.4, pointRadius: 0 },
      { label: "P10 (Low)",    data: rows.map((r) => Number(r.p10_kw)        || 0), borderColor: "rgba(96,165,250,0.5)", backgroundColor: "transparent",          borderDash: [4, 4], borderWidth: 1.5, tension: 0.4, pointRadius: 0 },
    ],
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ConsumptionPage() {
  const { user } = useAuth();
  const [view, setView] = useState<"Day" | "Week" | "Month">("Day");

  const { data, loading, error, noSite, refresh } = useSiteQuery<ConsumptionData>(
    user?.site_id,
    async (siteId, signal) => {
      const todayISO = new Date().toISOString().slice(0, 10);
      const weekAgoISO = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
      // Monthly: last 12 months so the backend has a valid range
      const twelveMonthsAgoISO = new Date(Date.now() - 365 * 86_400_000).toISOString().slice(0, 10);

      const [telDayS, weekS, monthS, forecastS, summaryS] = await Promise.allSettled([
        portalApi.getTelemetry(siteId, { days: 1 }, signal),
        portalApi.getEnergySummary(siteId, { granularity: "daily", start: weekAgoISO, end: todayISO }, signal),
        portalApi.getEnergySummary(siteId, { granularity: "monthly", start: twelveMonthsAgoISO, end: todayISO }, signal),
        portalApi.getLoadForecast(siteId, signal),
        portalApi.getEnergySummary(siteId, { granularity: "daily", start: todayISO, end: todayISO, summary: "true" }, signal),
      ]);

      signal.throwIfAborted();

      const todayTotals = summaryS.status === "fulfilled"
        ? (summaryS.value.data?.totals ?? summaryS.value.data ?? {})
        : {};

      // Telemetry: plain array with Watts fields
      const telRows = telDayS.status === "fulfilled" && Array.isArray(telDayS.value.data) ? telDayS.value.data : [];
      // Week / month: plain arrays from energy-summary
      const weekRows  = weekS.status  === "fulfilled" ? (Array.isArray(weekS.value.data)  ? weekS.value.data  : (weekS.value.data?.results  ?? [])) : [];
      const monthRows = monthS.status === "fulfilled" ? (Array.isArray(monthS.value.data) ? monthS.value.data : (monthS.value.data?.results ?? [])) : [];
      // Load forecast: plain array
      const fRows = forecastS.status === "fulfilled" && Array.isArray(forecastS.value.data) ? forecastS.value.data : [];

      // site_daily_energy lags by ~1 day; fall back to integrating 5-min telemetry
      // when the summary entry for today is missing (each row ≈ 5 min = 1/12 h).
      const telGenKwh  = telRows.reduce((s, r) => s + ((Number(r.pv1_power_w) || 0) + (Number(r.pv2_power_w) || 0)) / 1000 / 12, 0);
      const telLoadKwh = telRows.reduce((s, r) => s + (Number(r.load_power_w) || 0) / 1000 / 12, 0);
      const generationKwh = Number(todayTotals.pv_gen_kwh) || parseFloat(telGenKwh.toFixed(2));
      const gridExportKwh = Number(todayTotals.grid_export_kwh) || 0;

      return {
        consumptionKwh:     Number(todayTotals.load_kwh) || parseFloat(telLoadKwh.toFixed(2)),
        generationKwh,
        selfConsumptionPct: generationKwh > 0
          ? Math.round(Math.min(100, ((generationKwh - gridExportKwh) / generationKwh) * 100))
          : 0,
        gridImportKwh:      Number(todayTotals.grid_import_kwh) || 0,
        dayChart:      telRows.length   ? buildDayChart(telRows)                                      : { labels: [], datasets: [] },
        weekChart:     weekRows.length  ? buildAggChart(weekRows,  (ts) => new Date(ts).toLocaleDateString("en-IN", { weekday: "short", day: "numeric" })) : { labels: [], datasets: [] },
        monthChart:    monthRows.length ? buildAggChart(monthRows, (ts) => new Date(ts).toLocaleDateString("en-IN", { month: "short", year: "2-digit" }))  : { labels: [], datasets: [] },
        forecastChart: fRows.length     ? buildForecastChart(fRows)                                  : { labels: [], datasets: [] },
      };
    },
    { cacheKey: `consumption:${user?.site_id}`, ttl: TTL.summary, autoRefreshSec: 120 },
  );

  if (noSite) {
    return (
      <GlassCard className="border-amber-500/20">
        <p className="text-sm text-amber-300 font-medium">No site linked to your account.</p>
        <p className="text-xs text-white/55 mt-1">Contact your 360Watts installer to link your solar site.</p>
      </GlassCard>
    );
  }

  const chartData = view === "Day" ? data?.dayChart : view === "Week" ? data?.weekChart : data?.monthChart;
  // Day = line (power over time), Week = bars (daily totals), Month = line (trend over months)
  const chartType: "line" | "bar" = view === "Week" ? "bar" : "line";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1" style={{ fontFamily: "var(--font-display)" }}>
          Consumption
        </h1>
        <p className="text-muted-foreground text-sm">Energy usage breakdown and load forecast</p>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl
          bg-red-500/10 border border-red-500/20 text-sm text-red-300">
          <span>{error}</span>
          <button onClick={refresh} className="text-xs underline underline-offset-2 opacity-70 hover:opacity-100">Retry</button>
        </div>
      )}

      {/* KPI row */}
      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 transition-opacity duration-300 ${loading ? "opacity-50 animate-pulse" : ""}`}>
        <MetricCard title="Total Today"   value={data?.consumptionKwh ?? 0}    suffix=" kWh" icon={Home} delay={0} />
        <MetricCard title="Solar-Powered" value={data?.generationKwh ?? 0}     suffix=" kWh" icon={Sun}
          trend={{ direction: "up", value: `${Math.round(data?.selfConsumptionPct ?? 0)}% self-use` }} delay={1} />
        <MetricCard title="Grid-Drawn"    value={data?.gridImportKwh ?? 0}     suffix=" kWh" icon={Zap}
          trend={{ direction: "neutral", value: `₹${((data?.gridImportKwh ?? 0) * 6.80).toFixed(0)} est. cost` }} delay={2} />
      </div>

      {/* Load Profile Chart */}
      <GlassCard glow="green">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Load Profile</h2>
          <div className="flex gap-2">
            {(["Day", "Week", "Month"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  view === v ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-white/5"}`}>
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6 mb-4">
          {(view === "Day"
            ? [{ label: "Solar", color: COLORS.primary }, { label: "Load", color: "#60a5fa" }, { label: "Grid Import", color: COLORS.amber }]
            : [{ label: "Consumption", color: "#60a5fa" }, { label: "Generation", color: COLORS.primary }]
          ).map((l) => (
            <div key={l.label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: l.color }} />
              <span className="text-xs text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>

        {loading && !data ? (
          <div className="h-56 rounded-xl bg-white/[0.04] animate-pulse" />
        ) : !chartData || chartData.labels.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-sm text-white/40">No data available for this period.</div>
        ) : (
          <DataChart type={chartType} data={chartData} height={220} />
        )}

        {view === "Day" && (
          <div className="mt-3">
            <p className="text-xs text-muted-foreground mb-2 font-medium">TANGEDCO Tariff Bands</p>
            <div className="flex w-full rounded-lg overflow-hidden border border-white/5" style={{ height: 52 }}>
              {TARIFF_BANDS.map((band) => (
                <div key={band.label}
                  className="flex flex-col items-center justify-center px-2 py-1.5 border-r last:border-r-0 transition-colors"
                  style={{ flex: band.flex, background: band.bg, borderColor: band.border, borderRightColor: "rgba(255,255,255,0.06)" }}>
                  <span className="text-xs font-semibold" style={{ color: band.textColor }}>{band.rate}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">{band.time}</span>
                  <span className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: band.textColor, opacity: 0.7 }}>{band.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </GlassCard>

      {/* Load Forecast */}
      <GlassCard>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            Load Forecast — Next 24h
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">P10 / P50 / P90 probabilistic bands</p>
        </div>
        <div className="flex items-center gap-6 mb-4">
          {[
            { label: "P50 Median", color: "#60a5fa", dash: false },
            { label: "P90 High",   color: "rgba(96,165,250,0.5)", dash: false },
            { label: "P10 Low",    color: "rgba(96,165,250,0.5)", dash: true  },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-2">
              <div className="w-6 h-0.5" style={{ background: l.dash ? "transparent" : l.color, borderTop: l.dash ? `1.5px dashed ${l.color}` : undefined }} />
              <span className="text-xs text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>
        {loading && !data ? (
          <div className="h-48 rounded-xl bg-white/[0.04] animate-pulse" />
        ) : !data?.forecastChart || data.forecastChart.labels.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-sm text-white/40">No forecast data available.</div>
        ) : (
          <DataChart type="line" data={data.forecastChart} height={200} />
        )}
      </GlassCard>

      {/* Appliance Breakdown (estimated percentages — no per-appliance API yet) */}
      <GlassCard>
        <h2 className="text-lg font-semibold text-foreground mb-6" style={{ fontFamily: "var(--font-display)" }}>
          Estimated Breakdown
        </h2>
        <div className="space-y-4">
          {appliances.map((a, i) => {
            const kwh = (((data?.consumptionKwh ?? 0) * a.pct) / 100).toFixed(1);
            return (
              <motion.div key={a.name} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.35 }} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <a.icon size={18} className={a.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-foreground">{a.name}</span>
                    <span className="text-sm font-mono text-muted-foreground">{kwh} kWh</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: a.colorHex }}
                      initial={{ width: 0 }} animate={{ width: `${a.pct}%` }}
                      transition={{ delay: i * 0.08 + 0.2, duration: 0.6, ease: "easeOut" }} />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right shrink-0">{a.pct}%</span>
              </motion.div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}
