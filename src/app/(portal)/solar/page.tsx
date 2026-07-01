"use client";

import React, { useState } from "react";
import { Sun, TrendingUp, Zap, CloudSun } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import MetricCard from "@/components/ui/MetricCard";
import DataChart from "@/components/ui/DataChart";
import StatusPill from "@/components/ui/StatusPill";
import { COLORS } from "@/lib/tokens";
import { portalApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteQuery } from "@/lib/hooks/useSiteQuery";
import { TTL } from "@/lib/portalCache";

const MOCK_FORECAST = {
  labels: ["6am","7am","8am","9am","10am","11am","12pm","1pm","2pm","3pm","4pm","5pm","6pm"],
  datasets: [
    { label: "P90 (Optimistic)", data: [0.2,0.8,1.6,2.8,3.9,4.6,4.8,4.5,3.8,2.9,1.8,0.9,0.1], borderColor: "transparent", backgroundColor: COLORS.p90, fill: "+1", tension: 0.4, pointRadius: 0 },
    { label: "P50 (Median)", data: [0.1,0.6,1.3,2.4,3.4,4.1,4.3,4.0,3.3,2.5,1.5,0.7,0.0], borderColor: COLORS.primary, backgroundColor: "transparent", borderWidth: 2, tension: 0.4, pointRadius: 0 },
    { label: "P10 (Conservative)", data: [0.0,0.3,0.9,1.8,2.7,3.3,3.6,3.3,2.7,1.9,1.1,0.4,0.0], borderColor: COLORS.p10, backgroundColor: "transparent", borderDash: [4,4], borderWidth: 1.5, tension: 0.4, pointRadius: 0 },
    { label: "Physics Baseline", data: [0.0,0.5,1.1,2.2,3.2,3.8,4.0,3.8,3.1,2.3,1.3,0.6,0.0], borderColor: "rgba(47,191,113,0.2)", backgroundColor: "transparent", borderDash: [4,4], borderWidth: 1.5, tension: 0.4, pointRadius: 0 },
  ],
};

const MOCK_WEEKLY = {
  labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
  datasets: [{ label: "Generation kWh", data: [21.3,18.7,23.1,15.4,19.8,22.6,17.2], backgroundColor: COLORS.primaryMuted, borderColor: COLORS.primary, borderWidth: 1, borderRadius: 6 }],
};

type RegimeType = "Night" | "Ramp-Up" | "Peak" | "Ramp-Down" | "Overcast" | null;

interface SolarData {
  generationKwh: number;
  currentOutputKw: number;
  peakKw: number;
  regime: RegimeType;
  forecastData: typeof MOCK_FORECAST;
  weeklyData: typeof MOCK_WEEKLY;
}

function RegimeBadge({ regime }: { regime: RegimeType }) {
  if (!regime) return null;
  const color = regime === "Peak" || regime === "Ramp-Up" ? COLORS.primary : regime === "Overcast" ? COLORS.amber : COLORS.muted;
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}>
      {regime}
    </span>
  );
}

export default function SolarPage() {
  const { user } = useAuth();
  const [forecastRange, setForecastRange] = useState<"today" | "tomorrow">("today");

  const { data, loading, error } = useSiteQuery<SolarData>(
    user?.site_id,
    async (siteId) => {
      const [forecastRes, summaryRes, telemetryRes] = await Promise.all([
        portalApi.getForecast(siteId),
        portalApi.getEnergySummary(siteId, { granularity: "daily", summary: "true" }),
        portalApi.getTelemetry(siteId, { days: 7 }),
      ]);

      const summary = summaryRes.data?.totals ?? summaryRes.data;
      const telResults: Array<{ ts: string; actual_solar_kw: number; pv_today_kwh: number }> =
        telemetryRes.data?.results ?? [];
      const fResults: Array<{ forecast_for: string; p10_kw: number; p50_kw: number; p90_kw: number; physics_baseline_kw: number; regime: string }> =
        forecastRes.data?.results ?? [];

      const latest = telResults[telResults.length - 1];
      const DAY_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

      const weeklyData = telResults.length > 0 ? {
        labels: telResults.slice(-7).map((r) => DAY_LABELS[new Date(r.ts).getDay()]),
        datasets: [{ label: "Generation kWh", data: telResults.slice(-7).map((r) => Number(r.pv_today_kwh) || 0), backgroundColor: COLORS.primaryMuted, borderColor: COLORS.primary, borderWidth: 1, borderRadius: 6 }],
      } : MOCK_WEEKLY;

      const forecastData = fResults.length > 0 ? {
        labels: fResults.map((r) => { const h = new Date(r.forecast_for).getHours(); return `${h % 12 || 12}${h >= 12 ? "pm" : "am"}`; }),
        datasets: [
          { label: "P90 (Optimistic)", data: fResults.map((r) => Number(r.p90_kw) || 0), borderColor: "transparent", backgroundColor: COLORS.p90, fill: "+1", tension: 0.4, pointRadius: 0 },
          { label: "P50 (Median)", data: fResults.map((r) => Number(r.p50_kw) || 0), borderColor: COLORS.primary, backgroundColor: "transparent", borderWidth: 2, tension: 0.4, pointRadius: 0 },
          { label: "P10 (Conservative)", data: fResults.map((r) => Number(r.p10_kw) || 0), borderColor: COLORS.p10, backgroundColor: "transparent", borderDash: [4,4], borderWidth: 1.5, tension: 0.4, pointRadius: 0 },
          { label: "Physics Baseline", data: fResults.map((r) => Number(r.physics_baseline_kw) || 0), borderColor: "rgba(47,191,113,0.2)", backgroundColor: "transparent", borderDash: [4,4], borderWidth: 1.5, tension: 0.4, pointRadius: 0 },
        ],
      } : MOCK_FORECAST;

      return {
        generationKwh: summary?.generation_kwh != null ? Number(summary.generation_kwh) : 18.2,
        currentOutputKw: latest?.actual_solar_kw != null ? Number(latest.actual_solar_kw) : 4.2,
        peakKw: telResults.length > 0 ? Math.max(...telResults.map((r) => Number(r.actual_solar_kw) || 0)) || 4.8 : 4.8,
        regime: (fResults[fResults.length - 1]?.regime as RegimeType) ?? null,
        forecastData,
        weeklyData,
      };
    },
    { cacheKey: `solar:${user?.site_id}`, ttl: TTL.realtime, autoRefreshSec: 30 },
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1" style={{ fontFamily: "var(--font-display)" }}>Solar Generation</h1>
        <p className="text-muted-foreground text-sm">Live performance and forecast</p>
      </div>

      {error && <GlassCard><p className="text-sm text-red-300">{error}</p></GlassCard>}

      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 transition-opacity duration-300 ${loading ? "opacity-50 animate-pulse" : ""}`}>
        <MetricCard title="Today's Generation" value={data?.generationKwh ?? 18.2} suffix=" kWh" icon={Zap} trend={{ direction: "up", value: "+12% vs avg" }} delay={0} />
        <MetricCard title="Current Output" value={data?.currentOutputKw ?? 4.2} suffix=" kW" icon={Sun} delay={1} />
        <MetricCard title="Peak Today" value={data?.peakKw ?? 4.8} suffix=" kW" icon={TrendingUp} trend={{ direction: "neutral", value: "at 12:15 PM" }} delay={2} />
        <MetricCard title="Performance Ratio" value={87} suffix="%" icon={CloudSun} trend={{ direction: "up", value: "Good" }} delay={3} />
      </div>

      <GlassCard glow="green">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Generation Forecast</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Probabilistic — P10 / P50 / P90 bands</p>
            </div>
            <RegimeBadge regime={data?.regime ?? null} />
          </div>
          <div className="flex items-center gap-2">
            {(["today", "tomorrow"] as const).map((r) => (
              <button key={r} onClick={() => setForecastRange(r)} className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors capitalize ${forecastRange === r ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-white/5"}`}>{r}</button>
            ))}
            <StatusPill status="active" label="Live" animated />
          </div>
        </div>
        <div className="flex items-center gap-6 mb-4">
          {[
            { label: "P50 Median", color: COLORS.primary, dash: false },
            { label: "P90 Optimistic", color: COLORS.p90, dash: false },
            { label: "P10 Conservative", color: COLORS.p10, dash: true },
            { label: "Physics Baseline", color: "rgba(47,191,113,0.4)", dash: true },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-2">
              <div className="w-6 h-0.5" style={{ background: l.color, borderTop: l.dash ? `1.5px dashed ${l.color}` : undefined }} />
              <span className="text-xs text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>
        <DataChart type="line" data={data?.forecastData ?? MOCK_FORECAST} height={220} />
      </GlassCard>

      <GlassCard>
        <h2 className="text-lg font-semibold text-foreground mb-6" style={{ fontFamily: "var(--font-display)" }}>7-Day History</h2>
        <DataChart type="bar" data={data?.weeklyData ?? MOCK_WEEKLY} height={180} />
      </GlassCard>
    </div>
  );
}
