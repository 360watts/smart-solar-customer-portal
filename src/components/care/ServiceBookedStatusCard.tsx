import { CalendarCheck } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import type { CareBooking } from "@/lib/careBooking";

const SERVICE_LABEL: Record<CareBooking["service"], string> = {
  cleaning: "Cleaning",
  repair: "Repair Service",
};
const SLOT_LABEL: Record<CareBooking["slot"], string> = {
  morning: "08:00 AM – 01:00 PM",
  afternoon: "01:00 PM – 06:00 PM",
};

export default function ServiceBookedStatusCard({
  booking,
  onCancel,
}: {
  booking: CareBooking;
  onCancel: () => void;
}) {
  return (
    <GlassCard glow="green">
      <div className="flex flex-col lg:flex-row lg:items-center gap-5">
        <div className="flex items-center gap-2 text-emerald-400 shrink-0">
          <CalendarCheck size={18} />
          <div>
            <p className="font-semibold text-white">Service Booked</p>
            <p className="text-white/60 text-xs">Awaiting technician assignment</p>
          </div>
        </div>

        <div className="h-px lg:h-8 lg:w-px w-full bg-white/8" />

        <dl className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/40">Service</dt>
            <dd className="text-white mt-0.5">{SERVICE_LABEL[booking.service]}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/40">Scheduled</dt>
            <dd className="text-white mt-0.5">{booking.date} &bull; {SLOT_LABEL[booking.slot]}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/40">Booking ID</dt>
            <dd className="text-white font-mono mt-0.5">{booking.bookingId}</dd>
          </div>
        </dl>

        <button
          onClick={onCancel}
          className="shrink-0 px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-medium transition-colors whitespace-nowrap"
        >
          Cancel Booking
        </button>
      </div>
    </GlassCard>
  );
}
