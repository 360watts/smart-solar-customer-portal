"use client";

import type React from "react";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Sun } from "lucide-react";
import { parseRecContext } from "@/lib/recommendationContext";
import type { CustomerRecommendation } from "@/lib/api";

const clampPct = gsap.utils.clamp(0, 100);

/** Reads prefers-reduced-motion once; tween durations collapse to 0 so end-states still render, just instantly. */
function tweenDuration(base: number): number {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return base;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : base;
}

/* ---------------------------------------------------------------------- *
 * Usage & Savings — shared "Current Flow" motif: a pulse of current
 * travels the wire continuously. phantom_load peels a pulse off into a
 * leaking ring; load_shift slides a marker to where usage actually sits.
 * ---------------------------------------------------------------------- */

function FlowTrack({ trackRef }: { trackRef: React.RefObject<SVGPathElement | null> }) {
  useGSAP(() => {
    if (!trackRef.current) return;
    const length = trackRef.current.getTotalLength();
    gsap.set(trackRef.current, { strokeDasharray: `${length * 0.06} ${length}` });
    gsap.to(trackRef.current, {
      strokeDashoffset: -length,
      duration: tweenDuration(2.2),
      ease: "none",
      repeat: -1,
    });
  }, []);

  return (
    <svg viewBox="0 0 200 24" className="w-full h-6" preserveAspectRatio="none">
      <line x1="0" y1="12" x2="200" y2="12" stroke="color-mix(in srgb, var(--glow-amber) 22%, transparent)" strokeWidth={2} />
      <path
        ref={trackRef}
        d="M0,12 L200,12"
        fill="none"
        stroke="var(--glow-amber)"
        strokeWidth={2.5}
        strokeLinecap="round"
        style={{ filter: "drop-shadow(0 0 4px color-mix(in srgb, var(--glow-amber) 70%, transparent))" }}
      />
    </svg>
  );
}

function PhantomLoadVisual({ data }: { data: { avg_power_w: number; monthly_cost_estimate: number } }) {
  const trackRef = useRef<SVGPathElement>(null);
  const leakRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const counter = { value: 0 };
      gsap.to(counter, {
        value: data.monthly_cost_estimate,
        duration: tweenDuration(1.3),
        ease: "power3.out",
        onUpdate: () => {
          if (valueRef.current) valueRef.current.textContent = `₹${Math.round(counter.value)}`;
        },
      });
      if (leakRef.current) {
        gsap.fromTo(leakRef.current, { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: tweenDuration(0.4), delay: tweenDuration(0.3), ease: "back.out(2.4)" });
      }
      if (ringRef.current) {
        gsap.set(ringRef.current, { scale: 0.6, autoAlpha: 0.7 });
        gsap.to(ringRef.current, {
          scale: 2.4,
          autoAlpha: 0,
          duration: tweenDuration(1.6),
          ease: "power1.out",
          repeat: -1,
          repeatDelay: tweenDuration(0.5),
          delay: tweenDuration(0.6),
        });
      }
    },
    { dependencies: [data.monthly_cost_estimate] },
  );

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <FlowTrack trackRef={trackRef} />
        <div
          ref={leakRef}
          className="absolute left-[42%] top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
          style={{ background: "var(--glow-amber)" }}
        />
        <div
          ref={ringRef}
          className="absolute left-[42%] top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full"
          style={{ border: "1.5px solid var(--glow-amber)" }}
        />
      </div>
      <div className="shrink-0 text-right">
        <span ref={valueRef} className="text-xl font-semibold text-foreground tabular-nums block">
          ₹0
        </span>
        <span className="text-xs text-muted-foreground">/month wasted</span>
      </div>
    </div>
  );
}

function LoadShiftVisual({ data }: { data: { peak_fraction: number } }) {
  const trackRef = useRef<SVGPathElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const sunRef = useRef<HTMLDivElement>(null);
  const targetPct = clampPct(data.peak_fraction * 100);

  useGSAP(
    () => {
      if (!dotRef.current || !wrapRef.current) return;
      const trackWidth = wrapRef.current.offsetWidth;
      const targetX = (targetPct / 100) * trackWidth;

      gsap.set(dotRef.current, { x: 0 });
      gsap.set(sunRef.current, { autoAlpha: 0, scale: 0.4 });

      gsap
        .timeline({ defaults: { duration: tweenDuration(1.1) } })
        .to(dotRef.current, { x: targetX, ease: "elastic.out(1, 0.65)" }, 0)
        .to(sunRef.current, { autoAlpha: 1, scale: 1, ease: "back.out(2)", duration: tweenDuration(0.4) }, ">-0.3");
    },
    { dependencies: [targetPct] },
  );

  return (
    <div className="flex items-center gap-2">
      <div ref={wrapRef} className="relative flex-1">
        <FlowTrack trackRef={trackRef} />
        <div
          ref={dotRef}
          className="absolute top-1/2 left-0 w-3 h-3 -mt-1.5 -ml-1.5 rounded-full border-2 border-white"
          style={{ background: "var(--glow-amber)", boxShadow: "0 0 8px 1px var(--glow-amber)" }}
        />
      </div>
      <div ref={sunRef} className="shrink-0" style={{ color: "var(--glow-amber)" }}>
        <Sun size={16} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- *
 * Billing & Financial — shared "Ledger Meter" motif: a segmented HUD bar
 * fills in a quick left-to-right stagger, like an odometer settling.
 * ---------------------------------------------------------------------- */

const LEDGER_SEGMENTS = 14;

function LedgerMeter({ pct, danger }: { pct: number; danger: boolean }) {
  const segRefs = useRef<(HTMLDivElement | null)[]>([]);
  const litCount = Math.round((pct / 100) * LEDGER_SEGMENTS);
  const color = danger ? "#ef4444" : "#8b7cf6";

  useGSAP(
    () => {
      segRefs.current.forEach((seg, i) => {
        if (!seg) return;
        const lit = i < litCount;
        gsap.set(seg, { scaleY: 0.35, transformOrigin: "center", backgroundColor: "color-mix(in srgb, #8b7cf6 14%, transparent)" });
        if (lit) {
          gsap.to(seg, {
            scaleY: 1,
            backgroundColor: color,
            boxShadow: `0 0 8px color-mix(in srgb, ${color} 60%, transparent)`,
            duration: tweenDuration(0.35),
            delay: tweenDuration(i * 0.045),
            ease: "back.out(2)",
          });
        }
      });
    },
    { dependencies: [litCount, danger] },
  );

  return (
    <div className="grid gap-[3px] h-7 w-full" style={{ gridTemplateColumns: `repeat(${LEDGER_SEGMENTS}, 1fr)` }}>
      {Array.from({ length: LEDGER_SEGMENTS }).map((_, i) => (
        <div key={i} ref={(el) => { segRefs.current[i] = el; }} className="rounded-[2px]" />
      ))}
    </div>
  );
}

function TariffSlabVisual({ data }: { data: { units_so_far: number; slab_top: number } }) {
  const pct = data.slab_top > 0 ? clampPct((data.units_so_far / data.slab_top) * 100) : 0;

  return (
    <div className="flex flex-col gap-1.5">
      <LedgerMeter pct={pct} danger={pct >= 90} />
      <span className="text-xs text-muted-foreground">
        {Math.round(data.units_so_far)} of {Math.round(data.slab_top)} units this cycle
      </span>
    </div>
  );
}

function WalletUsageVisual({ data }: { data: { balance_kwh: number } }) {
  const pct = clampPct((data.balance_kwh / Math.max(data.balance_kwh, 50)) * 100);

  return (
    <div className="flex flex-col gap-1.5">
      <LedgerMeter pct={pct} danger={false} />
      <span className="text-xs text-muted-foreground">{Math.round(data.balance_kwh)} kWh banked credit</span>
    </div>
  );
}

/* ---------------------------------------------------------------------- *
 * System Health — "Vitals Pulse" motif: an EKG-style scan line whose
 * amplitude and color track the panel performance score.
 * ---------------------------------------------------------------------- */

function UnderperformanceVisual({ data }: { data: { pv_score: number } }) {
  const groupRef = useRef<SVGGElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const score = clampPct(data.pv_score);
  const healthy = score >= 85;
  const color = healthy ? "var(--glow-green)" : "var(--glow-amber)";
  const amplitude = 0.55 + (score / 100) * 0.6;

  useGSAP(
    () => {
      if (!lineRef.current || !groupRef.current) return;
      const length = lineRef.current.getTotalLength();
      gsap.set(lineRef.current, { strokeDasharray: length, strokeDashoffset: length });
      gsap.set(groupRef.current, { scaleY: 0.3, transformOrigin: "center" });

      const tl = gsap.timeline({ defaults: { duration: tweenDuration(1.2), ease: "power2.out" } });
      tl.to(groupRef.current, { scaleY: amplitude }, 0).to(lineRef.current, { strokeDashoffset: 0 }, 0);
      gsap.to(lineRef.current, {
        strokeDashoffset: -length,
        duration: tweenDuration(2.6),
        ease: "none",
        repeat: -1,
        delay: tweenDuration(1.2),
      });
    },
    { dependencies: [score] },
  );

  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 200 40" className="flex-1 h-10" preserveAspectRatio="none">
        <g ref={groupRef}>
          <path
            ref={lineRef}
            d="M0,20 L40,20 L52,4 L64,36 L76,20 L100,20 L112,10 L124,32 L136,20 L200,20"
            fill="none"
            stroke={color}
            strokeWidth={2.25}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 5px color-mix(in srgb, ${color} 65%, transparent))` }}
          />
        </g>
      </svg>
      <span className="text-lg font-semibold text-foreground tabular-nums shrink-0">{Math.round(score)}%</span>
    </div>
  );
}

export function StoryVisual({ rec }: { rec: CustomerRecommendation }) {
  const parsed = parseRecContext(rec);
  if (parsed.data === null) return null;

  switch (parsed.rec_type) {
    case "phantom_load":
      return <PhantomLoadVisual data={parsed.data} />;
    case "load_shift":
      return <LoadShiftVisual data={parsed.data} />;
    case "tariff_slab":
      return <TariffSlabVisual data={parsed.data} />;
    case "wallet_usage":
      return <WalletUsageVisual data={parsed.data} />;
    case "underperformance":
      return <UnderperformanceVisual data={parsed.data} />;
    default:
      return null;
  }
}

export default StoryVisual;
