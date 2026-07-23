"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ChevronRight, X } from "lucide-react";

interface OfflineDevice {
  serial: string;
  last_seen?: string;
  alert_count: number;
}

interface CriticalAlertsBannerProps {
  criticalCount: number;
  offlineDevices: OfflineDevice[];
  onDismiss?: () => void;
}

/**
 * Critical Alerts Banner — minimal one-line strip.
 * Full alert detail lives on the Alerts page; this only needs to say
 * "something's wrong" and point there, not repeat the breakdown.
 */
export const CriticalAlertsBanner: React.FC<CriticalAlertsBannerProps> = ({
  criticalCount,
  offlineDevices,
  onDismiss,
}) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Client-only value (matchMedia unavailable during SSR) — must run post-hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrefersReducedMotion(mq.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  if (!criticalCount || dismissed) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDismissed(true);
    onDismiss?.();
  };

  const offlineCount = offlineDevices.length;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="critical-banner"
        initial={prefersReducedMotion ? { opacity: 0 } : { y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={prefersReducedMotion ? { opacity: 0 } : { y: -12, opacity: 0 }}
        transition={prefersReducedMotion ? { duration: 0.2 } : { type: "spring", stiffness: 300, damping: 30 }}
        className="w-full"
      >
        <Link href="/alerts?severity=critical" legacyBehavior={false}>
          <div
            className="rounded-xl px-4 py-2.5 flex items-center gap-3 cursor-pointer transition-colors duration-200 group backdrop-blur-xl"
            style={{
              background: "color-mix(in srgb, var(--destructive) 10%, var(--card) 90%)",
              border: "1px solid color-mix(in srgb, var(--destructive) 35%, transparent)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "color-mix(in srgb, var(--destructive) 55%, transparent)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "color-mix(in srgb, var(--destructive) 35%, transparent)")}
          >
            <motion.div
              animate={prefersReducedMotion ? {} : { opacity: [0.6, 1, 0.6] }}
              transition={prefersReducedMotion ? {} : { duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="shrink-0"
            >
              <AlertTriangle size={16} style={{ color: "var(--destructive)" }} strokeWidth={2.5} />
            </motion.div>

            <p className="text-base font-medium flex-1 min-w-0 truncate" style={{ color: "var(--foreground)" }}>
              <span className="font-bold" style={{ color: "var(--destructive)" }}>
                {criticalCount} critical alert{criticalCount !== 1 ? "s" : ""}
              </span>
              {offlineCount > 0 && (
                <span style={{ color: "var(--muted-foreground)" }}>
                  {" "}· {offlineCount} device{offlineCount !== 1 ? "s" : ""} offline
                </span>
              )}
            </p>

            <span
              className="shrink-0 flex items-center gap-1 text-sm font-medium transition-colors"
              style={{ color: "var(--destructive)" }}
            >
              View details
              <ChevronRight size={13} />
            </span>

            <button
              onClick={handleDismiss}
              className="shrink-0 p-1 rounded-md transition-colors duration-200"
              aria-label="Dismiss alert"
              onMouseEnter={(e) => (e.currentTarget.style.background = "color-mix(in srgb, var(--foreground) 8%, transparent)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <X size={14} style={{ color: "var(--muted-foreground)" }} strokeWidth={2.5} />
            </button>
          </div>
        </Link>
      </motion.div>
    </AnimatePresence>
  );
};

export default CriticalAlertsBanner;
