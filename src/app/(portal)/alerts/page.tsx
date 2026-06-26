"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info, CheckCircle } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import StatusPill from "@/components/ui/StatusPill";
import { useAuth } from "@/contexts/AuthContext";
import { portalApi } from "@/lib/api";

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

const MOCK_ALERTS: Alert[] = [
  {
    id: "1",
    alert_type: "high_temperature",
    severity: "warning",
    title: "High Temperature",
    message: "Inverter temperature exceeded safe range (72°C)",
    device_serial: "EC19BE506BCE",
    triggered_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    status: "active",
    fault_code: "INV-003",
  },
  {
    id: "2",
    alert_type: "low_generation",
    severity: "critical",
    title: "Low Generation",
    message: "PV output 45% below forecast for 3+ consecutive hours",
    device_serial: "EC19BE506BCE",
    triggered_at: new Date(Date.now() - 5 * 3600000).toISOString(),
    status: "active",
    fault_code: "PV-007",
  },
  {
    id: "3",
    alert_type: "communication_error",
    severity: "info",
    title: "Communication Delay",
    message: "Device data delayed by 8 minutes",
    device_serial: "EC19BE506BCE",
    triggered_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    status: "resolved",
    fault_code: null,
  },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const SEVERITY_STYLES: Record<string, { color: string; bg: string }> = {
  critical: { color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
  warning: { color: "#E9B949", bg: "rgba(233,185,73,0.1)" },
  info: { color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
};

type StatusFilter = "all" | "active" | "resolved";
type SeverityFilter = "all" | "critical" | "warning" | "info";

export default function AlertsPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user?.site_id) return;
    portalApi
      .getSiteAlerts(user.site_id)
      .then((res) => {
        const data = res.data?.results ?? res.data;
        if (Array.isArray(data) && data.length > 0) setAlerts(data);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [user?.site_id]);

  useEffect(() => {
    setLoaded(true);
  }, []);

  function acknowledgeAlert(alertId: string) {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId ? { ...a, status: "acknowledged" as const } : a
      )
    );
    portalApi.acknowledgeAlert(alertId).catch(() => {});
  }

  const filtered = alerts.filter((a) => {
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && (a.status === "active" || a.status === "acknowledged")) ||
      (statusFilter === "resolved" && a.status === "resolved");
    const matchSeverity =
      severityFilter === "all" || a.severity === severityFilter;
    return matchStatus && matchSeverity;
  });

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const warningCount = alerts.filter((a) => a.severity === "warning").length;
  const infoCount = alerts.filter((a) => a.severity === "info").length;

  const pillBtn = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
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
        <p className="text-sm text-muted-foreground mt-1">
          System health &amp; notifications
        </p>
      </div>

      {/* Summary bar */}
      <div className="flex flex-wrap gap-3">
        <span
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444" }}
        >
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          {criticalCount} Critical
        </span>
        <span
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: "rgba(233,185,73,0.15)", color: "#E9B949" }}
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
          {warningCount} Warning
        </span>
        <span
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: "rgba(96,165,250,0.15)", color: "#60a5fa" }}
        >
          <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
          {infoCount} Info
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40 uppercase tracking-wider">Status</span>
          <div className="flex gap-1">
            {(["all", "active", "resolved"] as StatusFilter[]).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} className={pillBtn(statusFilter === s)}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40 uppercase tracking-wider">Severity</span>
          <div className="flex gap-1">
            {(["all", "critical", "warning", "info"] as SeverityFilter[]).map((s) => (
              <button key={s} onClick={() => setSeverityFilter(s)} className={pillBtn(severityFilter === s)}>
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
            <p className="text-sm text-white/50">No alerts matching your filters</p>
          </motion.div>
        ) : (
          filtered.map((alert) => {
            const sev = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.info;
            const Icon = alert.severity === "info" ? Info : AlertTriangle;
            return (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2 }}
              >
                <GlassCard>
                  <div className="flex items-start gap-4">
                    {/* Severity icon */}
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mt-0.5"
                      style={{ background: sev.bg }}
                    >
                      <Icon className="w-5 h-5" style={{ color: sev.color }} />
                    </div>

                    {/* Body */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm">{alert.title}</p>
                      <p className="text-xs text-white/60 mt-0.5">{alert.message}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/70 font-mono">
                          {alert.device_serial}
                        </span>
                        <span className="text-xs text-white/40">{timeAgo(alert.triggered_at)}</span>
                        {alert.fault_code && (
                          <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/70 font-mono">
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
                          className="text-xs px-3 py-1 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })
        )}
      </AnimatePresence>
    </div>
  );
}
