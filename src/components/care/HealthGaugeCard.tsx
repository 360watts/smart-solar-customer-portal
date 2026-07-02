"use client";

import { useEffect, useId } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { ChevronRight, RadioTower } from "lucide-react";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import GlassCard from "@/components/ui/GlassCard";
import { MiniArc, PulseDot, COMPONENT_META, healthStatusColor } from "@/components/care/InstrumentGauge";
import { statusLabel, type SystemHealthData } from "@/lib/care/types";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function cxy(deg: number, cx: number, cy: number, r: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// Tick-mark bezel ring — mirrors the staff dashboard's instrument-panel gauge language.
function TickRing({ cx, cy, r, color }: { cx: number; cy: number; r: number; color: string }) {
  const count = 36;
  return (
    <g>
      {Array.from({ length: count }).map((_, i) => {
        const isMajor = i % 9 === 0;
        const isMed = i % 3 === 0;
        const angle = (i / count) * 360 - 90;
        const rad = (angle * Math.PI) / 180;
        const len = isMajor ? 8 : isMed ? 5 : 3;
        const w = isMajor ? 1.5 : isMed ? 0.9 : 0.6;
        const opacity = isMajor ? 0.55 : isMed ? 0.3 : 0.15;
        const x1 = cx + (r - len) * Math.cos(rad);
        const y1 = cy + (r - len) * Math.sin(rad);
        const x2 = cx + r * Math.cos(rad);
        const y2 = cy + r * Math.sin(rad);
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={w} opacity={opacity} strokeLinecap="round" />
        );
      })}
    </g>
  );
}

function MainRing({ score, status, size }: { score: number; status: 0 | 1 | 2; size: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const tickR = cx - 3;
  const bezelR = cx - 12;
  const arcR = cx - 20;
  const stroke = 8;
  const color = healthStatusColor(status);
  const uid = `care-gauge-${useId().replace(/:/g, "")}`;

  const s = cxy(225, cx, cy, arcR);
  const e = cxy(135, cx, cy, arcR);
  const arcPath = `M ${s.x} ${s.y} A ${arcR} ${arcR} 0 1 1 ${e.x} ${e.y}`;

  const mv = useMotionValue(0);
  const offset = useTransform(mv, [0, 100], [1, 0]);
  useEffect(() => {
    const controls = animate(mv, score, { duration: 1.4, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [score, mv]);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible", display: "block" }}>
        <defs>
          <filter id={`${uid}-glow`} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="3" result="b1" />
            <feGaussianBlur stdDeviation="6" result="b2" />
            <feMerge>
              <feMergeNode in="b2" />
              <feMergeNode in="b1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id={`${uid}-grad`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
        </defs>
        <TickRing cx={cx} cy={cy} r={tickR} color={color} />
        <circle cx={cx} cy={cy} r={bezelR} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" opacity="0.5" />
        <path d={arcPath} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} strokeLinecap="round" />
        <motion.path
          d={arcPath}
          fill="none"
          stroke={`url(#${uid}-grad)`}
          strokeWidth={stroke}
          strokeLinecap="round"
          pathLength={1}
          style={{ strokeDashoffset: offset, strokeDasharray: "1 1", filter: `url(#${uid}-glow)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pb-2">
        <span className="font-mono text-2xl font-extrabold" style={{ color, textShadow: `0 0 12px ${color}66` }}>
          <AnimatedNumber value={score} decimals={0} suffix="%" />
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45 mt-1">Health</span>
      </div>
    </div>
  );
}

function ComponentDial({ compKey, data }: { compKey: keyof typeof COMPONENT_META; data: SystemHealthData["inverter"] }) {
  const meta = COMPONENT_META[compKey];
  const Icon = meta.icon;
  const sc = healthStatusColor(data.status);
  const [highlightKey, highlightValue] = Object.entries(data.details)[0] ?? [];

  return (
    <div className="flex flex-col items-center gap-2 px-3 py-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
      <div className="relative" style={{ width: 52, height: 52 }}>
        <MiniArc score={data.health_score} color={meta.color} size={52} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon size={16} style={{ color: meta.color }} />
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <PulseDot color={sc} />
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 whitespace-nowrap">{meta.label}</span>
      </div>
      <span className="font-mono text-sm font-bold" style={{ color: meta.color }}>{data.health_score}%</span>
      {highlightKey && (
        <p className="text-[10px] text-white/40 text-center leading-tight truncate w-full" title={highlightKey}>
          {highlightKey}: <span className="text-white/60">{highlightValue}</span>
        </p>
      )}
    </div>
  );
}

export default function HealthGaugeCard({
  health,
  onViewDetails,
}: {
  health: SystemHealthData;
  onViewDetails: () => void;
}) {
  return (
    <GlassCard className="h-full">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-white font-semibold text-base" style={{ fontFamily: "var(--font-display)" }}>
            System Health
          </h3>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45 mt-1">
            Overall <span className="text-white/25">|</span>{" "}
            <span style={{ color: healthStatusColor(health.overall_status) }}>{statusLabel(health.overall_status)}</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <button
            onClick={onViewDetails}
            className="flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300 transition-colors whitespace-nowrap"
          >
            View Details <ChevronRight size={14} />
          </button>
          <span className="flex items-center gap-1 font-mono text-[10px] text-white/35 whitespace-nowrap">
            <RadioTower size={11} /> Synced {timeAgo(health.last_updated)}
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-6">
        <div className="flex items-center justify-center">
          <MainRing score={health.overall_score} status={health.overall_status} size={128} />
        </div>
        <div className="flex-1 grid grid-cols-3 gap-2">
          <ComponentDial compKey="solar_panel" data={health.solar_panel} />
          <ComponentDial compKey="inverter" data={health.inverter} />
          <ComponentDial compKey="battery" data={health.battery} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/5">
        <div className="rounded-[10px] bg-white/[0.04] p-3">
          <p className="text-white/50 text-xs mb-1">System Size</p>
          <p className="text-white text-base font-semibold">{health.installation.system_size}</p>
        </div>
        <div className="rounded-[10px] bg-white/[0.04] p-3">
          <p className="text-white/50 text-xs mb-1">Installed On</p>
          <p className="text-white text-base font-semibold">{health.installation.installed_date}</p>
        </div>
        <div className="rounded-[10px] bg-white/[0.04] p-3">
          <p className="text-white/50 text-xs mb-1">Panel Warranty</p>
          <p className="text-white text-base font-semibold">{health.solar_panel.warranty || "—"}</p>
        </div>
        <div className="rounded-[10px] bg-white/[0.04] p-3">
          <p className="text-white/50 text-xs mb-1">Inverter Warranty</p>
          <p className="text-white text-base font-semibold">{health.inverter.warranty || "—"}</p>
        </div>
      </div>
    </GlassCard>
  );
}
