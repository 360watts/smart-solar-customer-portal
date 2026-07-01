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

  getForecast: (siteId: string, params?: { date?: string }, signal?: AbortSignal) =>
    api.get(`/api/backend/sites/${siteId}/forecast/`, { params, ...sig(signal) }),

  getLoadForecast: (siteId: string, signal?: AbortSignal) =>
    api.get(`/api/backend/sites/${siteId}/load-forecast/`, sig(signal)),

  getWeather: (siteId: string, signal?: AbortSignal) =>
    api.get(`/api/backend/sites/${siteId}/weather/`, sig(signal)),

  getSiteAlerts: (siteId: string, signal?: AbortSignal) =>
    api.get(`/api/backend/sites/${siteId}/alerts/`, sig(signal)),

  acknowledgeAlert: (alertId: string) =>
    api.post(`/api/backend/alerts/${alertId}/acknowledge/`),

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
};
