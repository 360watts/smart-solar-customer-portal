"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Wifi, WifiOff, ChevronDown } from "lucide-react";

interface Device {
  serial: string;
  label?: string;
  device_type?: string;
  status: "online" | "offline";
  last_seen?: string;
  alert_count: number;
}

interface DeviceStatusSectionProps {
  devices: Device[];
  expanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
}

/**
 * Device Status Section
 * Replaces "System online" pill with detailed device status.
 *
 * UX Focus:
 * - No false positives: an empty/unknown device list must never read as "online".
 * - No hiding bad news: when any device is offline, the breakdown is shown
 *   immediately — no click required. The collapse/expand toggle only exists
 *   for the all-online happy path, where hiding detail reduces clutter.
 */
export const DeviceStatusSection: React.FC<DeviceStatusSectionProps> = ({
  devices,
  expanded: initialExpanded = false,
  onExpandChange,
}) => {
  const [expanded, setExpanded] = useState(initialExpanded);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  const handleToggle = () => {
    const newState = !expanded;
    setExpanded(newState);
    onExpandChange?.(newState);
  };

  const hasData = devices.length > 0;
  const offlineCount = devices.filter((d) => d.status === "offline").length;
  const allOnline = hasData && offlineCount === 0;
  const allOffline = hasData && offlineCount === devices.length;
  // An outage is never hidden behind a click — force the detail open.
  const hasIssue = hasData && offlineCount > 0;
  const isOpen = hasIssue || expanded;

  const getStatusLabel = () => {
    if (!hasData) return "Device status unavailable";
    if (allOnline) return "All systems online";
    if (allOffline) return `All devices offline (${devices.length})`;
    return `${offlineCount}/${devices.length} devices offline`;
  };

  const getStatusColor = () => {
    if (!hasData) return "text-muted-foreground";
    if (allOnline) return "text-emerald-400";
    if (allOffline) return "text-red-400";
    return "text-amber-400";
  };

  const getStatusBg = () => {
    if (!hasData) return "bg-white/5 border-border";
    if (allOnline) return "bg-emerald-500/10 border-emerald-500/20";
    if (allOffline) return "bg-red-500/10 border-red-500/25";
    return "bg-amber-500/10 border-amber-500/20";
  };

  const StatusIcon = allOnline ? Wifi : WifiOff;

  const header = (
    <div className="flex items-center gap-2.5 flex-1 min-w-0">
      <motion.div
        animate={
          prefersReducedMotion || !hasData
            ? {}
            : allOnline
              ? { scale: [1, 1.05, 1] }
              : { opacity: [1, 0.6, 1] }
        }
        transition={prefersReducedMotion ? {} : { duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="flex-shrink-0"
      >
        <StatusIcon size={16} className={getStatusColor()} strokeWidth={2} />
      </motion.div>

      <div className="flex-1 min-w-0 text-left">
        <p className={`text-base font-semibold ${getStatusColor()}`}>{getStatusLabel()}</p>
        {hasData && (
          <p className="text-sm text-muted-foreground mt-0.5">
            {devices.length} device{devices.length !== 1 ? "s" : ""} monitored
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-0">
      {/* Main status pill — only clickable when there's nothing urgent to hide */}
      {hasIssue ? (
        <div className={`flex items-center justify-between gap-2 px-4 py-3 rounded-xl border ${getStatusBg()}`}>
          {header}
        </div>
      ) : (
        <button
          onClick={handleToggle}
          className={`
            flex items-center justify-between gap-2 px-4 py-3 rounded-xl
            border transition-all duration-200 cursor-pointer
            ${getStatusBg()}
            hover:border-opacity-100 active:scale-95
          `}
        >
          {header}
          {hasData && (
            <motion.div
              animate={prefersReducedMotion ? {} : { rotate: expanded ? 180 : 0 }}
              transition={prefersReducedMotion ? {} : { duration: 0.3, ease: "easeOut" }}
              className="flex-shrink-0"
            >
              <ChevronDown size={14} className="text-muted-foreground" strokeWidth={2.5} />
            </motion.div>
          )}
        </button>
      )}

      {/* Expanded details */}
      <motion.div
        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
        animate={
          isOpen
            ? { opacity: 1, height: "auto" }
            : prefersReducedMotion
              ? { opacity: 0 }
              : { opacity: 0, height: 0 }
        }
        transition={prefersReducedMotion ? { duration: 0.2 } : { duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div className="border-t border-border pt-0">
          {devices.map((device, idx) => {
            const isOnline = device.status === "online";
            const bgColor = isOnline ? "bg-emerald-500/10" : "bg-red-500/10";
            const borderColor = isOnline ? "border-emerald-500/20" : "border-red-500/25";
            const textColor = isOnline ? "text-emerald-300" : "text-red-300";

            return (
              <motion.div
                key={device.serial}
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0.2 }
                    : { type: "spring", stiffness: 300, damping: 25, delay: idx * 0.05 }
                }
                className={`
                  flex items-center justify-between gap-3 px-4 py-3 mt-2
                  rounded-lg border ${bgColor} ${borderColor}
                  transition-all duration-200 hover:border-opacity-100
                `}
              >
                {/* Device info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={
                        prefersReducedMotion
                          ? {}
                          : !isOnline
                            ? { opacity: [0.4, 1, 0.4] }
                            : {}
                      }
                      transition={prefersReducedMotion ? {} : { duration: 2, repeat: Infinity }}
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: isOnline ? "#10b981" : "#ef4444" }}
                    />
                    <p className={`text-sm font-semibold ${textColor}`}>{device.label ?? device.serial}</p>
                  </div>
                  {device.label && (
                    <p className={`text-sm mt-1 font-mono ${isOnline ? "text-emerald-200/50" : "text-red-200/50"}`}>
                      {device.serial}
                    </p>
                  )}
                  <p className={`text-sm mt-1 ${isOnline ? "text-emerald-200/60" : "text-red-200/60"}`}>
                    {isOnline ? "Connected" : "Disconnected"}
                  </p>
                </div>

                {/* Alert indicator */}
                {device.alert_count > 0 && (
                  <div className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-border">
                    <AlertTriangle size={12} className="text-amber-400" />
                    <span className="text-sm font-semibold text-foreground">{device.alert_count}</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default DeviceStatusSection;
