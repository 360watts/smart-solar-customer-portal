"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info, CheckCircle, Clock, WifiOff, Wifi } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import StatusPill from "@/components/ui/StatusPill";
import { useAuth } from "@/contexts/AuthContext";
import { portalApi, type IncidentItem } from "@/lib/api";
import { useSiteQuery } from "@/lib/hooks/useSiteQuery";
import { TTL } from "@/lib/portalCache";

interface AlertsDevice {
  serial: string;
  device_type?: string;
  is_online: boolean;
}

interface AlertsPageData {
  incidents: IncidentItem[];
  totalCount: number;
  devices: AlertsDevice[];
}

const INCIDENT_CATEGORY_LABELS: Record<IncidentItem["category"], string> = {
  hardware: "Hardware",
  connectivity: "Connectivity",
  data_quality: "Data Quality",
  weather_environmental: "Weather / Environmental",
  maintenance: "Maintenance",
  grid: "Grid",
};

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
  critical: { color: "var(--destructive)", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)" },
  warning: { color: "var(--glow-amber)", bg: "rgba(233,185,73,0.1)", border: "rgba(233,185,73,0.25)" },
  info: { color: "var(--info)", bg: "rgba(96,165,250,0.1)", border: "rgba(96,165,250,0.25)" },
};

// Severity rank for sort — critical first, then warning, then info; ties broken by recency.
const SEVERITY_RANK: Record<string, number> = { critical: 0, warning: 1, info: 2 };

type StatusFilter = "all" | "active" | "resolved";
type SeverityFilter = "all" | "critical" | "warning" | "info";
const ALERTS_PER_PAGE = 8;

// Fetched in one page-load-sized batch; the list is paginated client-side
// (matches the previous unpaginated-shim behavior) rather than round-tripping
// to the server per page — 200 comfortably covers a site's recent history.
const INCIDENT_FETCH_LIMIT = 200;

export default function AlertsPage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [page, setPage] = useState(1);
  const [localOverrides, setLocalOverrides] = useState<Record<string, IncidentItem["status"]>>({});

  const { data, loading, error } = useSiteQuery<AlertsPageData>(
    user?.site_id,
    async (siteId, signal) => {
      const [incidentsRes, overviewRes] = await Promise.all([
        portalApi.getSiteIncidents(siteId, { limit: INCIDENT_FETCH_LIMIT }, signal),
        portalApi.getPortalOverview(siteId, undefined, signal).catch(() => null),
      ]);
      signal.throwIfAborted();

      const realtime = (overviewRes?.data?.data?.realtime ?? {}) as Record<string, unknown>;
      const devices = (
        (realtime.devices ?? []) as Array<{ device_serial: string; device_type?: string; is_online?: boolean }>
      ).map((d) => ({ serial: d.device_serial, device_type: d.device_type ?? "gateway", is_online: Boolean(d.is_online) }));

      return { incidents: incidentsRes.results, totalCount: incidentsRes.count, devices };
    },
    { cacheKey: `alerts:${user?.site_id}`, ttl: TTL.summary, autoRefreshSec: 30 },
  );

  const incidents: IncidentItem[] = data?.incidents ?? [];
  const devices: AlertsDevice[] = data?.devices ?? [];
  const loaded = !loading;

  function acknowledgeAlert(incidentId: number) {
    setLocalOverrides((prev) => ({ ...prev, [incidentId]: "acknowledged" }));
    portalApi.acknowledgeAlert(String(incidentId)).catch(() => {});
  }

  const displayIncidents = incidents.map((inc) =>
    localOverrides[inc.id] ? { ...inc, status: localOverrides[inc.id]! } : inc
  );

  const filtered = displayIncidents
    .filter((inc) => {
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && (inc.status === "active" || inc.status === "acknowledged")) ||
        (statusFilter === "resolved" && inc.status === "resolved");
      const matchSeverity =
        severityFilter === "all" || inc.severity === severityFilter;
      return matchStatus && matchSeverity;
    })
    .sort((a, b) => {
      const rankDiff = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
      if (rankDiff !== 0) return rankDiff;
      return new Date(b.tsStart).getTime() - new Date(a.tsStart).getTime();
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ALERTS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * ALERTS_PER_PAGE;
  const pageEnd = pageStart + ALERTS_PER_PAGE;
  const visibleAlerts = filtered.slice(pageStart, pageEnd);

  const criticalCount = displayIncidents.filter((inc) => inc.severity === "critical").length;
  const warningCount = displayIncidents.filter((inc) => inc.severity === "warning").length;
  const infoCount = displayIncidents.filter((inc) => inc.severity === "info").length;
  const offlineDevices = devices.filter((d) => !d.is_online);

  // Map device_serial → offline flag so each incident card can show live device status,
  // not just the incident's own severity — the device may have recovered since triggering.
  const offlineSerials = new Set(offlineDevices.map((d) => d.serial));

  const pillBtn = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
      active
        ? "bg-surface-5 text-text-1"
        : "bg-surface-2 text-text-4 hover:bg-surface-4 hover:text-text-1"
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
        <GlassCard className={offlineDevices.length > 0 ? "border-red-500/30" : "border-border-2"}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-text-3 uppercase tracking-label font-medium">Device Connectivity</p>
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
                <span className="font-mono text-text-4">{d.serial}</span>
              </span>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Summary bar */}
      <div className="flex flex-wrap gap-3">
        <span
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold"
          style={{ background: "rgba(239,68,68,0.15)", color: "var(--destructive)" }}
        >
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          {criticalCount} Critical
        </span>
        <span
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold"
          style={{ background: "rgba(233,185,73,0.15)", color: "var(--glow-amber)" }}
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
          {warningCount} Warning
        </span>
        <span
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold"
          style={{ background: "rgba(96,165,250,0.15)", color: "var(--info)" }}
        >
          <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
          {infoCount} Info
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-4 uppercase tracking-label">Status</span>
          <div className="flex gap-1">
            {(["all", "active", "resolved"] as StatusFilter[]).map((s) => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className={pillBtn(statusFilter === s)}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-4 uppercase tracking-label">Severity</span>
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
            <p className="text-xl font-semibold text-text-1">All Clear</p>
            <p className="text-base text-text-4">No alerts matching your filters</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-1 bg-surface-1 px-4 py-3">
              <span className="text-sm text-text-3">
                Showing {filtered.length === 0 ? 0 : pageStart + 1}-{Math.min(pageEnd, filtered.length)} of {filtered.length} alerts
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-border-2 bg-surface-2 px-3 py-1.5 text-sm text-text-2 transition hover:bg-surface-3 disabled:cursor-not-allowed disabled:opacity-35"
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
                          : "bg-surface-2 text-text-3 border border-border-1 hover:bg-surface-3 hover:text-text-1"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-border-2 bg-surface-2 px-3 py-1.5 text-sm text-text-2 transition hover:bg-surface-3 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            {visibleAlerts.map((incident) => {
              const sev = SEVERITY_STYLES[incident.severity] ?? SEVERITY_STYLES.info;
              const Icon = incident.severity === "info" ? Info : AlertTriangle;
              const deviceOffline = incident.deviceSerial != null && offlineSerials.has(incident.deviceSerial);
              const isCritical = incident.severity === "critical";
              return (
                <motion.div
                  key={incident.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                >
                  <GlassCard
                    className={isCritical ? "border-red-500/30 bg-linear-to-br from-red-950/15 to-transparent" : undefined}
                  >
                    <div className="flex items-start gap-4">
                      {/* Severity icon — critical incidents pulse, matching the overview's critical card */}
                      <motion.div
                        animate={isCritical ? { scale: [1, 1.08, 1] } : {}}
                        transition={isCritical ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : undefined}
                        className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center mt-0.5"
                        style={{ background: sev.bg, border: `1px solid ${sev.border}` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: sev.color }} />
                      </motion.div>

                      {/* Body */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-text-1 text-base">{incident.title}</p>
                          {isCritical && (
                            <motion.span
                              animate={{ opacity: [1, 0.7, 1] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                              className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/90 text-foreground shadow-lg shadow-red-500/30"
                            >
                              CRITICAL
                            </motion.span>
                          )}
                          {deviceOffline && (
                            <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-label px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                              <WifiOff size={10} /> Device Offline
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-text-3 mt-0.5">{incident.summary}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="text-sm px-2 py-0.5 rounded bg-surface-4 text-text-2 font-mono">
                            {INCIDENT_CATEGORY_LABELS[incident.category] ?? incident.category}
                          </span>
                          {incident.deviceSerial && (
                            <span className="text-sm px-2 py-0.5 rounded bg-surface-4 text-text-2 font-mono">
                              {incident.deviceSerial}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-sm text-text-4">
                            <Clock size={11} /> {timeAgo(incident.tsStart)}
                          </span>
                          {incident.durationSeconds != null && (
                            <span className="text-sm px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/25 text-amber-300 font-mono">
                              {Math.round(incident.durationSeconds / 60)} min
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: status + ack */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <StatusPill
                          status={incident.status === "resolved" ? "active" : "warning"}
                          label={incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                        />
                        {incident.status === "active" && (
                          <button
                            onClick={() => acknowledgeAlert(incident.id)}
                            className="text-sm px-3 py-1 rounded-full bg-surface-4 text-text-2 hover:bg-surface-5 hover:text-text-1 transition-all cursor-pointer"
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
