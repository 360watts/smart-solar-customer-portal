"use client";

/**
 * Motion & 3D demo lab — review page, not shipped UI.
 * Visit /demo on localhost. Each section is one candidate treatment for the
 * portal; the goal is to pick winners and delete this page.
 */

import { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { Sun, Zap, Home, BatteryCharging, TrendingUp, Cpu } from "lucide-react";
import EnergyFlowScene3DLazy from "@/components/three/EnergyFlowScene3DLazy";
import HybridEnergyOverlay from "@/components/ui/HybridEnergyOverlay";

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------
function SectionHeading({ n, title, note }: { n: string; title: string; note: string }) {
  return (
    <div className="mb-6">
      <p className="eyebrow mb-1">Variant {n}</p>
      <h2 className="font-display text-xl font-bold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{note}</p>
    </div>
  );
}

function useCountUp(target: number, durationMs = 1200, run = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!run) return;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min((now - start) / durationMs, 1);
      setValue(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, run]);
  return value;
}

// ---------------------------------------------------------------------------
// 1. 3D tilt metric card — three intensities
// ---------------------------------------------------------------------------
function TiltCard({
  maxDeg,
  glare,
  parallax,
  label,
}: {
  maxDeg: number;
  glare?: boolean;
  parallax?: boolean;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [maxDeg, -maxDeg]), { stiffness: 260, damping: 24 });
  const ry = useSpring(useTransform(mx, [0, 1], [-maxDeg, maxDeg]), { stiffness: 260, damping: 24 });
  const glareX = useTransform(mx, [0, 1], ["20%", "80%"]);
  const glareY = useTransform(my, [0, 1], ["20%", "80%"]);
  const glareBg = useTransform(
    [glareX, glareY],
    ([x, y]) => `radial-gradient(280px circle at ${x} ${y}, rgba(47,191,113,0.14), transparent 70%)`,
  );
  const kwh = useCountUp(18.6);

  return (
    <div style={{ perspective: 900 }}>
      <motion.div
        ref={ref}
        onMouseMove={(e) => {
          const r = ref.current?.getBoundingClientRect();
          if (!r) return;
          mx.set((e.clientX - r.left) / r.width);
          my.set((e.clientY - r.top) / r.height);
        }}
        onMouseLeave={() => {
          mx.set(0.5);
          my.set(0.5);
        }}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        className="glass-green rounded-xl p-6 relative overflow-hidden cursor-pointer select-none"
      >
        {glare && (
          <motion.div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{ background: glareBg }}
          />
        )}
        <div style={parallax ? { transform: "translateZ(36px)", transformStyle: "preserve-3d" } : undefined}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="eyebrow mb-2">Solar generated today</p>
              <span className="stat-number text-3xl text-foreground">
                {kwh.toFixed(1)}
                <span className="text-lg font-semibold text-muted-foreground ml-1">kWh</span>
              </span>
            </div>
            <div
              className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center"
              style={parallax ? { transform: "translateZ(28px)" } : undefined}
            >
              <Sun className="text-primary" size={24} />
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-emerald-400">
            <TrendingUp size={15} />
            <span>+12% vs yesterday</span>
          </div>
        </div>
        <p className="absolute bottom-2 right-3 text-[10px] uppercase tracking-widest text-muted-foreground/60">
          {label}
        </p>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. Staggered cascade entrance
// ---------------------------------------------------------------------------
const cascadeParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const cascadeChild = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 26 } },
};

function CascadeDemo() {
  const [key, setKey] = useState(0);
  const items = [
    { icon: Sun, label: "Generation", v: "18.6 kWh" },
    { icon: Home, label: "Consumption", v: "12.1 kWh" },
    { icon: BatteryCharging, label: "Battery", v: "84%" },
    { icon: Zap, label: "Grid export", v: "6.5 kWh" },
  ];
  return (
    <div>
      <button
        onClick={() => setKey((k) => k + 1)}
        className="mb-4 px-4 py-1.5 rounded-lg text-sm font-medium bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary transition-all"
      >
        Replay
      </button>
      <motion.div key={key} variants={cascadeParent} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map(({ icon: Icon, label, v }) => (
          <motion.div key={label} variants={cascadeChild} className="glass rounded-xl p-5">
            <Icon className="text-primary mb-3" size={20} />
            <p className="eyebrow mb-1">{label}</p>
            <p className="stat-number text-2xl text-foreground">{v}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. Live-data pulse
// ---------------------------------------------------------------------------
function LivePulseDemo() {
  const [watts, setWatts] = useState(3240);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setWatts((w) => Math.max(2600, Math.min(4200, w + (Math.random() - 0.5) * 400)));
      setTick((t) => t + 1);
    }, 2200);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="glass-green rounded-xl p-6 w-fit min-w-72">
      <div className="flex items-center gap-2 mb-2">
        <motion.span
          key={tick}
          initial={{ scale: 1.6, opacity: 1 }}
          animate={{ scale: 1, opacity: 0.6 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="w-2 h-2 rounded-full bg-emerald-400"
        />
        <p className="eyebrow">Current power · live</p>
      </div>
      <motion.p
        key={tick}
        initial={{ textShadow: "0 0 32px rgba(47,191,113,0.55)" }}
        animate={{ textShadow: "0 0 12px rgba(47,191,113,0.15)" }}
        transition={{ duration: 1.4 }}
        className="stat-number text-4xl text-emerald-400"
      >
        {(watts / 1000).toFixed(2)}
        <span className="text-lg font-semibold text-muted-foreground ml-1.5">kW</span>
      </motion.p>
      <p className="text-xs text-muted-foreground mt-2">New reading every ~2s — the number flares, then settles.</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. Skeleton → content crossfade
// ---------------------------------------------------------------------------
function CrossfadeDemo() {
  const [loading, setLoading] = useState(true);
  return (
    <div>
      <button
        onClick={() => setLoading((l) => !l)}
        className="mb-4 px-4 py-1.5 rounded-lg text-sm font-medium bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary transition-all"
      >
        Toggle loading
      </button>
      <div className="glass rounded-xl p-6 w-fit min-w-80">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="skeleton" exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="animate-pulse space-y-3">
              <div className="h-3 bg-white/10 rounded w-24" />
              <div className="h-8 bg-white/10 rounded w-40" />
              <div className="h-3 bg-white/10 rounded w-32" />
            </motion.div>
          ) : (
            <motion.div key="content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <p className="eyebrow mb-2">Monthly savings</p>
              <p className="stat-number text-3xl text-foreground">
                ₹2,840<span className="text-lg font-semibold text-muted-foreground ml-1">saved</span>
              </p>
              <p className="text-sm text-emerald-400 mt-2">On track for best month this year</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. Sliding nav pill (layoutId)
// ---------------------------------------------------------------------------
function NavPillDemo() {
  const tabs = ["Dashboard", "Solar", "Savings", "History"];
  const [active, setActive] = useState(0);
  return (
    <div className="glass rounded-xl p-2 flex gap-1 w-fit">
      {tabs.map((t, i) => (
        <button
          key={t}
          onClick={() => setActive(i)}
          className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            i === active ? "text-emerald-300" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {i === active && (
            <motion.span
              layoutId="nav-pill"
              className="absolute inset-0 rounded-lg bg-emerald-500/15 border border-emerald-500/30"
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
            />
          )}
          <span className="relative">{t}</span>
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 6. Isometric energy flow — single-SVG true isometric projection.
// Every vertex comes from one iso(x, y, z) projection, so objects and flow
// paths share a coordinate system and always connect exactly.
// ---------------------------------------------------------------------------
const U = 20;   // px per iso grid unit (2:1 pixel isometric)
const ZF = 14;  // px of screen rise per z unit
const OX = 210; // scene origin (screen px, inside 420x330 viewBox)
const OY = 104;

function iso(x: number, y: number, z = 0): [number, number] {
  return [OX + (x - y) * U, OY + (x + y) * (U / 2) - z * ZF];
}
const P = (x: number, y: number, z = 0) => iso(x, y, z).join(" ");
const poly = (pts: Array<[number, number, number?]>) =>
  "M " + pts.map(([x, y, z]) => P(x, y, z ?? 0)).join(" L ") + " Z";

/** The three visible faces of an axis-aligned box on the iso grid. */
function IsoBox({
  x1, y1, x2, y2, h, top, right, left, stroke = "rgba(255,255,255,0.10)",
}: {
  x1: number; y1: number; x2: number; y2: number; h: number;
  top: string; right: string; left: string; stroke?: string;
}) {
  return (
    <g stroke={stroke} strokeWidth="1">
      <path d={poly([[x2, y1, h], [x2, y2, h], [x2, y2, 0], [x2, y1, 0]])} fill={right} />
      <path d={poly([[x2, y2, h], [x1, y2, h], [x1, y2, 0], [x2, y2, 0]])} fill={left} />
      <path d={poly([[x1, y1, h], [x2, y1, h], [x2, y2, h], [x1, y2, h]])} fill={top} />
    </g>
  );
}

function FlowPath({ d, color, dur, width = 2 }: { d: string; color: string; dur: number; width?: number }) {
  return (
    <g>
      <path d={d} stroke={color} strokeWidth={width + 3} strokeLinecap="round" opacity="0.12" fill="none" />
      <motion.path
        d={d} stroke={color} strokeWidth={width} strokeLinecap="round" fill="none"
        strokeDasharray="5 9"
        animate={{ strokeDashoffset: [0, -28] }}
        transition={{ duration: dur, repeat: Infinity, ease: "linear" }}
      />
    </g>
  );
}

// Gable roof: ridge runs parallel to the y-axis at x = RIDGE_X. Height is a
// function of x alone, so each pitch is a true flat plane in 3D — not a fake.
const WALL_H = 1.7;
const ROOF_RISE = 1.15;
const EAVE_OVERHANG = 0.35;
const RIDGE_X = 5;
function roofZ(x: number) {
  const halfSpan = RIDGE_X - (3 - EAVE_OVERHANG);
  return WALL_H + ROOF_RISE * Math.max(0, 1 - Math.abs(x - RIDGE_X) / halfSpan);
}

function EnergyFlowDemo() {
  const HOUSE = { x1: 3, y1: 3, x2: 7, y2: 7 };
  const ex1 = HOUSE.x1 - EAVE_OVERHANG, ex2 = HOUSE.x2 + EAVE_OVERHANG;
  const ey1 = HOUSE.y1 - EAVE_OVERHANG, ey2 = HOUSE.y2 + EAVE_OVERHANG;
  const ridgeZ = roofZ(RIDGE_X);
  const eaveZ = roofZ(ex1);

  // Panel array mounted flush on the front-facing (south) pitch, standing a
  // hair proud of the roof surface — height follows the same roofZ(x) slope,
  // so the array is genuinely tilted at the roof pitch, not a flat sticker.
  const PANEL_STANDOFF = 0.08;
  const panelZ = (x: number) => roofZ(x) + PANEL_STANDOFF;
  const pRows = 2, pCols = 3;
  const px1 = RIDGE_X + 0.25, px2 = ex2 - 0.25;
  const py1 = ey1 + 0.3, py2 = ey2 - 0.3;

  const [sunX, sunY] = iso(0.4, 8.2, 5.4);
  const [panelCx, panelCy] = iso((px1 + px2) / 2, (py1 + py2) / 2, panelZ((px1 + px2) / 2));
  const [gridInX, gridInY] = iso(8.1, 1.6, 0.95);
  const [houseRightX, houseRightY] = iso(7, 5, WALL_H * 0.55);
  const [houseLeftX, houseLeftY] = iso(5, 7, WALL_H * 0.4);
  const [battInX, battInY] = iso(2.1, 8.1, 0.6);
  const [ridgeMidX, ridgeMidY] = iso(RIDGE_X, 5, ridgeZ);

  return (
    <div className="glass rounded-xl p-6 sm:p-8 overflow-hidden">
      <div className="relative max-w-lg mx-auto">
        <svg viewBox="0 0 420 340" className="w-full h-auto" fill="none" aria-label="Live energy flow: sun to rooftop solar, home load, battery, and grid">
          <defs>
            <linearGradient id="efPanel" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(80,220,160,0.65)" />
              <stop offset="100%" stopColor="rgba(47,191,113,0.22)" />
            </linearGradient>
            <linearGradient id="efRoofFront" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2A3B4E" />
              <stop offset="100%" stopColor="#1C2A38" />
            </linearGradient>
            <linearGradient id="efRoofSide" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1A2735" />
              <stop offset="100%" stopColor="#101B26" />
            </linearGradient>
            <radialGradient id="efSun">
              <stop offset="0%" stopColor="#FFF3D2" />
              <stop offset="55%" stopColor="#E9B949" />
              <stop offset="100%" stopColor="rgba(233,185,73,0)" />
            </radialGradient>
            <filter id="efSoftShadow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3.2" />
            </filter>
          </defs>

          {/* ── Ground plane + iso grid ── */}
          <path d={poly([[0, 0], [10, 0], [10, 10], [0, 10]])} fill="rgba(47,191,113,0.05)" stroke="rgba(47,191,113,0.16)" strokeWidth="1" />
          {[2, 4, 6, 8].map((i) => (
            <g key={i} stroke="rgba(255,255,255,0.045)" strokeWidth="1">
              <path d={`M ${P(i, 0)} L ${P(i, 10)}`} />
              <path d={`M ${P(0, i)} L ${P(10, i)}`} />
            </g>
          ))}

          {/* ── Soft contact shadows (blurred, sun is upper-left → shadows fall lower-right) ── */}
          <g filter="url(#efSoftShadow)" opacity="0.55">
            <path d={poly([[ex1 + 0.15, ey1 + 0.15], [ex2 + 0.2, ey1 + 0.15], [ex2 + 0.2, ey2 + 0.2], [ex1 + 0.15, ey2 + 0.2]])} fill="#000" />
            <path d={poly([[1.05, 7.55], [2.15, 7.55], [2.15, 8.75], [1.05, 8.75]])} fill="#000" />
            <path d={poly([[8.25, 1.05], [9.35, 1.05], [9.35, 2.15], [8.25, 2.15]])} fill="#000" />
          </g>

          {/* ── Sun (drawn early: farthest background element) ── */}
          <motion.g animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} style={{ transformOrigin: `${sunX}px ${sunY}px` }}>
            <circle cx={sunX} cy={sunY} r="34" fill="url(#efSun)" opacity="0.55" />
            <circle cx={sunX} cy={sunY} r="12" fill="#FBD98B" />
            <circle cx={sunX} cy={sunY} r="12" fill="none" stroke="#FFF3D2" strokeWidth="1" opacity="0.6" />
          </motion.g>

          {/* ── Flow paths ── */}
          <FlowPath d={`M ${sunX + 20} ${sunY + 10} Q ${(sunX + panelCx) / 2 + 10} ${(sunY + panelCy) / 2 - 14} ${panelCx - 20} ${panelCy - 4}`} color="#E9B949" dur={1.3} />
          <FlowPath d={`M ${houseRightX} ${houseRightY} Q ${(houseRightX + gridInX) / 2} ${(houseRightY + gridInY) / 2 + 10} ${gridInX} ${gridInY}`} color="#2FBF71" dur={1.7} />
          <FlowPath d={`M ${houseLeftX} ${houseLeftY} Q ${(houseLeftX + battInX) / 2} ${(houseLeftY + battInY) / 2 + 8} ${battInX} ${battInY}`} color="#2FBF71" dur={2.1} />
          {/* panel → ridge → house load, so the array visibly feeds the building it sits on */}
          <FlowPath d={`M ${panelCx} ${panelCy + 6} Q ${(panelCx + ridgeMidX) / 2} ${(panelCy + ridgeMidY) / 2 + 4} ${ridgeMidX} ${ridgeMidY}`} color="#E9B949" dur={1.5} width={1.5} />

          {/* ── Battery ── */}
          <IsoBox x1={1} y1={7.5} x2={2.1} y2={8.7} h={1.1} top="rgba(47,191,113,0.32)" right="#12291D" left="#0C1E15" stroke="rgba(47,191,113,0.35)" />
          <path d={poly([[2.1, 7.68, 0.78], [2.1, 8.52, 0.78], [2.1, 8.52, 0.14], [2.1, 7.68, 0.14]])} fill="rgba(47,191,113,0.55)" />
          <path d={`M ${P(1.55, 7.5, 1.1)} L ${P(1.55, 7.5, 1.28)}`} stroke="#12291D" strokeWidth="3" strokeLinecap="round" />

          {/* ── Transformer: padmount cabinet + twin HV bushings + warning band ── */}
          <IsoBox x1={8.2} y1={1} x2={9.3} y2={2.1} h={1.15} top="rgba(255,255,255,0.16)" right="#182131" left="#101725" />
          <path d={poly([[8.2, 1, 0.75], [9.3, 1, 0.75], [9.3, 1, 0.6], [8.2, 1, 0.6]])} fill="#E9B949" opacity="0.55" />
          <path d={poly([[9.3, 1.05, 0.75], [9.3, 2.05, 0.75], [9.3, 2.05, 0.6], [9.3, 1.05, 0.6]])} fill="#E9B949" opacity="0.4" />
          {[0.35, 0.65].map((t) => {
            const bx = 8.2 + t * 1.1, by = 1 + t * 0.35;
            return (
              <g key={t}>
                <path d={`M ${P(bx, by, 1.15)} L ${P(bx, by, 1.55)}`} stroke="#8B97B8" strokeWidth="2.4" strokeLinecap="round" />
                {[1.2, 1.32, 1.44].map((z) => <ellipse key={z} cx={iso(bx, by, z)[0]} cy={iso(bx, by, z)[1]} rx="3.2" ry="1.3" fill="#5A6478" />)}
              </g>
            );
          })}

          {/* ── House walls ── */}
          <IsoBox {...HOUSE} h={WALL_H} top="#16263C" right="#101C2C" left="#0B1420" />
          <path d={poly([[5.35, 7, 0.95], [6.05, 7, 0.95], [6.05, 7, 0], [5.35, 7, 0]])} fill="rgba(0,0,0,0.28)" />
          <motion.path
            d={poly([[7, 3.9, WALL_H * 0.78], [7, 4.75, WALL_H * 0.78], [7, 4.75, WALL_H * 0.32], [7, 3.9, WALL_H * 0.32]])}
            fill="rgba(251,217,139,0.55)"
            animate={{ opacity: [0.45, 0.9, 0.45] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <path d={poly([[3.9, 3, WALL_H * 0.72], [4.55, 3, WALL_H * 0.72], [4.55, 3, WALL_H * 0.3], [3.9, 3, WALL_H * 0.3]])} fill="rgba(140,170,210,0.22)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />

          {/* ── Gable roof: near gable-end wall, two pitches, ridge cap, far gable-end ── */}
          <path d={poly([[HOUSE.x1, HOUSE.y2, 0], [RIDGE_X, HOUSE.y2, ridgeZ], [HOUSE.x2, HOUSE.y2, 0]])} fill="#0E1824" stroke="rgba(255,255,255,0.08)" />
          <path d={poly([[ex1, ey1, eaveZ], [ex1, ey2, eaveZ], [RIDGE_X, ey2, ridgeZ], [RIDGE_X, ey1, ridgeZ]])} fill="url(#efRoofSide)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <path d={poly([[RIDGE_X, ey1, ridgeZ], [RIDGE_X, ey2, ridgeZ], [ex2, ey2, eaveZ], [ex2, ey1, eaveZ]])} fill="url(#efRoofFront)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <path d={`M ${P(RIDGE_X, ey1, ridgeZ)} L ${P(RIDGE_X, ey2, ridgeZ)}`} stroke="#3A4C60" strokeWidth="2" />
          <path d={poly([[HOUSE.x1, HOUSE.y1, 0], [RIDGE_X, HOUSE.y1, ridgeZ], [HOUSE.x2, HOUSE.y1, 0]])} fill="#131F2C" stroke="rgba(255,255,255,0.06)" />

          {/* ── Solar array mounted flush on the front (south) pitch — genuinely tilted at roof pitch ── */}
          <motion.g animate={{ opacity: [0.88, 1, 0.88] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
            <path
              d={poly([[px1, py1, panelZ(px1)], [px2, py1, panelZ(px2)], [px2, py2, panelZ(px2)], [px1, py2, panelZ(px1)]])}
              fill="url(#efPanel)" stroke="rgba(120,240,180,0.7)" strokeWidth="1"
            />
            {Array.from({ length: pRows }).map((_, r) =>
              Array.from({ length: pCols }).map((_, c) => {
                const cw = (px2 - px1) / pCols, rh = (py2 - py1) / pRows;
                const cx1 = px1 + c * cw + 0.04, cx2 = px1 + (c + 1) * cw - 0.04;
                const cy1 = py1 + r * rh + 0.05, cy2 = py1 + (r + 1) * rh - 0.05;
                return (
                  <path key={`${r}-${c}`}
                    d={poly([[cx1, cy1, panelZ(cx1)], [cx2, cy1, panelZ(cx2)], [cx2, cy2, panelZ(cx2)], [cx1, cy2, panelZ(cx1)]])}
                    fill="rgba(5,9,14,0.6)" stroke="rgba(120,240,180,0.32)" strokeWidth="0.6" />
                );
              }),
            )}
          </motion.g>
        </svg>

        {/* ── Data chips: sun→Solar, house→Home load, battery→Battery, transformer→Grid ── */}
        <Chip x={sunX} y={sunY - 42} label="Solar" value="3.2 kW" tone="amber" />
        <Chip x={houseRightX + 46} y={houseRightY - 4} label="Home load" value="2.1 kW" tone="emerald" />
        <Chip x={battInX - 34} y={battInY + 30} label="Battery" value="84%" tone="emerald" />
        <Chip x={gridInX + 34} y={gridInY - 30} label="Grid" value="+1.1 kW" tone="amber" />
      </div>
      <p className="text-center text-sm text-muted-foreground mt-5">
        True gable roof (ridge-based slope function) with an array mounted flush on the pitch — same
        <code className="font-mono text-xs mx-1">iso(x, y, z)</code> projection driving walls, roof, panels, and every flow line.
      </p>
    </div>
  );
}

/** Small stat chip positioned in the SVG's coordinate space (viewBox 420x340). */
function Chip({ x, y, label, value, tone }: { x: number; y: number; label: string; value: string; tone: "emerald" | "amber" }) {
  return (
    <div
      className={`absolute -translate-x-1/2 px-2.5 py-1 rounded-lg border backdrop-blur-sm text-center ${
        tone === "emerald" ? "bg-emerald-500/10 border-emerald-500/30" : "bg-amber-500/10 border-amber-400/30"
      }`}
      style={{ left: `${(x / 420) * 100}%`, top: `${(y / 340) * 100}%` }}
    >
      <span className="block text-[9px] uppercase tracking-[0.14em] text-muted-foreground leading-none mb-0.5">{label}</span>
      <span className={`font-mono text-xs font-semibold ${tone === "emerald" ? "text-emerald-300" : "text-amber-300"}`}>{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 7. Orbital system — house as the sun, resources as orbiting bodies.
// Ties into the "360" brand mark; energy travels along the orbit arcs
// themselves via native SVG <animateMotion>, so paths are always exact.
// ---------------------------------------------------------------------------
function OrbitalDemo() {
  const cx = 210, cy = 150;
  const orbits = [
    { r: 96, icon: Sun, label: "Solar", value: "3.2 kW", color: "#E9B949", angle: -90, dur: 10 },
    { r: 96, icon: BatteryCharging, label: "Battery", value: "84%", color: "#2FBF71", angle: 30, dur: 13 },
    { r: 96, icon: Zap, label: "Grid", value: "+1.1 kW", color: "#6B7A99", angle: 150, dur: 16 },
  ];
  const pt = (r: number, deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };

  return (
    <div className="glass rounded-xl p-6 sm:p-8 overflow-hidden">
      <div className="relative max-w-lg mx-auto">
        <svg viewBox="0 0 420 300" className="w-full h-auto" fill="none">
          <defs>
            <radialGradient id="orbHouse" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#1C3A2A" />
              <stop offset="100%" stopColor="#081410" />
            </radialGradient>
          </defs>

          {/* faint concentric orbit rings for depth */}
          {[62, 96, 128].map((r) => (
            <circle key={r} cx={cx} cy={cy} r={r} stroke="rgba(255,255,255,0.06)" strokeDasharray="2 6" />
          ))}

          {/* orbit paths + comet particles gliding exactly along them */}
          {orbits.map(({ r, color, angle, dur }, i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r={r} stroke={`${color}33`} strokeWidth="1.5" />
              <circle r="4" fill={color} style={{ filter: `drop-shadow(0 0 6px ${color})` }}>
                <animateMotion dur={`${dur}s`} repeatCount="indefinite" rotate="auto"
                  path={`M ${pt(r, angle)[0]} ${pt(r, angle)[1]} A ${r} ${r} 0 1 1 ${pt(r, angle - 0.01)[0]} ${pt(r, angle - 0.01)[1]}`} />
              </circle>
            </g>
          ))}

          {/* central house — the "sun" of the system */}
          <circle cx={cx} cy={cy} r="46" fill="url(#orbHouse)" stroke="rgba(47,191,113,0.4)" strokeWidth="1.5" />
          <motion.circle cx={cx} cy={cy} r="52" fill="none" stroke="rgba(47,191,113,0.25)" strokeWidth="1"
            animate={{ r: [46, 62, 46], opacity: [0.5, 0, 0.5] }} transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }} />
        </svg>

        {/* HTML layer: house icon + orbiting cards, positioned from the same math as the SVG */}
        <div className="absolute" style={{ left: `${(cx / 420) * 100}%`, top: `${(cy / 300) * 100}%`, transform: "translate(-50%,-50%)" }}>
          <Home className="text-emerald-400" size={26} />
        </div>
        {orbits.map(({ r, icon: Icon, label, value, color, angle }, i) => {
          const [x, y] = pt(r, angle);
          return (
            <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
              style={{ left: `${(x / 420) * 100}%`, top: `${(y / 300) * 100}%` }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center border backdrop-blur-sm"
                style={{ background: `${color}18`, borderColor: `${color}55` }}>
                <Icon size={16} style={{ color }} />
              </div>
              <div className="text-center leading-tight">
                <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
                <p className="font-mono text-xs font-semibold" style={{ color }}>{value}</p>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-center text-sm text-muted-foreground mt-5">
        House as the gravitational center; resources orbit it and comets travel the orbit path itself
        via native <code className="font-mono text-xs">&lt;animateMotion&gt;</code> — no per-frame JS.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 8. Circuit board — right-angle traces, chip-package nodes, PCB texture.
// Leans into "smart hardware" rather than "energy" as the metaphor.
// ---------------------------------------------------------------------------
function ChipNode({ x, y, w, h, label, value, color, icon: Icon }: {
  x: number; y: number; w: number; h: number; label: string; value: string; color: string; icon: React.ComponentType<{ size?: number; color?: string }>;
}) {
  const pins = 4;
  return (
    <g>
      {Array.from({ length: pins }).map((_, i) => {
        const px = x + (w / (pins + 1)) * (i + 1);
        return <line key={`t${i}`} x1={px} y1={y - 8} x2={px} y2={y} stroke={color} strokeWidth="2" opacity="0.5" />;
      })}
      {Array.from({ length: pins }).map((_, i) => {
        const px = x + (w / (pins + 1)) * (i + 1);
        return <line key={`b${i}`} x1={px} y1={y + h} x2={px} y2={y + h + 8} stroke={color} strokeWidth="2" opacity="0.5" />;
      })}
      <rect x={x} y={y} width={w} height={h} rx="6" fill="#0B0F14" stroke={color} strokeWidth="1.4" />
      <rect x={x} y={y} width={w} height={h} rx="6" fill={color} opacity="0.06" />
      <foreignObject x={x} y={y} width={w} height={h}>
        <div className="w-full h-full flex flex-col items-center justify-center gap-0.5">
          <Icon size={14} color={color} />
          <span className="text-[8px] uppercase tracking-widest text-muted-foreground">{label}</span>
          <span className="font-mono text-[10px] font-bold" style={{ color }}>{value}</span>
        </div>
      </foreignObject>
    </g>
  );
}

function TraceDemo() {
  const solarColor = "#E9B949", homeColor = "#93C5FD", battColor = "#2FBF71", gridColor = "#6B7A99";
  // Manhattan (right-angle) trace paths between chip pin exits
  const traces = [
    { d: "M 90 70 L 90 110 L 210 110 L 210 150", color: solarColor, dur: 2.2 },
    { d: "M 330 70 L 330 110 L 250 110 L 250 150 L 250 190 L 210 190", color: battColor, dur: 2.8 },
    { d: "M 330 230 L 330 190 L 250 190 L 250 150 L 210 150", color: gridColor, dur: 3.2 },
    { d: "M 90 230 L 90 190 L 210 190", color: homeColor, dur: 2.5 },
  ];
  return (
    <div className="rounded-xl p-6 sm:p-8 overflow-hidden border" style={{ background: "#0A0F0B", borderColor: "rgba(47,191,113,0.18)" }}>
      <div className="relative max-w-lg mx-auto">
        <svg viewBox="0 0 420 300" className="w-full h-auto" fill="none">
          {/* PCB drill-hole texture */}
          <defs>
            <pattern id="pcbDots" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="12" cy="12" r="1" fill="rgba(47,191,113,0.10)" />
            </pattern>
          </defs>
          <rect width="420" height="300" fill="url(#pcbDots)" />

          {/* traces: dim base track + animated current dot per pin via animateMotion */}
          {traces.map(({ d, color, dur }, i) => (
            <g key={i}>
              <path d={d} stroke={color} strokeWidth="2" opacity="0.22" />
              <path d={d} stroke={color} strokeWidth="2" opacity="0.55" strokeDasharray="1 7" strokeLinecap="round" />
              <circle r="3" fill={color} style={{ filter: `drop-shadow(0 0 5px ${color})` }}>
                <animateMotion dur={`${dur}s`} repeatCount="indefinite" path={d} />
              </circle>
            </g>
          ))}

          {/* via dots at every trace corner-node */}
          <ChipNode x={50} y={40} w={80} h={30} label="Solar" color={solarColor} icon={Sun} value="3.2 kW" />
          <ChipNode x={290} y={40} w={80} h={30} label="Battery" color={battColor} icon={BatteryCharging} value="84%" />
          <ChipNode x={170} y={135} w={80} h={30} label="Gateway" color="#F0F6FF" icon={Cpu} value="360" />
          <ChipNode x={50} y={230} w={80} h={30} label="Home" color={homeColor} icon={Home} value="2.1 kW" />
          <ChipNode x={290} y={230} w={80} h={30} label="Grid" color={gridColor} icon={Zap} value="+1.1 kW" />
        </svg>
      </div>
      <p className="text-center text-sm text-muted-foreground mt-5">
        Right-angle PCB traces and chip-package nodes — leans into &ldquo;smart hardware&rdquo; rather
        than &ldquo;energy weather,&rdquo; for a more technical, control-room read.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 9. Liquid glass pipes — Tesla / Home Assistant lineage: soft curved tubes
// with droplets of light flowing toward/away from a central home card.
// ---------------------------------------------------------------------------
function LiquidPipesDemo() {
  const cx = 210, cy = 150;
  const nodes = [
    { x: 70, y: 60, label: "Solar", value: "3.2 kW", color: "#E9B949", icon: Sun, rev: false },
    { x: 350, y: 60, label: "Battery", value: "84%", color: "#2FBF71", icon: BatteryCharging, rev: false },
    { x: 350, y: 240, label: "Grid", value: "+1.1 kW", color: "#6B7A99", icon: Zap, rev: true },
    { x: 70, y: 240, label: "Home", value: "2.1 kW", color: "#93C5FD", icon: Home, rev: true },
  ];
  const pipe = (x: number, y: number) => `M ${x} ${y} Q ${(x + cx) / 2} ${(y + cy) / 2} ${cx} ${cy}`;

  return (
    <div className="glass rounded-xl p-6 sm:p-8 overflow-hidden">
      <div className="relative max-w-lg mx-auto">
        <svg viewBox="0 0 420 300" className="w-full h-auto" fill="none">
          {nodes.map(({ x, y, color, rev }, i) => {
            const d = pipe(x, y);
            return (
              <g key={i}>
                {/* glass tube: wide translucent outline + thin bright core */}
                <path d={d} stroke={color} strokeWidth="10" opacity="0.08" strokeLinecap="round" />
                <path d={d} stroke={color} strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
                {/* droplets of light travelling the tube, staggered */}
                {[0, 0.33, 0.66].map((delay) => (
                  <circle key={delay} r="3.2" fill={color} style={{ filter: `drop-shadow(0 0 6px ${color})` }}>
                    <animateMotion dur="2.4s" begin={`${delay * 2.4}s`} repeatCount="indefinite"
                      path={rev ? `M ${cx} ${cy} Q ${(x + cx) / 2} ${(y + cy) / 2} ${x} ${y}` : d} />
                  </circle>
                ))}
              </g>
            );
          })}

          {/* central home card glow */}
          <circle cx={cx} cy={cy} r="40" fill="rgba(47,191,113,0.08)" />
        </svg>

        {/* HTML glass cards on top, positioned via the same coordinates */}
        <div className="absolute -translate-x-1/2 -translate-y-1/2 glass rounded-2xl p-3 flex flex-col items-center"
          style={{ left: `${(cx / 420) * 100}%`, top: `${(cy / 300) * 100}%` }}>
          <Home className="text-emerald-400 mb-1" size={22} />
          <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">360watts</span>
        </div>
        {nodes.map(({ x, y, label, value, color, icon: Icon }, i) => (
          <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border backdrop-blur-md px-3 py-2 flex items-center gap-2"
            style={{ left: `${(x / 420) * 100}%`, top: `${(y / 300) * 100}%`, background: "rgba(255,255,255,0.04)", borderColor: `${color}40` }}>
            <Icon size={15} style={{ color }} />
            <div className="leading-tight">
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</p>
              <p className="font-mono text-xs font-semibold" style={{ color }}>{value}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-muted-foreground mt-5">
        Curved glass pipes with droplets of light — the Tesla / Home&nbsp;Assistant power-flow
        lineage, softened to match the portal&apos;s glassmorphism.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function MotionDemoPage() {
  return (
    <main className="min-h-screen bg-background bg-sun-glow px-6 py-12">
      <div className="max-w-5xl mx-auto space-y-16">
        <header>
          <p className="eyebrow mb-2">360watts · motion lab</p>
          <h1 className="page-title mb-2">3D &amp; animation demo variants</h1>
          <p className="text-base text-muted-foreground max-w-2xl">
            Candidate treatments for the customer portal. Hover, click, and replay each one — pick
            winners, the rest get deleted.
          </p>
        </header>

        <section>
          <SectionHeading
            n="1"
            title="3D tilt metric card"
            note="Mouse-tracking perspective tilt at three intensities. B adds a cursor-following emerald glare; C lifts the content and icon on separate Z-planes (parallax) so the card reads as layered glass."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <TiltCard maxDeg={4} label="A · subtle 4°" />
            <TiltCard maxDeg={9} glare label="B · 9° + glare" />
            <TiltCard maxDeg={9} glare parallax label="C · 9° + glare + parallax" />
          </div>
        </section>

        <section>
          <SectionHeading
            n="2"
            title="Staggered cascade entrance"
            note="Cards spring in one after another (70ms apart) instead of the whole page fading as a block. This is the pattern I'd apply to every portal page grid."
          />
          <CascadeDemo />
        </section>

        <section>
          <SectionHeading
            n="3"
            title="Live-data pulse"
            note="When a fresh reading lands, the number flares emerald and settles, and the live dot pings. Communicates 'this is real-time' without a spinner."
          />
          <LivePulseDemo />
        </section>

        <section>
          <SectionHeading
            n="4"
            title="Skeleton → content crossfade"
            note="Data currently pops in when loading finishes. AnimatePresence gives the skeleton a graceful exit and the content a soft rise."
          />
          <CrossfadeDemo />
        </section>

        <section>
          <SectionHeading
            n="5"
            title="Sliding nav indicator"
            note="A shared layoutId pill glides between items instead of teleporting. Candidate for the portal sidebar's active state."
          />
          <NavPillDemo />
        </section>

        <section>
          <SectionHeading
            n="6"
            title="Isometric energy flow (pseudo-3D)"
            note="The middle path between flat UI and a full three.js scene — a single SVG built from one isometric projection, so the house, panels, battery, pylon, and every energy path share exact coordinates. In production the flows, battery level, and window glow would track live site data."
          />
          <EnergyFlowDemo />
        </section>

        <section>
          <SectionHeading
            n="7"
            title="Orbital system"
            note="The house sits at the gravitational center; solar, battery, and grid orbit it. Comets glide the orbit arcs themselves via native <animateMotion> — no per-frame JS math. Ties naturally into the '360' brand mark."
          />
          <OrbitalDemo />
        </section>

        <section>
          <SectionHeading
            n="8"
            title="Circuit board"
            note="Right-angle PCB traces, chip-package nodes with pins, drill-hole texture. A completely different read: 'smart hardware control room' instead of 'weather system.' Best fit if the brand wants to emphasize the gateway device itself."
          />
          <TraceDemo />
        </section>

        <section>
          <SectionHeading
            n="9"
            title="Liquid glass pipes"
            note="The Tesla / Home Assistant power-flow lineage — curved translucent tubes with droplets of light flowing toward or away from a central home card. Most consumer-familiar pattern; softened here to match the portal's existing glassmorphism instead of Tesla's flat dark UI."
          />
          <LiquidPipesDemo />
        </section>

        <section>
          <SectionHeading
            n="10"
            title="Fixed-frame architectural render (react-three-fiber)"
            note="Deliberately not interactive — one locked hero-shot camera, like a real-estate photo, not a spinnable product viewer. A modern two-story home with a true gable roof: two flat pitches meeting at a real ridge, triangular gable-end walls front and back, a chimney, a floor band separating the stories, recessed realistic windows (physical glass material, not glowing cartoon blocks), a stone plinth, clipped hedges, a timber deck, and a gravel foreground path. The sun runs a full sunrise→noon→sunset→night arc every ~70s; the moon sits at the mathematically opposite point on the same arc (sin(θ+π) = −sin(θ)), so it's guaranteed to rise as the sun sets and cast real moonlight — a directional light at the moon's position, not a fixed ambient floor — while the porch light and interior glow brighten for visibility after dark. The weather toggle (Clear/Cloudy/Overcast) layers clouds and dimming on top of the same model. Lazy-loaded — costs nothing on any page that doesn't render it."
          />
          <EnergyFlowScene3DLazy />
        </section>

        <section>
          <SectionHeading
            n="11"
            title="Hybrid HUD overlay: static vector backdrop + SVG telemetry"
            note="Stack A from the brief: a static, hand-drawn architectural SVG (never re-renders — it's just gradients and shapes, zero WebGL cost) with an animated telemetry layer painted on top, anchored to fixed coordinate vertices: Solar node on the roof array, Gateway hub beside the glass facade, EV charger in the driveway, battery pack on the basement wall, grid pylon at the edge. Every beam is three coordinated layers — a heavy-blur glow track, a static dotted rail (the physical wiring, visible even at zero power), and a moving dash flow stream whose speed scales live with that node's kW. Curves are cubic beziers bowed perpendicular to each connection, not straight lines. Glassmorphic instrument cards use the portal's existing .glass tokens. Values tick via Framer Motion's `animate()` toward new random targets every ~3s to simulate a live feed."
          />
          <HybridEnergyOverlay />
        </section>
      </div>
    </main>
  );
}
