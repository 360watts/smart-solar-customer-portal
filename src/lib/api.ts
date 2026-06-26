import axios from "axios";
import { getAccessToken, refreshAccessToken } from "./auth";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// Portal-specific endpoints
export const portalApi = {
  getTelemetry: (siteId: string, params?: { days?: number; aggregate?: string }) =>
    api.get(`/api/sites/${siteId}/telemetry/`, { params }),

  getEnergySummary: (siteId: string, params?: { date?: string; aggregate?: string }) =>
    api.get(`/api/sites/${siteId}/energy-summary/`, { params }),

  getHistory: (siteId: string, params?: { aggregate?: string }) =>
    api.get(`/api/sites/${siteId}/history/`, { params }),

  getForecast: (siteId: string) =>
    api.get(`/api/sites/${siteId}/forecast/`),

  getLoadForecast: (siteId: string) =>
    api.get(`/api/sites/${siteId}/load-forecast/`),

  getWeather: (siteId: string) =>
    api.get(`/api/sites/${siteId}/weather/`),

  getSiteAlerts: (siteId: string) =>
    api.get(`/api/sites/${siteId}/alerts/`),

  acknowledgeAlert: (alertId: string) =>
    api.post(`/api/alerts/${alertId}/acknowledge/`),

  getGatewayStatus: (siteId: string) =>
    api.get(`/api/sites/${siteId}/gateway-status/`),

  getEquipment: (siteId: string) =>
    api.get(`/api/sites/${siteId}/equipment/`),

  getHardwareHealth: (siteId: string, days?: number) =>
    api.get(`/api/sites/${siteId}/hardware-health/`, { params: { days } }),

  getProfile: () =>
    api.get(`/api/profile/`),

  updateProfile: (data: Record<string, unknown>) =>
    api.put(`/api/profile/`, data),

  getSite: (siteId: string) =>
    api.get(`/api/sites/${siteId}/`),
};
