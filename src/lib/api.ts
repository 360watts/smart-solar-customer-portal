import axios from "axios";

const api = axios.create({
  baseURL: "",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

export default api;

export interface SavingsData {
  id: number;
  electricityBill: {
    amount: number;
    period: string;
    billingMonths: number;
    status: "due" | "paid" | "overdue";
  };
  consumption: {
    totalUnitsWithoutSolar: number;
    solarUnits: number;
    ebImportUnits: number;
    ebExportUnits: number;
    evUnits: number;
  };
  savings: {
    billWithoutSolar: number;
    savingsAmount: number;
    savingsPercentage: number;
  };
  investment: {
    upfrontAmount: number;
    savedAmount: number;
    paybackPercentage: number;
    remainingInvestment: number;
    monthsToBreakEven: number;
    breakEvenDate: string;
  };
}

export interface ServiceBooking {
  id: number;
  booking_number: string;
  site: number;
  site_id: string;
  site_name?: string;
  issue_category: "panel" | "inverter" | "battery" | "monitoring" | "cleaning" | "other";
  issue_description: string;
  status: "pending" | "scheduled" | "completed" | "closed" | "cancelled";
  preferred_date: string | null;
  preferred_slot: "morning" | "afternoon" | "";
  vendor: number | null;
  vendor_company?: string | null;
  vendor_name?: string | null;
  vendor_phone?: string | null;
  service_date: string | null;
  service_time: string | null;
  technician_notes: string;
  created_at: string;
  updated_at: string;
}

export interface SiteMember {
  id: number;
  role: "viewer" | "co_owner";
  status: "pending" | "active" | "revoked";
  user: { id: number; first_name: string; last_name: string } | null;
  added_by: { id: number; first_name: string } | null;
  created_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  invite_link?: string;
  qr_code?: string;
  expires_at?: string;
}

export interface InviteDetails {
  site_name: string;
  role: "viewer" | "co_owner";
  invited_by: string;
  expires_at: string;
  invite_email?: string;
}

export interface PortalSummaryMeta<TData> {
  version: 1;
  site_id: string;
  generated_at: string;
  data: TData;
  partial_errors: Array<{
    key: string;
    message: string;
  }>;
  cache?: {
    hit: boolean;
    fragments?: Record<string, boolean>;
  };
}

// Helper: merge signal into axios config. Forwarding AbortController signals
// allows in-flight HTTP connections to be cancelled when a component unmounts
// or siteId changes — freeing backend resources and preventing stale updates.
function sig(signal?: AbortSignal) {
  return signal ? { signal } : {};
}

export interface IncidentItem {
  id: number;
  deviceId: number | null;
  deviceSerial: string | null;
  category: "hardware" | "connectivity" | "data_quality" | "weather_environmental" | "maintenance" | "grid";
  incidentType: string;
  incidentTypeTitle: string;
  severity: "critical" | "warning" | "info";
  status: "active" | "acknowledged" | "resolved";
  tsStart: string;
  tsEnd: string | null;
  durationSeconds: number | null;
  title: string;
  summary: string;
  detectedBy: string;
  evidenceCount: number;
}

export interface SiteIncidentsResponse {
  count: number;
  limit: number;
  offset: number;
  results: IncidentItem[];
}

export interface DataQualityGap {
  tsStart: string;
  tsEnd: string;
  category: IncidentItem["category"];
  incidentType: string;
  severity: string;
}

export interface UptimeDailyScore {
  reportDate: string;
  uptimePct: number;
  totalExpectedSlots: number;
  impactedSlots: number;
  impactedSlotsByCategory: Record<string, number>;
}

export interface SiteUptimeResponse {
  rollingAvgUptimePct: number | null;
  dailyScores: UptimeDailyScore[];
}

function _mapIncidentDict(raw: any): IncidentItem {
  return {
    id: raw.id, deviceId: raw.device_id ?? null, deviceSerial: raw.device_serial ?? null,
    category: raw.category, incidentType: raw.incident_type, incidentTypeTitle: raw.incident_type_title,
    severity: raw.severity, status: raw.status, tsStart: raw.ts_start, tsEnd: raw.ts_end ?? null,
    durationSeconds: raw.duration_seconds ?? null, title: raw.title, summary: raw.summary ?? "",
    detectedBy: raw.detected_by, evidenceCount: raw.evidence_count ?? 0,
  };
}

export const portalApi = {
  getPortalOverview: (siteId: string, params?: { date?: string }, signal?: AbortSignal) =>
    api.get<PortalSummaryMeta<Record<string, unknown>>>(`/api/backend/sites/${siteId}/portal-overview/`, { params, ...sig(signal) }),

  getPortalDevice: (siteId: string, signal?: AbortSignal) =>
    api.get<PortalSummaryMeta<Record<string, unknown>>>(`/api/backend/sites/${siteId}/portal-device/`, sig(signal)),

  getTelemetry: (siteId: string, params?: { days?: number; aggregate?: string }, signal?: AbortSignal) =>
    api.get(`/api/backend/sites/${siteId}/telemetry/`, { params, ...sig(signal) }),

  getEnergySummary: (siteId: string, params?: { granularity?: string; start?: string; end?: string; date?: string; summary?: string; combined?: string }, signal?: AbortSignal) =>
    api.get(`/api/backend/sites/${siteId}/energy-summary/`, { params, ...sig(signal) }),

  getHistory: (siteId: string, params?: { aggregate?: string }, signal?: AbortSignal) =>
    api.get(`/api/backend/sites/${siteId}/history/`, { params, ...sig(signal) }),

  getForecast: (siteId: string, params?: { date?: string; start_date?: string; end_date?: string }, signal?: AbortSignal) =>
    api.get(`/api/backend/sites/${siteId}/forecast/`, { params, ...sig(signal) }),

  getLoadForecast: (siteId: string, signal?: AbortSignal) =>
    api.get(`/api/backend/sites/${siteId}/load-forecast/`, sig(signal)),

  getWeather: (siteId: string, signal?: AbortSignal) =>
    api.get(`/api/backend/sites/${siteId}/weather/`, sig(signal)),

  getSiteIncidents: async (siteId: string, opts?: { limit?: number; offset?: number; status?: string }, signal?: AbortSignal): Promise<SiteIncidentsResponse> => {
    const resp = await api.get(`/api/backend/sites/${siteId}/incidents/`, {
      params: { limit: opts?.limit, offset: opts?.offset, status: opts?.status }, ...sig(signal),
    });
    const raw: any = resp.data;
    return { count: raw.count, limit: raw.limit, offset: raw.offset, results: (raw.results || []).map(_mapIncidentDict) };
  },

  getSiteDataQualityGaps: async (siteId: string, start: string, end: string, signal?: AbortSignal): Promise<DataQualityGap[]> => {
    const resp = await api.get(`/api/backend/sites/${siteId}/data-quality-gaps/`, {
      params: { start, end }, ...sig(signal),
    });
    return (resp.data || []).map((g: any) => ({
      tsStart: g.ts_start, tsEnd: g.ts_end, category: g.category, incidentType: g.incident_type, severity: g.severity,
    }));
  },

  getSiteUptime: async (siteId: string, days = 30, signal?: AbortSignal): Promise<SiteUptimeResponse> => {
    const resp = await api.get(`/api/backend/sites/${siteId}/uptime/`, { params: { days }, ...sig(signal) });
    const raw: any = resp.data;
    return {
      rollingAvgUptimePct: raw.rolling_avg_uptime_pct,
      dailyScores: (raw.daily_scores || []).map((s: any) => ({
        reportDate: s.report_date, uptimePct: s.uptime_pct, totalExpectedSlots: s.total_expected_slots,
        impactedSlots: s.impacted_slots, impactedSlotsByCategory: s.impacted_slots_by_category || {},
      })),
    };
  },

  getGatewayStatus: (siteId: string, signal?: AbortSignal) =>
    api.get(`/api/backend/sites/${siteId}/gateway-status/`, sig(signal)),

  getEquipment: (siteId: string, signal?: AbortSignal) =>
    api.get(`/api/backend/sites/${siteId}/equipment/`, sig(signal)),

  getHardwareHealth: (siteId: string, days?: number, signal?: AbortSignal) =>
    api.get(`/api/backend/sites/${siteId}/hardware-health/`, { params: { days }, ...sig(signal) }),

  getSavings: (siteId: string, signal?: AbortSignal) =>
    api.get<PortalSummaryMeta<{ savings: SavingsData | null }>>(`/api/backend/sites/${siteId}/portal-savings/`, sig(signal)),

  getProfile: () =>
    api.get(`/api/backend/profile/`),

  updateProfile: (data: Record<string, unknown>) =>
    api.put(`/api/backend/profile/update/`, data),

  changePassword: (data: Record<string, unknown>) =>
    api.post(`/api/backend/profile/change-password/`, data),

  getSite: (siteId: string) =>
    api.get(`/api/backend/sites/${siteId}/profile/`),

  getMyBookings: (signal?: AbortSignal) =>
    api.get<ServiceBooking[]>(`/api/backend/bookings/`, sig(signal)),

  createServiceBooking: (
    data: {
      site_id: string;
      issue_category: ServiceBooking["issue_category"];
      issue_description?: string;
      preferred_date?: string;
      preferred_slot?: ServiceBooking["preferred_slot"];
    },
  ) => api.post<ServiceBooking>(`/api/backend/bookings/`, data),

  cancelServiceBooking: (bookingId: number) =>
    api.post<ServiceBooking>(`/api/backend/bookings/${bookingId}/cancel/`),

  getSiteMembers: (siteId: string, includeRevoked = false, signal?: AbortSignal) =>
    api.get<SiteMember[]>(`/api/backend/sites/${siteId}/members/`, {
      params: includeRevoked ? { include_revoked: 1 } : undefined,
      ...sig(signal),
    }),

  inviteSiteMember: (siteId: string, email: string | null, role: SiteMember["role"]) =>
    api.post<SiteMember>(`/api/backend/sites/${siteId}/members/`, { invite_email: email ?? undefined, role }),

  updateSiteMember: (siteId: string, memberId: number, data: { role?: string; status?: string }) =>
    api.patch<SiteMember>(`/api/backend/sites/${siteId}/members/${memberId}/`, data),

  resendSiteInvite: (siteId: string, memberId: number) =>
    api.post(`/api/backend/sites/${siteId}/members/${memberId}/resend/`, {}),

  getInviteDetails: (token: string, signal?: AbortSignal) =>
    api.get<InviteDetails>(`/api/backend/site-invites/${token}/`, sig(signal)),

  acceptInvite: (token: string) =>
    api.post(`/api/backend/site-invites/${token}/accept/`),
};
