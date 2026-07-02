"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight } from "lucide-react";

interface AlertsCounts {
  critical: number;
  warning: number;
  info: number;
}

interface AlertsSectionProps {
  counts: AlertsCounts;
  loading?: boolean;
  delay?: number;
  impact?: string; // e.g., "CRITICAL: Both devices offline"
}

/**
 * Premium alerts section with severity breakdown and pulsing critical state.
 * Solar Noir aesthetic: glass morphism + gradient accents + spring physics.
 * Accessibility: respects prefers-reduced-motion for animations.
 */
export const AlertsSection: React.FC<AlertsSectionProps> = ({
  counts,
  loading = false,
  delay = 0,
  impact,
}) => {
  const total = counts.critical + counts.warning + counts.info;
  const hasCritical = counts.critical > 0;
  const hasMultipleCritical = counts.critical > 2;
  const severityPct = total > 0 ? Math.min(100, Math.round(((counts.critical * 3 + counts.warning * 2 + counts.info) / (total * 3)) * 100)) : 0;
  const severityLabel =
    hasCritical ? "Critical" :
    counts.warning > 0 ? "Watch" :
    total > 0 ? "Info" :
    "Clear";
  const footerText = impact ?? (hasCritical ? "Critical issues need attention now." : total > 0 ? "Non-critical alerts are available to review." : "All monitored devices are reporting normally.");
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  return (
    <Link href={hasCritical ? "/alerts?severity=critical" : "/alerts"} legacyBehavior={false} className="block h-full">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 28, delay: delay * 0.08 }}
        whileHover={{ y: -3, transition: { type: "spring", stiffness: 400, damping: 20 } }}
        className={`
          glass rounded-2xl p-5 cursor-pointer transition-all duration-300 h-full min-h-[248px] flex flex-col
          ${
            hasMultipleCritical
              ? "border-red-500/50 hover:border-red-500/70 bg-gradient-to-br from-red-950/15 to-transparent"
              : hasCritical
                ? "border-red-500/30 hover:border-red-500/50"
                : "border-white/10 hover:border-white/20"
          }
        `}
      >
        {/* Header: Title + Badge */}
        <div className="flex items-start justify-between mb-4">
          <div
            className={`
              w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
              ${
                hasCritical
                  ? "bg-red-500/20"
                  : "bg-white/10"
              }
            `}
          >
            <AlertTriangle
              size={18}
              className={hasCritical ? "text-red-400" : "text-white/40"}
            />
          </div>

          {/* Critical badge with pulse animation */}
          {hasCritical && (
            <motion.div
              animate={prefersReducedMotion ? {} : { opacity: [1, 0.7, 1] }}
              transition={prefersReducedMotion ? {} : { duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="px-3 py-1.5 rounded-full text-xs font-bold bg-red-500/90 text-white
                shadow-lg shadow-red-500/30"
            >
              {counts.critical} Critical
            </motion.div>
          )}
        </div>

        <div className="mb-3">
          <div className={`stat-number text-3xl mb-0.5 ${hasCritical ? "text-red-300" : "text-white"}`}>
            {loading ? "..." : total}
          </div>
          <p className={`text-xs mt-1 font-medium uppercase tracking-wider ${hasCritical ? "text-red-200" : "text-white/60"}`}>
            {total === 0 ? "No Active Alerts" : `Active Alert${total !== 1 ? "s" : ""}`}
          </p>
        </div>

        {!loading && (
          <>
            <div className="mb-3">
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${hasCritical ? "bg-red-400" : counts.warning > 0 ? "bg-amber-400" : "bg-emerald-400"}`}
                  style={{ boxShadow: hasCritical ? "0 0 6px rgba(248,113,113,0.55)" : counts.warning > 0 ? "0 0 6px rgba(251,191,36,0.45)" : "0 0 6px rgba(52,211,153,0.45)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${severityPct}%` }}
                  transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-white/45">Alert severity</span>
                <span className={`text-[10px] font-semibold ${hasCritical ? "text-red-300" : counts.warning > 0 ? "text-amber-300" : "text-emerald-300"}`}>{severityLabel}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/15">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_5px_rgba(248,113,113,0.55)] shrink-0" />
                  <span className="text-[10px] text-red-200/70 truncate">Critical</span>
                </div>
                <span className="text-xs font-bold text-red-300 tabular-nums">{counts.critical}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.45)] shrink-0" />
                  <span className="text-[10px] text-white/50 truncate">Warn / Info</span>
                </div>
                <span className="text-xs font-bold text-white/85 tabular-nums">{counts.warning} / {counts.info}</span>
              </div>
            </div>
          </>
        )}

        {/* CTA Footer */}
        <div className={`mt-auto flex min-h-[48px] items-center justify-between gap-2 rounded-lg border px-2.5 py-2 ${hasCritical ? "border-red-500/15 bg-red-500/[0.08]" : "border-white/[0.06] bg-white/[0.035]"}`}>
          <span className={`text-[11px] font-medium leading-snug ${hasCritical ? "text-red-100/85" : "text-white/62"}`}>
            {footerText}
          </span>
          <motion.div
            animate={prefersReducedMotion ? {} : { x: hasCritical ? [0, 3, 0] : 0 }}
            transition={prefersReducedMotion ? {} : { duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ArrowRight
              size={14}
              className={hasCritical ? "text-red-400/70" : "text-white/40"}
            />
          </motion.div>
        </div>
      </motion.div>
    </Link>
  );
};

export default AlertsSection;
