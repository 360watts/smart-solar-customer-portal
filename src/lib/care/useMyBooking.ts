"use client";

import { useAuth } from "@/contexts/AuthContext";
import { portalApi, type ServiceBooking } from "@/lib/api";
import { useSiteQuery } from "@/lib/hooks/useSiteQuery";
import { TTL } from "@/lib/portalCache";

const ACTIVE_STATUSES: ServiceBooking["status"][] = ["pending", "scheduled"];

export function useMyBooking() {
  const { user } = useAuth();
  return useSiteQuery<ServiceBooking | null>(
    user?.site_id,
    async (_siteId, signal) => {
      const res = await portalApi.getMyBookings(signal);
      return res.data.find((b) => ACTIVE_STATUSES.includes(b.status)) ?? null;
    },
    { cacheKey: `care:booking:${user?.site_id}`, ttl: TTL.summary },
  );
}
