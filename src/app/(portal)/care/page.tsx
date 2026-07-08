"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MembershipCard from "@/components/care/MembershipCard";
import HealthGaugeCard from "@/components/care/HealthGaugeCard";
import DiagnosticsPanel from "@/components/care/DiagnosticsPanel";
import BookServiceDialog from "@/components/care/BookServiceDialog";
import SkeletonPulse from "@/components/ui/SkeletonPulse";
import { useAuth } from "@/contexts/AuthContext";
import { portalApi } from "@/lib/api";
import { useSystemHealth } from "@/lib/care/useSystemHealth";
import { useCareFaults, deriveMaintenanceFaults } from "@/lib/care/useCareFaults";
import { useMyBooking } from "@/lib/care/useMyBooking";

export default function CarePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: health, loading: healthLoading } = useSystemHealth();
  const { data: alertFaults, loading: faultsLoading } = useCareFaults();
  const { data: booking, loading: bookingLoading, refresh: refreshBooking } = useMyBooking();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Active alerts are the primary source; components whose health score has
  // degraded but haven't tripped an alert yet are added from the real
  // hardware-health `alert` field, skipping any component an alert already covers.
  const faults = useMemo(() => {
    const base = alertFaults ?? [];
    const covered = new Set(base.map((f) => f.component));
    const maintenance = deriveMaintenanceFaults(health).filter((f) => !covered.has(f.component));
    return [...base, ...maintenance];
  }, [alertFaults, health]);

  async function handleCancel() {
    if (!booking) return;
    await portalApi.cancelServiceBooking(booking.id);
    refreshBooking();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>360care</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          {healthLoading || !health ? (
            <SkeletonPulse className="h-full min-h-48" />
          ) : (
            <HealthGaugeCard health={health} onViewDetails={() => router.push("/care/health")} />
          )}
        </div>
        <div className="lg:col-span-1">
          <MembershipCard booking={booking} onScheduleService={() => setDialogOpen(true)} onCancel={handleCancel} />
        </div>
      </div>

      {faultsLoading || bookingLoading || healthLoading ? (
        <SkeletonPulse className="h-40" />
      ) : (
        <DiagnosticsPanel
          faults={faults}
          tips={health?.maintenance_tips ?? []}
          hasActiveBooking={Boolean(booking)}
          onSchedule={() => setDialogOpen(true)}
        />
      )}

      {dialogOpen && user?.site_id && (
        <BookServiceDialog
          siteId={user.site_id}
          onClose={() => setDialogOpen(false)}
          onBooked={() => { setDialogOpen(false); refreshBooking(); }}
        />
      )}
    </div>
  );
}
