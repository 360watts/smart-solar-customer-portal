"use client";

import React from "react";
import { Sun, Zap, AlertTriangle, Activity } from "lucide-react";
import MetricCard from "@/components/ui/MetricCard";
import GlassCard from "@/components/ui/GlassCard";
import StatusPill from "@/components/ui/StatusPill";

export default function OverviewPage() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground font-syne mb-2">
          Good morning, John
        </h1>
        <p className="text-muted-foreground">
          Your solar system is running optimally
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="System Capacity"
          value={6.5}
          icon={Sun}
          suffix=" kW"
          delay={0}
        />
        <MetricCard
          title="Today's Generation"
          value={18.2}
          icon={Zap}
          suffix=" kWh"
          trend={{ direction: "up", value: "+12%" }}
          delay={1}
        />
        <MetricCard
          title="Active Alerts"
          value={2}
          icon={AlertTriangle}
          trend={{ direction: "down", value: "-1 from yesterday" }}
          delay={2}
        />
        <MetricCard
          title="System Status"
          value="98%"
          icon={Activity}
          trend={{ direction: "neutral", value: "Optimal" }}
          delay={3}
        />
      </div>

      {/* Energy Flow Section */}
      <GlassCard glow="green">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground font-syne">
            Live Energy Flow
          </h2>
          <StatusPill status="active" label="Live" />
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-muted-foreground text-sm mb-1">Solar</p>
            <p className="text-2xl font-bold text-primary">4.2 kW</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm mb-1">→</p>
            <p className="text-xl">⚡</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm mb-1">Home</p>
            <p className="text-2xl font-bold text-accent">3.8 kW</p>
          </div>
        </div>
      </GlassCard>

      {/* Data Panel Placeholder */}
      <GlassCard>
        <h2 className="text-lg font-semibold text-foreground font-syne mb-4">
          Detailed Analytics
        </h2>
        <div className="flex gap-2 mb-4">
          {["Overview", "Solar", "History", "Weather", "Load"].map((tab) => (
            <button
              key={tab}
              className="px-3 py-1 rounded-lg text-sm text-muted-foreground hover:bg-primary/10 transition-colors"
            >
              {tab}
            </button>
          ))}
        </div>
        <p className="text-muted-foreground text-center py-8">
          Chart data will be displayed here
        </p>
      </GlassCard>
    </div>
  );
}
