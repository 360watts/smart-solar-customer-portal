/**
 * Lightweight client-side TTL cache for portal API responses.
 *
 * Mirrors the staff frontend cacheService pattern with three additions:
 *  • stale-while-revalidate: callers can read stale data while a background
 *    refresh is in flight, avoiding blank screens on re-navigation.
 *  • in-flight deduplication: if two components request the same cache key
 *    simultaneously (e.g. on first mount) only one HTTP request is made.
 *  • no external dependency — plain Map, no IndexedDB, safe for SSR guards.
 */

export const TTL = {
  realtime: 15_000,       // 15 s  — live kW readings
  summary:  3 * 60_000,   // 3 min — daily kWh totals
  forecast: 15 * 60_000,  // 15 min — P10/P50/P90 bands
  history:  30 * 60_000,  // 30 min — weekly/monthly history
  static:   60 * 60_000,  // 1 hr  — site profile, equipment
} as const;

/** Data is considered stale after 30 s even if the TTL hasn't expired. */
const STALE_AFTER = 30_000;

interface Entry {
  data: unknown;
  setAt: number;
  ttl: number;
}

// Module-level singletons — survive React re-renders, reset on full page reload.
const store = new Map<string, Entry>();
const inFlight = new Map<string, Promise<unknown>>();

function ageMs(e: Entry): number {
  return Date.now() - e.setAt;
}

/** Returns cached data + staleness flag, or null if missing / expired. */
export function cacheGet<T>(key: string): { data: T; isStale: boolean } | null {
  const e = store.get(key);
  if (!e) return null;
  const age = ageMs(e);
  if (age > e.ttl) {
    store.delete(key);
    return null;
  }
  return { data: e.data as T, isStale: age > STALE_AFTER };
}

export function cacheSet<T>(key: string, data: T, ttl: number): void {
  store.set(key, { data, setAt: Date.now(), ttl });
}

export function cacheClear(pattern?: RegExp): void {
  if (!pattern) { store.clear(); return; }
  for (const key of store.keys()) {
    if (pattern.test(key)) store.delete(key);
  }
}

/**
 * Ensures only one in-flight request per cache key at a time.
 * Additional callers awaiting the same key share the existing promise.
 * On rejection (including axios CanceledError from AbortSignal), the entry
 * is removed immediately so the next caller starts a fresh request.
 */
export async function cacheDedup<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key);
  if (existing) return existing as Promise<T>;
  const p = fn()
    .catch((err) => { inFlight.delete(key); throw err; })
    .finally(() => inFlight.delete(key));
  inFlight.set(key, p as Promise<unknown>);
  return p;
}
