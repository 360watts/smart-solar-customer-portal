"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sun, Home, Zap, ArrowRight, TrendingUp, AlertTriangle, Activity } from "lucide-react";
import StatusPill from "@/components/ui/StatusPill";
import GlassCard from "@/components/ui/GlassCard";
import EnergyFlowDiagram from "@/components/ui/EnergyFlowDiagram";
import HourlyGenerationChart from "@/components/ui/HourlyGenerationChart";

// ─── Animated counter ─────────────────────────────────────────────────────────
function AnimatedNumber({ value, decimals = 1, suffix = "" }: { value: number; decimals?: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const duration = 1400;
    function tick(now: number) {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setDisplay(value * ease);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value]);
  return <>{display.toFixed(decimals)}{suffix}</>;
}

// ─── Greeting (client-only) ─────────────────────────────────────────────────
function Greeting() {
  const [greeting, setGreeting] = useState<string>("Good morning");
  useEffect(() => {
    const hour = new Date().getHours();
    const text = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    setGreeting(text);
  }, []);
  return <>{greeting}</>;
}

// ─── Live Clock (client-only) ────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState<string>("");
  useEffect(() => {
    setTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
    }, 10000);
    return () => clearInterval(interval);
  }, []);
  return <span className="text-xs text-white/55 font-mono">{time || "••:••"}</span>;
}

// ─── KPI Tile ─────────────────────────────────────────────────────────────────
function KpiTile({
  label, value, unit, icon: Icon, color, trend, delay = 0,
}: {
  label: string; value: number; unit: string; icon: React.ElementType;
  color: "green" | "amber" | "blue" | "red"; trend?: string; delay?: number;
}) {
  const cm = {
    green: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    amber: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-400/20" },
    blue: { text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-400/20" },
    red: { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-400/20" },
  }[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 28, delay: delay * 0.08 }}
      whileHover={{ y: -3, transition: { type: "spring", stiffness: 400, damping: 20 } }}
      className={`glass border ${cm.border} rounded-2xl p-5 cursor-default`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${cm.bg} flex items-center justify-center`}>
          <Icon size={18} className={cm.text} />
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cm.bg} ${cm.text}`}>
            {trend}
          </span>
        )}
      </div>
      <div className="stat-number text-3xl text-white mb-0.5">
        <AnimatedNumber value={value} decimals={value % 1 === 0 ? 0 : 1} />
        <span className="text-base font-normal text-white/60 ml-1">{unit}</span>
      </div>
      <p className="text-xs text-white/60 mt-1 font-medium uppercase tracking-wider">{label}</p>
    </motion.div>
  );
}

// ─── Radial self-consumption arc ──────────────────────────────────────────────
function SelfUseArc({ pct }: { pct: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg viewBox="0 0 130 130" className="w-full h-full">
      <circle cx="65" cy="65" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10" />
      <motion.circle
        cx="65" cy="65" r={r} fill="none" stroke="#2FBF71" strokeWidth="10" strokeLinecap="round"
        strokeDasharray={circ} initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        transform="rotate(-90 65 65)"
        style={{ filter: "drop-shadow(0 0 6px rgba(47,191,113,0.6))" }}
      />
      <text x="65" y="60" textAnchor="middle" fill="#F0F6FF" fontSize="22" fontWeight="800" fontFamily="var(--font-display),system-ui">{pct}%</text>
      <text x="65" y="76" textAnchor="middle" fill="#A8B8D8" fontSize="9" fontFamily="DM Sans,system-ui">self-use</text>
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const FLOW_DATA = {
  solarKw: 4.2,
  homeKw: 3.8,
  batteryKw: 0.8,
  batterySoc: 62,
  gridKw: -0.4,
  loads: [
    { label: "Air Con", kw: 1.8, color: "#60a5fa" },
    { label: "EV", kw: 1.1, color: "#a78bfa" },
    { label: "Lights", kw: 0.5, color: "#fbbf24" },
    { label: "Other", kw: 0.4, color: "#6B7A99" },
  ],
};

export default function OverviewPage() {
  return (
    <div className="relative space-y-6 bg-sun-glow">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <p className="text-xs text-white/55 uppercase tracking-[0.2em] font-medium mb-2">
            Solar Dashboard · Coimbatore
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-none tracking-tight">
            <Greeting />,<br />
            <span className="glow-text-green">John.</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <StatusPill status="active" label="System online" animated />
          <LiveClock />
        </div>
      </motion.div>

      {/* Hero stat + energy flow — open layout, no card boxing */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="flex flex-col sm:flex-row gap-8 items-start"
      >
        {/* Left — live output stats (30%) */}
        <div className="min-w-0" style={{ flex: "3" }}>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs uppercase tracking-[0.18em] font-medium" style={{ color: "#2FBF71" }}>Live Output</span>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="stat-number text-6xl glow-text-green">
              <AnimatedNumber value={4.2} decimals={1} />
            </span>
            <span className="text-xl text-white/45 font-light">kW</span>
          </div>
          <p className="text-white/55 text-sm mb-8">
            Peak today: <span className="text-white/55">4.8 kW</span> at 12:15 PM
          </p>
          <div className="flex flex-col gap-2">
            {[
              { label: "Today's yield", value: "18.2 kWh", accent: "rgba(47,191,113,0.7)" },
              { label: "This month",    value: "310 kWh",  accent: "rgba(255,255,255,0.18)" },
              { label: "CO₂ avoided",  value: "248 kg",   accent: "rgba(255,255,255,0.18)" },
            ].map((s) => (
              <div key={s.label}
                className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5"
                style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-1 h-5 rounded-full shrink-0" style={{ background: s.accent }} />
                  <span className="text-xs text-white/60 whitespace-nowrap">{s.label}</span>
                </div>
                <span className="text-sm font-bold whitespace-nowrap tabular-nums"
                  style={{ color: s.accent === "rgba(47,191,113,0.7)" ? "#2FBF71" : "rgba(255,255,255,0.6)",
                           fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px bg-white/6 self-stretch" />

        {/* Right — energy flow diagram (70%) */}
        <div className="min-w-0" style={{ flex: "7" }}>
          <p className="text-xs uppercase tracking-[0.18em] font-medium mb-3" style={{ color: "#2FBF71" }}>
            Live Energy Flow
          </p>
          <EnergyFlowDiagram data={FLOW_DATA} />
        </div>
      </motion.div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiTile label="System Capacity" value={6.5} unit="kWp" icon={Sun} color="green" delay={0} />
        <KpiTile label="Today's Generation" value={18.2} unit="kWh" icon={Zap} color="amber" trend="+12%" delay={1} />
        <KpiTile label="Active Alerts" value={2} unit="" icon={AlertTriangle} color="red" delay={2} />
        <KpiTile label="Performance Ratio" value={87} unit="%" icon={Activity} color="blue" trend="Good" delay={3} />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Self-use ring */}
        <GlassCard>
          <p className="text-xs text-white/60 uppercase tracking-widest font-medium mb-4">Self-Consumption</p>
          <div className="w-32 h-32 mx-auto">
            <SelfUseArc pct={77} />
          </div>
          <p className="text-center text-xs text-white/55 mt-3">77% powered by solar today</p>
        </GlassCard>

        {/* Hourly generation with interactive tooltips */}
        <GlassCard className="md:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs text-white/60 uppercase tracking-widest font-medium">Energy Overview</p>
            <span className="text-xs text-white/55">Today</span>
          </div>
          <HourlyGenerationChart />
        </GlassCard>
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Solar Forecast", href: "/solar", icon: Sun },
          { label: "Consumption", href: "/consumption", icon: Home },
          { label: "Bill History", href: "/history", icon: TrendingUp },
          { label: "Weather", href: "/weather", icon: Activity },
        ].map((nav) => (
          <motion.a key={nav.href} href={nav.href} whileHover={{ y: -2 }}
            className="glass rounded-xl p-4 flex items-center justify-between group cursor-pointer hover:border-white/15 transition-colors"
          >
            <span className="text-sm font-medium text-white/50 group-hover:text-white/80 transition-colors">{nav.label}</span>
            <ArrowRight size={14} className="text-white/45 group-hover:text-white/50 transition-colors" />
          </motion.a>
        ))}
      </div>
    </div>
  );
}
