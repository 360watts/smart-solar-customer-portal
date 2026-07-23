"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SERIES = [
  { key: "solar", label: "Solar",  color: "#2FBF71", dimColor: "rgba(47,191,113,0.55)",  hoverColor: "rgba(47,191,113,0.85)"  },
  { key: "load",  label: "Load",   color: "#60a5fa", dimColor: "rgba(96,165,250,0.55)",  hoverColor: "rgba(96,165,250,0.85)"  },
  { key: "grid",  label: "Grid",   color: "#E9B949", dimColor: "rgba(233,185,73,0.55)",  hoverColor: "rgba(233,185,73,0.85)"  },
] as const;

const GRID_EXPORT_COLOR = "#2dd4bf";
const GRID_EXPORT_DIM   = "rgba(45,212,191,0.55)";
const GRID_EXPORT_HOVER = "rgba(45,212,191,0.85)";

interface TooltipState {
  hour: string;
  solar: number;
  load: number;
  grid: number;
}

export interface HourlyPoint {
  hour: string;
  solar: number;
  load: number;
  /** Positive = grid import, negative = grid export. */
  grid: number;
}

interface Props {
  /** Real telemetry points. If omitted the chart renders an empty skeleton. */
  points?: HourlyPoint[];
  /** Index of the "current hour" bar to highlight. Defaults to last point. */
  nowIndex?: number;
}

export default function HourlyGenerationChart({ points = [], nowIndex }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [tooltipX, setTooltipX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleHover = useCallback((idx: number, e: React.MouseEvent) => {
    setHoveredIndex(idx);
    setTooltip({ hour: points[idx].hour, solar: points[idx].solar, load: points[idx].load, grid: points[idx].grid });
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      // Fractional position 0..1 along the chart width
      setTooltipX((e.clientX - rect.left) / rect.width);
    }
  }, [points]);

  const maxValue = points.length
    ? Math.max(...points.flatMap((p) => [p.solar, p.load, Math.abs(p.grid)]), 0.1)
    : 1;
  const isNow = nowIndex ?? (points.length > 0 ? points.length - 1 : -1);

  if (points.length === 0) {
    // Heights are precomputed constants so SSR and client render identically.
    const SKELETON_HEIGHTS = [
      [36, 44, 26], [52, 60, 40], [68, 76, 56], [44, 52, 32], [72, 80, 60],
      [56, 64, 44], [80, 72, 48], [48, 56, 36], [64, 72, 52], [76, 80, 64],
      [40, 48, 28], [60, 68, 48], [52, 60, 40], [44, 52, 32], [68, 76, 56],
      [36, 44, 26], [56, 64, 44], [72, 64, 52],
    ];
    return (
      <div className="flex-1 flex items-end gap-0.5 min-h-32 opacity-20 animate-pulse">
        {SKELETON_HEIGHTS.map((heights, i) => (
          <div key={i} className="flex-1 flex items-end gap-px" style={{ height: "100%" }}>
            {heights.map((h, j) => (
              <div key={j} className="flex-1 rounded-t-xs bg-foreground/20" style={{ height: `${h}%` }} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Tooltip anchors left when cursor is in the right 45% of the chart
  const tooltipStyle: React.CSSProperties = tooltipX > 0.55
    ? { right: `${Math.round((1 - tooltipX) * 100 + 2)}%`, left: "auto", top: 0 }
    : { left: `${Math.round(tooltipX * 100 + 2)}%`, right: "auto", top: 0 };

  return (
    <div ref={containerRef} className="chart-root relative overflow-visible flex-1 flex flex-col">

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4">
        {SERIES.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
            <span className="text-xs font-medium tracking-wider uppercase font-mono" style={{ color: s.color, opacity: 0.85 }}>
              {s.label}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: GRID_EXPORT_COLOR, boxShadow: `0 0 6px ${GRID_EXPORT_COLOR}` }} />
          <span className="text-xs font-medium tracking-wider uppercase font-mono" style={{ color: GRID_EXPORT_COLOR, opacity: 0.85 }}>
            Export
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 flex items-end gap-0.75 min-h-36 overflow-hidden">
        {points.map((pt, i) => {
          const { solar, load, grid } = pt;
          const isExport = grid < 0;
          const gridAbs  = Math.abs(grid);
          const hovered  = hoveredIndex === i;
          const active   = i === isNow;
          const delay    = Math.min(i * 0.02, 0.6); // cap stagger so it doesn't drag forever

          return (
            <div
              key={i}
              className="flex-1 flex items-end gap-0.5 cursor-crosshair min-w-0"
              style={{ height: "100%" }}
              onMouseEnter={(e) => handleHover(i, e)}
              onMouseMove={(e) => handleHover(i, e)}
              onMouseLeave={() => { setHoveredIndex(null); setTooltip(null); }}
            >
              {/* Solar bar — originY:1 tells Framer Motion to scale from the bottom edge */}
              <motion.div
                className="flex-1 rounded-t-sm min-w-0"
                style={{
                  height: solar > 0 ? `${(solar / maxValue) * 100}%` : "3px",
                  minHeight: "3px",
                  originY: 1,
                  background: active ? SERIES[0].color : hovered ? SERIES[0].hoverColor : SERIES[0].dimColor,
                  boxShadow: (active || hovered) ? `0 0 6px ${SERIES[0].color}88` : "none",
                  transition: "background 0.12s, box-shadow 0.12s",
                }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay, type: "spring", stiffness: 260, damping: 22 }}
              />

              {/* Load bar */}
              <motion.div
                className="flex-1 rounded-t-sm min-w-0"
                style={{
                  height: load > 0 ? `${(load / maxValue) * 100}%` : "3px",
                  minHeight: "3px",
                  originY: 1,
                  background: active ? SERIES[1].color : hovered ? SERIES[1].hoverColor : SERIES[1].dimColor,
                  boxShadow: (active || hovered) ? `0 0 6px ${SERIES[1].color}88` : "none",
                  transition: "background 0.12s, box-shadow 0.12s",
                }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: delay + 0.04, type: "spring", stiffness: 260, damping: 22 }}
              />

              {/* Grid bar — amber = import, teal = export */}
              <motion.div
                className="flex-1 rounded-t-sm min-w-0"
                style={{
                  height: gridAbs > 0 ? `${(gridAbs / maxValue) * 100}%` : "3px",
                  minHeight: "3px",
                  originY: 1,
                  background: active
                    ? (isExport ? GRID_EXPORT_COLOR : SERIES[2].color)
                    : hovered
                    ? (isExport ? GRID_EXPORT_HOVER : SERIES[2].hoverColor)
                    : (isExport ? GRID_EXPORT_DIM   : SERIES[2].dimColor),
                  boxShadow: (active || hovered)
                    ? `0 0 6px ${isExport ? GRID_EXPORT_COLOR : SERIES[2].color}88`
                    : "none",
                  transition: "background 0.12s, box-shadow 0.12s",
                }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: delay + 0.08, type: "spring", stiffness: 260, damping: 22 }}
              />
            </div>
          );
        })}
      </div>

      {/* Tooltip — follows hovered column, flips to left side near right edge */}
      <AnimatePresence>
        {tooltip && hoveredIndex !== null && (
          <motion.div
            key="chart-tooltip"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
            className="absolute z-50 pointer-events-none"
            style={tooltipStyle}
          >
            <div
              className="px-3.5 py-3 rounded-xl backdrop-blur-xl"
              style={{
                background: "linear-gradient(135deg, color-mix(in srgb, var(--card) 97%, transparent) 0%, color-mix(in srgb, var(--card) 95%, var(--background) 5%) 100%)",
                border: "1px solid var(--border)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.25), 0 0 0 1px var(--border), inset 0 1px 0 rgba(255,255,255,0.05)",
                whiteSpace: "nowrap",
                minWidth: "140px",
              }}
            >
              {/* Hour label */}
              <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-2.5 pb-2 border-b border-border">
                {tooltip.hour}
              </div>

              {/* Solar */}
              <div className="flex items-center justify-between gap-4 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: SERIES[0].color, boxShadow: `0 0 6px ${SERIES[0].color}` }} />
                  <span className="text-xs text-muted-foreground font-medium">Solar</span>
                </div>
                <span className="text-sm font-bold font-mono" style={{ color: SERIES[0].color }}>
                  {tooltip.solar.toFixed(2)} kW
                </span>
              </div>

              {/* Load */}
              <div className="flex items-center justify-between gap-4 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: SERIES[1].color, boxShadow: `0 0 6px ${SERIES[1].color}` }} />
                  <span className="text-xs text-muted-foreground font-medium">Load</span>
                </div>
                <span className="text-sm font-bold font-mono" style={{ color: SERIES[1].color }}>
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
                      <span className="text-xs text-muted-foreground font-medium">
                        Grid {isExport ? "↑ export" : "↓ import"}
                      </span>
                    </div>
                    <span className="text-sm font-bold font-mono" style={{ color: gridColor }}>
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
      <div className="flex justify-between mt-3 text-xs text-muted-foreground font-mono">
        {points.map((pt, i) => (
          <span key={i} className={i % 3 === 0 ? "text-muted-foreground" : "invisible"}>
            {pt.hour}
          </span>
        ))}
      </div>
    </div>
  );
}
