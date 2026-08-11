"use client";

import React, { useEffect, useState } from "react";
import { motion, useSpring, useTransform, AnimatePresence } from "framer-motion";
import {
  IndianRupee, Zap, Calendar, ChevronDown, Info,
  Sun, PlugZap, ArrowDownToLine, ArrowUpFromLine,
  type LucideIcon,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { portalApi, SavingsData, DataQuality, MeasurementSource } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteQuery } from "@/lib/hooks/useSiteQuery";
import { TTL } from "@/lib/portalCache";
import { COLORS } from "@/lib/tokens";
import { getConfidenceTier, formatDataSource, variancePercent } from "@/lib/billConfidence";

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
  const size = 156;
  const strokeWidth = 11;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const capped = Math.min(pct, 100);

  const spring = useSpring(0, { stiffness: 40, damping: 20 });
  const dashOffset = useTransform(spring, (v) => circumference - (v / 100) * circumference);

  useEffect(() => { spring.set(capped); }, [spring, capped]);

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} />
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
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-emerald-400" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
          <AnimatedNumber value={capped} decimals={1} suffix="%" />
        </span>
        <span className="text-xs text-muted-foreground mt-1 tracking-wider uppercase">recovered</span>
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
        <span className="font-medium text-foreground" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
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

// ── Confidence stamp ──────────────────────────────────────────────────────────
// Signature element: this bill carries a real government levy (TANGEDCO's
// networking charge) on top of the net-metering math, so the reconciliation
// status reads as an official mark on the ledger rather than a soft UI pill.
function ConfidenceStamp({ dataQuality }: { dataQuality: DataQuality }) {
  const tier = getConfidenceTier(dataQuality);
  const cfg = {
    reconciled:     { color: "var(--primary)", label: "Actual bill" },
    estimated:      { color: COLORS.amber, label: "Estimate" },
    "low-coverage": { color: "var(--destructive)", label: "Rough estimate" },
  }[tier];
  return (
    <div
      className="inline-flex items-center justify-center px-3 py-1.5 shrink-0"
      style={{
        transform: "rotate(-6deg)",
        border: `2px solid ${cfg.color}`,
        outline: `1px solid ${cfg.color}`,
        outlineOffset: "2px",
        borderRadius: "3px",
        color: cfg.color,
        letterSpacing: "0.12em",
      }}
    >
      <span className="text-xs font-bold uppercase" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
        {cfg.label}
      </span>
    </div>
  );
}

function DataQualityDisclosure({ dataQuality }: { dataQuality: DataQuality }) {
  // coverage_pct describes the inverter alone. Presenting it bare reads as
  // "100% of everything" while other meters sat at 57% — so when any source
  // trails, say so here and let the breakdown carry the per-instrument detail.
  const partial = (dataQuality.sources ?? []).filter(
    (s) => s.days_in_period > 0 && s.days < s.days_in_period
  ).length;
  return (
    <div className="flex items-center gap-1 text-sm text-muted-foreground">
      <Info size={12} />
      {formatDataSource(dataQuality.source)}: {dataQuality.coverage_pct}% coverage
      ({dataQuality.days_with_data} of {dataQuality.days_in_period} days)
      {partial > 0 && ` · ${partial} other meter${partial > 1 ? "s" : ""} partial — see breakdown`}
    </div>
  );
}

// ── Passbook ledger row ───────────────────────────────────────────────────────
function LedgerRow({ label, value, unit, tone = "default", indent = false, muted = false, icon: Icon, trailing }: {
  label: string; value: string; unit?: string;
  tone?: "default" | "credit" | "debit"; indent?: boolean; muted?: boolean;
  icon?: LucideIcon; trailing?: React.ReactNode;
}) {
  const color = {
    default: "var(--foreground)",
    credit: "var(--primary)",
    debit: "var(--destructive)",
  }[tone];
  return (
    <div className={indent ? "pl-4" : ""}>
      <div className="flex items-baseline justify-between py-2">
        <span className={`flex items-center gap-1.5 text-sm ${muted ? "text-muted-foreground" : "text-foreground"}`}>
          {Icon && <Icon size={13} style={{ color }} />}
          {label}
          {trailing}
        </span>
        <span
          className="text-sm font-semibold tabular-nums"
          style={{ fontFamily: "var(--font-jetbrains-mono)", color }}
        >
          {value}
          {unit && <span className="text-xs text-muted-foreground ml-1 font-normal">{unit}</span>}
        </span>
      </div>
    </div>
  );
}

function LedgerDivider() {
  return <div className="my-1" style={{ borderTop: "1px dashed var(--border)" }} />;
}

// ── Instrument provenance ─────────────────────────────────────────────────────
// The figures above are not one measurement — they come from separate meters
// installed at different times, each blind to something. A single blended
// "coverage %" hides that. Each instrument states what it reads, what it
// misses, and how much of this cycle it actually covered.
function SourceCoverage({ sources }: { sources: MeasurementSource[] }) {
  return (
    <div className="mt-4">
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
        Where these numbers come from
      </p>
      <div className="flex flex-col gap-3">
        {sources.map((s) => {
          const pct = s.days_in_period > 0
            ? Math.round((s.days / s.days_in_period) * 100)
            : 0;
          // Full coverage reads as measured; partial is still useful but must
          // not look authoritative; nothing at all is stated plainly, not hidden.
          const tone =
            pct >= 95 ? "var(--primary)" :
            pct > 0   ? COLORS.amber :
                        "var(--muted-foreground)";
          return (
            <div key={s.key}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm">{s.label}</span>
                <span
                  className="text-xs shrink-0 tabular-nums"
                  style={{ fontFamily: "var(--font-jetbrains-mono)", color: tone }}
                >
                  {s.days === 0 ? "no data" : `${s.days}/${s.days_in_period} days · ${pct}%`}
                </span>
              </div>
              {/* Coverage strip — fraction of the cycle this instrument reported. */}
              <div
                className="mt-1 h-[3px] w-full overflow-hidden"
                style={{ background: "var(--border)", borderRadius: "2px" }}
                role="img"
                aria-label={`${s.label}: ${pct}% of the billing cycle`}
              >
                <div style={{ width: `${pct}%`, height: "100%", background: tone }} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {s.measures}
                {s.blind_to ? <> · <span style={{ color: COLORS.amber }}>Doesn&apos;t see: {s.blind_to}</span></> : null}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Native `title` tooltip: hovers by default and — unlike an absolutely
// positioned popup — is never clipped by the collapsible breakdown's
// `overflow: hidden` (needed for the height-collapse animation), since it
// renders in the browser's own UI layer rather than this DOM subtree.
function InfoToggle({ note }: { note: string }) {
  return (
    <span
      className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
      title={note}
    >
      <Info size={11} />
    </span>
  );
}

// ── Passbook ledger (hero) ────────────────────────────────────────────────────
function PassbookLedger({ savings }: { savings: SavingsData }) {
  const { electricityBill, consumption, savings: sav, networkCharge, energyWallet } = savings;
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  // Once reconciled, electricityBill.amount IS TANGEDCO's real due_amount —
  // it already includes their own networking charge + GST, so adding ours on
  // top would double-count it. Only layer our estimate on top of our own
  // slab-only estimate, not on top of a real fetched/entered bill.
  const isReconciled = savings.data_quality.estimate_status === "reconciled";
  // A reconciled ₹0 comes from APIclub's "payment received" response, which
  // returns no amount. So we know nothing is outstanding, but TANGEDCO's own
  // networking charge is unknown — ours stays an estimate rather than being
  // "included above" the way a real fetched total would be.
  const billSettled = isReconciled && electricityBill.amount <= 0.01;
  const totalPayable = electricityBill.amount + (isReconciled ? 0 : networkCharge?.totalWithGst ?? 0);
  const variance = electricityBill.estimateAmount != null && electricityBill.actualAmount != null
    ? variancePercent(electricityBill.estimateAmount, electricityBill.actualAmount)
    : null;

  // Plain-language translation of the ledger math below — the numbers show
  // their work, but the takeaway ("why do I owe this") should be stated once
  // in words rather than left for the reader to subtract themselves.
  const netMeteringBillIsZero = electricityBill.amount <= 0.01;
  let summaryLine: string | null = null;
  if (billSettled) {
    summaryLine = networkCharge
      ? "TANGEDCO has nothing outstanding for this cycle. The networking charge below is our estimate — their bill doesn't break it out for us."
      : "TANGEDCO has nothing outstanding for this cycle.";
  } else if (isReconciled) {
    summaryLine = networkCharge
      ? "This is your actual TANGEDCO bill, including their networking charge."
      : "This is your actual TANGEDCO bill for this cycle.";
  } else if (netMeteringBillIsZero && networkCharge && networkCharge.totalWithGst > 0) {
    summaryLine = `You exported more solar than you used — net-metering bill: ₹0. The ₹${Math.round(totalPayable).toLocaleString("en-IN")} is TANGEDCO's networking charge.`;
  } else if (networkCharge && networkCharge.totalWithGst > 0) {
    summaryLine = `Net-metering bill ₹${electricityBill.amount.toLocaleString("en-IN")} + ₹${networkCharge.totalWithGst.toLocaleString("en-IN")} networking charge.`;
  }

  return (
    <GlassCard glow="green">
      {/* Perforated header strip, ticket-stub style */}
      <div
        className="flex items-center justify-between pb-4 mb-4"
        style={{ borderBottom: "1px dashed var(--border)" }}
      >
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Billing passbook</p>
          <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            {electricityBill.period}
          </h2>
        </div>
        <span className="text-sm text-muted-foreground shrink-0">
          {electricityBill.billingMonths}-month cycle
        </span>
      </div>

      {/* Total + stamp — always visible summary */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Total payable</p>
          <p className="text-4xl font-bold" style={{ fontFamily: "var(--font-jetbrains-mono)", color: "var(--primary)" }}>
            ₹<AnimatedNumber value={totalPayable} decimals={0} />
          </p>
          {variance != null && (
            <p className="text-sm text-muted-foreground mt-1">
              {variance >= 0 ? "+" : ""}{variance.toFixed(1)}% vs your last actual bill
            </p>
          )}
          {isReconciled && electricityBill.dueDate && (
            <p className="text-sm mt-1" style={{ color: "var(--secondary)" }}>
              Due {new Date(electricityBill.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </p>
          )}
        </div>
        <ConfidenceStamp dataQuality={savings.data_quality} />
      </div>

      {summaryLine && (
        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{summaryLine}</p>
      )}

      {/* Line-item breakdown is collapsed by default — tap to reveal */}
      <button
        type="button"
        onClick={() => setBreakdownOpen((o) => !o)}
        className="flex items-center gap-1 text-sm font-medium mt-4 text-emerald-400 hover:opacity-80 transition-opacity"
      >
        {breakdownOpen ? "Hide breakdown" : "View breakdown"}
        <ChevronDown size={14} style={{ transform: breakdownOpen ? "rotate(180deg)" : undefined, transition: "transform 0.2s" }} />
      </button>

      <AnimatePresence initial={false}>
        {breakdownOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="pt-4">
              <LedgerDivider />
              <p className="text-xs uppercase tracking-widest text-muted-foreground mt-3 mb-1">Energy this cycle</p>
              <LedgerRow
                label="Household load (measured)"
                value={consumption.loadUnits != null ? consumption.loadUnits.toFixed(1) : "—"}
                unit={consumption.loadUnits != null ? "kWh" : undefined}
                muted
                icon={Zap}
                trailing={<InfoToggle note={
                  consumption.loadUnits != null
                    ? "Measured directly by the inverter. This is what your bill-without-solar estimate below is based on — not the meter readings below it, which aren't fully trustworthy yet."
                    : "Not available yet for this cached figure — refresh to load it."
                } />}
              />
              <LedgerRow label="Solar generated" value={consumption.solarUnits.toFixed(1)} unit="kWh" tone="credit" icon={Sun} />
              <LedgerRow label="Imported from grid" value={consumption.ebImportUnits.toFixed(1)} unit="kWh" tone="debit" icon={ArrowDownToLine} />
              <LedgerRow label="Exported to grid" value={consumption.ebExportUnits.toFixed(1)} unit="kWh" tone="credit" icon={ArrowUpFromLine} />
              {consumption.evUnits > 0 && (
                <LedgerRow label="EV charging" value={consumption.evUnits.toFixed(1)} unit="kWh" tone="debit" icon={PlugZap} />
              )}

              <LedgerDivider />

              <p className="text-xs uppercase tracking-widest text-muted-foreground mt-3 mb-1">Bill breakup</p>
              <LedgerRow label="Bill without solar" value={`₹${sav.billWithoutSolar.toLocaleString("en-IN")}`} muted />
              <LedgerRow label="Net-metering savings" value={`−₹${sav.savingsAmount.toLocaleString("en-IN")}`} tone="credit" muted />
              <LedgerRow
                label={
                  billSettled ? "EB bill (actual, settled)"
                  : isReconciled ? "EB bill (actual, total)"
                  : "EB bill (net units, estimated)"
                }
                value={`₹${electricityBill.amount.toLocaleString("en-IN")}`}
              />
              {networkCharge && (
                <>
                  <LedgerRow
                    label={`Networking charge (excl. GST)${
                      billSettled ? " (estimated)"
                      : isReconciled ? " (included above)"
                      : networkCharge.isEstimated ? " (projected)"
                      : ""
                    }`}
                    value={`₹${networkCharge.chargeBeforeGst.toLocaleString("en-IN")}`}
                    muted
                    indent
                    trailing={
                      <InfoToggle note="TANGEDCO's fee for using their distribution network to wheel your exported solar power onto the grid — separate from your net-metering bill above. Applies to every solar customer, every cycle." />
                    }
                  />
                  {/* TANGEDCO's own bill shows CGST/SGST as zero on this charge, so the
                      row only appears if a plan actually configures a GST percentage. */}
                  {networkCharge.gstAmount > 0 && (
                    <LedgerRow label="GST" value={`₹${networkCharge.gstAmount.toLocaleString("en-IN")}`} muted indent />
                  )}
                </>
              )}

              {energyWallet && (
                <>
                  <LedgerDivider />

                  <p className="text-xs uppercase tracking-widest text-muted-foreground mt-3 mb-1">Energy wallet</p>
                  <LedgerRow
                    label="Banked credit (carried in)"
                    value={energyWallet.balanceKwh.toFixed(1)}
                    unit="kWh"
                    icon={Zap}
                    trailing={<InfoToggle note="Surplus exported units banked from past cycles under 1:1 net metering — applied against future grid import before you're billed for it." />}
                  />
                  {Math.round(energyWallet.projectedBalanceKwh * 10) !== Math.round(energyWallet.balanceKwh * 10) && (
                    <LedgerRow
                      label="Projected balance (if cycle closed today)"
                      value={energyWallet.projectedBalanceKwh.toFixed(1)}
                      unit="kWh"
                      muted
                      indent
                      trailing={<InfoToggle note="Only becomes official once this cycle closes and the next one opens — not yet applied to your balance above." />}
                    />
                  )}
                </>
              )}

              {savings.data_quality.sources?.length ? (
                <>
                  <LedgerDivider />
                  <SourceCoverage sources={savings.data_quality.sources} />
                </>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
        <DataQualityDisclosure dataQuality={savings.data_quality} />
      </div>
    </GlassCard>
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
      <div className="h-96 rounded-xl bg-foreground/[0.04]" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => <div key={i} className="h-40 rounded-xl bg-foreground/[0.04]" />)}
      </div>
      <div className="h-64 rounded-xl bg-foreground/[0.04]" />
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
        const { electricityBill, consumption, investment } = savings;
        // Solar/import/export/EV are separate meter readings, not addends of
        // totalUnits anymore (that's the inverter's load figure now — see
        // the savings-formula change). Bars below are relative to each other,
        // not to the load total, so they need their own denominator.
        const meterTotal = consumption.solarUnits + consumption.ebImportUnits + consumption.evUnits;
        return (
    <motion.div key="content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-6">
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
            Your running solar ledger, cycle by cycle
          </p>
        </div>
        <StatusPill status={electricityBill.status} />
      </motion.div>

      {/* Passbook ledger — the hero */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08 }}>
        <PassbookLedger savings={savings} />
      </motion.div>

      {/* Investment recovery — secondary panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16 }}
          className="glass rounded-xl p-6 flex items-center gap-5"
          style={{
            background: "linear-gradient(135deg, color-mix(in srgb, var(--card) 90%, transparent) 0%, color-mix(in srgb, var(--card) 95%, var(--background) 5%) 100%)",
            border: "1px solid color-mix(in srgb, var(--primary) 12%, transparent)",
          }}
        >
          <PaybackRing pct={investment.paybackPercentage} />
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--primary) 20%, transparent)" }}>
                <IndianRupee size={16} className="text-emerald-400" />
              </div>
              <p className="text-sm text-muted-foreground">Investment recovered</p>
            </div>
            <p className="text-base">
              <span className="text-emerald-400 font-semibold" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                ₹{investment.savedAmount.toLocaleString("en-IN")}
              </span>
              {" "}of{" "}
              <span style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                ₹{investment.upfrontAmount.toLocaleString("en-IN")}
              </span>
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.22 }}
          className="glass rounded-xl p-6 flex flex-col justify-between"
          style={{
            background: "linear-gradient(135deg, color-mix(in srgb, var(--card) 90%, transparent) 0%, color-mix(in srgb, var(--card) 95%, var(--background) 5%) 100%)",
            border: "1px solid var(--border)",
          }}
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--secondary) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--secondary) 18%, transparent)" }}>
                <Calendar size={16} style={{ color: "var(--secondary)" }} />
              </div>
              <p className="text-sm text-muted-foreground">Break-even projection</p>
            </div>
            <p className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
              {investment.breakEvenDate}
            </p>
          </div>
          <div className="mt-4 pt-3 flex items-center justify-between text-sm" style={{ borderTop: "1px solid var(--border)" }}>
            <span className="text-muted-foreground">
              {investment.monthsToBreakEven.toLocaleString("en-IN")} months left
            </span>
            <span style={{ fontFamily: "var(--font-jetbrains-mono)", color: "color-mix(in srgb, var(--foreground) 60%, transparent)" }}>
              ₹{investment.remainingInvestment.toLocaleString("en-IN")} to go
            </span>
          </div>
        </motion.div>
      </div>

      {/* Energy breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <GlassCard>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={16} className="text-muted-foreground" />
            <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
              Energy breakdown
            </h2>
            <span className="text-sm text-muted-foreground ml-auto">
              {totalUnits.toFixed(1)} kWh household load
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-5">
            Household load is measured directly by the inverter — it&apos;s what your &quot;bill without solar&quot; estimate is based on. The meters below are shown for reference and don&apos;t sum to it.
          </p>
          <div className="space-y-5">
            <ConsumptionBar label="Solar Generated" value={consumption.solarUnits} total={meterTotal} color="var(--primary)" icon={Sun} />
            <ConsumptionBar label="Grid Import" value={consumption.ebImportUnits} total={meterTotal} color={COLORS.amber} icon={ArrowDownToLine} />
            <ConsumptionBar label="Grid Export" value={consumption.ebExportUnits} total={meterTotal} color="#60a5fa" icon={ArrowUpFromLine} />
            {consumption.evUnits > 0 && (
              <ConsumptionBar label="EV Charging" value={consumption.evUnits} total={meterTotal} color="#a78bfa" icon={PlugZap} />
            )}
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
        );
      })()}
    </AnimatePresence>
  );
}
