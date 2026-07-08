"use client";

import { AlertOctagon, AlertTriangle, CheckCircle2 } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { PulseDot } from "@/components/care/InstrumentGauge";
import type { CareFault } from "@/lib/care/useCareFaults";
import type { MaintenanceTip } from "@/lib/care/types";

const SEVERITY_COLOR: Record<CareFault["severity"], string> = {
  critical: "#EF4444",
  warning: "#E9B949",
};

function Row({
  accent,
  children,
}: {
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative pl-4 py-3.5">
      <span
        className="absolute left-0 top-1.5 bottom-1.5 .w-\[3px\] rounded-full"
        style={{ background: accent, boxShadow: `0 0 8px ${accent}55` }}
      />
      {children}
    </div>
  );
}

function FaultRow({ fault }: { fault: CareFault }) {
  const color = SEVERITY_COLOR[fault.severity];
  const Icon = fault.severity === "critical" ? AlertOctagon : AlertTriangle;
  return (
    <Row accent={color}>
      <div className="flex items-start gap-3">
        <Icon size={17} style={{ color }} className="shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <PulseDot color={color} />
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{fault.component}</p>
          </div>
          <p className="text-foreground font-medium mt-1">{fault.issue}</p>
          {fault.details && <p className="text-muted-foreground text-sm mt-0.5">{fault.details}</p>}
          <p className="text-foreground/90 text-sm mt-1.5">{fault.action}</p>
        </div>
      </div>
    </Row>
  );
}

function AllClearRow({ onSchedule, canSchedule }: { onSchedule: () => void; canSchedule: boolean }) {
  return (
    <Row accent="#2FBF71">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <CheckCircle2 size={17} className="text-emerald-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">All Clear</p>
            <p className="text-foreground font-medium mt-1">No faults detected — system running smoothly</p>
            <p className="text-muted-foreground text-sm mt-0.5">
              {canSchedule
                ? "Schedule a routine check-up to keep your system at peak efficiency."
                : "A routine check-up is already scheduled — see your 360care plan."}
            </p>
          </div>
        </div>
        {canSchedule && (
          <button
            onClick={onSchedule}
            className="shrink-0 ml-8 sm:ml-0 px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-colors whitespace-nowrap cursor-pointer"
          >
            Schedule a Service
          </button>
        )}
      </div>
    </Row>
  );
}

export default function DiagnosticsPanel({
  faults,
  tips,
  hasActiveBooking,
  onSchedule,
}: {
  faults: CareFault[];
  tips: MaintenanceTip[];
  hasActiveBooking: boolean;
  onSchedule: () => void;
}) {
  const criticalCount = faults.filter((f) => f.severity === "critical").length;
  const warningCount = faults.filter((f) => f.severity === "warning").length;

  const statusColor = criticalCount > 0 ? "#EF4444" : warningCount > 0 ? "#E9B949" : "#2FBF71";
  const statusLabel =
    criticalCount > 0
      ? `${criticalCount} Critical`
      : warningCount > 0
        ? `${warningCount} Advisory`
        : "Nominal";

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">Diagnostics</h2>
        <div className="flex items-center gap-1.5">
          <PulseDot color={statusColor} />
          <span className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: statusColor }}>
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="divide-y divide-border">
        {faults.map((fault) => (
          <FaultRow key={fault.id} fault={fault} />
        ))}
        {faults.length === 0 && (
          <AllClearRow onSchedule={onSchedule} canSchedule={!hasActiveBooking} />
        )}
      </div>

      {tips.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-2.5">
            Maintenance Tips
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {tips.map((tip) => (
              <div
                key={tip.description}
                className="flex items-start gap-2.5 rounded-lg border border-border .bg-white\/\[0\.02\] p-3"
              >
                <span className="text-base leading-none shrink-0 mt-0.5">{tip.icon}</span>
                <div className="min-w-0">
                  <p className="text-foreground text-sm">{tip.description}</p>
                  <span className="inline-block mt-1 font-mono text-[9px] uppercase .tracking-\[0\.1em\] text-emerald-400/80 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                    {tip.frequency}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
}
