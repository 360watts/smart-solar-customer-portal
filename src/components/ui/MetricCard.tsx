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
        delay: delay * 0.1,
      }}
      whileHover={{ y: -4 }}
      className="glass-green rounded-xl p-6 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground font-display">
              {typeof value === "number" ? displayValue : value}
              {suffix}
            </span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
          <Icon className="text-primary" size={24} />
        </div>
      </div>

      {trend && (
        <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
          <TrendIcon size={16} />
          <span>{trend.value}</span>
        </div>
      )}
    </motion.div>
  );
}
