import { AlertTriangle, AlertOctagon } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { PulseDot } from "@/components/care/InstrumentGauge";
import type { CareFault } from "@/lib/care/useCareFaults";

export default function FaultCard({ fault }: { fault: CareFault }) {
  const critical = fault.severity === "critical";
  const Icon = critical ? AlertOctagon : AlertTriangle;
  const color = critical ? "#EF4444" : "#E9B949";
  const bg = critical ? "rgba(239,68,68,0.08)" : "rgba(233,185,73,0.08)";
  const border = critical ? "rgba(239,68,68,0.25)" : "rgba(233,185,73,0.25)";

  return (
    <GlassCard className="border" style={{ background: bg, borderColor: border }}>
      <div className="flex items-start gap-3">
        <Icon size={18} style={{ color }} className="shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <PulseDot color={color} />
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/50">{fault.component}</p>
          </div>
          <p className="text-white font-medium mt-1.5">{fault.issue}</p>
          {fault.details && <p className="text-white/60 text-sm mt-1">{fault.details}</p>}
          <p className="text-white/70 text-sm mt-2">{fault.action}</p>
        </div>
      </div>
    </GlassCard>
  );
}
