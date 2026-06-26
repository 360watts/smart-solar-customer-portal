"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Cpu, Zap, Battery, Sun, Wifi, AlertTriangle } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import StatusPill from "@/components/ui/StatusPill";
import { useAuth } from "@/contexts/AuthContext";
import { portalApi } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────

interface GatewayStatus {
  is_online: boolean;
  last_heartbeat: string;
  age_seconds: number;
  serial: string;
}

interface TelemetryReading {
  ts: string;
  inverter_temp_c: number;
  dc_temp_c: number;
  run_state: string;
  work_mode: string;
  battery_status: string;
  battery_soc_percent: number;
  actual_solar_kw: number;
  actual_load_kw: number;
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
  signal_strength_dbm: number;
  device_temp_c: number;
  inverter_efficiency_pct: number;
  battery_efficiency_pct: number;
  solar_efficiency_pct: number;
}

// ── Mock data ──────────────────────────────────────────────────────────────────

const MOCK_GATEWAY: GatewayStatus = {
  is_online: true,
  last_heartbeat: new Date(Date.now() - 120000).toISOString(),
  age_seconds: 120,
  serial: "EC19BE506BCE",
};

const MOCK_TELEMETRY: TelemetryReading = {
  ts: new Date().toISOString(),
  inverter_temp_c: 58,
  dc_temp_c: 52,
  run_state: "Normal",
  work_mode: "Sell First",
  battery_status: "Charging",
  battery_soc_percent: 62,
  actual_solar_kw: 4.2,
  actual_load_kw: 3.8,
  fault_code_1: null,
  fault_code_2: null,
  fault_code_3: null,
  fault_code_4: null,
  fault_code_5: null,
};

const MOCK_EQUIPMENT: Equipment = {
  inverters: [
    {
      brand: "Deye",
      model: "SUN-12K-SG04LP3",
      capacity_kva: 12,
      firmware_version: "v1.0.15",
      installed_date: "2023-01-15",
      warranty_expiry: "2028-01-15",
      is_active: true,
    },
  ],
  batteries: [
    {
      brand: "Deye",
      model: "RW-M6.1-1",
      capacity_kwh: 6.1,
      installed_date: "2023-01-15",
      warranty_expiry: "2033-01-15",
    },
  ],
  panels: [
    {
      brand: "Jinko",
      model: "Tiger Pro 530W",
      capacity_wp: 530,
      technology: "Mono PERC",
      installed_date: "2023-01-15",
      warranty_expiry: "2048-01-15",
    },
  ],
};

const MOCK_HEALTH: HardwareHealth = {
  signal_strength_dbm: -65,
  device_temp_c: 42,
  inverter_efficiency_pct: 94,
  battery_efficiency_pct: 87,
  solar_efficiency_pct: 91,
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
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
  const msLeft = new Date(expiryDate).getTime() - Date.now();
  if (msLeft < 0) return "#F87171";
  if (msLeft < 365 * 24 * 3600000) return "#E9B949";
  return "#6B7A99";
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

function SignalBarVisual({ dbm, showLabel }: { dbm: number; showLabel?: boolean }) {
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
  const { user } = useAuth();
  const siteId = user?.site_id ?? "";

  const [gateway, setGateway] = useState<GatewayStatus>(MOCK_GATEWAY);
  const [telemetry, setTelemetry] = useState<TelemetryReading>(MOCK_TELEMETRY);
  const [equipment, setEquipment] = useState<Equipment>(MOCK_EQUIPMENT);
  const [health, setHealth] = useState<HardwareHealth>(MOCK_HEALTH);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!siteId) return;
    Promise.all([
      portalApi.getGatewayStatus(siteId),
      portalApi.getTelemetry(siteId),
      portalApi.getEquipment(siteId),
      portalApi.getHardwareHealth(siteId),
    ])
      .then(([gwRes, telRes, eqRes, hhRes]) => {
        setGateway(gwRes.data);
        const rows = telRes.data?.results;
        if (rows?.length) setTelemetry(rows[rows.length - 1]);
        setEquipment(eqRes.data);
        setHealth(hhRes.data);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [siteId]);

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
          </div>
        </GlassCard>
      </motion.div>

      {/* 2. Live Inverter Snapshot */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Live Status</h3>
            <span className="text-xs text-muted-foreground">Updated {timeAgo(telemetry.ts)}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {/* Run State */}
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10 }} className="p-3">
              <p className="text-xs text-muted-foreground mb-1">Run State</p>
              <p className="text-sm font-semibold text-foreground">{telemetry.run_state}</p>
            </div>
            {/* Work Mode */}
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10 }} className="p-3">
              <p className="text-xs text-muted-foreground mb-1">Work Mode</p>
              <p className="text-sm font-semibold text-foreground">{telemetry.work_mode}</p>
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
              <SocArc pct={telemetry.battery_soc_percent} />
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
                  Warranty expires {new Date(inv.warranty_expiry).getFullYear()}
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
                  Warranty expires {new Date(bat.warranty_expiry).getFullYear()}
                </p>
              </div>
            ))}
          </GlassCard>

          {/* Panels */}
          <GlassCard>
            <div className="flex items-center gap-2 mb-3">
              <Sun size={16} style={{ color: "#2FBF71" }} />
              <h4 className="text-sm font-semibold text-foreground">Solar Panels</h4>
            </div>
            {equipment.panels.map((panel, i) => (
              <div key={i} className="space-y-1.5 text-sm">
                <p className="font-bold text-foreground">{panel.brand} {panel.model}</p>
                <p className="text-muted-foreground">{panel.capacity_wp}W · {panel.technology}</p>
                <p className="text-muted-foreground">Installed {panel.installed_date}</p>
                <p style={{ color: warrantyColor(panel.warranty_expiry), fontSize: 12 }}>
                  Warranty expires {new Date(panel.warranty_expiry).getFullYear()}
                </p>
              </div>
            ))}
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
              const color = efficiencyColor(pct);
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
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      style={{ height: "100%", borderRadius: 4, background: color }}
                    />
                  </div>
                  <span style={{ color, fontSize: 13, fontWeight: 600, width: 38, textAlign: "right" }}>
                    {pct}%
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
