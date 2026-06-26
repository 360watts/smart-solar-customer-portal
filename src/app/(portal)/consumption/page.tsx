"use client";

import React, { useState, useEffect } from "react";
import { Home, Sun, Zap, Wind, Car, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";
import GlassCard from "@/components/ui/GlassCard";
import MetricCard from "@/components/ui/MetricCard";
import DataChart from "@/components/ui/DataChart";
import { COLORS } from "@/lib/tokens";
import { portalApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

// 24-hour labels
const HOURS_24 = [
  "12am","1am","2am","3am","4am","5am","6am","7am","8am","9am","10am","11am",
  "12pm","1pm","2pm","3pm","4pm","5pm","6pm","7pm","8pm","9pm","10pm","11pm",
];

// Mock load profile data (Day view fallback)
const MOCK_LOAD_DAY = {
  labels: HOURS_24,
  datasets: [
    {
      label: "Solar",
      data: [0,0,0,0,0,0,0.3,1.2,2.6,3.4,3.2,2.4,2.8,3.0,2.9,2.6,1.8,0.8,0,0,0,0,0,0],
      backgroundColor: COLORS.primaryMuted,
      borderColor: COLORS.primary,
      borderWidth: 1.5,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
    },
    {
      label: "Load",
      data: [0.5,0.4,0.4,0.4,0.5,0.7,1.1,1.4,1.8,2.2,2.0,1.8,2.1,2.3,2.2,2.0,2.4,3.2,3.8,3.1,2.2,1.6,1.0,0.7],
      backgroundColor: "transparent",
      borderColor: "#60a5fa",
      borderWidth: 1.5,
      fill: false,
      tension: 0.4,
      pointRadius: 0,
    },
    {
      label: "Grid Import",
      data: [0.5,0.4,0.4,0.4,0.5,0.7,0.8,0.2,0,0,0,0,0,0,0,0,0.6,2.4,3.8,3.1,2.2,1.6,1.0,0.7],
      backgroundColor: COLORS.amberMuted,
      borderColor: COLORS.amber,
      borderWidth: 1.5,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
    },
  ],
};

const MOCK_LOAD_WEEK = {
  labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
  datasets: [
    {
      label: "Consumption kWh",
      data: [18.3, 21.2, 19.5, 22.1, 17.8, 24.6, 20.3],
      backgroundColor: "rgba(96,165,250,0.2)",
      borderColor: "#60a5fa",
      borderWidth: 1,
      borderRadius: 6,
    },
  ],
};

const MOCK_LOAD_MONTH = {
  labels: Array.from({ length: 30 }, (_, i) => `${i + 1}`),
  datasets: [
    {
      label: "Consumption kWh",
      data: [18,22,19,25,17,21,23,16,20,26,18,24,19,22,17,25,20,18,23,21,19,16,22,24,17,20,26,18,21,23],
      backgroundColor: "rgba(96,165,250,0.2)",
      borderColor: "#60a5fa",
      borderWidth: 1,
      borderRadius: 4,
    },
  ],
};

// Mock load forecast (P10/P50/P90)
const MOCK_LOAD_FORECAST = {
  labels: HOURS_24,
  datasets: [
    {
      label: "P90 (High)",
      data: [0.7,0.6,0.6,0.6,0.7,1.0,1.5,1.9,2.4,2.8,2.6,2.3,2.6,2.8,2.7,2.5,2.9,3.8,4.5,3.7,2.7,2.1,1.4,1.0],
      borderColor: "transparent",
      backgroundColor: "rgba(96,165,250,0.3)",
      fill: "+1",
      tension: 0.4,
      pointRadius: 0,
    },
    {
      label: "P50 (Median)",
      data: [0.5,0.4,0.4,0.4,0.5,0.7,1.1,1.4,1.8,2.2,2.0,1.8,2.1,2.3,2.2,2.0,2.4,3.2,3.8,3.1,2.2,1.6,1.0,0.7],
      borderColor: "#60a5fa",
      backgroundColor: "transparent",
      borderWidth: 2,
      tension: 0.4,
      pointRadius: 0,
    },
    {
      label: "P10 (Low)",
      data: [0.3,0.2,0.2,0.3,0.4,0.5,0.8,1.0,1.3,1.7,1.5,1.4,1.6,1.8,1.7,1.5,1.9,2.5,3.1,2.4,1.7,1.1,0.7,0.4],
      borderColor: "rgba(96,165,250,0.5)",
      backgroundColor: "transparent",
      borderDash: [4, 4],
      borderWidth: 1.5,
      tension: 0.4,
      pointRadius: 0,
    },
  ],
};

const appliances = [
  { name: "Air Conditioners", icon: Wind, pct: 45, color: "text-emerald-400", colorHex: COLORS.primary },
  { name: "EV Charging", icon: Car, pct: 22, color: "text-blue-400", colorHex: "#60a5fa" },
  { name: "Lights", icon: Lightbulb, pct: 12, color: "text-amber-400", colorHex: COLORS.amber },
  { name: "Other", icon: Home, pct: 21, color: "text-muted-foreground", colorHex: COLORS.muted },
];

// TANGEDCO tariff bands
const TARIFF_BANDS = [
  {
    label: "Off-Peak",
    rate: "₹4.20/kWh",
    time: "10pm – 6am",
    // 10pm–midnight + midnight–6am = 8h out of 24h ≈ 33.3%
    flex: 8,
    bg: "rgba(96,165,250,0.15)",
    border: "rgba(96,165,250,0.4)",
    textColor: "#60a5fa",
  },
  {
    label: "Day",
    rate: "₹6.80/kWh",
    time: "6am – 6pm",
    // 6am–6pm = 12h out of 24h = 50%
    flex: 12,
    bg: "rgba(47,191,113,0.1)",
    border: "rgba(47,191,113,0.3)",
    textColor: COLORS.primary,
  },
  {
    label: "Peak",
    rate: "₹7.50/kWh",
    time: "6pm – 10pm",
    // 6pm–10pm = 4h out of 24h ≈ 16.7%
    flex: 4,
    bg: "rgba(233,185,73,0.15)",
    border: "rgba(233,185,73,0.4)",
    textColor: COLORS.amber,
  },
];

export default function ConsumptionPage() {
  const { user } = useAuth();
  const [view, setView] = useState<"Day" | "Week" | "Month">("Day");
  const [loading, setLoading] = useState(false);

  // KPI state (mock defaults)
  const [consumptionKwh, setConsumptionKwh] = useState(18.3);
  const [generationKwh, setGenerationKwh] = useState(14.1);
  const [selfConsumptionPct, setSelfConsumptionPct] = useState(77);
  const [gridImportKwh, setGridImportKwh] = useState(4.2);

  // Chart state
  const [loadProfileData, setLoadProfileData] = useState(MOCK_LOAD_DAY);
  const [loadForecastData, setLoadForecastData] = useState(MOCK_LOAD_FORECAST);

  useEffect(() => {
    if (!user?.site_id) return;
    setLoading(true);
    Promise.all([
      portalApi.getTelemetry(user.site_id, { days: 1 }),
      portalApi.getLoadForecast(user.site_id),
      portalApi.getEnergySummary(user.site_id, { date: "today" }),
    ])
      .then(([telRes, forecastRes, summaryRes]) => {
        // Energy summary → KPIs
        const summary = summaryRes.data;
        if (summary?.consumption_kwh != null) setConsumptionKwh(Number(summary.consumption_kwh));
        if (summary?.generation_kwh != null) setGenerationKwh(Number(summary.generation_kwh));
        if (summary?.self_consumption_pct != null) setSelfConsumptionPct(Number(summary.self_consumption_pct));
        if (summary?.grid_import_kwh != null) setGridImportKwh(Number(summary.grid_import_kwh));

        // Telemetry → Load profile chart (Day view)
        const telResults: Array<{ ts: string; actual_solar_kw: number; actual_load_kw: number; grid_import_kw: number }> =
          telRes.data?.results ?? [];
        if (telResults.length > 0) {
          const labels = telResults.map((r) => {
            const d = new Date(r.ts);
            const h = d.getHours();
            const ampm = h >= 12 ? "pm" : "am";
            return `${h % 12 || 12}${ampm}`;
          });
          setLoadProfileData({
            labels,
            datasets: [
              {
                label: "Solar",
                data: telResults.map((r) => Number(r.actual_solar_kw) || 0),
                backgroundColor: COLORS.primaryMuted,
                borderColor: COLORS.primary,
                borderWidth: 1.5,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
              },
              {
                label: "Load",
                data: telResults.map((r) => Number(r.actual_load_kw) || 0),
                backgroundColor: "transparent",
                borderColor: "#60a5fa",
                borderWidth: 1.5,
                fill: false,
                tension: 0.4,
                pointRadius: 0,
              },
              {
                label: "Grid Import",
                data: telResults.map((r) => Number(r.grid_import_kw) || 0),
                backgroundColor: COLORS.amberMuted,
                borderColor: COLORS.amber,
                borderWidth: 1.5,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
              },
            ],
          });
        }

        // Load forecast → P10/P50/P90 chart
        const fResults: Array<{ ts: string; load_kw_p10: number; load_kw_p50: number; load_kw_p90: number }> =
          forecastRes.data?.results ?? [];
        if (fResults.length > 0) {
          const fLabels = fResults.map((r) => {
            const d = new Date(r.ts);
            const h = d.getHours();
            const ampm = h >= 12 ? "pm" : "am";
            return `${h % 12 || 12}${ampm}`;
          });
          setLoadForecastData({
            labels: fLabels,
            datasets: [
              {
                label: "P90 (High)",
                data: fResults.map((r) => Number(r.load_kw_p90) || 0),
                borderColor: "transparent",
                backgroundColor: "rgba(96,165,250,0.3)",
                fill: "+1",
                tension: 0.4,
                pointRadius: 0,
              },
              {
                label: "P50 (Median)",
                data: fResults.map((r) => Number(r.load_kw_p50) || 0),
                borderColor: "#60a5fa",
                backgroundColor: "transparent",
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 0,
              },
              {
                label: "P10 (Low)",
                data: fResults.map((r) => Number(r.load_kw_p10) || 0),
                borderColor: "rgba(96,165,250,0.5)",
                backgroundColor: "transparent",
                borderDash: [4, 4],
                borderWidth: 1.5,
                tension: 0.4,
                pointRadius: 0,
              },
            ],
          });
        }
      })
      .catch(() => {
        // Silently keep mock data on API failure
      })
      .finally(() => setLoading(false));
  }, [user?.site_id]);

  const chartData = view === "Day" ? loadProfileData : view === "Week" ? MOCK_LOAD_WEEK : MOCK_LOAD_MONTH;
  const chartType = view === "Day" ? "line" : "bar";

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1" style={{ fontFamily: "var(--font-display)" }}>
          Consumption
        </h1>
        <p className="text-muted-foreground text-sm">Energy usage breakdown and load forecast</p>
      </div>

      {/* Hero KPI row */}
      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 transition-opacity duration-300 ${loading ? "opacity-50 animate-pulse" : ""}`}>
        <MetricCard
          title="Total Today"
          value={consumptionKwh}
          suffix=" kWh"
          icon={Home}
          delay={0}
        />
        <MetricCard
          title="Solar-Powered"
          value={generationKwh}
          suffix=" kWh"
          icon={Sun}
          trend={{ direction: "up", value: `${selfConsumptionPct}% self-use` }}
          delay={1}
        />
        <MetricCard
          title="Grid-Drawn"
          value={gridImportKwh}
          suffix=" kWh"
          icon={Zap}
          trend={{ direction: "neutral", value: `₹${(gridImportKwh * 6.80).toFixed(0)} est. cost` }}
          delay={2}
        />
      </div>

      {/* Load Profile Chart */}
      <GlassCard glow="green">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            Load Profile
          </h2>
          <div className="flex gap-2">
            {(["Day", "Week", "Month"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  view === v ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-white/5"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mb-4">
          {[
            { label: "Solar", color: COLORS.primary },
            { label: "Load", color: "#60a5fa" },
            { label: "Grid Import", color: COLORS.amber },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: l.color }} />
              <span className="text-xs text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>

        <DataChart type={chartType} data={chartData} height={220} />

        {/* Tariff Band Overlay — only on Day view */}
        {view === "Day" && (
          <div className="mt-3">
            <p className="text-xs text-muted-foreground mb-2 font-medium">TANGEDCO Tariff Bands</p>
            <div className="flex w-full rounded-lg overflow-hidden border border-white/5" style={{ height: 52 }}>
              {TARIFF_BANDS.map((band) => (
                <div
                  key={band.label}
                  className="flex flex-col items-center justify-center px-2 py-1.5 border-r last:border-r-0 transition-colors"
                  style={{
                    flex: band.flex,
                    background: band.bg,
                    borderColor: band.border,
                    borderRightColor: "rgba(255,255,255,0.06)",
                  }}
                >
                  <span className="text-xs font-semibold" style={{ color: band.textColor }}>{band.rate}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">{band.time}</span>
                  <span className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: band.textColor, opacity: 0.7 }}>{band.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </GlassCard>

      {/* Load Forecast Strip */}
      <GlassCard>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            Load Forecast — Next 24h
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">P10 / P50 / P90 probabilistic bands</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mb-4">
          {[
            { label: "P50 Median", color: "#60a5fa", dash: false },
            { label: "P90 High", color: "rgba(96,165,250,0.5)", dash: false },
            { label: "P10 Low", color: "rgba(96,165,250,0.5)", dash: true },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-2">
              <div
                className="w-6 h-0.5"
                style={{
                  background: l.dash ? "transparent" : l.color,
                  borderTop: l.dash ? `1.5px dashed ${l.color}` : undefined,
                }}
              />
              <span className="text-xs text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>

        <DataChart type="line" data={loadForecastData} height={200} />
      </GlassCard>

      {/* Appliance Breakdown */}
      <GlassCard>
        <h2 className="text-lg font-semibold text-foreground mb-6" style={{ fontFamily: "var(--font-display)" }}>
          Estimated Breakdown
        </h2>
        <div className="space-y-4">
          {appliances.map((a, i) => {
            const kwhVal = ((consumptionKwh * a.pct) / 100).toFixed(1);
            return (
              <motion.div
                key={a.name}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.35 }}
                className="flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <a.icon size={18} className={a.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-foreground">{a.name}</span>
                    <span className="text-sm font-mono text-muted-foreground">{kwhVal} kWh</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: a.colorHex }}
                      initial={{ width: 0 }}
                      animate={{ width: `${a.pct}%` }}
                      transition={{ delay: i * 0.08 + 0.2, duration: 0.6, ease: "easeOut" }}
                    />
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
