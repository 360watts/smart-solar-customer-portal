"use client";

import React from "react";
import { motion } from "framer-motion";
import { Cloud, Sun, CloudSun, CloudRain, Wind, Droplets, Thermometer, type LucideIcon } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import DataChart from "@/components/ui/DataChart";
import { COLORS } from "@/lib/tokens";
import { useAuth } from "@/contexts/AuthContext";
import { portalApi } from "@/lib/api";
import { useSiteQuery } from "@/lib/hooks/useSiteQuery";
import { TTL } from "@/lib/portalCache";
import { formatHourLabel, SITE_TIMEZONE } from "@/lib/utils";

interface WeatherHourly {
  forecast_for: string;
  ghi_wm2: number;
  temperature_c: number;
  humidity_pct: number;
  wind_speed_ms: number;
  cloud_cover_pct: number;
}
interface WeatherCurrent {
  obs_timestamp: string;
  ghi_wm2: number;
  temperature_c: number;
  humidity_pct: number;
  wind_speed_ms: number;
  cloud_cover_pct: number;
  fetched_at: string;
}
interface DayForecast {
  day: string;
  Icon: LucideIcon;
  high: number;
  low: number;
  avgGhi: number;
  solarScore: number;
  condition: string;
}
interface WeatherData {
  current: WeatherCurrent | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ghiChart: any | null;
  forecast: DayForecast[];
  fetchedAt: string | null;
}

function conditionFromCloud(cloudPct: number): { label: string; Icon: LucideIcon } {
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
    return `${Math.floor(diff / 60)}h ago`;
  } catch { return "recently"; }
}
// Matches the staff dashboard's WeatherTab format and the site's own
// timezone (Coimbatore), not the viewing device's.
const formatHour = formatHourLabel;

function dayLabel(isoString: string, index: number): string {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  try { return new Date(isoString).toLocaleDateString("en-US", { weekday: "short", timeZone: SITE_TIMEZONE }); }
  catch { return `Day ${index + 1}`; }
}
function groupByDay(hourly: WeatherHourly[]): DayForecast[] {
  const byDay: Record<string, WeatherHourly[]> = {};
  hourly.forEach((h) => {
    // Bucket by the site's own calendar day (Coimbatore), not a raw slice of
    // the ISO string — if forecast_for is UTC, slicing the first 10 chars
    // puts hours after ~6:30pm IST into tomorrow's UTC date, silently
    // shifting the 5-day forecast by a day near midnight.
    const key = new Date(h.forecast_for).toLocaleDateString("en-CA", { timeZone: SITE_TIMEZONE });
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(h);
  });
  return Object.entries(byDay).slice(0, 5).map(([dateKey, hours], i) => {
    const avgCloud = hours.reduce((s, h) => s + h.cloud_cover_pct, 0) / hours.length;
    const avgGhi = Math.round(hours.reduce((s, h) => s + h.ghi_wm2, 0) / hours.length);
    const { label, Icon } = conditionFromCloud(avgCloud);
    return {
      day: dayLabel(dateKey + "T12:00:00", i),
      Icon, condition: label, avgGhi,
      high: Math.round(Math.max(...hours.map((h) => h.temperature_c))),
      low: Math.round(Math.min(...hours.map((h) => h.temperature_c))),
      solarScore: Math.min(100, Math.round(avgGhi / 10)),
    };
  });
}

function SolarQualityArc({ score }: { score: number }) {
  const radius = 32; const cx = 44; const cy = 44;
  const circumference = Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score > 75 ? "var(--primary)" : score > 40 ? "var(--secondary)" : "var(--muted)";
  return (
    <div className="flex flex-col items-center">
      <svg width="88" height="52" viewBox="0 0 88 52">
        <path d={`M ${cx-radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx+radius} ${cy}`} fill="none" stroke="var(--border)" strokeWidth={6} strokeLinecap="round" />
        <path d={`M ${cx-radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx+radius} ${cy}`} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" strokeDasharray={`${progress} ${circumference}`} style={{ transition: "stroke-dasharray 1s ease" }} />
      </svg>
      <p className="text-sm text-muted-foreground -mt-2">Solar Quality</p>
      <p className="text-base font-bold mt-0.5" style={{ color, fontFamily: "var(--font-display)" }}>{score}</p>
    </div>
  );
}

export default function WeatherPage() {
  const { user } = useAuth();

  const { data, loading, error } = useSiteQuery<WeatherData>(
    user?.site_id,
    async (siteId) => {
      const res = await portalApi.getWeather(siteId);
      const raw = res.data as { current: WeatherCurrent; hourly_forecast: WeatherHourly[] };
      const now = new Date();

      // No fallback to mock data here — showing MOCK_GHI_DATA when the API
      // returns nothing would silently present fabricated numbers as real
      // readings. null means "no data" and the page shows an empty state.
      let ghiChart: Parameters<typeof DataChart>[0]["data"] | null = null;
      let forecast: DayForecast[] = [];

      if (raw.hourly_forecast?.length) {
        const labels = raw.hourly_forecast.map((h) => formatHour(h.forecast_for));
        ghiChart = {
          labels,
          datasets: [
            { label: "Actual GHI W/m²", data: raw.hourly_forecast.map((h) => new Date(h.forecast_for) <= now ? h.ghi_wm2 : null) as number[], borderColor: COLORS.amber, backgroundColor: COLORS.amberMuted, fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: COLORS.amber },
            { label: "Forecast GHI W/m²", data: raw.hourly_forecast.map((h) => new Date(h.forecast_for) > now ? h.ghi_wm2 : null) as number[], borderColor: "rgba(233,185,73,0.5)", backgroundColor: "rgba(233,185,73,0.06)", fill: true, tension: 0.4, pointRadius: 2, pointBackgroundColor: "rgba(233,185,73,0.5)" },
          ],
        } as Parameters<typeof DataChart>[0]["data"];
        forecast = groupByDay(raw.hourly_forecast);
      }

      return { current: raw.current ?? null, ghiChart, forecast, fetchedAt: raw.current?.fetched_at ?? null };
    },
    { cacheKey: `weather:${user?.site_id}`, ttl: TTL.forecast, autoRefreshSec: 600 },
  );

  const cur = data?.current;
  const temp = cur ? Math.round(cur.temperature_c) : null;
  const ghi = cur ? Math.round(cur.ghi_wm2) : null;
  const humidity = cur ? Math.round(cur.humidity_pct) : null;
  const wind = cur ? cur.wind_speed_ms.toFixed(1) : null;
  const cloudPct = cur ? Math.round(cur.cloud_cover_pct) : null;
  const feelsLike = cur ? Math.round(cur.temperature_c - cur.wind_speed_ms / 3) : null;
  const solarScore = ghi != null ? Math.min(100, Math.round(ghi / 10)) : 0;
  const { label: conditionLabel, Icon: ConditionIcon } = conditionFromCloud(cloudPct ?? 0);

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div>
        <h1 className="page-title mb-1">Weather</h1>
        <p className="text-muted-foreground text-base">Coimbatore — solar irradiance &amp; conditions</p>
      </div>

      {error && <GlassCard><p className="text-base" style={{ color: "var(--destructive)" }}>{error}</p></GlassCard>}

      <GlassCard glow="amber">
        <div className="flex flex-col lg:flex-row items-start gap-6">
          <div className="flex items-center gap-6 flex-1">
            <div className="w-20 h-20 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <ConditionIcon size={48} className="text-amber-400" />
            </div>
            <div>
              <p className="text-5xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                {loading ? "—" : temp != null ? `${temp}°C` : "—"}
              </p>
              <p className="text-muted-foreground mt-1">{loading ? "Loading…" : `${conditionLabel} — Coimbatore`}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 flex-1">
            {[
              { icon: Sun, label: "GHI", value: ghi != null ? `${ghi} W/m²` : "—" },
              { icon: Droplets, label: "Humidity", value: humidity != null ? `${humidity}%` : "—" },
              { icon: Wind, label: "Wind", value: wind != null ? `${wind} m/s` : "—" },
              { icon: Thermometer, label: "Feels Like", value: feelsLike != null ? `${feelsLike}°C` : "—" },
              { icon: Cloud, label: "Cloud Cover", value: cloudPct != null ? `${cloudPct}%` : "—" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-foreground/4 border border-border">
                <s.icon size={13} className="text-amber-400 shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground leading-tight">{s.label}</p>
                  <p className="text-base font-semibold text-foreground leading-tight">{s.value}</p>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-center px-3 py-1 rounded-xl bg-foreground/4 border border-border">
              <SolarQualityArc score={solarScore} />
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Solar Irradiance — Today</h2>
          <span className="text-sm text-muted-foreground font-mono">W/m²</span>
        </div>
        {data?.ghiChart ? (
          <DataChart type="line" data={data.ghiChart as Parameters<typeof DataChart>[0]["data"]} height={200} />
        ) : (
          <div className="h-50 flex items-center justify-center text-base text-muted-foreground">
            {loading ? "Loading…" : "No irradiance data available for today."}
          </div>
        )}
      </GlassCard>

      <GlassCard>
        <h2 className="text-lg font-semibold text-foreground mb-4" style={{ fontFamily: "var(--font-display)" }}>5-Day Solar Forecast</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {(data?.forecast ?? []).map((f, i) => {
            const scoreColor = f.solarScore > 75 ? "var(--primary)" : f.solarScore > 40 ? "var(--secondary)" : "var(--muted)";
            return (
              <div key={i} className="shrink-0 w-36 rounded-2xl p-4 flex flex-col gap-2 border border-border bg-foreground/3">
                <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>{f.day}</p>
                <f.Icon size={28} className="my-1" style={{ color: i === 0 ? "var(--secondary)" : "var(--muted)" }} />
                <p className="text-sm text-muted-foreground leading-tight">{f.condition}</p>
                <p className="text-base font-medium text-foreground">{f.high}° / {f.low}°</p>
                <p className="text-sm text-muted-foreground">{f.avgGhi} W/m²</p>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Score</span>
                    <span className="text-sm font-medium" style={{ color: scoreColor }}>{f.solarScore}</span>
                  </div>
                  <div className="h-1.5 bg-foreground/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${f.solarScore}%`, background: scoreColor }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      <p className="text-sm text-muted-foreground text-center pb-2">
        Weather data: Open-Meteo · Updated {data?.fetchedAt ? timeAgo(data.fetchedAt) : "recently"}
      </p>
    </motion.div>
  );
}
