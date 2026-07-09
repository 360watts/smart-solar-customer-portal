"use client";

/**
 * Hybrid "Stack A" energy overlay: a static, hand-drawn architectural SVG
 * backdrop (no WebGL, no photo asset needed — the house itself is vector,
 * drawn once and never re-rendered) with an animated telemetry layer painted
 * on top, anchored to fixed coordinate vertices on that backdrop:
 *   Solar node   → roof array
 *   Gateway hub  → wall-mounted distribution box beside the glass facade
 *   EV node      → charger post in the driveway
 *   Battery      → basement pack, left elevation
 *   Grid         → utility pylon, right edge
 *
 * Every beam is three coordinated layers (per spec): a heavy-blur glow
 * track, a static dotted rail (the physical wiring, always visible), and a
 * moving dash "flow stream" whose speed scales with that node's live kW —
 * more power, faster dashes, driven by Framer Motion's animate + repeat.
 */

import { useEffect, useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";

// ---------------------------------------------------------------------------
// Backdrop coordinate map — the single source of truth. Every beam and card
// reads from here, so telemetry can never drift off the artwork it anchors to.
// ---------------------------------------------------------------------------
const NODE = {
  solar: { x: 300, y: 92 },
  gateway: { x: 432, y: 236 },
  battery: { x: 150, y: 298 },
  ev: { x: 486, y: 322 },
  grid: { x: 612, y: 150 },
} as const;

/** Cubic bezier through two control points offset perpendicular to the chord,
 *  so beams sweep along a natural architectural curve instead of a straight line. */
function cubic(a: { x: number; y: number }, b: { x: number; y: number }, bow = 0.28) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const nx = -dy, ny = dx;
  const len = Math.hypot(dx, dy) || 1;
  const ox = (nx / len) * len * bow;
  const oy = (ny / len) * len * bow;
  const c1 = { x: a.x + dx * 0.32 + ox * 0.5, y: a.y + dy * 0.32 + oy * 0.5 };
  const c2 = { x: a.x + dx * 0.68 + ox * 0.85, y: a.y + dy * 0.68 + oy * 0.85 };
  return `M ${a.x} ${a.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${b.x} ${b.y}`;
}

type Reading = { kw: number; color: string; label: string; sub: string };

/** The three-layer beam: glow / static rail / flow stream. Idle nodes (kw≈0)
 *  fall back to just the dotted rail — the "power dropped to zero" state
 *  the brief calls out explicitly. */
function Beam({ d, color, kw, maxKw }: { d: string; color: string; kw: number; maxKw: number }) {
  const active = kw > 0.03;
  const speed = Math.max(0.4, Math.min(2.2, kw / maxKw + 0.4));
  const duration = 1.6 / speed;
  return (
    <g>
      {/* glow path: thick, heavily blurred, barely-there */}
      {active && <path d={d} stroke={color} strokeWidth={14} fill="none" opacity={0.05} style={{ filter: "url(#heo-blur)" }} />}
      {/* static rail: the physical wiring, always visible */}
      <path d={d} stroke={active ? color : "#3A4150"} strokeWidth={1} fill="none" opacity={active ? 0.22 : 0.35} strokeDasharray="1 6" strokeLinecap="round" />
      {/* flow stream: the moving current, speed tied to live kW */}
      {active && (
        <motion.path
          d={d} stroke={color} strokeWidth={2.2} fill="none" strokeLinecap="round"
          strokeDasharray="7 10"
          animate={{ strokeDashoffset: [0, -34] }}
          transition={{ duration, repeat: Infinity, ease: "linear" }}
          style={{ filter: "url(#heo-sharp)" }}
        />
      )}
    </g>
  );
}

/** Glassmorphic instrument card, anchored to a node's percentage position
 *  over the backdrop so it reflows correctly at any container width. */
function InstrumentCard({ x, y, reading, align = "center" }: { x: number; y: number; reading: Reading; align?: "left" | "right" | "center" }) {
  const alignClass = align === "left" ? "items-start text-left" : align === "right" ? "items-end text-right" : "items-center text-center";
  return (
    <div
      className={`absolute -translate-x-1/2 -translate-y-full flex flex-col ${alignClass} gap-0.5 px-2.5 py-1.5 rounded-lg backdrop-blur-xl bg-white/4 border pointer-events-none`}
      style={{ left: `${(x / 640) * 100}%`, top: `${((y - 14) / 400) * 100}%`, borderColor: `${reading.color}40`, boxShadow: `0 0 24px ${reading.color}22` }}
    >
      <span className="text-[9px] uppercase tracking-[0.14em] text-white/50 leading-none">{reading.label}</span>
      <span className="font-mono text-sm font-bold leading-none" style={{ color: reading.color }}>
        {reading.kw.toFixed(1)} kW
      </span>
      <span className="text-[9px] text-white/40 leading-none">{reading.sub}</span>
    </div>
  );
}

/** Drives one reading toward a new random target every few seconds with an
 *  eased tween (Framer's `animate` imperative API) — a believable live feed
 *  without needing a real telemetry socket for the demo. */
function useLiveKw(base: number, range: number) {
  const mv = useMotionValue(base);
  const [value, setValue] = useState(base);
  useEffect(() => {
    const unsub = mv.on("change", (v) => setValue(v));
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      const target = Math.max(0, base + (Math.random() - 0.5) * range * 2);
      animate(mv, target, { duration: 2.4, ease: "easeInOut" });
      setTimeout(tick, 2600 + Math.random() * 1400);
    };
    tick();
    return () => {
      cancelled = true;
      unsub();
    };
  }, [mv, base, range]);
  return value;
}

export default function HybridEnergyOverlay() {
  const solarKw = useLiveKw(3.4, 1.1);
  const evKw = useLiveKw(2.2, 1.6);
  const batteryKw = useLiveKw(0.9, 0.9);
  const gridKw = useLiveKw(0.6, 0.7);
  const homeKw = solarKw + batteryKw - evKw - gridKw > 0 ? solarKw * 0.55 : 1.8;

  // plain derived number, not a motion value — the component already
  // re-renders on every useLiveKw tick, so no separate reactivity is needed
  const roofGlow = Math.min(1, solarKw / 4.5);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-white/8 bg-[#070B12]" style={{ aspectRatio: "8/5" }}>
      <svg viewBox="0 0 640 400" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="heo-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0B1220" />
            <stop offset="100%" stopColor="#0E1826" />
          </linearGradient>
          <linearGradient id="heo-roof" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#454C56" />
            <stop offset="100%" stopColor="#2B3037" />
          </linearGradient>
          <linearGradient id="heo-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E3DDCF" />
            <stop offset="100%" stopColor="#C9C2B2" />
          </linearGradient>
          <linearGradient id="heo-glass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3A4F63" />
            <stop offset="55%" stopColor="#1C2733" />
            <stop offset="100%" stopColor="#0F161E" />
          </linearGradient>
          <linearGradient id="heo-drive" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8D8A82" />
            <stop offset="100%" stopColor="#6E6B64" />
          </linearGradient>
          <filter id="heo-blur" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
          <filter id="heo-sharp" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="1.4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id="heo-groundglow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2FBF71" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#2FBF71" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* backdrop: sky, ground, static architectural illustration — never animates */}
        <rect width="640" height="400" fill="url(#heo-sky)" />
        <rect x="0" y="330" width="640" height="70" fill="#0A0F16" />
        <ellipse cx="300" cy="200" rx="280" ry="180" fill="url(#heo-groundglow)" />

        {/* ── house: two-story gable elevation ── */}
        {/* roof */}
        <polygon points="300,40 460,140 140,140" fill="url(#heo-roof)" stroke="#1B1E23" strokeWidth="1.5" />
        <polygon points="300,40 460,140 440,140 300,58 160,140 140,140" fill="#20242A" opacity="0.5" />
        {/* solar array on the front-facing roof pitch */}
        <g opacity="0.95">
          {[0, 1, 2, 3].map((c) =>
            [0, 1].map((r) => (
              <rect key={`${c}-${r}`} x={228 + c * 32} y={96 + r * 22} width="28" height="18" rx="1.5"
                fill="#0B1119" stroke="#2FBF7166" strokeWidth="0.75" />
            )),
          )}
          <rect x="222" y="90" width="140" height="66" rx="3" fill="none" stroke="#2FBF71"
            opacity={roofGlow} strokeWidth="1.5" />
        </g>
        {/* upper floor */}
        <rect x="160" y="140" width="300" height="100" fill="url(#heo-wall)" stroke="#B0A996" strokeWidth="1" />
        <rect x="160" y="236" width="300" height="8" fill="#8B8378" />
        {/* ground floor */}
        <rect x="160" y="244" width="300" height="96" fill="url(#heo-wall)" stroke="#B0A996" strokeWidth="1" />
        {/* upper windows */}
        {[190, 240, 290, 340].map((x) => (
          <rect key={x} x={x} y={162} width="26" height="34" rx="1.5" fill="#141C24" stroke="#2A2D31" strokeWidth="1.5" />
        ))}
        {/* ground-floor glass facade (the "glass facade" the brief references) */}
        <rect x="330" y="256" width="110" height="76" rx="2" fill="url(#heo-glass)" stroke="#1B1E23" strokeWidth="2" />
        <line x1="385" y1="256" x2="385" y2="332" stroke="#1B1E23" strokeWidth="1.5" />
        {/* entry door */}
        <rect x="200" y="278" width="46" height="62" rx="1.5" fill="#23272C" stroke="#141618" strokeWidth="1.5" />

        {/* ── wall-mounted gateway hub, right beside the glass facade ── */}
        <rect x={NODE.gateway.x - 12} y={NODE.gateway.y - 16} width="24" height="32" rx="3" fill="#151A21" stroke="#2FBF7188" strokeWidth="1.5" />
        <rect x={NODE.gateway.x - 8} y={NODE.gateway.y - 10} width="16" height="8" rx="1" fill="#2FBF7133" />

        {/* ── driveway + EV charger ── */}
        <polygon points="440,340 620,340 640,400 420,400" fill="url(#heo-drive)" />
        <rect x={NODE.ev.x - 4} y={NODE.ev.y - 30} width="8" height="30" fill="#20242A" />
        <rect x={NODE.ev.x - 10} y={NODE.ev.y - 40} width="20" height="14" rx="2" fill="#151A21" stroke="#3AA0C866" strokeWidth="1.2" />
        {/* simplified EV silhouette parked beside the charger */}
        <g transform={`translate(${NODE.ev.x + 34}, ${NODE.ev.y - 6})`}>
          <rect x="-38" y="-14" width="76" height="18" rx="8" fill="#2B3038" stroke="#12151A" strokeWidth="1.5" />
          <path d="M -24,-14 L -14,-26 L 20,-26 L 30,-14 Z" fill="#2B3038" stroke="#12151A" strokeWidth="1.5" />
          <circle cx="-20" cy="4" r="7" fill="#0E1013" stroke="#3A4150" strokeWidth="1.5" />
          <circle cx="20" cy="4" r="7" fill="#0E1013" stroke="#3A4150" strokeWidth="1.5" />
        </g>

        {/* ── basement battery pack, left elevation ── */}
        <rect x={NODE.battery.x - 16} y={NODE.battery.y - 22} width="32" height="40" rx="3" fill="#0F2A1D" stroke="#2FBF7188" strokeWidth="1.5" />
        <rect x={NODE.battery.x - 10} y={NODE.battery.y - 2} width="20" height="14" fill="#2FBF7155" />

        {/* ── utility pylon, right edge ── */}
        <g transform={`translate(${NODE.grid.x}, ${NODE.grid.y})`} stroke="#8B97B8" strokeWidth="2" fill="none">
          <line x1="0" y1="-40" x2="0" y2="90" />
          <line x1="-26" y1="-30" x2="26" y2="-30" />
          <line x1="-18" y1="-12" x2="18" y2="-12" />
        </g>

        {/* ── telemetry: bezier beams from the gateway hub to every node ── */}
        <Beam d={cubic(NODE.solar, NODE.gateway, 0.22)} color="#E9B949" kw={solarKw} maxKw={5} />
        <Beam d={cubic(NODE.gateway, NODE.battery, -0.2)} color="#2FBF71" kw={batteryKw} maxKw={2.5} />
        <Beam d={cubic(NODE.gateway, NODE.ev, 0.18)} color="#3AA0C8" kw={evKw} maxKw={4} />
        <Beam d={cubic(NODE.gateway, NODE.grid, -0.16)} color="#8B97B8" kw={gridKw} maxKw={2} />
      </svg>

      <InstrumentCard x={NODE.solar.x} y={NODE.solar.y} reading={{ kw: solarKw, color: "#E9B949", label: "Solar", sub: "roof array" }} />
      <InstrumentCard x={NODE.gateway.x + 34} y={NODE.gateway.y + 6} reading={{ kw: homeKw, color: "#93C5FD", label: "Gateway", sub: "home load" }} align="left" />
      <InstrumentCard x={NODE.battery.x} y={NODE.battery.y - 10} reading={{ kw: batteryKw, color: "#2FBF71", label: "Battery", sub: "charging" }} />
      <InstrumentCard x={NODE.ev.x + 34} y={NODE.ev.y - 30} reading={{ kw: evKw, color: "#3AA0C8", label: "EV charger", sub: "driveway" }} align="left" />
      <InstrumentCard x={NODE.grid.x - 10} y={NODE.grid.y - 30} reading={{ kw: gridKw, color: "#8B97B8", label: "Grid", sub: "import" }} align="right" />
    </div>
  );
}
