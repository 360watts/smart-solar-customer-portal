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
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  return (
    <Link href={hasCritical ? "/alerts?severity=critical" : "/alerts"} legacyBehavior={false}>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 28, delay: delay * 0.08 }}
        whileHover={{ y: -3, transition: { type: "spring", stiffness: 400, damping: 20 } }}
        className={`
          glass rounded-2xl p-5 cursor-pointer transition-all duration-300
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

        {/* Main content */}
        <div className="mb-4">
          <div className={`stat-number text-3xl mb-0.5 ${hasCritical ? "text-red-300" : "text-white"}`}>
            {loading ? "..." : total}
          </div>
          <p className={`text-xs mt-1 font-medium uppercase tracking-wider ${hasCritical ? "text-red-200" : "text-white/60"}`}>
            {total === 0 ? "No Active Alerts" : `Active Alert${total !== 1 ? "s" : ""}`}
          </p>
          {impact && (
            <p className="text-xs text-red-200/80 mt-2 font-semibold leading-snug">
              {impact}
            </p>
          )}
        </div>

        {/* Severity breakdown */}
        {!loading && total > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            {/* Critical */}
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/15">
              <div className="text-sm font-bold text-red-400">{counts.critical}</div>
              <div className="text-xs text-red-300/70 mt-0.5">Critical</div>
            </div>

            {/* Warning */}
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/15">
              <div className="text-sm font-bold text-amber-400">{counts.warning}</div>
              <div className="text-xs text-amber-300/70 mt-0.5">Warning</div>
            </div>

            {/* Info */}
            <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/15">
              <div className="text-sm font-bold text-blue-400">{counts.info}</div>
              <div className="text-xs text-blue-300/70 mt-0.5">Info</div>
            </div>
          </div>
        )}

        {/* CTA Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <span className="text-xs text-white/50 font-medium">
            {hasCritical ? "Review critical alerts" : "View all alerts"}
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
