"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import { Cpu, Zap, Battery, Sun, Wifi, AlertTriangle, Clock, Radio, Globe, Activity, type LucideIcon } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import StatusPill from "@/components/ui/StatusPill";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import SkeletonPulse from "@/components/ui/SkeletonPulse";
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
    logger_serial?: string | null;
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

interface FleetDevice {
  device_serial: string;
  device_type?: "gateway" | "energy_meter" | string;
  is_online: boolean;
  last_heartbeat?: string | null;
  age_seconds?: number | null;
  model?: string;
  firmware_version?: string;
  connectivity_type?: string;
  network_ip?: string;
  signal_strength_dbm?: number | null;
  device_temp_c?: number | null;
}

interface DisplayDevice {
  key: string;
  serial: string;
  label: string;
  is_online: boolean;
  description: string;
  details: Array<{ label: string; icon: LucideIcon; value: string; tone?: string }>;
  /** Only set for the device matching the inverter gateway — communication-path info that has nowhere else to live. */
  commsBanner?: { text: string; tone: "warn" | "info" };
  dataSourceBadge?: { label: string; tone: "good" | "warn" };
  /** The inverter gateway is the site's primary comms hub — gets the hero treatment (signal gauge, richer header). */
  isPrimary: boolean;
  signalPct: number | null;
}

interface DeviceSummary {
  gateway: GatewayStatus;
  telemetry: TelemetryReading | null;
  equipment: Equipment;
  health: HardwareHealth;
  fleet: FleetDevice[];
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

// Spring transition shared with the rest of the portal (Overview, Alerts) so card
// entrances feel consistent across pages instead of this page's own plain tween.
const SPRING = { type: "spring" as const, stiffness: 280, damping: 28 };

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

// Despite the `signal_strength_dbm` field name, firmware actually sends a 0–100
// RSSI percentage (confirmed against the backend's own severity thresholds in
// _build_heartbeat_health_payload: warn<=40, critical<=25 — a dBm scale would
// never use positive thresholds like these). Bucketed on that scale, aligned
// to the same warn/critical boundaries the backend already uses.
function signalBars(pct: number): { count: number; color: string; label: string } {
  if (pct >= 70) return { count: 5, color: "var(--primary)", label: "Excellent" };
  if (pct >= 55) return { count: 4, color: "var(--primary)", label: "Good" };
  if (pct >= 40) return { count: 3, color: "var(--secondary)", label: "Fair" };
  if (pct >= 25) return { count: 2, color: "var(--secondary)", label: "Weak" };
  return { count: 1, color: "var(--destructive)", label: "Poor" };
}

function warrantyColor(expiryDate: string): string {
  if (!expiryDate) return "var(--muted)";
  const msLeft = new Date(expiryDate).getTime() - Date.now();
  if (msLeft < 0) return "var(--destructive)";
  if (msLeft < 365 * 24 * 3600000) return "var(--secondary)";
  return "var(--muted)";
}

function warrantyYear(expiryDate: string): string {
  if (!expiryDate) return "—";
  const year = new Date(expiryDate).getFullYear();
  return Number.isFinite(year) ? String(year) : "—";
}

function efficiencyColor(pct: number): string {
  if (pct >= 80) return "var(--primary)";
  if (pct >= 60) return "var(--secondary)";
  return "var(--destructive)";
}

function healthTone(pct: number | null): { label: string; color: string } {
  if (pct == null) return { label: "No Data", color: "var(--muted)" };
  if (pct >= 80) return { label: "Excellent", color: "var(--primary)" };
  if (pct >= 60) return { label: "Fair", color: "var(--secondary)" };
  return { label: "Needs Attention", color: "var(--destructive)" };
}

function tempColor(c: number, warn = 65, critical = 75): string {
  if (c > critical) return "var(--destructive)";
  if (c > warn) return "var(--secondary)";
  return "var(--muted)";
}

function fleetDeviceLabel(deviceType?: string): string {
  if (deviceType === "energy_meter") return "Energy Meter Gateway";
  return "Inverter Gateway";
}

// Builds one card per physical communication device, merging in the gateway-only
// facts (data source, RS-485 staleness) that used to live in a separate,
// duplicate "Gateway Status" card — each device now has exactly one card with
// its full picture, instead of the same identity split across two places.
function buildDisplayDevices(fleet: FleetDevice[], gateway: GatewayStatus): DisplayDevice[] {
  return fleet.map((device) => {
    const isGatewayDevice = device.device_serial === gateway.serial;
    const details: DisplayDevice["details"] = [
      { label: "Last seen", icon: Clock, value: timeAgo(device.last_heartbeat ?? "") },
      { label: "Model", icon: Cpu, value: device.model || "ESP32" },
      { label: "Firmware", icon: Zap, value: device.firmware_version || "—" },
      { label: "Link", icon: Radio, value: device.connectivity_type || "—" },
      { label: "Signal", icon: Wifi, value: device.signal_strength_dbm != null ? `${device.signal_strength_dbm}%` : "—" },
      { label: "IP Address", icon: Globe, value: device.network_ip || "—" },
      {
        // Firmware currently reports exactly 0.0 for every device fleet-wide —
        // an unimplemented sensor stub, not a real reading. Showing "0.0°C" as
        // if it were live would be misleading, so treat 0 the same as no data
        // until firmware actually wires up the chip-temp sensor.
        label: "Chip Temp",
        icon: Activity,
        value: device.device_temp_c ? `${device.device_temp_c.toFixed(1)}°C` : "—",
        tone: device.device_temp_c ? tempColor(device.device_temp_c) : undefined,
      },
    ];

    let commsBanner: DisplayDevice["commsBanner"];
    let dataSourceBadge: DisplayDevice["dataSourceBadge"];
    if (isGatewayDevice && gateway.data_source) {
      // Backend reports exactly two values here: 'rs485' (live local read) or
      // 'deye_cloud' (falling back to Deye's cloud API when RS-485 goes quiet).
      // Previously mislabeled "Deye Logger" here, which is actually the name of
      // a different physical WiFi-stick accessory listed under Equipment below —
      // conflating the two made it unclear what data path was actually live.
      dataSourceBadge = gateway.data_source === "rs485"
        ? { label: "RS-485 (live)", tone: "good" }
        : { label: "Deye Cloud (fallback)", tone: "warn" };
      if (gateway.rs485_stale) {
        commsBanner = {
          tone: "warn",
          text: `RS-485 link inactive since ${gateway.rs485_last_seen ? timeAgo(gateway.rs485_last_seen) : "unknown"} — readings are coming from Deye's cloud API instead. The gateway itself is still online.`,
        };
      }
    }

    return {
      key: `attached-${device.device_serial}`,
      serial: device.device_serial,
      label: fleetDeviceLabel(device.device_type),
      is_online: device.is_online,
      description: device.device_type === "energy_meter"
        ? "ESP32 gateway reading the energy meter"
        : "ESP32 gateway reading the inverter",
      details,
      commsBanner,
      dataSourceBadge,
      isPrimary: isGatewayDevice,
      signalPct: device.signal_strength_dbm ?? null,
    };
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SocArc({ pct }: { pct: number }) {
  const color = pct > 50 ? "var(--primary)" : pct > 20 ? "var(--secondary)" : "var(--destructive)";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        style={{
          display: "inline-block",
          width: 32,
          height: 8,
          borderRadius: 4,
          background: "color-mix(in srgb, var(--foreground) 8%, transparent)",
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

// Point on a circle at `deg` (0 = 12 o'clock), used to build the 270° gauge arc.
function arcPoint(deg: number, cx: number, cy: number, r: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// Instrument-style gauge — a 270° arc (gap at the bottom) with a soft glow
// filter and gradient stroke, in the same construction as the staff app's
// "Solar Observatory" hardware-health panel (EnergyFlowHealthRow.tsx), just
// re-skinned into Solar Noir's palette so the two apps read as one system
// instead of two different component libraries for the same concept.
function MiniArc({
  pct, color, size = 76, strokeWidth = 7,
}: { pct: number; color: string; size?: number; strokeWidth?: number }) {
  const cx = size / 2, cy = size / 2, r = cx - strokeWidth / 2 - 2;
  const start = arcPoint(225, cx, cy, r), end = arcPoint(135, cx, cy, r);
  const path = `M ${start.x} ${start.y} A ${r} ${r} 0 1 1 ${end.x} ${end.y}`;
  const uid = useId().replace(/:/g, "");
  const clamped = Math.min(100, Math.max(0, pct)) / 100;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible", display: "block" }}>
      <defs>
        <filter id={`${uid}-glow`} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path d={path} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} strokeLinecap="round" />
      <motion.path
        d={path} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
        pathLength={1}
        initial={{ strokeDashoffset: 1 }}
        animate={{ strokeDashoffset: 1 - clamped }}
        transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
        style={{ strokeDasharray: "1 1", filter: `url(#${uid}-glow)` }}
      />
    </svg>
  );
}

// Small pulsing dot — live/online indicator, matching the staff panel's PulseDot.
function PulseDot({ color }: { color: string }) {
  return (
    <div className="relative w-2 h-2">
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: color, opacity: 0.4 }}
        animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0.25 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function DevicePage() {
  const { user, status } = useAuth();

  const { data, loading, error, noSite, refresh } = useSiteQuery<DeviceSummary>(
    user?.site_id,
    async (siteId, signal) => {
      const [summary, overview] = await Promise.all([
        portalApi.getPortalDevice(siteId, signal),
        portalApi.getPortalOverview(siteId, undefined, signal).catch(() => null),
      ]);
      signal.throwIfAborted();
      const payload = summary.data.data;
      const realtime = (overview?.data?.data?.realtime ?? {}) as Record<string, unknown>;
      const fleet = (
        (realtime.devices ?? []) as Array<FleetDevice>
      ).map((d) => ({
        device_serial: d.device_serial,
        device_type: d.device_type ?? "gateway",
        is_online: Boolean(d.is_online),
        last_heartbeat: d.last_heartbeat,
        age_seconds: d.age_seconds,
        model: d.model,
        firmware_version: d.firmware_version,
        connectivity_type: d.connectivity_type,
        network_ip: d.network_ip,
        signal_strength_dbm: d.signal_strength_dbm,
        device_temp_c: d.device_temp_c,
      }));
      return {
        gateway: (payload.gateway ?? EMPTY_GATEWAY) as GatewayStatus,
        telemetry: (payload.telemetry ?? null) as TelemetryReading | null,
        equipment: (payload.equipment ?? EMPTY_EQUIPMENT) as Equipment,
        health: (payload.hardware_health ?? EMPTY_HEALTH) as HardwareHealth,
        fleet,
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
  const fleet = data?.fleet ?? [];
  const displayDevices = buildDisplayDevices(fleet, gateway);
  const displayOfflineCount = displayDevices.filter((d) => !d.is_online).length;

  const faultCodes = [
    telemetry.fault_code_1,
    telemetry.fault_code_2,
    telemetry.fault_code_3,
    telemetry.fault_code_4,
    telemetry.fault_code_5,
  ].filter((f): f is string => !!f && f !== "0");

  const solarOutputKw = ((telemetry.pv1_power_w || 0) + (telemetry.pv2_power_w || 0)) / 1000;

  return (
    <div className="space-y-5 pb-8">
      <motion.h1
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-foreground font-display mb-6"
      >
        Devices
      </motion.h1>

      {noSite && (
        <GlassCard>
          <p className="text-base text-amber-300">No site linked to your account.</p>
        </GlassCard>
      )}

      {error && (
        <GlassCard>
          <div className="flex items-center justify-between gap-3">
            <p className="text-base text-red-300">{error}</p>
            <button onClick={refresh} className="text-sm text-muted-foreground underline underline-offset-2">
              Retry
            </button>
          </div>
        </GlassCard>
      )}

      {loading && (
        <div className="space-y-5">
          <SkeletonPulse className="h-40 w-full rounded-2xl" />
          <SkeletonPulse className="h-32 w-full rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <SkeletonPulse key={i} className="h-32 rounded-2xl" />)}
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* 1. Device fleet — one card per physical communication device. Each
              card is now the single source of truth for that device (identity,
              connectivity, and — for the inverter gateway — its data path) so
              nothing is split across a second "status" card anymore. */}
          {displayDevices.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-sm text-muted-foreground uppercase tracking-widest font-medium">
                  {displayDevices.length} device{displayDevices.length !== 1 ? "s" : ""} on this site
                </p>
                {displayDevices.length > 1 && (
                  <span className={`text-sm font-semibold ${displayOfflineCount > 0 ? "text-red-400" : "text-emerald-400"}`}>
                    {displayOfflineCount > 0 ? `${displayOfflineCount} offline` : "All online"}
                  </span>
                )}
              </div>
              <div className={`grid grid-cols-1 ${displayDevices.length > 1 ? "lg:grid-cols-2" : ""} gap-4`}>
                {displayDevices.map((d, i) => (
                  <motion.div
                    key={d.key}
                    className="h-full"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...SPRING, delay: i * 0.06 }}
                  >
                    <GlassCard
                      glow={d.is_online ? "green" : undefined}
                      className={`h-full flex flex-col relative overflow-hidden ${!d.is_online ? "border-red-500/30" : d.isPrimary ? "border-emerald-500/25" : ""}`}
                    >
                      {/* Primary (gateway) card gets a subtle ambient glow wash — visually the hero device on this page */}
                      {d.isPrimary && d.is_online && (
                        <div
                          className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full"
                          style={{ background: "radial-gradient(circle, rgba(47,191,113,0.14) 0%, transparent 70%)" }}
                        />
                      )}

                      <div className="flex items-start justify-between gap-3 mb-3 relative">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            {d.isPrimary && d.is_online && (
                              <motion.div
                                className="absolute inset-0 rounded-xl"
                                style={{ background: "rgba(47,191,113,0.35)" }}
                                animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
                                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                              />
                            )}
                            <div
                              style={{ background: d.is_online ? "color-mix(in srgb, var(--primary) 15%, transparent)" : "rgba(239,68,68,0.12)" }}
                              className={`relative rounded-xl flex items-center justify-center ${d.isPrimary ? "w-14 h-14" : "w-11 h-11"}`}
                            >
                              <Cpu size={d.isPrimary ? 26 : 20} style={{ color: d.is_online ? "var(--primary)" : "var(--destructive)" }} />
                            </div>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              {d.isPrimary && (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                                  style={{ background: "color-mix(in srgb, var(--primary) 15%, transparent)", color: "var(--primary)" }}>
                                  Primary
                                </span>
                              )}
                              <h3 className={`font-semibold text-foreground truncate ${d.isPrimary ? "text-lg" : ""}`}>{d.label}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground font-mono truncate">{d.serial}</p>
                          </div>
                        </div>
                        <StatusPill status={d.is_online ? "active" : "error"} label={d.is_online ? "Online" : "Offline"} />
                      </div>

                      <p className="text-sm text-muted-foreground mb-3 relative">{d.description}</p>

                      {/* Hero row for the gateway: signal gauge + data-source path side by side.
                          Same instrument-tile construction (accent bar, ambient glow, pulse dot,
                          270° arc) as the Hardware Health tiles below, so the gateway's signal
                          reads as part of the same instrument system rather than a one-off. */}
                      {d.isPrimary && d.signalPct != null ? (() => {
                        const sig = signalBars(d.signalPct);
                        return (
                          <div className="relative overflow-hidden rounded-xl bg-foreground/[0.03] border border-border mb-4">
                            <div className="h-0.75" style={{ background: `linear-gradient(90deg, ${sig.color}cc, ${sig.color}33)` }} />
                            <div
                              className="pointer-events-none absolute -top-4 left-6 w-20 h-10 rounded-full opacity-40"
                              style={{ background: sig.color, filter: "blur(20px)" }}
                            />
                            <div className="absolute top-2.5 right-2.5"><PulseDot color={sig.color} /></div>
                            <div className="flex items-center gap-4 p-3.5 relative">
                              <div className="relative w-16 h-16 shrink-0">
                                <MiniArc pct={d.signalPct} color={sig.color} size={64} strokeWidth={6} />
                                <div className="absolute inset-0 flex items-center justify-center pb-1.5">
                                  <span
                                    className="text-sm font-bold"
                                    style={{ color: sig.color, fontFamily: "var(--font-jetbrains-mono), monospace" }}
                                  >
                                    {d.signalPct}%
                                  </span>
                                </div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-foreground">
                                  Signal — {sig.label}
                                </p>
                                {d.dataSourceBadge && (
                                  <span
                                    className="inline-block mt-1.5 text-sm font-mono px-2 py-0.5 rounded-full"
                                    style={
                                      d.dataSourceBadge.tone === "good"
                                        ? { background: "color-mix(in srgb, var(--primary) 12%, transparent)", color: "var(--primary)", border: "1px solid color-mix(in srgb, var(--primary) 30%, transparent)" }
                                        : { background: "color-mix(in srgb, var(--secondary) 12%, transparent)", color: "var(--secondary)", border: "1px solid color-mix(in srgb, var(--secondary) 30%, transparent)" }
                                    }
                                  >
                                    Data via: {d.dataSourceBadge.label}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })() : d.dataSourceBadge ? (
                        <div className="mb-3 relative">
                          <span
                            className="text-sm font-mono px-2 py-0.5 rounded-full"
                            style={
                              d.dataSourceBadge.tone === "good"
                                ? { background: "color-mix(in srgb, var(--primary) 12%, transparent)", color: "var(--primary)", border: "1px solid color-mix(in srgb, var(--primary) 30%, transparent)" }
                                : { background: "color-mix(in srgb, var(--secondary) 12%, transparent)", color: "var(--secondary)", border: "1px solid color-mix(in srgb, var(--secondary) 30%, transparent)" }
                            }
                          >
                            Data via: {d.dataSourceBadge.label}
                          </span>
                        </div>
                      ) : null}

                      <div className="grid grid-cols-2 gap-3 border-t border-border pt-3 relative">
                        {d.details.map((detail) => (
                          <div key={`${d.key}-${detail.label}`} className="min-w-0 flex items-start gap-2">
                            <detail.icon size={13} className="text-muted-foreground shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="text-xs uppercase tracking-wider text-muted-foreground">{detail.label}</p>
                              <p
                                className="mt-0.5 truncate text-sm font-semibold text-foreground"
                                style={detail.tone ? { color: detail.tone } : undefined}
                              >
                                {detail.value}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {d.commsBanner && (
                        <div className="mt-auto pt-3 relative">
                          <div
                            className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg"
                            style={{ background: "color-mix(in srgb, var(--secondary) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--secondary) 20%, transparent)", color: "var(--secondary)" }}
                          >
                            <AlertTriangle size={13} className="shrink-0" />
                            <span>{d.commsBanner.text}</span>
                          </div>
                        </div>
                      )}
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* 2. Live Inverter Snapshot */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.1 }}>
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Live Status</h3>
                <span className="text-sm text-muted-foreground">Updated {timeAgo(telemetry.timestamp)}</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {/* Run State */}
                <div style={{ background: "color-mix(in srgb, var(--foreground) 4%, transparent)", borderRadius: 10 }} className="p-3">
                  <p className="text-sm text-muted-foreground mb-1">Run State</p>
                  <p className="text-base font-semibold text-foreground">{runStateLabel(telemetry.run_state)}</p>
                </div>
                {/* Solar Output */}
                <div style={{ background: "color-mix(in srgb, var(--foreground) 4%, transparent)", borderRadius: 10 }} className="p-3">
                  <p className="text-sm text-muted-foreground mb-1">Solar Output</p>
                  <p className="text-base font-semibold text-foreground">
                    <AnimatedNumber value={solarOutputKw} decimals={2} /> kW
                  </p>
                </div>
                {/* Inverter Temp */}
                <div style={{ background: "color-mix(in srgb, var(--foreground) 4%, transparent)", borderRadius: 10 }} className="p-3">
                  <p className="text-sm text-muted-foreground mb-1">Inverter Temp</p>
                  <p className="text-base font-semibold" style={{ color: tempColor(telemetry.inverter_temp_c) }}>
                    <AnimatedNumber value={telemetry.inverter_temp_c} decimals={1} />°C
                  </p>
                </div>
                {/* Battery SOC */}
                <div style={{ background: "color-mix(in srgb, var(--foreground) 4%, transparent)", borderRadius: 10 }} className="p-3">
                  <p className="text-sm text-muted-foreground mb-1">Battery SOC</p>
                  {telemetry.battery_soc_percent != null
                    ? <SocArc pct={telemetry.battery_soc_percent} />
                    : <p className="text-base font-semibold text-muted-foreground mt-1">—</p>
                  }
                </div>
              </div>

              {faultCodes.length > 0 && (
                <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                  <span className="flex items-center gap-1.5 text-sm text-red-400">
                    <AlertTriangle size={13} />
                    Fault Codes:
                  </span>
                  {faultCodes.map((fc, i) => (
                    <span
                      key={i}
                      style={{ background: "color-mix(in srgb, var(--destructive) 12%, transparent)", color: "var(--destructive)", borderRadius: 6, padding: "2px 8px", fontSize: 12, fontFamily: "monospace" }}
                    >
                      {fc}
                    </span>
                  ))}
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* 3. Equipment Cards */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.15 }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Inverters */}
              <GlassCard>
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={16} style={{ color: "var(--primary)" }} />
                  <h4 className="text-base font-semibold text-foreground">Inverter</h4>
                </div>
                {equipment.inverters.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No inverter on record.</p>
                ) : equipment.inverters.map((inv, i) => (
                  <div key={i} className="space-y-1.5 text-base">
                    <p className="font-bold text-foreground">{inv.brand} {inv.model}</p>
                    <p className="text-muted-foreground">{inv.capacity_kva} kVA</p>
                    {inv.logger_serial && (
                      <p className="text-muted-foreground">
                        WiFi logger stick <span className="font-mono text-foreground">{inv.logger_serial}</span>
                      </p>
                    )}
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
                  <Battery size={16} style={{ color: "var(--primary)" }} />
                  <h4 className="text-base font-semibold text-foreground">Battery</h4>
                </div>
                {equipment.batteries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No battery installed — grid-tied system.</p>
                ) : equipment.batteries.map((bat, i) => (
                  <div key={i} className="space-y-1.5 text-base">
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
                  <Sun size={16} style={{ color: "var(--primary)" }} />
                  <h4 className="text-base font-semibold text-foreground">Solar Panels</h4>
                </div>
                {equipment.panels.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No panels on record.</p>
                ) : (() => {
                  // Group by brand+model key, sum count
                  const groups = new Map<string, { panel: typeof equipment.panels[0]; count: number }>();
                  for (const p of equipment.panels) {
                    const key = `${p.brand}|${p.model}|${p.capacity_wp}`;
                    const existing = groups.get(key);
                    if (existing) existing.count++;
                    else groups.set(key, { panel: p, count: 1 });
                  }
                  return Array.from(groups.values()).map(({ panel, count }, i) => (
                    <div key={i} className="space-y-1.5 text-base">
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

          {/* 4. Hardware Health summary strip — the full per-component breakdown
              (gauges, live metrics, alerts, maintenance tips) now lives on the
              360Care page, which computes it from the same backend score. This
              strip answers "is everything OK?" at a glance and links out to the
              full report instead of duplicating it here. */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.2 }}>
            <GlassCard>
              {(() => {
                const metrics = [health.solar_efficiency_pct, health.inverter_efficiency_pct, health.battery_efficiency_pct];
                const available = metrics.filter((m): m is number => m != null);
                const overallPct = available.length > 0
                  ? Math.round(available.reduce((s, v) => s + v, 0) / available.length)
                  : null;
                const overallTone = healthTone(overallPct);
                const color = overallPct != null ? efficiencyColor(overallPct) : "var(--muted)";

                return (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: `${color}18`, border: `1px solid ${color}35` }}
                      >
                        <Activity size={18} style={{ color }} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-base text-foreground">Hardware Health</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {overallPct != null ? `${overallPct}% overall` : "No data"} &bull; Solar, inverter &amp; battery
                        </p>
                      </div>
                      {overallPct != null && (
                        <span
                          className="ml-auto sm:ml-0 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                          style={{ background: `${overallTone.color}26`, color: overallTone.color }}
                        >
                          {overallTone.label}
                        </span>
                      )}
                    </div>
                    <a
                      href="/care/health"
                      className="shrink-0 flex items-center justify-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 border border-emerald-500/25 hover:border-emerald-500/40 rounded-lg px-4 py-2 transition-colors whitespace-nowrap"
                    >
                      View Full Health Report
                    </a>
                  </div>
                );
              })()}
            </GlassCard>
          </motion.div>
        </>
      )}
    </div>
  );
}
