"use client";

import React from "react";

export interface FlowData {
  solarKw: number;
  homeKw: number;
  batteryKw: number;   // >0 = charging, <0 = discharging
  batterySoc: number;  // 0–100
  gridKw: number;      // >0 = importing, <0 = exporting
  loads?: { label: string; kw: number; color: string }[];
}

function arc(cx: number, cy: number, r: number, startClock: number, sweepDeg: number): string {
  if (sweepDeg < 1) return "";
  if (sweepDeg > 359.9) sweepDeg = 359.9;
  const rad = (d: number) => (d - 90) * Math.PI / 180;
  const sx = cx + r * Math.cos(rad(startClock));
  const sy = cy + r * Math.sin(rad(startClock));
  const ex = cx + r * Math.cos(rad(startClock + sweepDeg));
  const ey = cy + r * Math.sin(rad(startClock + sweepDeg));
  return `M ${sx.toFixed(1)},${sy.toFixed(1)} A ${r},${r} 0 ${sweepDeg > 180 ? 1 : 0},1 ${ex.toFixed(1)},${ey.toFixed(1)}`;
}

// Quadratic bezier beam. Bows perpendicular outward using XOR sign rule for X-topology.
function beam(ax: number, ay: number, ar: number, bx: number, by: number, br: number, k = 55) {
  const dx = bx - ax, dy = by - ay;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / dist, uy = dy / dist;
  const p0x = ax + ar * ux, p0y = ay + ar * uy;
  const p1x = bx - br * ux, p1y = by - br * uy;
  const mx = (p0x + p1x) / 2, my = (p0y + p1y) / 2;
  const sign = (ax < bx) !== (ay < by) ? -1 : 1;
  const cpx = mx + k * sign * (dy / dist);
  const cpy = my - k * sign * (dx / dist);
  // True bezier midpoint at t=0.5
  const mid = { x: 0.25 * p0x + 0.5 * cpx + 0.25 * p1x, y: 0.25 * p0y + 0.5 * cpy + 0.25 * p1y };
  return { path: `M ${p0x.toFixed(1)},${p0y.toFixed(1)} Q ${cpx.toFixed(1)},${cpy.toFixed(1)} ${p1x.toFixed(1)},${p1y.toFixed(1)}`, mid };
}

const DEFAULT: FlowData = {
  solarKw: 4.2, homeKw: 3.8, batteryKw: 0.8, batterySoc: 62, gridKw: -0.4, loads: [],
};

// Memoized: the SVG rebuilds expensive bezier paths and arc strings on every render.
// Only re-render when actual power values change, not on every parent state update.
const EnergyFlowDiagram = React.memo(function EnergyFlowDiagram({ data = DEFAULT }: { data?: FlowData }) {
  const { solarKw, homeKw, batteryKw, batterySoc, gridKw } = data;

  const W = 520, H = 300, VT = -10;
  const gwX = 260, gwY = 150, gwR = 26;
  const sX = 88,  sY = 68,  sR = 24;
  const bX = 432, bY = 68,  bR = 22;
  const hX = 88,  hY = 234, hR = 22;
  const gX = 432, gY = 234, gR = 22;

  const exporting  = gridKw < 0;
  const charging   = batteryKw > 0;
  const battActive = Math.abs(batteryKw) > 0.05;

  // Normalize beam speed: all beams use the same formula so they feel cohesive.
  // Range: 0.35 (very low power) → 1.6 (high power). Reference scale = 6 kW.
  const beamSpeed = (kw: number) => Math.max(0.35, Math.min(1.6, kw / 6));

  const sCol  = "#2FBF71";
  const bCol  = charging  ? "#2FBF71" : "#E9B949";
  const gCol  = exporting ? "#E9B949" : "#6B7A99";
  const hCol  = "#93C5FD";
  const gwCol = "#F0F6FF";

  const sAR = sR + 7, bAR = bR + 7, gAR = gR + 7, hAR = hR + 7;
  const sArcPct = Math.min(solarKw / 6.5, 1);
  const bArcPct = batterySoc / 100;
  const gArcPct = Math.min(Math.abs(gridKw) / 5.0, 1);
  const hArcPct = Math.min(homeKw / 8.0, 1);

  const beamS = beam(sX, sY, sR, gwX, gwY, gwR);
  const beamB = beam(bX, bY, bR, gwX, gwY, gwR);
  const beamH = beam(hX, hY, hR, gwX, gwY, gwR);
  const beamG = beam(gX, gY, gR, gwX, gwY, gwR);

  // Beam label — placed exactly at bezier midpoint, no offset
  function BeamLabel({ x, y, value, sub, col }: { x: number; y: number; value: string; sub: string; col: string }) {
    return (
      <g transform={`translate(${x.toFixed(1)},${y.toFixed(1)})`}>
        <rect x="-27" y="-14" width="54" height="28" rx="10"
          fill="rgba(6,10,16,.95)" stroke={col} strokeWidth="1.2"
          style={{ filter: `drop-shadow(0 0 4px ${col}55)` }} />
        <text x="0" y="-3" textAnchor="middle" dominantBaseline="middle"
          fill={col} fontSize="8.5" fontWeight="700" fontFamily="var(--font-jetbrains-mono),monospace">{value}</text>
        <text x="0" y="8" textAnchor="middle" dominantBaseline="middle"
          fill={col} fontSize="6.5" fontFamily="DM Sans,system-ui" opacity=".7">{sub}</text>
      </g>
    );
  }

  // Beam renderer — 4-layer system: deep halo + track + fast dashes + slow dashes
  function Beam({ d, col, dir, speed = 1.0, active = true }: {
    d: string; col: string; dir: "fwd" | "rev"; speed?: number; active?: boolean;
  }) {
    if (!active) return <path d={d} fill="none" stroke={col} strokeWidth="1.2" strokeOpacity=".06" strokeDasharray="3 9" />;
    return <>
      {/* Layer 1 — deep atmospheric glow */}
      <path d={d} fill="none" stroke={col} strokeWidth="28" opacity=".07" style={{ filter: "url(#ef-halo)" }} />
      {/* Layer 2 — mid glow */}
      <path d={d} fill="none" stroke={col} strokeWidth="6" opacity=".12" style={{ filter: "url(#ef-glow)" }} />
      {/* Layer 3 — static dotted track */}
      <path d={d} fill="none" stroke={col} strokeWidth="1" strokeOpacity=".18" strokeDasharray="2 10" />
      {/* Layer 4 — primary animated flow (slower) */}
      <path d={d} fill="none" stroke={col} strokeWidth="2.5" strokeLinecap="round" strokeOpacity=".9"
        className={`ef-${dir}`} style={{ animationDuration: `${1.4 / speed}s`, filter: "url(#ef-sharp)" }} />
      {/* Layer 5 — fast sparkle overlay */}
      <path d={d} fill="none" stroke={col} strokeWidth="1.2" strokeLinecap="round" strokeOpacity=".5"
        className={`ef-${dir}`} style={{ animationDuration: `${0.7 / speed}s`, animationDelay: `${-0.35 / speed}s`, filter: "url(#ef-sharp)" }} />
    </>;
  }

  return (
    <div className="w-4/5 select-none mx-auto">
      <svg viewBox={`0 ${VT} ${W} ${H}`} className="w-full" style={{ height: "auto" }} preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id="ef-dots" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="14" cy="14" r="0.65" fill="var(--foreground)" opacity="0.06" />
          </pattern>
          <filter id="ef-halo" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="12" />
          </filter>
          <filter id="ef-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="ef-sharp" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="ef-nhalo" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
          {/* Hexagon clip for gateway */}
          <clipPath id="ef-hex-clip">
            <polygon points={[0,1,2,3,4,5].map(i => {
              const a = (i * 60 - 30) * Math.PI / 180;
              return `${(gwX + gwR * Math.cos(a)).toFixed(1)},${(gwY + gwR * Math.sin(a)).toFixed(1)}`;
            }).join(' ')} />
          </clipPath>
        </defs>

        <style>{`
          @keyframes ef-fwd  { to { stroke-dashoffset: -18; } }
          @keyframes ef-rev  { to { stroke-dashoffset:  18; } }
          @keyframes ef-fwd2 { to { stroke-dashoffset: -9;  } }
          @keyframes ef-ring { 0%,100%{ opacity:.18; transform:scale(1); } 65%{ opacity:0; transform:scale(1.85); } }
          @keyframes ef-live { 0%,100%{ opacity:1; } 50%{ opacity:.15; } }
          @keyframes ef-pulse { 0%,100%{ opacity:.45; } 50%{ opacity:1; } }
          @keyframes ef-spin  { to { transform: rotate(360deg); } }
          .ef-fwd  { stroke-dasharray:10 8; animation:ef-fwd  linear infinite; }
          .ef-rev  { stroke-dasharray:10 8; animation:ef-rev  linear infinite; }
          .ef-ring { transform-box:fill-box; transform-origin:center; animation:ef-ring 3s ease-out infinite; }
          .ef-live { animation:ef-live 1.4s ease-in-out infinite; }
          .ef-pulse { animation:ef-pulse 2.6s ease-in-out infinite; }
          .ef-spin  { transform-box:fill-box; transform-origin:center; animation:ef-spin 12s linear infinite; }
        `}</style>

        <rect x="0" y={VT} width={W} height={H - VT} fill="url(#ef-dots)" />

        {/* ══ BEAMS ══ */}
        <Beam d={beamS.path} col={sCol} dir="fwd"  speed={beamSpeed(solarKw)}              active={solarKw > 0} />
        <Beam d={beamB.path} col={bCol} dir={charging ? "rev" : "fwd"} speed={beamSpeed(Math.abs(batteryKw))} active={battActive} />
        <Beam d={beamG.path} col={gCol} dir={exporting ? "rev" : "fwd"} speed={beamSpeed(Math.abs(gridKw))}  active={true} />
        <Beam d={beamH.path} col={hCol} dir="rev"  speed={beamSpeed(homeKw)}              active={homeKw > 0} />

        {/* ── kW labels — exactly at bezier midpoint ── */}
        {solarKw > 0 && <BeamLabel x={beamS.mid.x} y={beamS.mid.y} value={`${solarKw.toFixed(2)} kW`} sub="Generating" col={sCol} />}
        {battActive   && <BeamLabel x={beamB.mid.x} y={beamB.mid.y} value={`${Math.abs(batteryKw).toFixed(2)} kW`} sub={charging ? "Charging" : "Discharging"} col={bCol} />}
        <BeamLabel x={beamG.mid.x} y={beamG.mid.y} value={`${Math.abs(gridKw).toFixed(2)} kW`} sub={exporting ? "Exporting" : "Importing"} col={gCol} />
        <BeamLabel x={beamH.mid.x} y={beamH.mid.y} value={`${homeKw.toFixed(2)} kW`} sub="Consuming" col={hCol} />

        {/* ══ SOLAR NODE ══ */}
        <g>
          {solarKw > 0 && <>
            <circle cx={sX} cy={sY} r={sR + 18} fill={sCol} opacity=".04" filter="url(#ef-nhalo)" />
            <circle cx={sX} cy={sY} r={sR + 11} fill="none" stroke="rgba(47,191,113,.18)" strokeWidth="1" className="ef-ring" />
          </>}
          <path d={arc(sX, sY, sAR, 225, 270)} fill="none" stroke="rgba(47,191,113,.1)" strokeWidth="5" strokeLinecap="round" />
          {sArcPct > 0 && <path d={arc(sX, sY, sAR, 225, sArcPct * 270)} fill="none" stroke={sCol} strokeWidth="5" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 6px rgba(47,191,113,.9))" }} />}
          <circle cx={sX} cy={sY} r={sR} fill="rgba(47,191,113,.08)" stroke="rgba(47,191,113,.32)" strokeWidth="1.5" />
          <g transform={`translate(${sX},${sY - 1})`}>
            <circle r="4" fill={sCol} opacity=".9" />
            {[0,45,90,135,180,225,270,315].map(a => {
              const c = Math.cos(a*Math.PI/180), s = Math.sin(a*Math.PI/180);
              return <line key={a} x1={c*5.5} y1={s*5.5} x2={c*8} y2={s*8} stroke={sCol} strokeWidth="1.3" strokeLinecap="round" opacity=".75" />;
            })}
          </g>
          <text x={sX} y={sY + sR + 14} textAnchor="middle" fill={sCol} fontSize="11" fontWeight="700" fontFamily="DM Sans,system-ui">Solar</text>
        </g>

        {/* ══ BATTERY NODE ══ */}
        <g>
          {battActive && <>
            <circle cx={bX} cy={bY} r={bR + 18} fill={bCol} opacity=".03" filter="url(#ef-nhalo)" />
            <circle cx={bX} cy={bY} r={bR + 10} fill="none" stroke={`${bCol}20`} strokeWidth="1" className="ef-ring" />
          </>}
          <path d={arc(bX, bY, bAR, 225, 270)} fill="none" stroke={`${bCol}14`} strokeWidth="4.5" strokeLinecap="round" />
          {bArcPct > 0 && <path d={arc(bX, bY, bAR, 225, bArcPct * 270)} fill="none" stroke={bCol} strokeWidth="4.5" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 5px ${bCol})` }} />}
          <circle cx={bX} cy={bY} r={bR} fill={`${bCol}10`} stroke={`${bCol}32`} strokeWidth="1.5" />
          <g transform={`translate(${bX},${bY - 1})`}>
            <rect x="-6" y="-4.5" width="10" height="8" rx="2" fill="none" stroke={bCol} strokeWidth="1.5" opacity=".85" />
            <rect x="4" y="-2.5" width="2.5" height="4.5" rx="1" fill={bCol} opacity=".55" />
            <rect x="-4.5" y="-3" width={Math.max(1, (batterySoc/100)*7)} height="5.5" rx="1" fill={bCol} opacity=".65" />
          </g>
          <text x={bX} y={bY + 10} textAnchor="middle" dominantBaseline="middle"
            fill={bCol} fontSize="8.5" fontWeight="800" fontFamily="var(--font-jetbrains-mono),monospace">{batterySoc}%</text>
          {/* label BELOW like all other nodes */}
          <text x={bX} y={bY + bR + 14} textAnchor="middle" fill={bCol} fontSize="11" fontWeight="700" fontFamily="DM Sans,system-ui">Battery</text>
        </g>

        {/* ══ HOME NODE ══ */}
        <g>
          <path d={arc(hX, hY, hAR, 225, 270)} fill="none" stroke="rgba(147,197,253,.1)" strokeWidth="4.5" strokeLinecap="round" />
          {hArcPct > 0 && <path d={arc(hX, hY, hAR, 225, hArcPct * 270)} fill="none" stroke={hCol} strokeWidth="4.5" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 5px rgba(147,197,253,.7))" }} />}
          <circle cx={hX} cy={hY} r={hR} fill="rgba(147,197,253,.06)" stroke="rgba(147,197,253,.28)" strokeWidth="1.5" />
          <g transform={`translate(${hX},${hY - 2})`}>
            <path d="M 0,-8.5 L 8.5,1.5 L 7,1.5 L 7,8.5 L -7,8.5 L -7,1.5 L -8.5,1.5 Z"
              fill="rgba(147,197,253,.1)" stroke="rgba(147,197,253,.65)" strokeWidth="1.5" strokeLinejoin="round" />
            <rect x="-3" y="3" width="6" height="5.5" rx="1.2" fill="rgba(147,197,253,.38)" />
          </g>
          <text x={hX} y={hY + hR + 14} textAnchor="middle" fill={hCol} fontSize="11" fontWeight="700" fontFamily="DM Sans,system-ui">Home</text>
        </g>

        {/* ══ GRID NODE ══ */}
        <g>
          <path d={arc(gX, gY, gAR, 225, 270)} fill="none" stroke={`${gCol}14`} strokeWidth="4.5" strokeLinecap="round" />
          {gArcPct > 0 && <path d={arc(gX, gY, gAR, 225, gArcPct * 270)} fill="none" stroke={gCol} strokeWidth="4.5" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 5px ${gCol})` }} />}
          <circle cx={gX} cy={gY} r={gR} fill={`${gCol}10`} stroke={`${gCol}32`} strokeWidth="1.5" />
          <path d={`M ${gX+1.5},${gY-6.5} L ${gX-3},${gY+0.5} L ${gX+0.5},${gY+0.5} L ${gX-1.5},${gY+6.5} L ${gX+3},${gY-0.5} L ${gX-0.5},${gY-0.5} Z`}
            fill={gCol} opacity=".88" />
          <text x={gX} y={gY + gR + 14} textAnchor="middle" fill={gCol} fontSize="11" fontWeight="700" fontFamily="DM Sans,system-ui">Grid</text>
        </g>

        {/* ══ GATEWAY NODE — matches staff HubNode: indigo radial, Activity icon, pulse ring ══ */}
        <g>
          {/* Pulsing outer ring (matches staff: opacity 0.15→0.45, scale 1→1.28) */}
          <circle cx={gwX} cy={gwY} r={gwR + 14} fill="none" stroke="rgba(99,102,241,.28)" strokeWidth="1.5" className="ef-pulse" />
          {/* Radial gradient fill circle — matches staff radial-gradient */}
          <defs>
            <radialGradient id="ef-hub-grad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="rgba(99,102,241,0.5)" />
              <stop offset="100%" stopColor="var(--card)" />
            </radialGradient>
          </defs>
          <circle cx={gwX} cy={gwY} r={gwR} fill="url(#ef-hub-grad)" stroke="rgba(99,102,241,.6)" strokeWidth="2" />
          {/* Activity icon (Lucide Activity = polyline zigzag) */}
          <g transform={`translate(${gwX},${gwY})`} opacity=".9">
            <polyline
              points="-11,0 -6.5,-8 -2,3 2.5,-6 6.5,2 11,2"
              fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            />
          </g>
          {/* Label — indigo, uppercase, tracked (matches staff) */}
          <text x={gwX} y={gwY + gwR + 14} textAnchor="middle"
            fill="#6366f1" fontSize="10" fontWeight="800" letterSpacing="1.5"
            fontFamily="DM Sans,system-ui" style={{ textTransform: "uppercase" }}>Gateway</text>
        </g>

        {/* ── LIVE badge ── */}
        <g transform={`translate(${W - 62},${VT + 14})`}>
          <rect width="56" height="20" rx="10" fill="rgba(47,191,113,.1)" stroke="rgba(47,191,113,.35)" strokeWidth="1" />
          <circle cx="11" cy="10" r="3.5" fill={sCol} className="ef-live" />
          <text x="19" y="10" dominantBaseline="middle" fill={sCol} fontSize="9" fontWeight="600" fontFamily="DM Sans,system-ui">LIVE</text>
        </g>
      </svg>
    </div>
  );
});

export default EnergyFlowDiagram;
