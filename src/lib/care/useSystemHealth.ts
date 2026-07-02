"use client";

import { useAuth } from "@/contexts/AuthContext";
import { portalApi } from "@/lib/api";
import { useSiteQuery } from "@/lib/hooks/useSiteQuery";
import { TTL } from "@/lib/portalCache";
import type { SystemHealthData } from "./types";

export function useSystemHealth() {
  const { user } = useAuth();
  return useSiteQuery<SystemHealthData>(
    user?.site_id,
    async (siteId, signal) => {
      const res = await portalApi.getHardwareHealth(siteId, 7, signal);
      return res.data as SystemHealthData;
    },
    { cacheKey: `care:health:${user?.site_id}`, ttl: TTL.summary, autoRefreshSec: 60 },
  );
}
