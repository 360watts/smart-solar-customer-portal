"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info, CheckCircle, Clock, WifiOff, Wifi } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import StatusPill from "@/components/ui/StatusPill";
import { useAuth } from "@/contexts/AuthContext";
import { portalApi } from "@/lib/api";
import { useSiteQuery } from "@/lib/hooks/useSiteQuery";
import { TTL } from "@/lib/portalCache";

interface Alert {
  id: string;
  alert_type: string;
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  device_serial: string;
  triggered_at: string;
  status: "active" | "resolved" | "acknowledged";
  fault_code: string | null;
}

interface AlertsDevice {
  serial: string;
  device_type?: string;
  is_online: boolean;
}

interface AlertsPageData {
  alerts: Alert[];
  devices: AlertsDevice[];
}

// Human-readable fallback titles for alert types the backend doesn't label explicitly.
const TYPE_LABELS: Record<string, string> = {
  device_offline: "Device Offline",
  low_battery: "Low Battery",
  high_temperature: "High Temperature",
  communication_error: "Communication Error",
  threshold_exceeded: "Threshold Exceeded",
  maintenance_due: "Maintenance Due",
  fault: "Fault Detected",
  custom: "Alert",
};

function normalizeAlert(raw: Record<string, unknown>): Alert {
  const alertType = String(raw.alert_type ?? raw.type ?? "custom");
  const severity = (raw.severity as Alert["severity"]) || "warning";
  const deviceSerial = String(raw.device_serial ?? raw.device_id ?? "—");
  return {
    id: String(raw.id ?? `${deviceSerial}-${raw.timestamp ?? raw.triggered_at}`),
    alert_type: alertType,
    severity,
    title: (raw.title as string) || TYPE_LABELS[alertType] || "Alert",
    message: (raw.message as string) || "",
    device_serial: deviceSerial,
    triggered_at: String(raw.triggered_at ?? raw.timestamp ?? new Date().toISOString()),
    status: (raw.status as Alert["status"]) || "active",
    fault_code: (raw.fault_code as string) || null,
  };
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const SEVERITY_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  critical: { color: "#EF4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)" },
  warning: { color: "#E9B949", bg: "rgba(233,185,73,0.1)", border: "rgba(233,185,73,0.25)" },
  info: { color: "#60a5fa", bg: "rgba(96,165,250,0.1)", border: "rgba(96,165,250,0.25)" },
};

// Severity rank for sort — critical first, then warning, then info; ties broken by recency.
const SEVERITY_RANK: Record<string, number> = { critical: 0, warning: 1, info: 2 };

type StatusFilter = "all" | "active" | "resolved";
type SeverityFilter = "all" | "critical" | "warning" | "info";
const ALERTS_PER_PAGE = 8;

export default function AlertsPage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [page, setPage] = useState(1);
  const [localOverrides, setLocalOverrides] = useState<Record<string, Alert["status"]>>({});

  const { data, loading, error } = useSiteQuery<AlertsPageData>(
    user?.site_id,
    async (siteId, signal) => {
      const [alertsRes, overviewRes] = await Promise.all([
        portalApi.getSiteAlerts(siteId, signal),
        portalApi.getPortalOverview(siteId, undefined, signal).catch(() => null),
      ]);
      signal.throwIfAborted();

      const rawAlerts = alertsRes.data as unknown;
      const list = Array.isArray(rawAlerts)
        ? rawAlerts
        : Array.isArray((rawAlerts as { results?: unknown[] })?.results)
          ? (rawAlerts as { results: unknown[] }).results
          : [];
      const alerts = (list as Record<string, unknown>[]).map(normalizeAlert);

      const realtime = (overviewRes?.data?.data?.realtime ?? {}) as Record<string, unknown>;
      const devices = (
        (realtime.devices ?? []) as Array<{ device_serial: string; device_type?: string; is_online?: boolean }>
      ).map((d) => ({ serial: d.device_serial, device_type: d.device_type ?? "gateway", is_online: Boolean(d.is_online) }));

      return { alerts, devices };
    },
    { cacheKey: `alerts:${user?.site_id}`, ttl: TTL.summary, autoRefreshSec: 30 },
  );

  const alerts: Alert[] = data?.alerts ?? [];
  const devices: AlertsDevice[] = data?.devices ?? [];
  const loaded = !loading;

  function acknowledgeAlert(alertId: string) {
    setLocalOverrides((prev) => ({ ...prev, [alertId]: "acknowledged" }));
    portalApi.acknowledgeAlert(alertId).catch(() => {});
  }

  const displayAlerts = alerts.map((a) =>
    localOverrides[a.id] ? { ...a, status: localOverrides[a.id]! } : a
  );

  const filtered = displayAlerts
    .filter((a) => {
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && (a.status === "active" || a.status === "acknowledged")) ||
        (statusFilter === "resolved" && a.status === "resolved");
      const matchSeverity =
        severityFilter === "all" || a.severity === severityFilter;
      return matchStatus && matchSeverity;
    })
    .sort((a, b) => {
      const rankDiff = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
      if (rankDiff !== 0) return rankDiff;
      return new Date(b.triggered_at).getTime() - new Date(a.triggered_at).getTime();
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ALERTS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * ALERTS_PER_PAGE;
  const pageEnd = pageStart + ALERTS_PER_PAGE;
  const visibleAlerts = filtered.slice(pageStart, pageEnd);

  const criticalCount = displayAlerts.filter((a) => a.severity === "critical").length;
  const warningCount = displayAlerts.filter((a) => a.severity === "warning").length;
  const infoCount = displayAlerts.filter((a) => a.severity === "info").length;
  const offlineDevices = devices.filter((d) => !d.is_online);

  // Map device_serial → offline flag so each alert card can show live device status,
  // not just the alert's own severity — the device may have recovered since triggering.
  const offlineSerials = new Set(offlineDevices.map((d) => d.serial));

  const pillBtn = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
      active
        ? "bg-white/20 text-white"
        : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
    }`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground font-display">
          Alerts
        </h1>
        <p className="text-base text-muted-foreground mt-1">
          System health &amp; notifications
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-base text-red-300">
          {error}
        </div>
      )}

      {/* Device status strip — offline devices surfaced here too, not just in alert text */}
      {devices.length > 0 && (
        <GlassCard className={offlineDevices.length > 0 ? "border-red-500/30" : "border-white/10"}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-white/60 uppercase tracking-widest font-medium">Device Connectivity</p>
            <span className={`text-sm font-semibold ${offlineDevices.length > 0 ? "text-red-400" : "text-emerald-400"}`}>
              {offlineDevices.length > 0
                ? `${offlineDevices.length}/${devices.length} offline`
                : "All devices online"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {devices.map((d) => (
              <span
                key={d.serial}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border"
                style={
                  d.is_online
                    ? { background: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.25)", color: "#34d399" }
                    : { background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.3)", color: "#f87171" }
                }
              >
                {d.is_online ? <Wifi size={12} /> : <WifiOff size={12} />}
                <span className="font-semibold">{d.device_type === "energy_meter" ? "Energy Meter IoT Gateway" : "Inverter IoT Gateway"}</span>
                <span className="font-mono text-white/45">{d.serial}</span>
              </span>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Summary bar */}
      <div className="flex flex-wrap gap-3">
        <span
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold"
          style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444" }}
        >
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          {criticalCount} Critical
        </span>
        <span
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold"
          style={{ background: "rgba(233,185,73,0.15)", color: "#E9B949" }}
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
          {warningCount} Warning
        </span>
        <span
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold"
          style={{ background: "rgba(96,165,250,0.15)", color: "#60a5fa" }}
        >
          <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
          {infoCount} Info
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/40 uppercase tracking-wider">Status</span>
          <div className="flex gap-1">
            {(["all", "active", "resolved"] as StatusFilter[]).map((s) => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className={pillBtn(statusFilter === s)}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/40 uppercase tracking-wider">Severity</span>
          <div className="flex gap-1">
            {(["all", "critical", "warning", "info"] as SeverityFilter[]).map((s) => (
              <button key={s} onClick={() => { setSeverityFilter(s); setPage(1); }} className={pillBtn(severityFilter === s)}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alert list */}
      <AnimatePresence mode="popLayout">
        {loaded && filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(16,185,129,0.15)" }}>
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-xl font-semibold text-white">All Clear</p>
            <p className="text-base text-white/50">No alerts matching your filters</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3">
              <span className="text-sm text-white/55">
                Showing {filtered.length === 0 ? 0 : pageStart + 1}-{Math.min(pageEnd, filtered.length)} of {filtered.length} alerts
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-sm text-white/70 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setPage(p)}
                      className={`h-8 min-w-8 rounded-lg px-2 text-sm font-semibold transition ${
                        p === currentPage
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/25"
                          : "bg-white/[0.04] text-white/55 border border-white/[0.06] hover:bg-white/[0.08] hover:text-white/80"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-sm text-white/70 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            {visibleAlerts.map((alert) => {
              const sev = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.info;
              const Icon = alert.severity === "info" ? Info : AlertTriangle;
              const deviceOffline = offlineSerials.has(alert.device_serial);
              const isCritical = alert.severity === "critical";
              return (
                <motion.div
                  key={alert.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                >
                  <GlassCard
                    className={isCritical ? "border-red-500/30 bg-gradient-to-br from-red-950/15 to-transparent" : undefined}
                  >
                    <div className="flex items-start gap-4">
                      {/* Severity icon — critical alerts pulse, matching the overview's critical card */}
                      <motion.div
                        animate={isCritical ? { scale: [1, 1.08, 1] } : {}}
                        transition={isCritical ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : undefined}
                        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mt-0.5"
                        style={{ background: sev.bg, border: `1px solid ${sev.border}` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: sev.color }} />
                      </motion.div>

                      {/* Body */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-white text-base">{alert.title}</p>
                          {isCritical && (
                            <motion.span
                              animate={{ opacity: [1, 0.7, 1] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                              className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/90 text-white shadow-lg shadow-red-500/30"
                            >
                              CRITICAL
                            </motion.span>
                          )}
                          {deviceOffline && (
                            <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                              <WifiOff size={10} /> Device Offline
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-white/60 mt-0.5">{alert.message}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="text-sm px-2 py-0.5 rounded bg-white/10 text-white/70 font-mono">
                            {alert.device_serial}
                          </span>
                          <span className="flex items-center gap-1 text-sm text-white/40">
                            <Clock size={11} /> {timeAgo(alert.triggered_at)}
                          </span>
                          {alert.fault_code && (
                            <span className="text-sm px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/25 text-amber-300 font-mono">
                              {alert.fault_code}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: status + ack */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <StatusPill
                          status={alert.status === "resolved" ? "active" : "warning"}
                          label={alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                        />
                        {alert.status === "active" && (
                          <button
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="text-sm px-3 py-1 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all cursor-pointer"
                          >
                            Acknowledge
                          </button>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
