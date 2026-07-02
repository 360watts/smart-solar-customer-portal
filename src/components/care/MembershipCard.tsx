import { ShieldCheck, Check, CalendarPlus } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";

const BENEFITS = [
  "2 free service visits / year",
  "Priority technician dispatch",
  "20% off spare parts",
  "24/7 fault monitoring",
];

export default function MembershipCard({
  onScheduleService,
  bookingActive,
}: {
  onScheduleService: () => void;
  bookingActive: boolean;
}) {
  return (
    <GlassCard glow="green" className="h-full flex flex-col">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
          <ShieldCheck size={20} className="text-emerald-400" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-semibold text-base truncate">360care Subscriber</p>
          <p className="text-white/60 text-sm">Active &bull; Till Dec 2028</p>
        </div>
      </div>

      <div className="h-px bg-white/8 my-4" />

      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45 mb-2.5">Included in your plan</p>
      <ul className="space-y-2 flex-1">
        {BENEFITS.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2 text-sm text-white/75">
            <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onScheduleService}
        disabled={bookingActive}
        className="mt-4 flex items-center justify-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 border border-emerald-500/25 hover:border-emerald-500/40 disabled:text-white/30 disabled:border-white/10 disabled:cursor-not-allowed rounded-lg py-2 transition-colors"
      >
        <CalendarPlus size={14} /> {bookingActive ? "Service Booked" : "Schedule a Service"}
      </button>
    </GlassCard>
  );
}
