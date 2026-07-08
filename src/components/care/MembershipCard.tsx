import { ShieldCheck, Check, CalendarPlus, CalendarClock } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import type { ServiceBooking } from "@/lib/api";

const BENEFITS = [
  "2 free service visits / year",
  "Priority technician dispatch",
  "20% off spare parts",
  "24/7 fault monitoring",
];

const CATEGORY_LABEL: Record<ServiceBooking["issue_category"], string> = {
  panel: "Panel",
  inverter: "Inverter",
  battery: "Battery",
  monitoring: "Monitoring",
  cleaning: "Cleaning",
  other: "Repair Service",
};

export default function MembershipCard({
  booking,
  onScheduleService,
  onCancel,
}: {
  booking: ServiceBooking | null;
  onScheduleService: () => void;
  onCancel: () => void;
}) {
  return (
    <GlassCard glow="green" className="h-full flex flex-col">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
          <ShieldCheck size={20} className="text-emerald-400" />
        </div>
        <div className="min-w-0">
          <p className="text-foreground font-semibold text-base truncate">360care Subscriber</p>
          <p className="text-muted-foreground text-sm">Active &bull; Till Dec 2028</p>
        </div>
      </div>

      <div className="h-px bg-border my-4" />

      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-2.5">Included in your plan</p>
      <ul className="space-y-2 flex-1">
        {BENEFITS.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2 text-sm text-foreground">
            <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>

      {booking ? (
        <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <CalendarClock size={14} className="shrink-0" />
            <p className="font-mono text-[10px] uppercase tracking-[0.14em]">
              {booking.status === "scheduled" ? "Scheduled" : "Requested"}
            </p>
          </div>
          <p className="text-foreground text-sm font-medium mt-1.5">
            {CATEGORY_LABEL[booking.issue_category]}
            {booking.service_date && ` · ${booking.service_date}`}
          </p>
          <p className="text-muted-foreground text-xs mt-0.5">{booking.booking_number}</p>
          <button
            onClick={onCancel}
            className="mt-2.5 text-xs text-destructive hover:text-destructive/80 transition-colors cursor-pointer"
          >
            Cancel booking
          </button>
        </div>
      ) : (
        <button
          onClick={onScheduleService}
          className="mt-4 flex items-center justify-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 border border-emerald-500/25 hover:border-emerald-500/40 rounded-lg py-2 transition-colors cursor-pointer"
        >
          <CalendarPlus size={14} /> Schedule a Service
        </button>
      )}
    </GlassCard>
  );
}
