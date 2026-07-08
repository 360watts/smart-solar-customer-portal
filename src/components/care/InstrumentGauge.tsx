"use client";

import { useEffect, useId } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Zap, BatteryMedium, Sun } from "lucide-react";

// Shared component metadata (icon/label/accent color) used by both the main
// 360Care page and the System Health Details page so the three components
// always read consistently across the feature.
export const COMPONENT_META = {
  solar_panel: { icon: Sun, label: "Solar Panels", color: "#2FBF71" },
  inverter: { icon: Zap, label: "Inverter", color: "#60a5fa" },
  battery: { icon: BatteryMedium, label: "Battery", color: "#E9B949" },
} as const;

export function healthStatusColor(status: 0 | 1 | 2): string {
  return status === 0 ? "#2FBF71" : status === 1 ? "#E9B949" : "#EF4444";
}

function cxy(deg: number, cx: number, cy: number, r: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// Small glowing arc gauge used on instrument tiles — same visual language as
// the staff dashboard's per-component health arcs (EnergyFlowHealthRow.tsx).
export function MiniArc({ score, color, size }: { score: number; color: string; size: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = cx - 4;
  const s = cxy(225, cx, cy, r);
  const e = cxy(135, cx, cy, r);
  const path = `M ${s.x} ${s.y} A ${r} ${r} 0 1 1 ${e.x} ${e.y}`;
  const uid = `mini-arc-${useId().replace(/:/g, "")}`;
  const mv = useMotionValue(0);
  const offset = useTransform(mv, [0, 100], [1, 0]);

  useEffect(() => {
    const controls = animate(mv, score, { duration: 1.2, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [score, mv]);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible", display: "block" }}>
      <defs>
        <filter id={uid} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d={path} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" strokeLinecap="round" />
      <motion.path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        pathLength={1}
        style={{ strokeDashoffset: offset, strokeDasharray: "1 1", filter: `url(#${uid})` }}
      />
    </svg>
  );
}

export function PulseDot({ color }: { color: string }) {
  return (
    <div className="relative w-2 h-2">
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: color, opacity: 0.4 }}
        animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute .inset-\[1px\] rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
    </div>
  );
}
