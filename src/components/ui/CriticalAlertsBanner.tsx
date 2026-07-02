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
          <div className="glass rounded-xl border border-red-500/30 bg-red-950/15 px-4 py-2.5 flex items-center gap-3 cursor-pointer hover:border-red-500/50 transition-colors duration-200 group">
            <motion.div
              animate={prefersReducedMotion ? {} : { opacity: [0.6, 1, 0.6] }}
              transition={prefersReducedMotion ? {} : { duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="flex-shrink-0"
            >
              <AlertTriangle size={16} className="text-red-400" strokeWidth={2.5} />
            </motion.div>

            <p className="text-base text-red-200 font-medium flex-1 min-w-0 truncate">
              <span className="font-bold">{criticalCount} critical alert{criticalCount !== 1 ? "s" : ""}</span>
              {offlineCount > 0 && (
                <span className="text-red-200/70">
                  {" "}· {offlineCount} device{offlineCount !== 1 ? "s" : ""} offline
                </span>
              )}
            </p>

            <span className="flex-shrink-0 flex items-center gap-1 text-sm font-medium text-red-300/80 group-hover:text-red-200">
              View details
              <ChevronRight size={13} />
            </span>

            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 rounded-md hover:bg-white/10 transition-colors duration-200"
              aria-label="Dismiss alert"
            >
              <X size={14} className="text-red-300/60" strokeWidth={2.5} />
            </button>
          </div>
        </Link>
      </motion.div>
    </AnimatePresence>
  );
};

export default CriticalAlertsBanner;
