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
  getSiteOverview: (siteId: string) => api.get(`/api/portal/sites/${siteId}/overview/`),
  getEnergyReadings: (siteId: string, from: string, to: string) =>
    api.get(`/api/portal/sites/${siteId}/readings/`, { params: { from, to } }),
  getForecast: (siteId: string) => api.get(`/api/portal/sites/${siteId}/forecast/`),
  getAlerts: (siteId: string) => api.get(`/api/portal/sites/${siteId}/alerts/`),
  getDeviceStatus: (siteId: string) => api.get(`/api/portal/sites/${siteId}/device/`),
  getWeather: (siteId: string) => api.get(`/api/portal/sites/${siteId}/weather/`),
  getProfile: () => api.get("/api/portal/profile/"),
};
