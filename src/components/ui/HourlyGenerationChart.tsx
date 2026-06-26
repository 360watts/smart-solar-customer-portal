"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const HOURS = ["6am","7am","8am","9am","10am","11am","12pm","1pm","2pm","3pm","4pm","5pm","6pm","7pm","8pm","9pm","10pm","11pm"];

const SOLAR = [0, 0, 0, 0.1, 0.5, 1.4, 2.6, 3.6, 4.2, 4.1, 3.5, 2.2, 1.0, 0.4, 0.1, 0, 0, 0];
const LOAD  = [0.6, 0.5, 0.4, 0.5, 0.8, 1.2, 1.8, 2.1, 2.4, 2.3, 2.0, 1.9, 2.2, 2.5, 2.8, 3.1, 2.6, 1.4];
// Positive = importing from grid, Negative = exporting to grid
const GRID  = LOAD.map((l, i) => parseFloat((l - SOLAR[i]).toFixed(2)));

const MAX_VALUE = 4.8;

const SERIES = [
  { key: "solar", label: "Solar",  color: "#2FBF71", dimColor: "rgba(47,191,113,0.18)",  hoverColor: "rgba(47,191,113,0.65)"  },
  { key: "load",  label: "Load",   color: "#60a5fa", dimColor: "rgba(96,165,250,0.18)",  hoverColor: "rgba(96,165,250,0.65)"  },
  { key: "grid",  label: "Grid",   color: "#E9B949", dimColor: "rgba(233,185,73,0.18)",  hoverColor: "rgba(233,185,73,0.65)"  },
] as const;

// Grid export (negative) shown in teal
const GRID_EXPORT_COLOR     = "#2dd4bf";
const GRID_EXPORT_DIM       = "rgba(45,212,191,0.18)";
const GRID_EXPORT_HOVER     = "rgba(45,212,191,0.65)";

interface TooltipState {
  hour: string;
  solar: number;
  load: number;
  grid: number;
}

export default function HourlyGenerationChart() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const handleHover = (idx: number) => {
    setHoveredIndex(idx);
    setTooltip({
      hour:  HOURS[idx],
      solar: SOLAR[idx],
      load:  LOAD[idx],
      grid:  GRID[idx],
    });
  };

  const isNow = 8; // 2pm slot as "current"

  return (
    <div className="chart-root relative overflow-visible">

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4">
        {SERIES.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.key === "grid" ? s.color : s.color, boxShadow: `0 0 6px ${s.color}` }} />
            <span className="text-[10px] font-medium tracking-wider uppercase font-mono" style={{ color: s.color, opacity: 0.85 }}>
              {s.label}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: GRID_EXPORT_COLOR, boxShadow: `0 0 6px ${GRID_EXPORT_COLOR}` }} />
          <span className="text-[10px] font-medium tracking-wider uppercase font-mono" style={{ color: GRID_EXPORT_COLOR, opacity: 0.85 }}>
            Export
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex items-end gap-0.5 h-32">
        {HOURS.map((hour, i) => {
          const solar = SOLAR[i];
          const load  = LOAD[i];
          const grid  = GRID[i];
          const isExport = grid < 0;
          const gridAbs  = Math.abs(grid);
          const hovered  = hoveredIndex === i;
          const active   = i === isNow;

          return (
            <motion.div
              key={i}
              className="flex-1 flex items-end gap-px cursor-crosshair group"
              style={{ height: "100%" }}
              onMouseEnter={() => handleHover(i)}
              onMouseLeave={() => { setHoveredIndex(null); setTooltip(null); }}
            >
              {/* Solar bar */}
              <motion.div
                className="flex-1 rounded-t-[2px]"
                style={{
                  height: solar > 0 ? `${(solar / MAX_VALUE) * 100}%` : "2px",
                  minHeight: "2px",
                  background: active
                    ? SERIES[0].color
                    : hovered
                    ? SERIES[0].hoverColor
                    : SERIES[0].dimColor,
                  boxShadow: (active || hovered) ? `0 0 8px ${SERIES[0].color}88` : "none",
                  transition: "background 0.15s, box-shadow 0.15s",
                }}
                initial={{ scaleY: 0, originY: "100%" }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.3 + i * 0.035, type: "spring", stiffness: 320, damping: 22 }}
              />

              {/* Load bar */}
              <motion.div
                className="flex-1 rounded-t-[2px]"
                style={{
                  height: `${(load / MAX_VALUE) * 100}%`,
                  minHeight: "2px",
                  background: active
                    ? SERIES[1].color
                    : hovered
                    ? SERIES[1].hoverColor
                    : SERIES[1].dimColor,
                  boxShadow: (active || hovered) ? `0 0 8px ${SERIES[1].color}88` : "none",
                  transition: "background 0.15s, box-shadow 0.15s",
                }}
                initial={{ scaleY: 0, originY: "100%" }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.35 + i * 0.035, type: "spring", stiffness: 320, damping: 22 }}
              />

              {/* Grid bar — amber = import, teal = export */}
              <motion.div
                className="flex-1 rounded-t-[2px]"
                style={{
                  height: gridAbs > 0 ? `${(gridAbs / MAX_VALUE) * 100}%` : "2px",
                  minHeight: "2px",
                  background: active
                    ? (isExport ? GRID_EXPORT_COLOR : SERIES[2].color)
                    : hovered
                    ? (isExport ? GRID_EXPORT_HOVER : SERIES[2].hoverColor)
                    : (isExport ? GRID_EXPORT_DIM   : SERIES[2].dimColor),
                  boxShadow: (active || hovered)
                    ? `0 0 8px ${isExport ? GRID_EXPORT_COLOR : SERIES[2].color}88`
                    : "none",
                  transition: "background 0.15s, box-shadow 0.15s",
                }}
                initial={{ scaleY: 0, originY: "100%" }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.4 + i * 0.035, type: "spring", stiffness: 320, damping: 22 }}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Tooltip — static top-right of chart */}
      <AnimatePresence>
        {tooltip && hoveredIndex !== null && (
          <motion.div
            key="chart-tooltip"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
            className="absolute top-0 right-0 z-50 pointer-events-none"
          >
            <div
              className="px-3.5 py-3 rounded-xl backdrop-blur-xl"
              style={{
                background: "linear-gradient(135deg, rgba(6,10,16,0.97) 0%, rgba(12,18,32,0.95) 100%)",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.07)",
                whiteSpace: "nowrap",
                minWidth: "140px",
              }}
            >
              {/* Hour label */}
              <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-2.5 pb-2 border-b border-white/[0.06]">
                {tooltip.hour}
              </div>

              {/* Solar */}
              <div className="flex items-center justify-between gap-4 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: SERIES[0].color, boxShadow: `0 0 6px ${SERIES[0].color}` }} />
                  <span className="text-[11px] text-white/55 font-medium">Solar</span>
                </div>
                <span className="text-[12px] font-bold font-mono" style={{ color: SERIES[0].color }}>
                  {tooltip.solar.toFixed(2)} kW
                </span>
              </div>

              {/* Load */}
              <div className="flex items-center justify-between gap-4 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: SERIES[1].color, boxShadow: `0 0 6px ${SERIES[1].color}` }} />
                  <span className="text-[11px] text-white/55 font-medium">Load</span>
                </div>
                <span className="text-[12px] font-bold font-mono" style={{ color: SERIES[1].color }}>
                  {tooltip.load.toFixed(2)} kW
                </span>
              </div>

              {/* Grid */}
              {(() => {
                const isExport = tooltip.grid < 0;
                const gridColor = isExport ? GRID_EXPORT_COLOR : SERIES[2].color;
                return (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: gridColor, boxShadow: `0 0 6px ${gridColor}` }} />
                      <span className="text-[11px] text-white/55 font-medium">
                        Grid {isExport ? "↑ export" : "↓ import"}
                      </span>
                    </div>
                    <span className="text-[12px] font-bold font-mono" style={{ color: gridColor }}>
                      {Math.abs(tooltip.grid).toFixed(2)} kW
                    </span>
                  </div>
                );
              })()}
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Time labels */}
      <div className="flex justify-between mt-3 text-[10px] text-white/30 font-mono">
        {HOURS.map((hour, i) => (
          <span key={i} className={i % 3 === 0 ? "text-white/40" : "invisible"}>
            {hour}
          </span>
        ))}
      </div>
    </div>
  );
}
