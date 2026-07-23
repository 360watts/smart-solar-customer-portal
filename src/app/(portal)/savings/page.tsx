"use client";

import React, { useEffect } from "react";
import { motion, useSpring, useTransform, AnimatePresence } from "framer-motion";
import {
  IndianRupee, TrendingUp, Zap, Calendar, ChevronRight,
  Sun, PlugZap, ArrowDownToLine, ArrowUpFromLine,
  type LucideIcon,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { portalApi, SavingsData } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteQuery } from "@/lib/hooks/useSiteQuery";
import { TTL } from "@/lib/portalCache";
import { COLORS } from "@/lib/tokens";

// ── Animated number counter ───────────────────────────────────────────────────
function AnimatedNumber({ value, decimals = 0, prefix = "", suffix = "" }: {
  value: number; decimals?: number; prefix?: string; suffix?: string;
}) {
  const spring = useSpring(0, { stiffness: 60, damping: 18 });
  const display = useTransform(spring, (v) =>
    `${prefix}${v.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`
  );
  useEffect(() => { spring.set(value); }, [spring, value]);
  return <motion.span>{display}</motion.span>;
}

// ── Payback ring ──────────────────────────────────────────────────────────────
function PaybackRing({ pct }: { pct: number }) {
  const size = 200;
  const strokeWidth = 14;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const capped = Math.min(pct, 100);

  const spring = useSpring(0, { stiffness: 40, damping: 20 });
  const dashOffset = useTransform(spring, (v) => circumference - (v / 100) * circumference);

  useEffect(() => { spring.set(capped); }, [spring, capped]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: dashOffset }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="#6EE7B7" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-emerald-400" style={{ fontFamily: "JetBrains Mono, monospace" }}>
          <AnimatedNumber value={capped} decimals={2} suffix="%" />
        </span>
        <span className="text-sm text-muted-foreground mt-1 tracking-wider uppercase">recovered</span>
      </div>
    </div>
  );
}

// ── Consumption bar ───────────────────────────────────────────────────────────
function ConsumptionBar({ label, value, total, color, icon: Icon }: {
  label: string; value: number; total: number; color: string; icon: LucideIcon;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-base">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon size={14} style={{ color }} />
          <span>{label}</span>
        </div>
        <span className="font-medium text-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>
          {value.toFixed(1)} kWh
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-foreground/[0.06] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
        />
      </div>
    </div>
  );
}

// ── Bill comparison ───────────────────────────────────────────────────────────
function BillComparison({ withoutSolar, ebBill, savingsPct }: {
  withoutSolar: number; ebBill: number; savingsPct: number;
}) {
  return (
    <div className="flex items-stretch gap-4">
      {/* Without solar */}
      <div className="flex-1 rounded-xl p-4" style={{ background: "color-mix(in srgb, var(--destructive) 6%, transparent)", border: "1px solid color-mix(in srgb, var(--destructive) 15%, transparent)" }}>
        <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider">Without Solar</p>
        <p className="text-2xl font-bold" style={{ fontFamily: "JetBrains Mono, monospace", color: "var(--destructive)" }}>
          ₹<AnimatedNumber value={withoutSolar} decimals={0} />
        </p>
        <p className="text-sm text-muted-foreground mt-1">Projected EB bill</p>
      </div>

      {/* Arrow */}
      <div className="flex flex-col items-center justify-center shrink-0">
        <div className="flex items-center gap-1 px-2 py-1 rounded-full text-sm font-semibold"
          style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)", color: "var(--primary)", border: "1px solid color-mix(in srgb, var(--primary) 20%, transparent)" }}>
          <TrendingUp size={12} />
          {savingsPct.toFixed(0)}% saved
        </div>
        <div className="w-px h-6 my-2" style={{ background: "var(--border)" }} />
        <ChevronRight size={14} className="text-muted-foreground" />
      </div>

      {/* Actual EB bill */}
      <div className="flex-1 rounded-xl p-4" style={{ background: "color-mix(in srgb, var(--primary) 6%, transparent)", border: "1px solid color-mix(in srgb, var(--primary) 15%, transparent)" }}>
        <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider">Actual EB Bill</p>
        <p className="text-2xl font-bold" style={{ fontFamily: "JetBrains Mono, monospace", color: "var(--primary)" }}>
          ₹<AnimatedNumber value={ebBill} decimals={0} />
        </p>
        <p className="text-sm text-muted-foreground mt-1">This billing cycle</p>
      </div>
    </div>
  );
}

// ── Status pill ───────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: "due" | "paid" | "overdue" }) {
  const cfg = {
    due:     { bg: "color-mix(in srgb, var(--secondary) 12%, transparent)", color: "var(--secondary)", border: "color-mix(in srgb, var(--secondary) 25%, transparent)", label: "Payment Due" },
    paid:    { bg: "color-mix(in srgb, var(--primary) 12%, transparent)", color: "var(--primary)", border: "rgba(47,191,113,0.25)", label: "Paid" },
    overdue: { bg: "color-mix(in srgb, var(--destructive) 12%, transparent)", color: "var(--destructive)", border: "color-mix(in srgb, var(--destructive) 25%, transparent)", label: "Overdue" },
  }[status];
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      {cfg.label}
    </span>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SavingsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-foreground/[0.05]" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => <div key={i} className="h-52 rounded-xl bg-foreground/[0.04]" />)}
      </div>
      <div className="h-64 rounded-xl bg-foreground/[0.04]" />
      <div className="h-48 rounded-xl bg-foreground/[0.04]" />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SavingsPage() {
  const { user } = useAuth();

  const { data: savings, loading, error } = useSiteQuery<SavingsData>(
    user?.site_id,
    async (siteId, signal) => {
      const res = await portalApi.getSavings(siteId, signal);
      const s = res.data.data.savings;
      if (!s) throw new Error("No savings data");
      return s;
    },
    { cacheKey: `savings:${user?.site_id}`, ttl: TTL.summary },
  );

  const totalUnits = savings?.consumption.totalUnitsWithoutSolar ?? 0;

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div key="skeleton" exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
          <SavingsSkeleton />
        </motion.div>
      ) : error || !savings ? (
        <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <GlassCard>
            <p className="text-base text-red-400">{error ?? "Failed to load savings data."}</p>
          </GlassCard>
        </motion.div>
      ) : (() => {
        const { electricityBill, consumption, savings: sav, investment } = savings;
        return (
    <motion.div key="content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="page-title mb-1">
            Savings & ROI
          </h1>
          <p className="text-base text-muted-foreground">
            {electricityBill.period} · {electricityBill.billingMonths}-month cycle
          </p>
        </div>
        <StatusPill status={electricityBill.status} />
      </motion.div>

      {/* Hero row: Payback ring + This cycle savings + Break-even */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Payback ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="glass rounded-xl p-6 flex flex-col items-center justify-center gap-4"
          style={{
            background: "linear-gradient(135deg, color-mix(in srgb, var(--card) 90%, transparent) 0%, color-mix(in srgb, var(--card) 95%, var(--background) 5%) 100%)",
            border: "1px solid color-mix(in srgb, var(--primary) 12%, transparent)",
            boxShadow: "0 0 40px color-mix(in srgb, var(--primary) 5%, transparent)",
          }}
        >
          <PaybackRing pct={investment.paybackPercentage} />
          <div className="text-center">
            <p className="text-sm text-muted-foreground uppercase tracking-widest mb-1">Investment Recovered</p>
            <p className="text-base text-muted-foreground">
              <span className="text-emerald-400 font-semibold" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                ₹{investment.savedAmount.toLocaleString("en-IN")}
              </span>
              {" "}of{" "}
              <span style={{ fontFamily: "JetBrains Mono, monospace" }}>
                ₹{investment.upfrontAmount.toLocaleString("en-IN")}
              </span>
            </p>
          </div>
        </motion.div>

        {/* This cycle savings */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="glass rounded-xl p-6 flex flex-col justify-between"
          style={{
            background: "linear-gradient(135deg, color-mix(in srgb, var(--primary) 6%, transparent) 0%, color-mix(in srgb, var(--card) 92%, transparent) 100%)",
            border: "1px solid color-mix(in srgb, var(--primary) 14%, transparent)",
          }}
        >
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--primary) 20%, transparent)" }}>
                <IndianRupee size={18} className="text-emerald-400" />
              </div>
              <p className="text-base text-muted-foreground">This Billing Cycle</p>
            </div>
            <p className="text-5xl font-bold text-emerald-400 mb-2" style={{ fontFamily: "JetBrains Mono, monospace" }}>
              ₹<AnimatedNumber value={sav.savingsAmount} decimals={0} />
            </p>
            <p className="text-base text-muted-foreground">saved on electricity</p>
          </div>
          <div className="mt-6 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between text-base">
              <span className="text-muted-foreground">Savings rate</span>
              <span className="font-semibold text-emerald-400" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                {sav.savingsPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-foreground/[0.06] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #2FBF71, #6EE7B7)" }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(sav.savingsPercentage, 100)}%` }}
                transition={{ duration: 1.4, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.4 }}
              />
            </div>
          </div>
        </motion.div>

        {/* Break-even */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass rounded-xl p-6 flex flex-col justify-between"
          style={{
            background: "linear-gradient(135deg, color-mix(in srgb, var(--card) 90%, transparent) 0%, color-mix(in srgb, var(--card) 95%, var(--background) 5%) 100%)",
            border: "1px solid var(--border)",
          }}
        >
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--secondary) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--secondary) 18%, transparent)" }}>
                <Calendar size={18} style={{ color: "var(--secondary)" }} />
              </div>
              <p className="text-base text-muted-foreground">Break-Even Projection</p>
            </div>
            <p className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "var(--font-display)" }}>
              {investment.breakEvenDate}
            </p>
            <p className="text-sm text-muted-foreground">estimated recovery date</p>
          </div>
          <div className="mt-6 space-y-3 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between text-base">
              <span className="text-muted-foreground">Months remaining</span>
              <span style={{ fontFamily: "JetBrains Mono, monospace", color: "var(--secondary)" }}>
                {investment.monthsToBreakEven.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex items-center justify-between text-base">
              <span className="text-muted-foreground">Still to recover</span>
              <span style={{ fontFamily: "JetBrains Mono, monospace", color: "color-mix(in srgb, var(--foreground) 60%, transparent)" }}>
                ₹{investment.remainingInvestment.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bill comparison */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.28 }}
      >
        <GlassCard glow="green">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={16} className="text-emerald-400" />
            <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
              Bill Comparison
            </h2>
            <span className="text-sm text-muted-foreground ml-auto">{electricityBill.period}</span>
          </div>
          <BillComparison
            withoutSolar={sav.billWithoutSolar}
            ebBill={electricityBill.amount}
            savingsPct={sav.savingsPercentage}
          />
        </GlassCard>
      </motion.div>

      {/* Consumption breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.36 }}
      >
        <GlassCard>
          <div className="flex items-center gap-2 mb-6">
            <Zap size={16} className="text-muted-foreground" />
            <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
              Energy Breakdown
            </h2>
            <span className="text-sm text-muted-foreground ml-auto">
              {totalUnits.toFixed(1)} kWh equivalent load
            </span>
          </div>
          <div className="space-y-5">
            <ConsumptionBar
              label="Solar Generated"
              value={consumption.solarUnits}
              total={totalUnits}
              color="var(--primary)"
              icon={Sun}
            />
            <ConsumptionBar
              label="Grid Import"
              value={consumption.ebImportUnits}
              total={totalUnits}
              color={COLORS.amber}
              icon={ArrowDownToLine}
            />
            <ConsumptionBar
              label="Grid Export"
              value={consumption.ebExportUnits}
              total={totalUnits}
              color="#60a5fa"
              icon={ArrowUpFromLine}
            />
            {consumption.evUnits > 0 && (
              <ConsumptionBar
                label="EV Charging"
                value={consumption.evUnits}
                total={totalUnits}
                color="#a78bfa"
                icon={PlugZap}
              />
            )}
          </div>

          {/* kWh summary row */}
          <div className="mt-6 pt-5 flex flex-wrap gap-4" style={{ borderTop: "1px solid var(--border)" }}>
            {[
              { label: "Total Units", value: totalUnits, color: "color-mix(in srgb, var(--foreground) 50%, transparent)" },
              { label: "Solar Units", value: consumption.solarUnits, color: "var(--primary)" },
              { label: "Grid Import", value: consumption.ebImportUnits, color: COLORS.amber },
              { label: "Grid Export", value: consumption.ebExportUnits, color: "#60a5fa" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex-1 min-w-25">
                <p className="text-sm text-muted-foreground mb-1">{label}</p>
                <p className="text-lg font-semibold" style={{ fontFamily: "JetBrains Mono, monospace", color }}>
                  {value.toFixed(1)}
                  <span className="text-sm text-muted-foreground ml-1">kWh</span>
                </p>
              </div>
            ))}
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
        );
      })()}
    </AnimatePresence>
  );
}
