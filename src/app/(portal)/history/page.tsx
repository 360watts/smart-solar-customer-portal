"use client";

import React, { useState } from "react";
import { TrendingUp, Calendar, Download } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import DataChart from "@/components/ui/DataChart";
import { COLORS } from "@/lib/tokens";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const monthlyData = {
  labels: MONTHS,
  datasets: [
    {
      label: "Generation kWh",
      data: [410, 380, 490, 520, 460, 310, 290, 320, 380, 450, 420, 380],
      backgroundColor: COLORS.primaryMuted,
      borderColor: COLORS.primary,
      borderWidth: 1,
      borderRadius: 6,
    },
    {
      label: "Consumption kWh",
      data: [380, 350, 420, 470, 430, 490, 510, 480, 420, 390, 370, 360],
      backgroundColor: COLORS.amberMuted,
      borderColor: COLORS.amber,
      borderWidth: 1,
      borderRadius: 6,
    },
  ],
};

const savingsData = {
  labels: MONTHS,
  datasets: [
    {
      label: "Bill Savings ₹",
      data: [3280, 3040, 3920, 4160, 3680, 2480, 2320, 2560, 3040, 3600, 3360, 3040],
      borderColor: COLORS.primary,
      backgroundColor: COLORS.primaryMuted,
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointBackgroundColor: COLORS.primary,
    },
  ],
};

const TABLE_DATA = [
  { month: "Jun 2026", gen: "310 kWh", con: "490 kWh", grid: "180 kWh", savings: "₹2,480" },
  { month: "May 2026", gen: "460 kWh", con: "430 kWh", grid: "0 kWh", savings: "₹3,680" },
  { month: "Apr 2026", gen: "520 kWh", con: "470 kWh", grid: "0 kWh", savings: "₹4,160" },
  { month: "Mar 2026", gen: "490 kWh", con: "420 kWh", grid: "0 kWh", savings: "₹3,920" },
  { month: "Feb 2026", gen: "380 kWh", con: "350 kWh", grid: "0 kWh", savings: "₹3,040" },
  { month: "Jan 2026", gen: "410 kWh", con: "380 kWh", grid: "0 kWh", savings: "₹3,280" },
];

export default function HistoryPage() {
  const [chartView, setChartView] = useState<"energy" | "savings">("energy");

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1" style={{ fontFamily: "var(--font-syne)" }}>
            History
          </h1>
          <p className="text-muted-foreground text-sm">12-month energy & savings overview</p>
        </div>
        <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors px-3 py-2 rounded-lg hover:bg-primary/10">
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "12-Month Generation", value: "4,810 kWh", icon: TrendingUp },
          { label: "Total Bill Savings", value: "₹38,480", icon: TrendingUp },
          { label: "CO₂ Avoided", value: "3.85 tonnes", icon: TrendingUp },
          { label: "Grid Independence", value: "82%", icon: Calendar },
        ].map((s) => (
          <GlassCard key={s.label}>
            <p className="text-xs text-muted-foreground mb-2">{s.label}</p>
            <p className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-syne)" }}>
              {s.value}
            </p>
          </GlassCard>
        ))}
      </div>

      {/* Chart */}
      <GlassCard glow="green">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: "var(--font-syne)" }}>
            Monthly Trends
          </h2>
          <div className="flex gap-2">
            {(["energy", "savings"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setChartView(v)}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                  chartView === v ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-white/5"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <DataChart
          type={chartView === "energy" ? "bar" : "line"}
          data={chartView === "energy" ? monthlyData : savingsData}
          height={220}
        />
      </GlassCard>

      {/* Table */}
      <GlassCard>
        <h2 className="text-lg font-semibold text-foreground mb-4" style={{ fontFamily: "var(--font-syne)" }}>
          Monthly Breakdown
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Month", "Generation", "Consumption", "From Grid", "Savings"].map((h) => (
                  <th key={h} className="text-left text-xs text-muted-foreground font-medium pb-3 pr-6">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TABLE_DATA.map((row, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-white/2 transition-colors">
                  <td className="py-3 pr-6 text-foreground font-medium">{row.month}</td>
                  <td className="py-3 pr-6 text-primary">{row.gen}</td>
                  <td className="py-3 pr-6 text-muted-foreground">{row.con}</td>
                  <td className="py-3 pr-6 text-amber-400">{row.grid}</td>
                  <td className="py-3 pr-6 text-green-400 font-medium">{row.savings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
