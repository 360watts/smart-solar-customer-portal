"use client";

import React, { useState } from "react";
import { Sun, TrendingUp, Zap, CloudSun } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import MetricCard from "@/components/ui/MetricCard";
import DataChart from "@/components/ui/DataChart";
import StatusPill from "@/components/ui/StatusPill";
import { COLORS } from "@/lib/tokens";

const HOURS = ["6am", "7am", "8am", "9am", "10am", "11am", "12pm", "1pm", "2pm", "3pm", "4pm", "5pm", "6pm"];

const forecastData = {
  labels: HOURS,
  datasets: [
    {
      label: "P90 (Optimistic)",
      data: [0.2, 0.8, 1.6, 2.8, 3.9, 4.6, 4.8, 4.5, 3.8, 2.9, 1.8, 0.9, 0.1],
      borderColor: "transparent",
      backgroundColor: COLORS.p90,
      fill: "+1",
      tension: 0.4,
      pointRadius: 0,
    },
    {
      label: "P50 (Median)",
      data: [0.1, 0.6, 1.3, 2.4, 3.4, 4.1, 4.3, 4.0, 3.3, 2.5, 1.5, 0.7, 0.0],
      borderColor: COLORS.primary,
      backgroundColor: "transparent",
      borderWidth: 2,
      tension: 0.4,
      pointRadius: 0,
    },
    {
      label: "P10 (Conservative)",
      data: [0.0, 0.3, 0.9, 1.8, 2.7, 3.3, 3.6, 3.3, 2.7, 1.9, 1.1, 0.4, 0.0],
      borderColor: COLORS.p10,
      backgroundColor: "transparent",
      borderDash: [4, 4],
      borderWidth: 1.5,
      tension: 0.4,
      pointRadius: 0,
    },
  ],
};

const weeklyData = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  datasets: [
    {
      label: "Generation kWh",
      data: [21.3, 18.7, 23.1, 15.4, 19.8, 22.6, 17.2],
      backgroundColor: COLORS.primaryMuted,
      borderColor: COLORS.primary,
      borderWidth: 1,
      borderRadius: 6,
    },
  ],
};

export default function SolarPage() {
  const [forecastRange, setForecastRange] = useState<"today" | "tomorrow">("today");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1" style={{ fontFamily: "var(--font-display)" }}>
          Solar Generation
        </h1>
        <p className="text-muted-foreground text-sm">Live performance and forecast</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Today's Generation" value={18.2} suffix=" kWh" icon={Zap} trend={{ direction: "up", value: "+12% vs avg" }} delay={0} />
        <MetricCard title="Current Output" value={4.2} suffix=" kW" icon={Sun} delay={1} />
        <MetricCard title="Peak Today" value={4.8} suffix=" kW" icon={TrendingUp} trend={{ direction: "neutral", value: "at 12:15 PM" }} delay={2} />
        <MetricCard title="Performance Ratio" value={87} suffix="%" icon={CloudSun} trend={{ direction: "up", value: "Good" }} delay={3} />
      </div>

      {/* P10/P50/P90 Forecast */}
      <GlassCard glow="green">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
              Generation Forecast
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Probabilistic — P10 / P50 / P90 bands</p>
          </div>
          <div className="flex items-center gap-2">
            {(["today", "tomorrow"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setForecastRange(r)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors capitalize ${
                  forecastRange === r
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:bg-white/5"
                }`}
              >
                {r}
              </button>
            ))}
            <StatusPill status="active" label="Live" animated />
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mb-4">
          {[
            { label: "P50 Median", color: COLORS.primary, dash: false },
            { label: "P90 Optimistic", color: COLORS.p90, dash: false },
            { label: "P10 Conservative", color: COLORS.p10, dash: true },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-2">
              <div
                className="w-6 h-0.5"
                style={{
                  background: l.color,
                  borderTop: l.dash ? `1.5px dashed ${l.color}` : undefined,
                }}
              />
              <span className="text-xs text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>

        <DataChart type="line" data={forecastData} height={220} />
      </GlassCard>

      {/* Weekly bar chart */}
      <GlassCard>
        <h2 className="text-lg font-semibold text-foreground mb-6" style={{ fontFamily: "var(--font-display)" }}>
          7-Day History
        </h2>
        <DataChart type="bar" data={weeklyData} height={180} />
      </GlassCard>
    </div>
  );
}
