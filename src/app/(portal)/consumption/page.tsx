"use client";

import React, { useState } from "react";
import { Home, Tv, Wind, Refrigerator, Car, Zap } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import MetricCard from "@/components/ui/MetricCard";
import DataChart from "@/components/ui/DataChart";
import { COLORS } from "@/lib/tokens";

const HOURS = ["12am","2am","4am","6am","8am","10am","12pm","2pm","4pm","6pm","8pm","10pm"];

const loadData = {
  labels: HOURS,
  datasets: [
    {
      label: "Solar",
      data: [0, 0, 0, 0.3, 1.2, 2.6, 3.4, 3.2, 2.4, 1.1, 0, 0],
      backgroundColor: COLORS.primaryMuted,
      borderColor: COLORS.primary,
      borderWidth: 1.5,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
    },
    {
      label: "Grid",
      data: [0.6, 0.4, 0.5, 0.8, 0.5, 0.2, 0.1, 0.3, 0.4, 1.2, 1.8, 1.1],
      backgroundColor: COLORS.amberMuted,
      borderColor: COLORS.amber,
      borderWidth: 1.5,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
    },
  ],
};

const appliances = [
  { name: "Air Conditioners", icon: Wind, kwh: 8.4, pct: 46, color: "text-primary" },
  { name: "Refrigerator", icon: Refrigerator, kwh: 3.2, pct: 18, color: "text-blue-400" },
  { name: "EV Charging", icon: Car, kwh: 2.8, pct: 15, color: "text-amber-400" },
  { name: "TV & Entertainment", icon: Tv, kwh: 1.9, pct: 10, color: "text-purple-400" },
  { name: "Other", icon: Home, kwh: 2.0, pct: 11, color: "text-muted-foreground" },
];

export default function ConsumptionPage() {
  const [view, setView] = useState<"today" | "week" | "month">("today");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1" style={{ fontFamily: "var(--font-display)" }}>
          Consumption
        </h1>
        <p className="text-muted-foreground text-sm">Energy usage breakdown</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Today" value={18.3} suffix=" kWh" icon={Zap} delay={0} />
        <MetricCard title="From Solar" value={14.1} suffix=" kWh" icon={Zap} trend={{ direction: "up", value: "77% self-use" }} delay={1} />
        <MetricCard title="From Grid" value={4.2} suffix=" kWh" icon={Home} trend={{ direction: "down", value: "-8% vs avg" }} delay={2} />
        <MetricCard title="Avg Load" value={0.76} suffix=" kW" icon={Zap} delay={3} />
      </div>

      {/* Load profile chart */}
      <GlassCard glow="green">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            Load Profile
          </h2>
          <div className="flex gap-2">
            {(["today", "week", "month"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                  view === v ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-white/5"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-6 mb-4">
          {[{ label: "Solar", color: COLORS.primary }, { label: "Grid", color: COLORS.amber }].map((l) => (
            <div key={l.label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: l.color }} />
              <span className="text-xs text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>
        <DataChart type="line" data={loadData} height={220} />
      </GlassCard>

      {/* Appliance breakdown */}
      <GlassCard>
        <h2 className="text-lg font-semibold text-foreground mb-6" style={{ fontFamily: "var(--font-display)" }}>
          Appliance Breakdown
        </h2>
        <div className="space-y-4">
          {appliances.map((a) => (
            <div key={a.name} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                <a.icon size={18} className={a.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-foreground">{a.name}</span>
                  <span className="text-sm font-mono text-muted-foreground">{a.kwh} kWh</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700"
                    style={{ width: `${a.pct}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-muted-foreground w-8 text-right shrink-0">{a.pct}%</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
