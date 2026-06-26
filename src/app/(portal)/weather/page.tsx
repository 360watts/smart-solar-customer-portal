"use client";

import React from "react";
import { Cloud, Sun, CloudRain, Wind, Droplets, Thermometer, Eye } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import DataChart from "@/components/ui/DataChart";
import { COLORS } from "@/lib/tokens";

const HOURS = ["6am", "8am", "10am", "12pm", "2pm", "4pm", "6pm"];

const ghiData = {
  labels: HOURS,
  datasets: [
    {
      label: "GHI W/m²",
      data: [120, 380, 650, 820, 790, 510, 180],
      borderColor: COLORS.amber,
      backgroundColor: COLORS.amberMuted,
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointBackgroundColor: COLORS.amber,
    },
  ],
};

const FORECAST = [
  { day: "Today", icon: Sun, high: 34, low: 26, ghi: 820, condition: "Clear", solarScore: 95 },
  { day: "Tomorrow", icon: CloudRain, high: 30, low: 24, ghi: 320, condition: "Partly cloudy", solarScore: 45 },
  { day: "Saturday", icon: Cloud, high: 29, low: 23, ghi: 410, condition: "Overcast", solarScore: 52 },
  { day: "Sunday", icon: Sun, high: 33, low: 25, ghi: 780, condition: "Clear", solarScore: 91 },
  { day: "Monday", icon: Sun, high: 35, low: 27, ghi: 850, condition: "Clear", solarScore: 98 },
];

export default function WeatherPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1" style={{ fontFamily: "var(--font-display)" }}>
          Weather
        </h1>
        <p className="text-muted-foreground text-sm">Coimbatore — solar irradiance & conditions</p>
      </div>

      {/* Current conditions */}
      <GlassCard glow="amber">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-amber-500/10 flex items-center justify-center">
              <Sun size={48} className="text-amber-400" />
            </div>
            <div>
              <p className="text-5xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                34°C
              </p>
              <p className="text-muted-foreground mt-1">Clear Sky — Coimbatore</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { icon: Sun, label: "GHI", value: "820 W/m²" },
              { icon: Wind, label: "Wind", value: "12 km/h" },
              { icon: Droplets, label: "Humidity", value: "62%" },
              { icon: Thermometer, label: "Feels like", value: "37°C" },
              { icon: Eye, label: "Visibility", value: "10 km" },
              { icon: Cloud, label: "Cloud cover", value: "5%" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <s.icon size={14} className="text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-sm text-foreground font-medium">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* GHI chart */}
      <GlassCard>
        <h2 className="text-lg font-semibold text-foreground mb-6" style={{ fontFamily: "var(--font-display)" }}>
          Today's Irradiance (GHI W/m²)
        </h2>
        <DataChart type="line" data={ghiData} height={200} />
      </GlassCard>

      {/* 5-day forecast */}
      <GlassCard>
        <h2 className="text-lg font-semibold text-foreground mb-4" style={{ fontFamily: "var(--font-display)" }}>
          5-Day Solar Forecast
        </h2>
        <div className="space-y-3">
          {FORECAST.map((f, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/3 transition-colors">
              <f.icon size={22} className={i === 0 ? "text-amber-400" : "text-muted-foreground"} />
              <div className="w-24 shrink-0">
                <p className="text-sm font-medium text-foreground">{f.day}</p>
                <p className="text-xs text-muted-foreground">{f.condition}</p>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Solar score</span>
                  <span
                    className="text-xs font-medium"
                    style={{ color: f.solarScore > 75 ? COLORS.primary : f.solarScore > 50 ? COLORS.amber : "#6B7A99" }}
                  >
                    {f.solarScore}%
                  </span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${f.solarScore}%`,
                      background: f.solarScore > 75 ? COLORS.primary : f.solarScore > 50 ? COLORS.amber : "#6B7A99",
                    }}
                  />
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm text-foreground">{f.high}° / {f.low}°</p>
                <p className="text-xs text-muted-foreground">{f.ghi} W/m²</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
