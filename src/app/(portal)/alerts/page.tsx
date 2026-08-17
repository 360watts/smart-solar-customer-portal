"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info, CheckCircle, WifiOff, Wifi, Timer } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import StatusPill from "@/components/ui/StatusPill";
import { useAuth } from "@/contexts/AuthContext";
import { portalApi, type IncidentItem } from "@/lib/api";
import { useSiteQuery } from "@/lib/hooks/useSiteQuery";
import { TTL } from "@/lib/portalCache";
import { SITE_TIMEZONE } from "@/lib/utils";

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

// Plain-language duration — customers shouldn't need to do minutes→hours→days
// math. Caps out at days: past 24h, minutes stop being meaningful precision.
function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hours < 24) return remMins === 0 ? `${hours}h` : `${hours}h ${remMins}m`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours === 0 ? `${days}d` : `${days}d ${remHours}h`;
}

// Absolute timestamp for the detail row — timeAgo() alone can't answer
// "what day/time did this actually happen," which matters once an incident
// is more than a few hours old.
function formatAbsolute(iso: string): string {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: SITE_TIMEZONE,
  });
}

// The API only fills durationSeconds once an incident resolves — for a
// still-open incident it's null, which was silently hiding the duration
// chip entirely. Compute it live from tsStart so "Ongoing for Xm" always
// has a number to show.
function effectiveDurationSeconds(incident: IncidentItem): number | null {
  if (incident.durationSeconds != null) return incident.durationSeconds;
  if (incident.tsEnd) return null;
  return Math.max(0, (Date.now() - new Date(incident.tsStart).getTime()) / 1000);
}

// Fixed fill for a still-open incident's timeline bar — there's no shared
// time axis across cards to compute a "true" proportion against, so this is
// a deliberate visual constant (not a measurement) that reads as "still
// going" via the dashed pattern + pulsing end-dot, distinct from a resolved
// incident's full solid bar.
const OPEN_TIMELINE_FILL_PCT = 68;

/**
 * Duration bar for one incident — replaces three separate text fragments
 * (occurred / resolved / duration) with a single shape: dot position marks
 * start, fill marks the run, and an open vs. checked-off end dot marks
 * whether it's still active. Read before the message for anyone scanning.
 */
function IncidentTimeline({
  incident,
  color,
  prefersReducedMotion,
}: {
  incident: IncidentItem;
  color: string;
  prefersReducedMotion: boolean;
}) {
  const resolved = incident.tsEnd != null;
  const fillPct = resolved ? 100 : OPEN_TIMELINE_FILL_PCT;
  const durationSeconds = effectiveDurationSeconds(incident);

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-xs font-mono text-text-4">
        <span>Started {formatAbsolute(incident.tsStart)}</span>
        <span className={resolved ? "text-text-3" : undefined}>
          {resolved ? `Resolved ${formatAbsolute(incident.tsEnd!)}` : "Ongoing"}
        </span>
      </div>
      <div className="relative h-1.5 mt-1.5 rounded-full" style={{ background: "var(--surface-4, rgba(255,255,255,0.08))" }}>
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={
            resolved
              ? { width: `${fillPct}%`, background: color }
              : {
                  width: `${fillPct}%`,
                  background: `repeating-linear-gradient(90deg, ${color} 0 8px, color-mix(in srgb, ${color} 45%, transparent) 8px 14px)`,
                }
          }
        />
        <span
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full"
          style={{ left: "0%", background: "var(--card, #0f1420)", border: `2px solid ${color}` }}
        />
        <motion.span
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full"
          style={{ left: `${fillPct}%`, background: "var(--card, #0f1420)", border: `2px solid ${color}` }}
          animate={!resolved && !prefersReducedMotion ? { boxShadow: [`0 0 0 0 ${color}55`, `0 0 0 5px ${color}00`] } : undefined}
          transition={!resolved && !prefersReducedMotion ? { duration: 1.8, repeat: Infinity, ease: "easeOut" } : undefined}
        />
      </div>
      {durationSeconds != null && (
        <div className="flex justify-center mt-1.5">
          <span
            className="flex items-center gap-1 text-xs font-mono font-semibold px-2 py-0.5 rounded-full"
            style={{ color, background: `color-mix(in srgb, ${color} 14%, transparent)` }}
          >
            <Timer size={10} />
            {resolved ? "Lasted" : "Ongoing for"} {formatDuration(durationSeconds)}
          </span>
        </div>
      )}
    </div>
  );
}

// Plain-language lifecycle labels — "acknowledged" reads as jargon to a
// customer; "Being Reviewed" says what's actually happening.
const STATUS_LABELS: Record<IncidentItem["status"], string> = {
  active: "Active",
  acknowledged: "Being Reviewed",
  resolved: "Resolved",
};

// StatusPill's built-in variants, mapped by actual urgency: an open incident
// reads red regardless of severity, "being reviewed" reads amber, and only a
// resolved incident earns green. Previously active/acknowledged both mapped
// to "warning" (indistinguishable amber) and resolved mapped to the "active"
// variant name (confusing but coincidentally green) — this makes the mapping
// explicit instead of leaning on a naming accident.
const STATUS_PILL_VARIANT: Record<IncidentItem["status"], "active" | "warning" | "error"> = {
  active: "error",
  acknowledged: "warning",
  resolved: "active",
};

const SEVERITY_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  critical: { color: "var(--destructive)", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)" },
  warning: { color: "var(--glow-amber)", bg: "rgba(233,185,73,0.1)", border: "rgba(233,185,73,0.25)" },
  info: { color: "var(--info)", bg: "rgba(96,165,250,0.1)", border: "rgba(96,165,250,0.25)" },
};

// Severity rank for sort — critical first, then warning, then info; ties broken by recency.
const SEVERITY_RANK: Record<string, number> = { critical: 0, warning: 1, info: 2 };

type StatusFilter = "all" | "active" | "acknowledged" | "resolved";
type SeverityFilter = "all" | "critical" | "warning" | "info";

const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
  all: "All",
  active: "Active",
  acknowledged: "Being Reviewed",
  resolved: "Resolved",
};
const ALERTS_PER_PAGE = 8;

// Fetched in one page-load-sized batch; the list is paginated client-side
// (matches the previous unpaginated-shim behavior) rather than round-tripping
// to the server per page — 200 comfortably covers a site's recent history.
const INCIDENT_FETCH_LIMIT = 200;

export default function AlertsPage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [page, setPage] = useState(1);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  const { data, loading, error } = useSiteQuery<AlertsPageData>(
    user?.site_id,
    async (siteId, signal) => {
      // Fetching "most recent N by ts_start" can starve genuinely open
      // incidents out of the page entirely on a site with a flapping
      // device (confirmed live: one device opening/auto-resolving a
      // device_offline incident every ~15-20 min pushed a still-open
      // incident from days earlier to rank 85 in the site's -ts_start
      // ordering). Fetch open incidents by status explicitly so they're
      // never at the mercy of how much resolved noise ranks above them,
      // and separately fetch a recent-history page for the list/table view.
      const [recentRes, activeRes, ackRes, overviewRes] = await Promise.all([
        portalApi.getSiteIncidents(siteId, { limit: INCIDENT_FETCH_LIMIT }, signal),
        portalApi.getSiteIncidents(siteId, { limit: 100, status: "active" }, signal),
        portalApi.getSiteIncidents(siteId, { limit: 100, status: "acknowledged" }, signal),
        portalApi.getPortalOverview(siteId, undefined, signal).catch(() => null),
      ]);
      signal.throwIfAborted();

      const realtime = (overviewRes?.data?.data?.realtime ?? {}) as Record<string, unknown>;
      const devices = (
        (realtime.devices ?? []) as Array<{ device_serial: string; device_type?: string; is_online?: boolean }>
      ).map((d) => ({ serial: d.device_serial, device_type: d.device_type ?? "gateway", is_online: Boolean(d.is_online) }));

      // Merge the guaranteed-complete open set into the recent-history list
      // (dedup by id) so the table still shows every open incident even if
      // it's not among the most recent N by start time.
      const byId = new Map(recentRes.results.map((i) => [i.id, i]));
      for (const i of [...activeRes.results, ...ackRes.results]) byId.set(i.id, i);

      return { incidents: Array.from(byId.values()), totalCount: recentRes.count, devices };
    },
    { cacheKey: `alerts:${user?.site_id}`, ttl: TTL.summary, autoRefreshSec: 30 },
  );

  const incidents: IncidentItem[] = data?.incidents ?? [];
  const devices: AlertsDevice[] = data?.devices ?? [];
  const loaded = !loading;

  const filtered = incidents
    .filter((inc) => {
      const matchStatus = statusFilter === "all" || inc.status === statusFilter;
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
  const isFiltered = statusFilter !== "active" || severityFilter !== "all";

  // Windowed page numbers (max 7 visible) so a large history doesn't wrap
  // into a multi-row button grid — same window logic as the staff mobile view.
  const pageWindow = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1;
    if (currentPage <= 4) return i + 1;
    if (currentPage >= totalPages - 3) return totalPages - 6 + i;
    return currentPage - 3 + i;
  });

  // Severity badges must reflect what's currently open, not the fetched
  // history window — without this, a resolved incident (e.g. a device_offline
  // blip that opened and auto-resolved within the same second) still counted
  // toward "X Critical" alongside genuinely active ones. Also exclude
  // incidents whose device has since been removed from the site — a
  // soft-deleted device's incidents never get closed by the maintenance
  // cron (it only re-checks live devices), so they'd otherwise sit "active"
  // forever and inflate the count.
  const activeDeviceSerials = new Set(devices.map((d) => d.serial));
  const openIncidents = incidents.filter(
    (inc) =>
      (inc.status === "active" || inc.status === "acknowledged") &&
      (!inc.deviceSerial || activeDeviceSerials.has(inc.deviceSerial)),
  );
  const criticalCount = openIncidents.filter((inc) => inc.severity === "critical").length;
  const warningCount = openIncidents.filter((inc) => inc.severity === "warning").length;
  const infoCount = openIncidents.filter((inc) => inc.severity === "info").length;
  const offlineDevices = devices.filter((d) => !d.is_online);

  // Map device_serial → offline flag so each incident card can show live device status,
  // not just the incident's own severity — the device may have recovered since triggering.
  const offlineSerials = new Set(offlineDevices.map((d) => d.serial));

  const statusPillBtn = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
      active
        ? "bg-surface-5 text-text-1"
        : "bg-surface-2 text-text-4 hover:bg-surface-4 hover:text-text-1"
    }`;

  // Severity chips double as both the "system health" summary and the
  // severity filter — one control instead of a count row + a separate,
  // uncolored filter row that said the same thing twice.
  const severityChips: Array<{ key: SeverityFilter; label: string; count: number; color: string }> = [
    { key: "all", label: "All", count: openIncidents.length, color: "var(--ink-2, var(--text-2))" },
    { key: "critical", label: "Critical", count: criticalCount, color: "var(--destructive)" },
    { key: "warning", label: "Warning", count: warningCount, color: "var(--glow-amber)" },
    { key: "info", label: "Info", count: infoCount, color: "var(--info)" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">
          Alerts
        </h1>
        <p className="text-base text-muted-foreground mt-1">
          System health &amp; notifications
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-base" style={{ color: "var(--destructive)" }}>
          {error}
        </div>
      )}

      {/* Controls: severity (health summary + filter, combined) and status filter */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {severityChips.map(({ key, label, count, color }) => {
            const active = severityFilter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => { setSeverityFilter(key); setPage(1); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors cursor-pointer"
                style={
                  active
                    ? { background: `color-mix(in srgb, ${color} 16%, transparent)`, borderColor: `color-mix(in srgb, ${color} 45%, transparent)`, color }
                    : { background: "var(--surface-2)", borderColor: "transparent", color: "var(--text-4)" }
                }
                aria-pressed={active}
              >
                {key !== "all" && <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />}
                {label}
                <span className="font-mono tabular-nums opacity-80">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-text-4 uppercase tracking-label mr-1">Status</span>
          {(["all", "active", "acknowledged", "resolved"] as StatusFilter[]).map((s) => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className={statusPillBtn(statusFilter === s)}>
              {STATUS_FILTER_LABELS[s]}
            </button>
          ))}
          {isFiltered && (
            <button
              type="button"
              onClick={() => { setStatusFilter("active"); setSeverityFilter("all"); setPage(1); }}
              className="text-sm font-semibold text-primary hover:underline ml-1"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

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
                    ? { background: "color-mix(in srgb, var(--primary) 8%, transparent)", borderColor: "color-mix(in srgb, var(--primary) 25%, transparent)", color: "var(--primary)" }
                    : { background: "color-mix(in srgb, var(--destructive) 10%, transparent)", borderColor: "color-mix(in srgb, var(--destructive) 30%, transparent)", color: "var(--destructive)" }
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
            <p className="text-base text-text-4">
              {isFiltered ? "No alerts matching your filters" : "No alerts to show"}
            </p>
            {isFiltered && (
              <button
                type="button"
                onClick={() => { setStatusFilter("active"); setSeverityFilter("all"); setPage(1); }}
                className="text-sm font-semibold text-primary hover:underline"
              >
                Reset filters
              </button>
            )}
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
                  {pageWindow.map((p) => (
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
                    className="relative overflow-hidden pl-5"
                    style={
                      incident.status !== "resolved"
                        ? { background: `linear-gradient(155deg, color-mix(in srgb, ${sev.color} 7%, transparent), transparent 55%)` }
                        : undefined
                    }
                  >
                    {/* Severity rail — the one place severity is shown; icon/badge no longer repeat it */}
                    <span className="absolute inset-y-0 left-0 w-1" style={{ background: sev.color }} />

                    <div className="flex items-start gap-4">
                      <motion.div
                        animate={isCritical && !prefersReducedMotion ? { scale: [1, 1.08, 1] } : {}}
                        transition={isCritical && !prefersReducedMotion ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : undefined}
                        className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center mt-0.5"
                        style={{ background: sev.bg, border: `1px solid ${sev.border}` }}
                      >
                        <Icon className="w-4.5 h-4.5" style={{ color: sev.color }} />
                      </motion.div>

                      {/* Body */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-text-1 text-base">{incident.title}</p>
                            {isCritical && (
                              <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-label text-white" style={{ background: sev.color }}>
                                Critical
                              </span>
                            )}
                            {deviceOffline && (
                              <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-label px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30" style={{ color: "var(--destructive)" }}>
                                <WifiOff size={10} /> Device Offline
                              </span>
                            )}
                          </div>
                          {/* Right: status — moved into the header row so it sits next to the title it describes */}
                          <StatusPill
                            status={STATUS_PILL_VARIANT[incident.status]}
                            label={STATUS_LABELS[incident.status]}
                          />
                        </div>

                        {/* Customer-facing plain-language explanation only — the raw
                            diagnostic reading (incident.summary) is staff-only, shown
                            in the staff frontend's incident detail instead. */}
                        {incident.customerMessage && (
                          <p className="text-sm text-text-3 mt-1 max-w-prose">{incident.customerMessage}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 mt-2.5">
                          <span className="text-sm px-2 py-0.5 rounded bg-surface-4 text-text-2">
                            {INCIDENT_CATEGORY_LABELS[incident.category] ?? incident.category}
                          </span>
                          {incident.deviceSerial && (
                            <span className="text-sm px-2 py-0.5 rounded bg-surface-4 text-text-4 font-mono">
                              {incident.deviceSerial}
                            </span>
                          )}
                        </div>

                        <IncidentTimeline incident={incident} color={sev.color} prefersReducedMotion={prefersReducedMotion} />
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
