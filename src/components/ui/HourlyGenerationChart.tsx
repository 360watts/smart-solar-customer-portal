"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const HOURS = ["6am", "7am", "8am", "9am", "10am", "11am", "12pm", "1pm", "2pm", "3pm", "4pm", "5pm", "6pm", "7pm", "8pm", "9pm", "10pm", "11pm"];
const DATA = [0, 0, 0, 0.1, 0.5, 1.4, 2.6, 3.6, 4.2, 4.1, 3.5, 2.2, 1.0, 0.4, 0.1, 0, 0, 0];
const MAX_VALUE = 4.8;

interface TooltipPos {
  x: number;
  y: number;
  hour: string;
  value: number;
}

export default function HourlyGenerationChart() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<TooltipPos | null>(null);

  const handleHover = (idx: number, e: React.MouseEvent) => {
    const bar = e.currentTarget as HTMLElement;
    const container = bar.closest(".relative") as HTMLElement;
    if (!container) return;

    const barRect = bar.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    setHoveredIndex(idx);
    setTooltipPos({
      x: barRect.left - containerRect.left + barRect.width / 2,
      y: barRect.top - containerRect.top - 8,
      hour: HOURS[idx],
      value: DATA[idx],
    });
  };

  return (
    <div className="relative overflow-visible">
      {/* Chart container */}
      <div className="flex items-end gap-1 h-24">
        {DATA.map((v, i) => {
          const isNow = i === 8;
          const isHovered = hoveredIndex === i;
          const hasValue = v > 0;
          return (
            <motion.button
              key={i}
              onMouseEnter={(e) => handleHover(i, e)}
              onMouseLeave={() => {
                setHoveredIndex(null);
                setTooltipPos(null);
              }}
              className={`flex-1 rounded-sm transition-all duration-150 cursor-pointer group relative ${
                isNow ? "bg-emerald-400" : isHovered ? "bg-emerald-400/60" : hasValue ? "bg-emerald-500/20 hover:bg-emerald-500/30" : "bg-emerald-500/5 hover:bg-emerald-500/12"
              }`}
              style={{
                height: hasValue ? `${(v / MAX_VALUE) * 100}%` : "3px",
                minHeight: "3px",
              }}
              initial={{ scaleY: 0, originY: "bottom" }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.3 + i * 0.04, type: "spring", stiffness: 300, damping: 20 }}
              whileHover={{ scaleY: hasValue ? 1.08 : 1.04 }}
            >
              {/* Inner glow on hover */}
              {isHovered && (
                <motion.div
                  className="absolute inset-0 bg-emerald-400/30 rounded-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Tooltip — anchored to container, scrolls with chart */}
      <AnimatePresence>
        {tooltipPos && hoveredIndex !== null && (
          <motion.div
            key={`tooltip-${hoveredIndex}`}
            initial={{ opacity: 0, y: 8, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 24, duration: 0.2 }}
            className="absolute z-50 pointer-events-none"
            style={{
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y}px`,
              transform: "translateX(-50%)",
            }}
          >
            {/* Tooltip pill — refined emerald aesthetic */}
            <div className="px-3.5 py-2.5 rounded-lg bg-gradient-to-br from-black/95 to-black/85 border border-emerald-500/70 backdrop-blur-xl"
              style={{
                boxShadow: "0 0 20px rgba(47,191,113,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
                whiteSpace: "nowrap",
              }}>
              <div className="text-sm font-bold text-emerald-300 font-mono leading-tight">
                {tooltipPos.value.toFixed(2)} kW
              </div>
              <div className="text-xs text-emerald-400/80 mt-1.5 font-medium opacity-90 tracking-wide">
                {tooltipPos.hour}
              </div>
            </div>

            {/* Pointer — animated, glowing accent */}
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-emerald-300/50"
              style={{
                top: "100%",
                marginTop: "-1px",
                boxShadow: "0 0 16px rgba(47,191,113,1), 0 0 28px rgba(47,191,113,0.5)",
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 600, damping: 28 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Time labels — every 3 hours for better readability */}
      <div className="flex justify-between mt-3 text-xs text-white/35 font-mono">
        {HOURS.map((hour, i) => (
          <span key={i} className={i % 3 === 0 ? "block text-white/45" : "invisible"}>
            {hour}
          </span>
        ))}
      </div>
    </div>
  );
}
