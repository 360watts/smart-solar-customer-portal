"use client";

import { useAuth } from "@/contexts/AuthContext";
import { portalApi } from "@/lib/api";
import { useSiteQuery } from "@/lib/hooks/useSiteQuery";
import { TTL } from "@/lib/portalCache";
import type { SystemHealthData } from "./types";

export interface CareFault {
  id: string;
  component: "Solar Panels" | "Inverter" | "Battery";
  severity: "warning" | "critical";
  issue: string;
  details: string;
  action: string;
}

const HEALTH_COMPONENTS: Array<{ key: keyof Pick<SystemHealthData, "solar_panel" | "inverter" | "battery">; component: CareFault["component"] }> = [
  { key: "solar_panel", component: "Solar Panels" },
  { key: "inverter", component: "Inverter" },
  { key: "battery", component: "Battery" },
];

/**
 * Surfaces components that need maintenance per the real hardware-health score
 * (status !== excellent, backend-provided `alert` text) even when no active
 * alert has fired yet — e.g. gradual efficiency decline the alerting system
 * hasn't crossed a threshold for. Only used to fill gaps: callers should skip
 * a component here if an active alert already covers it, to avoid duplicates.
 */
export function deriveMaintenanceFaults(health: SystemHealthData | null): CareFault[] {
  if (!health) return [];
  const faults: CareFault[] = [];
  for (const { key, component } of HEALTH_COMPONENTS) {
    const data = health[key];
    if (data.status === 0 || !data.alert) continue;
    faults.push({
      id: `health-${key}`,
      component,
      severity: data.status === 2 ? "critical" : "warning",
      issue: `${component} health score ${data.health_score}%`,
      details: "",
      action: data.alert,
    });
  }
  return faults;
}

const COMPONENT_KEYWORDS: Array<{ match: RegExp; component: CareFault["component"] }> = [
  { match: /panel|pv|solar/i, component: "Solar Panels" },
  { match: /inverter/i, component: "Inverter" },
  { match: /battery/i, component: "Battery" },
];

function inferComponent(alertType: string, title: string): CareFault["component"] | null {
  const haystack = `${alertType} ${title}`;
  for (const { match, component } of COMPONENT_KEYWORDS) {
    if (match.test(haystack)) return component;
  }
  return null;
}

function actionFor(component: CareFault["component"]): string {
  if (component === "Solar Panels") return "Schedule cleaning to remove dust and debris affecting output.";
  if (component === "Inverter") return "Check ventilation and schedule maintenance to prevent overheating.";
  return "Schedule a battery health check to confirm capacity and cycle life.";
}

export function useCareFaults() {
  const { user } = useAuth();
  return useSiteQuery<CareFault[]>(
    user?.site_id,
    async (siteId, signal) => {
      const res = await portalApi.getSiteAlerts(siteId, signal);
      const raw = res.data as unknown;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as { results?: unknown[] })?.results)
          ? (raw as { results: unknown[] }).results
          : [];

      const faults: CareFault[] = [];
      for (const item of list as Record<string, unknown>[]) {
        const status = String(item.status ?? "active");
        if (status === "resolved") continue;
        const severity = (item.severity as string) === "critical" ? "critical" : "warning";
        const alertType = String(item.alert_type ?? item.type ?? "");
        const title = String(item.title ?? "");
        const component = inferComponent(alertType, title);
        if (!component) continue; // not a 360Care-relevant component fault
        faults.push({
          id: String(item.id ?? `${component}-${item.triggered_at ?? item.timestamp}`),
          component,
          severity,
          issue: title || "Issue detected",
          details: String(item.message ?? ""),
          action: actionFor(component),
        });
      }
      return faults;
    },
    { cacheKey: `care:faults:${user?.site_id}`, ttl: TTL.summary, autoRefreshSec: 60 },
  );
}
