"use client";

import React, { useEffect } from "react";
import { motion, useSpring, useTransform, AnimatePresence } from "framer-motion";
import {
  Zap, Info, Calendar,
  Sun, PlugZap, ArrowDownToLine, ArrowUpFromLine,
  type LucideIcon,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { portalApi, SavingsData, DataQuality, MeasurementSource } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteQuery } from "@/lib/hooks/useSiteQuery";
import { TTL } from "@/lib/portalCache";
import { COLORS } from "@/lib/tokens";
import { getConfidenceTier, variancePercent } from "@/lib/billConfidence";

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
                className="mt-1 h-0.75 w-full overflow-hidden"
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
  const { electricityBill, consumption, savings: sav, networkCharge, energyWallet, investment } = savings;
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
    <GlassCard glow="green" className="p-0 overflow-hidden">
      {/* Perforated header strip, ticket-stub style — spans the full spread */}
      <div
        className="flex items-center justify-between px-6 py-4"
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

      {/* Open-book spread: left leaf (the stamp) · stitched spine · right leaf (the ledger, always open) */}
      <div className="grid lg:grid-cols-[1fr_auto_1.35fr] items-stretch">
        {/* ── Left leaf ─────────────────────────────────────────────────── */}
        <div className="p-6 flex flex-col">
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

          <div className="mt-3">
            <ConfidenceStamp dataQuality={savings.data_quality} />
          </div>

          {summaryLine && (
            <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{summaryLine}</p>
          )}

          {/* Energy wallet — moved up from the ledger leaf: the stamp leaf is
              where "what's mine, banked" belongs, next to the total payable
              it offsets, not buried under the itemized breakdown. */}
          {energyWallet && (() => {
            const delta = energyWallet.projectedBalanceKwh - energyWallet.balanceKwh;
            const willChange = Math.round(delta * 10) !== 0;
            return (
              <div className="mt-6 pt-5" style={{ borderTop: "1px dashed var(--border)" }}>
                <div className="flex items-center gap-1.5 mb-3">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Energy wallet</p>
                  <InfoToggle note={
                    willChange
                      ? "Surplus exported units banked from past cycles under 1:1 net metering, applied against future grid import before you're billed for it. The projected figure only posts once your NEXT cycle also closes — TANGEDCO bills two months at a time in arrears, so this passbook shows one cycle behind the calendar until then."
                      : "Surplus exported units banked from past cycles under 1:1 net metering — applied against future grid import before you're billed for it."
                  } />
                </div>

                {/* Deposit-stub styling: dashed left edge like a torn passbook
                    counterfoil, credit-toned like every banked-kWh row in the ledger. */}
                <div
                  className="rounded-lg p-4 flex items-center gap-4"
                  style={{
                    borderLeft: "3px dashed color-mix(in srgb, var(--primary) 45%, transparent)",
                    background: "color-mix(in srgb, var(--primary) 5%, transparent)",
                  }}
                >
                  <Zap size={18} style={{ color: "var(--primary)" }} className="shrink-0" />
                  <div className="flex items-center gap-3 flex-wrap">
                    <div>
                      <p
                        className="text-2xl font-bold leading-none"
                        style={{ fontFamily: "var(--font-jetbrains-mono)", color: "var(--primary)" }}
                      >
                        {energyWallet.balanceKwh.toFixed(1)}
                        <span className="text-sm font-normal text-muted-foreground ml-1">kWh</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">carried into this cycle</p>
                    </div>

                    {willChange && (
                      <>
                        <span className="text-muted-foreground" aria-hidden>→</span>
                        <div>
                          <p
                            className="text-2xl font-bold leading-none"
                            style={{ fontFamily: "var(--font-jetbrains-mono)", color: "var(--foreground)" }}
                          >
                            {energyWallet.projectedBalanceKwh.toFixed(1)}
                            <span className="text-sm font-normal text-muted-foreground ml-1">kWh</span>
                          </p>
                          <p className="text-xs mt-1" style={{ color: delta > 0 ? "var(--primary)" : "var(--destructive)" }}>
                            {delta > 0 ? "+" : ""}{delta.toFixed(1)} projected — posts after next cycle closes
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Break-even card — fills the leaf's remaining height so the left
              page isn't left visibly shorter than the ledger opposite it. */}
          <div
            className="mt-6 flex-1 flex flex-col justify-center rounded-lg p-5"
            style={{
              border: "1px dashed var(--border)",
              background: "color-mix(in srgb, var(--secondary) 5%, transparent)",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={15} style={{ color: "var(--secondary)" }} />
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Break-even projection</p>
            </div>
            <p className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
              {investment.breakEvenDate}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {investment.monthsToBreakEven.toLocaleString("en-IN")} months left on the runway
            </p>

            {/* Runway — a ruled progress line, not a generic bar, echoing the
                dashed dividers used throughout the rest of the ledger. */}
            <div className="mt-5">
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "color-mix(in srgb, var(--foreground) 8%, transparent)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, var(--secondary), var(--primary))" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(investment.paybackPercentage, 100)}%` }}
                  transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.4 }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>Installed</span>
                <span style={{ fontFamily: "var(--font-jetbrains-mono)" }}>{investment.paybackPercentage.toFixed(1)}% recovered</span>
                <span>Break-even</span>
              </div>
            </div>

            <div className="mt-5 pt-4 grid grid-cols-2 gap-4 text-sm" style={{ borderTop: "1px dashed var(--border)" }}>
              <div>
                <p className="text-muted-foreground">Saved so far</p>
                <p style={{ fontFamily: "var(--font-jetbrains-mono)", fontWeight: 600, color: "var(--primary)" }}>
                  ₹{investment.savedAmount.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground">Remaining to recover</p>
                <p style={{ fontFamily: "var(--font-jetbrains-mono)", fontWeight: 600 }}>
                  ₹{investment.remainingInvestment.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stitched spine — the book's gutter ───────────────────────────── */}
        <div className="hidden lg:block relative" style={{ borderLeft: "1.5px dashed var(--border)" }}>
          <div
            aria-hidden
            className="absolute inset-y-0"
            style={{
              left: "-24px", right: "-24px",
              background: "linear-gradient(to right, transparent, color-mix(in srgb, var(--background) 45%, transparent) 50%, transparent)",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* ── Right leaf: the ledger — always open, this is the trust surface ── */}
        <div className="p-6 border-t lg:border-t-0" style={{ borderColor: "var(--border)", borderStyle: "dashed" }}>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Energy this cycle</p>
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

          {savings.data_quality.sources?.length ? (
            <>
              <LedgerDivider />
              <SourceCoverage sources={savings.data_quality.sources} />
            </>
          ) : null}
        </div>
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
      <div className="h-8 w-48 rounded-lg bg-foreground/5" />
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
        const { electricityBill } = savings;
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

      {/* Passbook ledger — the hero, and the whole page now: total payable,
          confidence stamp, and investment recovery on the left leaf; the
          full itemized ledger always open on the right. Nothing material
          left to say twice in a card below it. */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08 }}>
        <PassbookLedger savings={savings} />
      </motion.div>
    </motion.div>
        );
      })()}
    </AnimatePresence>
  );
}
