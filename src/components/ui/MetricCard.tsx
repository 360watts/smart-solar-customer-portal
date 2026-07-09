"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUp, ArrowDown, Minus, LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: {
    direction: "up" | "down" | "neutral";
    value: string;
  };
  suffix?: string;
  delay?: number;
}

export default function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  suffix = "",
  delay = 0,
}: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  // "fresh reading" pulse — flares once per value change, not on first mount,
  // so it reads as "new data just landed" rather than a generic load animation
  const [pulseKey, setPulseKey] = useState(0);
  const mounted = React.useRef(false);

  useEffect(() => {
    if (typeof value === "number") {
      const start = performance.now();
      const numValue = value;
      const duration = 1200;

      const animate = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(Math.floor(numValue * easeOut));

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      const id = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(id);
    }
  }, [value]);

  useEffect(() => {
    if (mounted.current) {
      setPulseKey((k) => k + 1);
    } else {
      mounted.current = true;
    }
  }, [value]);

  const trendIcon =
    trend?.direction === "up"
      ? ArrowUp
      : trend?.direction === "down"
        ? ArrowDown
        : Minus;
  const TrendIcon = trendIcon;

  const trendColor =
    trend?.direction === "up"
      ? "text-green-500"
      : trend?.direction === "down"
        ? "text-red-500"
        : "text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        delay: delay * 0.07,
      }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="glass-green rounded-xl p-6 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="eyebrow mb-2 flex items-center gap-1.5">
            {title}
            {/* live dot: pings once whenever a fresh reading lands */}
            <span className="relative inline-flex w-1.5 h-1.5">
              <motion.span
                key={pulseKey}
                className="absolute inline-flex w-full h-full rounded-full bg-emerald-400"
                initial={{ opacity: 0.7, scale: 1 }}
                animate={{ opacity: 0, scale: 2.6 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
              <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-emerald-400/70" />
            </span>
          </p>
          <div className="flex items-baseline gap-2">
            {/* stat-number = display face + tabular figures, so digits don't
                jitter horizontally during the count-up animation. Color
                flares emerald on a fresh value, then settles back. */}
            <motion.span
              key={pulseKey}
              initial={{ color: "#2FBF71" }}
              animate={{ color: "var(--foreground)" }}
              transition={{ duration: 1.1, ease: "easeOut" }}
              className="stat-number text-3xl"
            >
              {typeof value === "number" ? displayValue : value}
              {suffix && <span className="text-lg font-semibold text-muted-foreground ml-1">{suffix}</span>}
            </motion.span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
          <Icon className="text-primary" size={24} />
        </div>
      </div>

      {trend && (
        <div className={`flex items-center gap-1 text-base ${trendColor}`}>
          <TrendIcon size={16} />
          <span>{trend.value}</span>
        </div>
      )}
    </motion.div>
  );
}
