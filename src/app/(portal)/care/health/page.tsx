"use client";

import { ArrowLeft, RadioTower } from "lucide-react";
import { useRouter } from "next/navigation";
import GlassCard from "@/components/ui/GlassCard";
import SkeletonPulse from "@/components/ui/SkeletonPulse";
import { MiniArc, PulseDot, COMPONENT_META, healthStatusColor } from "@/components/care/InstrumentGauge";
import { useAuth } from "@/contexts/AuthContext";
import { useSystemHealth } from "@/lib/care/useSystemHealth";
import { useUptimeScore } from "@/lib/care/useUptimeScore";
import { statusLabel, type ComponentHealth } from "@/lib/care/types";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function InstrumentCard({ compKey, data }: { compKey: keyof typeof COMPONENT_META; data: ComponentHealth }) {
  const meta = COMPONENT_META[compKey];
  const Icon = meta.icon;
  const sc = healthStatusColor(data.status);

  return (
    <GlassCard className="relative overflow-hidden p-0 h-full flex flex-col">
      <div className="h-0.75" style={{ background: `linear-gradient(90deg, color-mix(in srgb, ${meta.color} 80%, transparent), color-mix(in srgb, ${meta.color} 20%, transparent))` }} />
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `color-mix(in srgb, ${meta.color} 9%, transparent)`, border: `1px solid color-mix(in srgb, ${meta.color} 19%, transparent)` }}
            >
              <Icon size={15} style={{ color: meta.color }} />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground truncate">{meta.label}</p>
              <p className="text-muted-foreground text-xs mt-0.5 truncate">{data.age}</p>
            </div>
          </div>
          <PulseDot color={sc} />
        </div>

        <div className="flex items-center gap-5">
          <div className="relative shrink-0" style={{ width: 72, height: 72 }}>
            <MiniArc score={data.health_score} color={meta.color} size={72} />
            <div className="absolute inset-0 flex items-center justify-center pb-1">
              <span className="font-mono text-base font-bold" style={{ color: meta.color }}>
                {data.health_score}
              </span>
            </div>
          </div>
          <span
            className="font-mono text-[10px] uppercase tracking-[0.08em] px-2 py-1 rounded-full whitespace-nowrap"
            style={{ background: `color-mix(in srgb, ${sc} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${sc} 19%, transparent)`, color: sc }}
          >
            {statusLabel(data.status)}
          </span>
        </div>

        <ul className="space-y-1 text-sm text-foreground mt-4">
          {data.specs.map((spec) => (
            <li key={spec} className="truncate">{spec}</li>
          ))}
        </ul>

        <div className="h-px bg-foreground/8 my-4" />

        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-2">Live Metrics (7d)</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          {Object.entries(data.details).map(([key, value]) => (
            <div key={key} className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground truncate">{key}</p>
              <p className="font-mono text-xs font-semibold text-foreground truncate">{value}</p>
            </div>
          ))}
        </div>

        <div className="flex-1" />

        {data.alert && (
          <p className="mt-4 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2">
            {data.alert}
          </p>
        )}
        {data.warranty && (
          <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Warranty: {data.warranty}
          </p>
        )}
      </div>
    </GlassCard>
  );
}

function UptimeTile({ siteId }: { siteId: string }) {
  const { loading, rollingAvgUptimePct } = useUptimeScore(siteId, 30);
  const pct = rollingAvgUptimePct ?? 100;
  const color = pct >= 99 ? "var(--primary)" : pct >= 95 ? "var(--secondary)" : "var(--destructive)";

  if (loading) return <SkeletonPulse className="h-full" />;

  return (
    <GlassCard className="relative overflow-hidden p-0 h-full flex flex-col">
      <div className="h-0.75" style={{ background: `linear-gradient(90deg, color-mix(in srgb, ${color} 80%, transparent), color-mix(in srgb, ${color} 20%, transparent))` }} />
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-4">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color }}>UPTIME (30D)</p>
            <p className="text-muted-foreground text-xs mt-0.5">Rolling average</p>
          </div>
          <PulseDot color={color} />
        </div>
        <div className="flex items-center gap-5">
          <div className="relative shrink-0" style={{ width: 72, height: 72 }}>
            <MiniArc score={Math.round(pct)} color={color} size={72} />
            <div className="absolute inset-0 flex items-center justify-center pb-1">
              <span className="font-mono text-base font-bold" style={{ color }}>{pct.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

export default function SystemHealthDetailsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: health, loading } = useSystemHealth();

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push("/care")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm"
      >
        <ArrowLeft size={16} /> Back to 360Care
      </button>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="page-title">
          System Health Details
        </h1>
        {health && (
          <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground whitespace-nowrap">
            <RadioTower size={11} /> Synced {timeAgo(health.last_updated)}
          </span>
        )}
      </div>

      {loading || !health ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SkeletonPulse className="h-64" />
          <SkeletonPulse className="h-64" />
          <SkeletonPulse className="h-64" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <InstrumentCard compKey="solar_panel" data={health.solar_panel} />
            <InstrumentCard compKey="inverter" data={health.inverter} />
            <InstrumentCard compKey="battery" data={health.battery} />
            {user?.site_id && <UptimeTile siteId={user.site_id} />}
          </div>

          <GlassCard>
            <h3 className="text-foreground font-semibold text-base mb-4" style={{ fontFamily: "var(--font-display)" }}>
              Installation Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">System Size</p>
                <p className="text-foreground text-base font-semibold mt-1">{health.installation.system_size}</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Installed On</p>
                <p className="text-foreground text-base font-semibold mt-1">{health.installation.installed_date}</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Installer</p>
                <p className="text-foreground text-base font-semibold mt-1">{health.installation.installer_name}</p>
              </div>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}
