"use client";

/**
 * useSiteQuery — secure, performance-aware data fetching hook for the portal.
 *
 * Patterns borrowed from the staff frontend (src/services/cacheService.ts +
 * src/shared/hooks/useAutoRefresh.ts):
 *
 *  • Stale-while-revalidate  — returns cached data instantly while a background
 *    refresh runs, so re-navigation never shows blank screens.
 *  • AbortController cleanup — in-flight requests are cancelled on unmount or
 *    siteId change; state is never set on an unmounted component.
 *  • In-flight dedup         — parallel mounts share one HTTP request per key.
 *  • Tab visibility guard    — auto-refresh pauses when the tab is hidden.
 *  • Explicit no-site state  — returns `noSite: true` instead of silently
 *    falling back to placeholder data when site_id is missing.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { cacheGet, cacheSet, cacheDedup } from "@/lib/portalCache";

export interface SiteQueryOptions {
  /** Stable string key — include siteId if the data is site-specific. */
  cacheKey: string;
  /** TTL in ms — use the TTL constants from portalCache. */
  ttl: number;
  /**
   * Auto-refresh interval in seconds.
   * 0 (default) = no polling.
   * Pauses automatically while the browser tab is hidden.
   */
  autoRefreshSec?: number;
  /**
   * Set to true when auth resolution has completed (with or without a user).
   * When true and siteId is undefined, loading will be reset to false.
   * This prevents infinite loading state if auth resolution fails.
   */
  isAuthResolved?: boolean;
}

export interface SiteQueryResult<T> {
  data: T | null;
  /** True only on the first fetch (no cached data available yet). */
  loading: boolean;
  /** True when data is from cache but older than STALE_AFTER. */
  isStale: boolean;
  error: string | null;
  /** True when siteId is null/undefined — show a "no site linked" UI. */
  noSite: boolean;
  /** Manually trigger a foreground re-fetch and reset loading. */
  refresh: () => void;
}

export function useSiteQuery<T>(
  siteId: string | null | undefined,
  /**
   * Fetcher receives the resolved siteId and an AbortSignal.
   * Call `signal.throwIfAborted()` after any async boundary if you want
   * early termination. portalApi (axios) does not consume the signal
   * directly, but the hook still guards state updates via the signal.
   */
  fetcher: (siteId: string, signal: AbortSignal) => Promise<T>,
  options: SiteQueryOptions,
): SiteQueryResult<T> {
  const { cacheKey, ttl, autoRefreshSec = 0, isAuthResolved = false } = options;

  // Initialise synchronously from cache to avoid a blank render on re-navigation.
  const [data, setData] = useState<T | null>(() => cacheGet<T>(cacheKey)?.data ?? null);
  const [loading, setLoading] = useState<boolean>(() => {
    if (siteId === undefined) return true;  // auth hasn't resolved yet — show skeleton
    if (siteId === null) return false;       // auth resolved: no site to fetch
    return cacheGet(cacheKey) === null;      // site present: loading only on cache miss
  });
  const [isStale, setIsStale] = useState<boolean>(
    () => cacheGet(cacheKey)?.isStale ?? false,
  );
  const [error, setError] = useState<string | null>(null);

  // Use a ref so the effect closure always sees the latest fetcher without
  // re-running effects (same pattern as useAutoRefresh in the staff frontend).
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(
    async (background: boolean) => {
      if (!siteId) return;

      // Cancel any previous in-flight request for this hook instance.
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (!background) setLoading(true);

      try {
        const result = await cacheDedup(cacheKey, () =>
          fetcherRef.current(siteId, controller.signal),
        );

        // Ignore result if this request was superseded (unmount / siteId change).
        if (controller.signal.aborted) return;

        cacheSet(cacheKey, result, ttl);
        setData(result);
        setIsStale(false);
        setError(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        // axios throws CanceledError (not the browser's AbortError) when a
        // request is cancelled via AbortSignal.
        if (err instanceof Error && (err.name === "AbortError" || err.name === "CanceledError")) {
          // Our signal is still live but we received a cancellation error — this
          // means cacheDedup returned a shared promise that was aborted by a
          // concurrent caller (React Strict Mode double-effect). Retry with a
          // fresh request now that inFlight has been cleared.
          void fetchData(background);
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load data.");
        // A failed refresh leaves the old `data` displayed as-is (better than
        // blanking the screen) — but the viewer needs to know it's no longer
        // current, so surface the same staleness signal a slow cache entry
        // would. Without this, a run of silent background-poll failures could
        // leave stale (possibly zero/misleading) values on screen with no
        // visible indication anything's wrong.
        setIsStale(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    // fetcherRef is stable; only re-create when the key or siteId changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [siteId, cacheKey, ttl],
  );

  // Initial load (and re-load on siteId / cacheKey change).
  useEffect(() => {
    // siteId === undefined: either auth is still resolving, or resolution failed.
    if (siteId === undefined) {
      if (isAuthResolved) {
        // Auth resolution completed without a siteId — likely auth error or no user.
        setLoading(false);
      }
      return;
    }

    // siteId === null means auth resolved but user has no site — clear loading.
    if (siteId === null) {
      setLoading(false);
      return;
    }

    const cached = cacheGet<T>(cacheKey);
    if (cached) {
      setData(cached.data);
      setIsStale(cached.isStale);
      setLoading(false);
      // Trigger a silent background refresh if data is stale.
      if (cached.isStale) void fetchData(true);
      return;
    }

    void fetchData(false);

    return () => {
      abortRef.current?.abort();
    };
  }, [siteId, cacheKey, fetchData, isAuthResolved]);

  // Tab-aware auto-refresh (mirrors useAutoRefresh from staff frontend).
  useEffect(() => {
    if (!autoRefreshSec || !siteId) return;
    const id = setInterval(() => {
      if (!document.hidden) void fetchData(true);
    }, autoRefreshSec * 1000);
    return () => clearInterval(id);
  }, [autoRefreshSec, siteId, fetchData]);

  const refresh = useCallback(() => void fetchData(false), [fetchData]);

  return {
    data,
    loading,
    isStale,
    error,
    // Only true when auth has resolved and the user genuinely has no site linked.
    // While auth is still loading (siteId === undefined), noSite stays false so
    // pages show a loading skeleton rather than a misleading "no site" banner.
    noSite: siteId === null,
    refresh,
  };
}
