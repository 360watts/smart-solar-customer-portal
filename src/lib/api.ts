import axios from "axios";

const api = axios.create({
  baseURL: "",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

export default api;

export const portalApi = {
  getTelemetry: (siteId: string, params?: { days?: number; aggregate?: string }) =>
    api.get(`/api/backend/sites/${siteId}/telemetry/`, { params }),

  getEnergySummary: (siteId: string, params?: { date?: string; aggregate?: string }) =>
    api.get(`/api/backend/sites/${siteId}/energy-summary/`, { params }),

  getHistory: (siteId: string, params?: { aggregate?: string }) =>
    api.get(`/api/backend/sites/${siteId}/history/`, { params }),

  getForecast: (siteId: string) =>
    api.get(`/api/backend/sites/${siteId}/forecast/`),

  getLoadForecast: (siteId: string) =>
    api.get(`/api/backend/sites/${siteId}/load-forecast/`),

  getWeather: (siteId: string) =>
    api.get(`/api/backend/sites/${siteId}/weather/`),

  getSiteAlerts: (siteId: string) =>
    api.get(`/api/backend/sites/${siteId}/alerts/`),

  acknowledgeAlert: (alertId: string) =>
    api.post(`/api/backend/alerts/${alertId}/acknowledge/`),

  getGatewayStatus: (siteId: string) =>
    api.get(`/api/backend/sites/${siteId}/gateway-status/`),

  getEquipment: (siteId: string) =>
    api.get(`/api/backend/sites/${siteId}/equipment/`),

  getHardwareHealth: (siteId: string, days?: number) =>
    api.get(`/api/backend/sites/${siteId}/hardware-health/`, { params: { days } }),

  getProfile: () =>
    api.get(`/api/backend/profile/`),

  updateProfile: (data: Record<string, unknown>) =>
    api.put(`/api/backend/profile/update/`, data),

  changePassword: (data: Record<string, unknown>) =>
    api.post(`/api/backend/profile/change-password/`, data),

  getSite: (siteId: string) =>
    api.get(`/api/backend/sites/${siteId}/profile/`),
};
