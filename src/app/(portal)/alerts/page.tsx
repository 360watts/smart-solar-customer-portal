"use client";

import GlassCard from "@/components/ui/GlassCard";
import StatusPill from "@/components/ui/StatusPill";

export default function AlertsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-foreground font-display mb-6">
        Alerts
      </h1>

      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">High Temperature</h3>
          <StatusPill status="warning" label="Warning" />
        </div>
        <p className="text-sm text-muted-foreground">
          Inverter temperature exceeded safe range
        </p>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Low Generation</h3>
          <StatusPill status="error" label="Error" />
        </div>
        <p className="text-sm text-muted-foreground">
          Expected generation below 50% due to cloud cover
        </p>
      </GlassCard>
    </div>
  );
}
