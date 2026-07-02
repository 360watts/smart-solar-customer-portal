import { CheckCircle2 } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";

const CHIPS = ["Panel Check", "Calibration", "Cleaning"];

export default function GeneralServiceCard({ onSchedule }: { onSchedule: () => void }) {
  return (
    <GlassCard glow="green">
      <div className="flex flex-col lg:flex-row lg:items-center gap-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <CheckCircle2 size={18} />
            <p className="font-medium">No faults detected — System running smoothly</p>
          </div>
          <p className="text-white font-semibold text-base">Book a General Service</p>
          <p className="text-white/60 text-sm mt-1">
            Schedule a routine check-up to keep your system at peak efficiency.
          </p>
          <div className="flex gap-2 mt-3 flex-wrap">
            {CHIPS.map((chip) => (
              <span key={chip} className="text-xs px-3 py-1 rounded-full bg-white/[0.06] text-white/70 border border-white/10">
                {chip}
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={onSchedule}
          className="shrink-0 px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-colors whitespace-nowrap"
        >
          Schedule a Service
        </button>
      </div>
    </GlassCard>
  );
}
