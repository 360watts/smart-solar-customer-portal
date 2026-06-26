"use client";

import React, { useEffect, useState } from "react";
import { Cloud, Sun, CloudSun, CloudRain, Wind, Droplets, Thermometer } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import DataChart from "@/components/ui/DataChart";
import { COLORS } from "@/lib/tokens";
import { useAuth } from "@/contexts/AuthContext";
import { portalApi } from "@/lib/api";

// ── Types ────────────────────────────────────────────────────────────────────
interface WeatherCurrent {
  obs_timestamp: string;
  ghi_wm2: number;
  temperature_c: number;
  humidity_pct: number;
  wind_speed_ms: number;
  cloud_cover_pct: number;
  fetched_at: string;
}

interface WeatherHourly {
  forecast_for: string;
  ghi_wm2: number;
  temperature_c: number;
  humidity_pct: number;
  wind_speed_ms: number;
  cloud_cover_pct: number;
}

interface WeatherData {
  current: WeatherCurrent;
  hourly_forecast: WeatherHourly[];
}

// ── Mock data (initial state) ────────────────────────────────────────────────
const MOCK_HOURS = ["6am", "8am", "10am", "12pm", "2pm", "4pm", "6pm"];

const mockGhiData = {
  labels: MOCK_HOURS,
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

const MOCK_FORECAST = [
  { day: "Today", icon: Sun, high: 34, low: 26, ghi: 820, condition: "Clear", solarScore: 95 },
  { day: "Tomorrow", icon: CloudRain, high: 30, low: 24, ghi: 320, condition: "Partly cloudy", solarScore: 45 },
  { day: "Saturday", icon: Cloud, high: 29, low: 23, ghi: 410, condition: "Overcast", solarScore: 52 },
  { day: "Sunday", icon: Sun, high: 33, low: 25, ghi: 780, condition: "Clear", solarScore: 91 },
  { day: "Monday", icon: Sun, high: 35, low: 27, ghi: 850, condition: "Clear", solarScore: 98 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function conditionFromCloud(cloudPct: number): { label: string; Icon: React.ElementType } {
  if (cloudPct < 20) return { label: "Clear Sky", Icon: Sun };
  if (cloudPct < 50) return { label: "Partly Cloudy", Icon: CloudSun };
  if (cloudPct < 80) return { label: "Mostly Cloudy", Icon: Cloud };
  return { label: "Overcast / Rain", Icon: CloudRain };
}

function timeAgo(isoString: string): string {
  try {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
    if (diff < 1) return "just now";
    if (diff < 60) return `${diff}m ago`;
    const h = Math.floor(diff / 60);
    return `${h}h ago`;
  } catch {
    return "recently";
  }
}

function formatHour(isoString: string): string {
  try {
    const d = new Date(isoString);
    const h = d.getHours();
    if (h === 0) return "12am";
    if (h < 12) return `${h}am`;
    if (h === 12) return "12pm";
    return `${h - 12}pm`;
  } catch {
    return "";
  }
}

function dayLabel(isoString: string, index: number): string {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  try {
    return new Date(isoString).toLocaleDateString("en-US", { weekday: "short" });
  } catch {
    return `Day ${index + 1}`;
  }
}

interface DayForecast {
  day: string;
  Icon: React.ElementType;
  high: number;
  low: number;
  avgGhi: number;
  solarScore: number;
  condition: string;
}

function groupByDay(hourly: WeatherHourly[]): DayForecast[] {
  const byDay: Record<string, WeatherHourly[]> = {};
  hourly.forEach((h) => {
    const dateKey = h.forecast_for.slice(0, 10);
    if (!byDay[dateKey]) byDay[dateKey] = [];
    byDay[dateKey].push(h);
  });

  return Object.entries(byDay)
    .slice(0, 5)
    .map(([dateKey, hours], i) => {
      const avgCloud = hours.reduce((s, h) => s + h.cloud_cover_pct, 0) / hours.length;
      const avgGhi = Math.round(hours.reduce((s, h) => s + h.ghi_wm2, 0) / hours.length);
      const maxTemp = Math.max(...hours.map((h) => h.temperature_c));
      const minTemp = Math.min(...hours.map((h) => h.temperature_c));
      const { label, Icon } = conditionFromCloud(avgCloud);
      return {
        day: dayLabel(dateKey + "T12:00:00", i),
        Icon,
        high: Math.round(maxTemp),
        low: Math.round(minTemp),
        avgGhi,
        solarScore: Math.min(100, Math.round(avgGhi / 10)),
        condition: label,
      };
    });
}

// ── Solar Quality Arc ─────────────────────────────────────────────────────────
function SolarQualityArc({ score }: { score: number }) {
  const radius = 32;
  const stroke = 6;
  const cx = 44;
  const cy = 44;
  const circumference = Math.PI * radius; // half circle
  const progress = (score / 100) * circumference;

  const color = score > 75 ? COLORS.primary : score > 40 ? COLORS.amber : COLORS.muted;

  return (
    <div className="flex flex-col items-center">
      <svg width="88" height="52" viewBox="0 0 88 52">
        {/* Background arc */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* Foreground arc */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
      </svg>
      <p className="text-xs text-muted-foreground -mt-2">Solar Quality</p>
      <p className="text-sm font-bold mt-0.5" style={{ color, fontFamily: "var(--font-display)" }}>
        {score}
      </p>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function WeatherPage() {
  const { user } = useAuth();

  // State
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [ghiData, setGhiData] = useState(mockGhiData);
  const [forecast, setForecast] = useState<DayForecast[] | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.site_id) return;
    portalApi
      .getWeather(user.site_id)
      .then((res) => {
        const data: WeatherData = res.data;
        setWeather(data);
        setFetchedAt(data.current.fetched_at);

        // Build GHI chart from hourly_forecast
        if (data.hourly_forecast?.length) {
          const now = new Date();
          const labels = data.hourly_forecast.map((h) => formatHour(h.forecast_for));
          const ghiValues = data.hourly_forecast.map((h) => h.ghi_wm2);

          // Split past vs future
          const pastData = data.hourly_forecast.map((h) =>
            new Date(h.forecast_for) <= now ? h.ghi_wm2 : null
          );
          const futureData = data.hourly_forecast.map((h) =>
            new Date(h.forecast_for) > now ? h.ghi_wm2 : null
          );

          setGhiData({
            labels,
            datasets: [
              {
                label: "Actual GHI W/m²",
                data: pastData as number[],
                borderColor: COLORS.amber,
                backgroundColor: COLORS.amberMuted,
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointBackgroundColor: COLORS.amber,
              },
              {
                label: "Forecast GHI W/m²",
                data: futureData as number[],
                borderColor: "rgba(233,185,73,0.5)",
                backgroundColor: "rgba(233,185,73,0.06)",
                fill: true,
                tension: 0.4,
                pointRadius: 2,
                pointBackgroundColor: "rgba(233,185,73,0.5)",
                // @ts-expect-error borderDash is valid chart.js option
                borderDash: [5, 5],
              },
            ],
          });

          setForecast(groupByDay(data.hourly_forecast));
        }
      })
      .catch(() => {
        // silent fallback — mock data stays
      });
  }, [user?.site_id]);

  // Derive display values
  const cur = weather?.current;
  const temp = cur ? Math.round(cur.temperature_c) : 34;
  const ghi = cur ? Math.round(cur.ghi_wm2) : 820;
  const humidity = cur ? Math.round(cur.humidity_pct) : 62;
  const wind = cur ? cur.wind_speed_ms.toFixed(1) : "3.3";
  const cloudPct = cur ? Math.round(cur.cloud_cover_pct) : 5;
  const feelsLike = cur ? Math.round(cur.temperature_c - cur.wind_speed_ms / 3) : 33;
  const solarScore = Math.min(100, Math.round(ghi / 10));

  const { label: conditionLabel, Icon: ConditionIcon } = conditionFromCloud(cloudPct);

  const displayForecast = forecast ?? MOCK_FORECAST.map((f) => ({
    day: f.day,
    Icon: f.icon,
    high: f.high,
    low: f.low,
    avgGhi: f.ghi,
    solarScore: f.solarScore,
    condition: f.condition,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1
          className="text-3xl font-bold text-foreground mb-1"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Weather
        </h1>
        <p className="text-muted-foreground text-sm">Coimbatore — solar irradiance &amp; conditions</p>
      </div>

      {/* ── Current conditions hero ── */}
      <GlassCard glow="amber">
        <div className="flex flex-col lg:flex-row items-start gap-6">
          {/* Left: temp + condition */}
          <div className="flex items-center gap-6 flex-1">
            <div className="w-20 h-20 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <ConditionIcon size={48} className="text-amber-400" />
            </div>
            <div>
              <p
                className="text-5xl font-bold text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {temp}°C
              </p>
              <p className="text-muted-foreground mt-1">{conditionLabel} — Coimbatore</p>
            </div>
          </div>

          {/* Middle: metric chips */}
          <div className="grid grid-cols-3 gap-3 flex-1">
            {[
              { icon: Sun, label: "GHI", value: `${ghi} W/m²` },
              { icon: Droplets, label: "Humidity", value: `${humidity}%` },
              { icon: Wind, label: "Wind", value: `${wind} m/s` },
              { icon: Thermometer, label: "Feels Like", value: `${feelsLike}°C` },
              { icon: Cloud, label: "Cloud Cover", value: `${cloudPct}%` },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/4 border border-white/6"
              >
                <s.icon size={13} className="text-amber-400 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
                  <p className="text-sm font-semibold text-foreground leading-tight">{s.value}</p>
                </div>
              </div>
            ))}

            {/* Solar quality arc in the 6th chip slot */}
            <div className="flex items-center justify-center px-3 py-1 rounded-xl bg-white/4 border border-white/6">
              <SolarQualityArc score={solarScore} />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* ── GHI 24h Chart ── */}
      <GlassCard>
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-lg font-semibold text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Solar Irradiance — Today
          </h2>
          <span className="text-xs text-muted-foreground font-mono">W/m²</span>
        </div>
        <DataChart type="line" data={ghiData} height={200} />
      </GlassCard>

      {/* ── 5-day Forecast Cards ── */}
      <GlassCard>
        <h2
          className="text-lg font-semibold text-foreground mb-4"
          style={{ fontFamily: "var(--font-display)" }}
        >
          5-Day Solar Forecast
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {displayForecast.map((f, i) => {
            const scoreColor =
              f.solarScore > 75 ? COLORS.primary : f.solarScore > 40 ? COLORS.amber : COLORS.muted;
            return (
              <div
                key={i}
                className="shrink-0 w-36 rounded-2xl p-4 flex flex-col gap-2 border border-white/6"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                {/* Day name */}
                <p
                  className="text-xs font-semibold text-foreground"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {f.day}
                </p>

                {/* Condition icon */}
                <f.Icon
                  size={28}
                  className="my-1"
                  style={{ color: i === 0 ? COLORS.amber : COLORS.muted }}
                />

                {/* Condition label */}
                <p className="text-xs text-muted-foreground leading-tight">{f.condition}</p>

                {/* Temp range */}
                <p className="text-sm font-medium text-foreground">
                  {f.high}° / {f.low}°
                </p>

                {/* Avg GHI */}
                <p className="text-xs text-muted-foreground">{f.avgGhi} W/m²</p>

                {/* Solar score bar */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Score</span>
                    <span className="text-xs font-medium" style={{ color: scoreColor }}>
                      {f.solarScore}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${f.solarScore}%`, background: scoreColor }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* ── Data source footnote ── */}
      <p className="text-xs text-muted-foreground text-center pb-2">
        Weather data: Open-Meteo · Updated{" "}
        {fetchedAt ? timeAgo(fetchedAt) : "recently"}
      </p>
    </div>
  );
}
