"use client";

import GlassCard from "@/components/ui/GlassCard";
import StatusPill from "@/components/ui/StatusPill";
import { Cpu, Signal } from "lucide-react";

export default function DevicePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-foreground font-syne mb-6">
        Device
      </h1>

      <GlassCard glow="green">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
              <Cpu className="text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Deye Inverter
              </h3>
              <p className="text-sm text-muted-foreground">
                SN: EC19BE506BCE
              </p>
            </div>
          </div>
          <StatusPill status="active" label="Online" />
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard>
          <p className="text-muted-foreground text-sm mb-2">Signal Strength</p>
          <p className="text-2xl font-bold text-foreground">-65 dBm</p>
          <p className="text-xs text-muted-foreground mt-2">Excellent</p>
        </GlassCard>

        <GlassCard>
          <p className="text-muted-foreground text-sm mb-2">Last Seen</p>
          <p className="text-2xl font-bold text-foreground">2 mins ago</p>
          <p className="text-xs text-muted-foreground mt-2">Live</p>
        </GlassCard>
      </div>
    </div>
  );
}
