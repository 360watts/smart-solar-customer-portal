"use client";

import { useEffect, useState } from "react";
import { portalApi, type SiteUptimeResponse } from "@/lib/api";

export interface UseUptimeScoreResult {
  loading: boolean;
  error: string | null;
  rollingAvgUptimePct: number | null;
  dailyScores: SiteUptimeResponse["dailyScores"];
}

export function useUptimeScore(siteId: string | null, days = 30): UseUptimeScoreResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SiteUptimeResponse>({ rollingAvgUptimePct: null, dailyScores: [] });

  useEffect(() => {
    if (!siteId) {
      // Resets loading from a previous truthy-siteId fetch if siteId becomes null.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    portalApi
      .getSiteUptime(siteId, days)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || "Failed to load uptime score");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [siteId, days]);

  return { loading, error, rollingAvgUptimePct: data.rollingAvgUptimePct, dailyScores: data.dailyScores };
}
