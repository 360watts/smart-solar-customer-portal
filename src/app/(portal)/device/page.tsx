"use client";

import { motion } from "framer-motion";
import { Cpu, Zap, Battery, Sun, Wifi, AlertTriangle } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import StatusPill from "@/components/ui/StatusPill";
import { useAuth } from "@/contexts/AuthContext";
import { portalApi } from "@/lib/api";
import { useSiteQuery } from "@/lib/hooks/useSiteQuery";
import { TTL } from "@/lib/portalCache";

// ── Types ──────────────────────────────────────────────────────────────────────

interface GatewayStatus {
  is_online: boolean;
  last_heartbeat: string;
  age_seconds: number;
  serial: string;
  data_source: string | null;
  rs485_last_seen: string | null;
  rs485_stale: boolean;
}

interface TelemetryReading {
  timestamp: string;
  inverter_temp_c: number;
  run_state: number | string | null;
  battery_soc_percent: number;
  pv1_power_w: number;
  pv2_power_w: number;
  load_power_w: number;
  fault_code_1: string | null;
  fault_code_2: string | null;
  fault_code_3: string | null;
  fault_code_4: string | null;
  fault_code_5: string | null;
}

interface Equipment {
  inverters: Array<{
    brand: string;
    model: string;
    capacity_kva: number;
    firmware_version: string;
    installed_date: string;
    warranty_expiry: string;
    is_active: boolean;
  }>;
  batteries: Array<{
    brand: string;
    model: string;
    capacity_kwh: number;
    installed_date: string;
    warranty_expiry: string;
  }>;
  panels: Array<{
    brand: string;
    model: string;
    capacity_wp: number;
    technology: string;
    installed_date: string;
    warranty_expiry: string;
  }>;
}

interface HardwareHealth {
  signal_strength_dbm: number | null;
  device_temp_c: number | null;
  inverter_efficiency_pct: number | null;
  battery_efficiency_pct: number | null;
  solar_efficiency_pct: number | null;
}

interface DeviceSummary {
  gateway: GatewayStatus;
  telemetry: TelemetryReading | null;
  equipment: Equipment;
  health: HardwareHealth;
}

// ── Empty placeholders used only before real summary data has loaded ───────────

const EMPTY_GATEWAY: GatewayStatus = {
  is_online: false,
  last_heartbeat: "",
  age_seconds: 0,
  serial: "",
  data_source: null,
  rs485_last_seen: null,
  rs485_stale: false,
};

const EMPTY_TELEMETRY: TelemetryReading = {
  timestamp: "",
  inverter_temp_c: 0,
  run_state: "No data",
  battery_soc_percent: 0,
  pv1_power_w: 0,
  pv2_power_w: 0,
  load_power_w: 0,
  fault_code_1: null,
  fault_code_2: null,
  fault_code_3: null,
  fault_code_4: null,
  fault_code_5: null,
};

const EMPTY_EQUIPMENT: Equipment = {
  inverters: [],
  batteries: [],
  panels: [],
};

const EMPTY_HEALTH: HardwareHealth = {
  signal_strength_dbm: null,
  device_temp_c: null,
  inverter_efficiency_pct: null,
  battery_efficiency_pct: null,
  solar_efficiency_pct: null,
};

// Deye inverter run_state integer codes → human label
const DEYE_RUN_STATE: Record<number, string> = {
  0: "Standby", 1: "Self-check", 2: "Normal", 3: "Alarm", 4: "Fault", 5: "Flash",
  6: "Check Discharge", 7: "EPS", 8: "Anti-backflow",
};
function runStateLabel(v: number | string | null): string {
  if (v == null) return "No data";
  if (typeof v === "string") return v || "No data";
  return DEYE_RUN_STATE[v] ?? `State ${v}`;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function signalBars(dbm: number): { count: number; color: string; label: string } {
  if (dbm >= -60) return { count: 5, color: "#2FBF71", label: "Excellent" };
  if (dbm >= -70) return { count: 4, color: "#2FBF71", label: "Good" };
  if (dbm >= -80) return { count: 3, color: "#E9B949", label: "Fair" };
  if (dbm >= -90) return { count: 2, color: "#E9B949", label: "Weak" };
  return { count: 1, color: "#F87171", label: "Poor" };
}

function warrantyColor(expiryDate: string): string {
  if (!expiryDate) return "#6B7A99";
  const msLeft = new Date(expiryDate).getTime() - Date.now();
  if (msLeft < 0) return "#F87171";
  if (msLeft < 365 * 24 * 3600000) return "#E9B949";
  return "#6B7A99";
}

function warrantyYear(expiryDate: string): string {
  if (!expiryDate) return "—";
  const year = new Date(expiryDate).getFullYear();
  return Number.isFinite(year) ? String(year) : "—";
}

function efficiencyColor(pct: number): string {
  if (pct >= 80) return "#2FBF71";
  if (pct >= 60) return "#E9B949";
  return "#F87171";
}

function tempColor(c: number, warn = 65, critical = 75): string {
  if (c > critical) return "#F87171";
  if (c > warn) return "#E9B949";
  return "#6B7A99";
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SignalBarVisual({ dbm, showLabel }: { dbm: number | null; showLabel?: boolean }) {
  if (dbm == null) {
    return <span style={{ color: "#6B7A99", fontSize: 12 }}>No signal data</span>;
  }
  const { count, color, label } = signalBars(dbm);
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex items-end gap-[2px]">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            style={{
              width: 4,
              height: 4 + i * 3,
              borderRadius: 1,
              backgroundColor: i <= count ? color : "rgba(255,255,255,0.12)",
              display: "block",
            }}
          />
        ))}
      </span>
      <span style={{ color, fontSize: 12 }}>{dbm} dBm</span>
      {showLabel && <span style={{ color: "#6B7A99", fontSize: 12 }}>{label}</span>}
    </span>
  );
}

function SocArc({ pct }: { pct: number }) {
  const color = pct > 50 ? "#2FBF71" : pct > 20 ? "#E9B949" : "#F87171";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        style={{
          display: "inline-block",
          width: 32,
          height: 8,
          borderRadius: 4,
          background: "rgba(255,255,255,0.08)",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            display: "block",
            width: `${pct}%`,
            height: "100%",
            background: color,
            borderRadius: 4,
            transition: "width 0.4s ease",
          }}
        />
      </span>
      <span style={{ color, fontWeight: 600, fontSize: 14 }}>{pct}%</span>
    </span>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function DevicePage() {
  const { user, status } = useAuth();

  const { data, loading, error, noSite, refresh } = useSiteQuery<DeviceSummary>(
    user?.site_id,
    async (siteId, signal) => {
      const summary = await portalApi.getPortalDevice(siteId, signal);
      signal.throwIfAborted();
      const payload = summary.data.data;
      return {
        gateway: (payload.gateway ?? EMPTY_GATEWAY) as GatewayStatus,
        telemetry: (payload.telemetry ?? null) as TelemetryReading | null,
        equipment: (payload.equipment ?? EMPTY_EQUIPMENT) as Equipment,
        health: (payload.hardware_health ?? EMPTY_HEALTH) as HardwareHealth,
      };
    },
    {
      cacheKey: `device:${user?.site_id}`,
      ttl: TTL.static,
      autoRefreshSec: 60,
      isAuthResolved: status !== "loading",
    },
  );

  const gateway = data?.gateway ?? EMPTY_GATEWAY;
  const telemetry = data?.telemetry ?? EMPTY_TELEMETRY;
  const equipment = data?.equipment ?? EMPTY_EQUIPMENT;
  const health = data?.health ?? EMPTY_HEALTH;

  const faultCodes = [
    telemetry.fault_code_1,
    telemetry.fault_code_2,
    telemetry.fault_code_3,
    telemetry.fault_code_4,
    telemetry.fault_code_5,
  ].filter((f): f is string => !!f && f !== "0");

  return (
    <div className="space-y-5 pb-8">
      <motion.h1
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-foreground font-display mb-6"
      >
        Device
      </motion.h1>

      {noSite && (
        <GlassCard>
          <p className="text-sm text-amber-300">No site linked to your account.</p>
        </GlassCard>
      )}

      {error && (
        <GlassCard>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-red-300">{error}</p>
            <button onClick={refresh} className="text-xs text-muted-foreground underline underline-offset-2">
              Retry
            </button>
          </div>
        </GlassCard>
      )}

      {loading && (
        <GlassCard>
          <p className="text-sm text-muted-foreground">Loading device summary…</p>
        </GlassCard>
      )}

      {/* 1. Gateway Status Card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <GlassCard glow={gateway.is_online ? "green" : undefined}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                style={{ background: "rgba(47,191,113,0.15)" }}
                className="w-12 h-12 rounded-xl flex items-center justify-center"
              >
                <Cpu size={22} style={{ color: "#2FBF71" }} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Deye Inverter Gateway</h3>
                <p className="text-sm text-muted-foreground font-mono">{gateway.serial}</p>
              </div>
            </div>
            <StatusPill status={gateway.is_online ? "active" : "error"} label={gateway.is_online ? "Online" : "Offline"} />
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground border-t border-white/5 pt-3 mt-2">
            <span>
              <span className="text-white/40 mr-1">Last seen:</span>
              {timeAgo(gateway.last_heartbeat)}
            </span>
            <span>
              <span className="text-white/40 mr-1">Signal:</span>
              <SignalBarVisual dbm={health.signal_strength_dbm} />
            </span>
            {equipment.inverters[0] && (
              <span>
                <span className="text-white/40 mr-1">Firmware:</span>
                <span className="font-mono text-xs">{equipment.inverters[0].firmware_version}</span>
              </span>
            )}
            {/* Data source indicator */}
            {gateway.data_source && (
              <span className="flex items-center gap-1.5">
                <span className="text-white/40 mr-1">Data via:</span>
                <span
                  className="text-xs font-mono px-2 py-0.5 rounded-full"
                  style={
                    gateway.data_source === "rs485"
                      ? { background: "rgba(47,191,113,0.12)", color: "#2FBF71", border: "1px solid rgba(47,191,113,0.3)" }
                      : { background: "rgba(233,185,73,0.12)", color: "#E9B949", border: "1px solid rgba(233,185,73,0.3)" }
                  }
                >
                  {gateway.data_source === "rs485" ? "RS-485" : "Deye Cloud"}
                </span>
              </span>
            )}
          </div>

          {/* RS-485 stale warning */}
          {gateway.rs485_stale && (
            <div className="mt-3 flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
              style={{ background: "rgba(233,185,73,0.08)", border: "1px solid rgba(233,185,73,0.2)", color: "#E9B949" }}>
              <span>⚠</span>
              <span>
                RS-485 link inactive since {gateway.rs485_last_seen ? timeAgo(gateway.rs485_last_seen) : "unknown"}.
                Showing values from Deye Cloud logger (WiFi stick). Gateway is online.
              </span>
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* 2. Live Inverter Snapshot */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Live Status</h3>
            <span className="text-xs text-muted-foreground">Updated {timeAgo(telemetry.timestamp)}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {/* Run State */}
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10 }} className="p-3">
              <p className="text-xs text-muted-foreground mb-1">Run State</p>
              <p className="text-sm font-semibold text-foreground">{runStateLabel(telemetry.run_state)}</p>
            </div>
            {/* Solar Output */}
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10 }} className="p-3">
              <p className="text-xs text-muted-foreground mb-1">Solar Output</p>
              <p className="text-sm font-semibold text-foreground">
                {(((telemetry.pv1_power_w || 0) + (telemetry.pv2_power_w || 0)) / 1000).toFixed(2)} kW
              </p>
            </div>
            {/* Inverter Temp */}
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10 }} className="p-3">
              <p className="text-xs text-muted-foreground mb-1">Inverter Temp</p>
              <p
                className="text-sm font-semibold"
                style={{ color: tempColor(telemetry.inverter_temp_c) }}
              >
                {telemetry.inverter_temp_c}°C
              </p>
            </div>
            {/* Battery SOC */}
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10 }} className="p-3">
              <p className="text-xs text-muted-foreground mb-1">Battery SOC</p>
              {telemetry.battery_soc_percent != null
                ? <SocArc pct={telemetry.battery_soc_percent} />
                : <p className="text-sm font-semibold text-muted-foreground mt-1">—</p>
              }
            </div>
          </div>

          {faultCodes.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-white/5 pt-3">
              <span className="flex items-center gap-1.5 text-xs text-red-400">
                <AlertTriangle size={13} />
                Fault Codes:
              </span>
              {faultCodes.map((fc, i) => (
                <span
                  key={i}
                  style={{ background: "rgba(248,113,113,0.12)", color: "#F87171", borderRadius: 6, padding: "2px 8px", fontSize: 12, fontFamily: "monospace" }}
                >
                  {fc}
                </span>
              ))}
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* 3. Equipment Cards */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Inverters */}
          <GlassCard>
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} style={{ color: "#2FBF71" }} />
              <h4 className="text-sm font-semibold text-foreground">Inverter</h4>
            </div>
            {equipment.inverters.map((inv, i) => (
              <div key={i} className="space-y-1.5 text-sm">
                <p className="font-bold text-foreground">{inv.brand} {inv.model}</p>
                <p className="text-muted-foreground">{inv.capacity_kva} kVA</p>
                <p className="text-muted-foreground">Installed {inv.installed_date}</p>
                <p style={{ color: warrantyColor(inv.warranty_expiry), fontSize: 12 }}>
                  Warranty expires {warrantyYear(inv.warranty_expiry)}
                </p>
              </div>
            ))}
          </GlassCard>

          {/* Batteries */}
          <GlassCard>
            <div className="flex items-center gap-2 mb-3">
              <Battery size={16} style={{ color: "#2FBF71" }} />
              <h4 className="text-sm font-semibold text-foreground">Battery</h4>
            </div>
            {equipment.batteries.map((bat, i) => (
              <div key={i} className="space-y-1.5 text-sm">
                <p className="font-bold text-foreground">{bat.brand} {bat.model}</p>
                <p className="text-muted-foreground">{bat.capacity_kwh} kWh</p>
                <p className="text-muted-foreground">Installed {bat.installed_date}</p>
                <p style={{ color: warrantyColor(bat.warranty_expiry), fontSize: 12 }}>
                  Warranty expires {warrantyYear(bat.warranty_expiry)}
                </p>
              </div>
            ))}
          </GlassCard>

          {/* Panels — group identical make/model to avoid repeating 8× the same row */}
          <GlassCard>
            <div className="flex items-center gap-2 mb-3">
              <Sun size={16} style={{ color: "#2FBF71" }} />
              <h4 className="text-sm font-semibold text-foreground">Solar Panels</h4>
            </div>
            {(() => {
              // Group by brand+model key, sum count
              const groups = new Map<string, { panel: typeof equipment.panels[0]; count: number }>();
              for (const p of equipment.panels) {
                const key = `${p.brand}|${p.model}|${p.capacity_wp}`;
                const existing = groups.get(key);
                if (existing) existing.count++;
                else groups.set(key, { panel: p, count: 1 });
              }
              return Array.from(groups.values()).map(({ panel, count }, i) => (
                <div key={i} className="space-y-1.5 text-sm">
                  <p className="font-bold text-foreground">
                    {count > 1 && <span className="text-emerald-400 mr-1">{count}×</span>}
                    {panel.brand} {panel.model}
                  </p>
                  <p className="text-muted-foreground">{panel.capacity_wp}W · {panel.technology}</p>
                  <p className="text-muted-foreground">Installed {panel.installed_date}</p>
                  <p style={{ color: warrantyColor(panel.warranty_expiry), fontSize: 12 }}>
                    Warranty expires {warrantyYear(panel.warranty_expiry)}
                  </p>
                </div>
              ));
            })()}
          </GlassCard>
        </div>
      </motion.div>

      {/* 4. Hardware Health */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <Wifi size={16} style={{ color: "#2FBF71" }} />
            <h3 className="font-semibold text-foreground">Hardware Health</h3>
          </div>

          <div className="space-y-4">
            {[
              { label: "Solar", icon: <Sun size={15} />, pct: health.solar_efficiency_pct },
              { label: "Inverter", icon: <Zap size={15} />, pct: health.inverter_efficiency_pct },
              { label: "Battery", icon: <Battery size={15} />, pct: health.battery_efficiency_pct },
            ].map(({ label, icon, pct }) => {
              const hasData = pct != null;
              const color = hasData ? efficiencyColor(pct!) : "#6B7A99";
              return (
                <div key={label} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-24 text-muted-foreground text-sm">
                    <span style={{ color }}>{icon}</span>
                    <span>{label}</span>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      height: 8,
                      borderRadius: 4,
                      background: "rgba(255,255,255,0.07)",
                      overflow: "hidden",
                    }}
                  >
                    {hasData && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        style={{ height: "100%", borderRadius: 4, background: color }}
                      />
                    )}
                  </div>
                  <span style={{ color, fontSize: 13, fontWeight: 600, width: 38, textAlign: "right" }}>
                    {hasData ? `${pct}%` : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
