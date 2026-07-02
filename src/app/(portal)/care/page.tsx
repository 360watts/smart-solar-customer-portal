"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MembershipCard from "@/components/care/MembershipCard";
import HealthGaugeCard from "@/components/care/HealthGaugeCard";
import MaintenanceTipsCard from "@/components/care/MaintenanceTipsCard";
import FaultCard from "@/components/care/FaultCard";
import GeneralServiceCard from "@/components/care/GeneralServiceCard";
import ServiceBookedStatusCard from "@/components/care/ServiceBookedStatusCard";
import BookServiceDialog from "@/components/care/BookServiceDialog";
import SkeletonPulse from "@/components/ui/SkeletonPulse";
import { useSystemHealth } from "@/lib/care/useSystemHealth";
import { useCareFaults, deriveMaintenanceFaults } from "@/lib/care/useCareFaults";
import { getBooking, cancelBooking, type CareBooking } from "@/lib/careBooking";

export default function CarePage() {
  const router = useRouter();
  const { data: health, loading: healthLoading } = useSystemHealth();
  const { data: alertFaults, loading: faultsLoading } = useCareFaults();
  const [booking, setBooking] = useState<CareBooking | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // localStorage is unavailable during SSR; hydrate booking state after mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBooking(getBooking());
  }, []);

  // Active alerts are the primary source; components whose health score has
  // degraded but haven't tripped an alert yet are added from the real
  // hardware-health `alert` field, skipping any component an alert already covers.
  const faults = useMemo(() => {
    const base = alertFaults ?? [];
    const covered = new Set(base.map((f) => f.component));
    const maintenance = deriveMaintenanceFaults(health).filter((f) => !covered.has(f.component));
    return [...base, ...maintenance];
  }, [alertFaults, health]);

  const hasFaults = faults.length > 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>360care</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          {healthLoading || !health ? (
            <SkeletonPulse className="h-full min-h-48" />
          ) : (
            <HealthGaugeCard health={health} onViewDetails={() => router.push("/care/health")} />
          )}
        </div>
        <div className="lg:col-span-1">
          <MembershipCard onScheduleService={() => (booking ? undefined : setDialogOpen(true))} bookingActive={Boolean(booking)} />
        </div>
      </div>

      {health && <MaintenanceTipsCard tips={health.maintenance_tips} />}

      <div>
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-white/50 mb-3">Fault &amp; Diagnostics</h2>

        {faultsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SkeletonPulse className="h-28" />
            <SkeletonPulse className="h-28" />
          </div>
        ) : hasFaults ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {faults.map((fault) => (
              <FaultCard key={fault.id} fault={fault} />
            ))}
          </div>
        ) : booking ? (
          <ServiceBookedStatusCard booking={booking} onCancel={() => { cancelBooking(); setBooking(null); }} />
        ) : (
          <GeneralServiceCard onSchedule={() => setDialogOpen(true)} />
        )}
      </div>

      {dialogOpen && (
        <BookServiceDialog
          onClose={() => setDialogOpen(false)}
          onBooked={(b) => { setBooking(b); setDialogOpen(false); }}
        />
      )}
    </div>
  );
}
