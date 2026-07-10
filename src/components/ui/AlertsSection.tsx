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
        className="glass rounded-2xl p-5 cursor-pointer transition-all duration-300 h-full min-h-62 flex flex-col"
        style={
          hasCritical
            ? {
                borderColor: `color-mix(in srgb, var(--destructive) ${hasMultipleCritical ? 50 : 30}%, transparent)`,
                background: hasMultipleCritical
                  ? `linear-gradient(to bottom right, color-mix(in srgb, var(--destructive) 12%, transparent), transparent)`
                  : undefined,
              }
            : undefined
        }
      >
        {/* Header: Title + Badge */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: hasCritical ? "color-mix(in srgb, var(--destructive) 20%, transparent)" : "color-mix(in srgb, var(--foreground) 8%, transparent)" }}
          >
            <AlertTriangle
              size={18}
              style={{ color: hasCritical ? "var(--destructive)" : "var(--muted-foreground)" }}
            />
          </div>

          {/* Critical badge with pulse animation */}
          {hasCritical && (
            <motion.div
              animate={prefersReducedMotion ? {} : { opacity: [1, 0.7, 1] }}
              transition={prefersReducedMotion ? {} : { duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="px-3 py-1.5 rounded-full text-sm font-bold"
              style={{ background: "var(--destructive)", color: "#ffffff", boxShadow: "0 8px 20px color-mix(in srgb, var(--destructive) 30%, transparent)" }}
            >
              {counts.critical} Critical
            </motion.div>
          )}
        </div>

        <div className="mb-3">
          <div className="stat-number text-3xl mb-0.5" style={{ color: hasCritical ? "var(--destructive)" : "var(--foreground)" }}>
            {loading ? "..." : total}
          </div>
          <p className="text-sm mt-1 font-medium uppercase tracking-wider" style={{ color: hasCritical ? "var(--destructive)" : "var(--muted-foreground)" }}>
            {total === 0 ? "No Active Alerts" : `Active Alert${total !== 1 ? "s" : ""}`}
          </p>
        </div>

        {!loading && (
          <>
            <div className="mb-3">
              <div className="h-1.5 rounded-full bg-foreground/5 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: hasCritical ? "var(--destructive)" : counts.warning > 0 ? "var(--secondary)" : "var(--primary)",
                    boxShadow: hasCritical
                      ? "0 0 6px color-mix(in srgb, var(--destructive) 55%, transparent)"
                      : counts.warning > 0
                        ? "0 0 6px color-mix(in srgb, var(--secondary) 45%, transparent)"
                        : "0 0 6px color-mix(in srgb, var(--primary) 45%, transparent)",
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${severityPct}%` }}
                  transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-xs text-muted-foreground">Alert severity</span>
                <span
                  className="text-xs font-semibold"
                  style={{ color: hasCritical ? "var(--destructive)" : counts.warning > 0 ? "var(--secondary)" : "var(--primary)" }}
                >
                  {severityLabel}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div
                className="p-2.5 rounded-lg"
                style={{ background: "color-mix(in srgb, var(--destructive) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--destructive) 18%, transparent)" }}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: "var(--destructive)", boxShadow: "0 0 5px color-mix(in srgb, var(--destructive) 55%, transparent)" }}
                  />
                  <span className="text-xs truncate" style={{ color: "var(--destructive)" }}>Critical</span>
                </div>
                <span className="text-sm font-bold tabular-nums" style={{ color: "var(--destructive)" }}>{counts.critical}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-foreground/[0.03] border border-border">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: "var(--secondary)", boxShadow: "0 0 5px color-mix(in srgb, var(--secondary) 45%, transparent)" }}
                  />
                  <span className="text-xs text-muted-foreground truncate">Warn / Info</span>
                </div>
                <span className="text-sm font-bold text-foreground tabular-nums">{counts.warning} / {counts.info}</span>
              </div>
            </div>
          </>
        )}

        {/* CTA Footer */}
        <div
          className="mt-auto flex min-h-12 items-center justify-between gap-2 rounded-lg border border-border px-2.5 py-2"
          style={
            hasCritical
              ? { borderColor: "color-mix(in srgb, var(--destructive) 18%, transparent)", background: "color-mix(in srgb, var(--destructive) 8%, transparent)" }
              : undefined
          }
        >
          <span className="text-xs font-medium leading-snug" style={{ color: hasCritical ? "var(--foreground)" : "var(--muted-foreground)" }}>
            {footerText}
          </span>
          <motion.div
            animate={prefersReducedMotion ? {} : { x: hasCritical ? [0, 3, 0] : 0 }}
            transition={prefersReducedMotion ? {} : { duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ArrowRight size={14} style={{ color: hasCritical ? "var(--destructive)" : "var(--muted-foreground)" }} />
          </motion.div>
        </div>
      </motion.div>
    </Link>
  );
};

export default AlertsSection;
