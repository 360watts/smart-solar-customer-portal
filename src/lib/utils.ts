import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Every site is physically in Coimbatore — chart labels must always reflect
// site-local time, not the viewing device's timezone (a viewer outside IST
// would otherwise see hour labels shifted relative to when the sun/grid
// actually did that). Matches the staff dashboard's exact format
// (SiteDataPanel/index.tsx `fmt()`): toLocaleTimeString with 2-digit
// hour/minute, so both apps read identically — e.g. "03:00 PM", not "3pm".
export const SITE_TIMEZONE = "Asia/Kolkata";

export function formatHourLabel(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: SITE_TIMEZONE });
  } catch {
    return ts;
  }
}

/** Day label matching the staff dashboard's date-axis format exactly
 * (SiteDataPanel's `fmt()` for its >7d case: `{ month: 'short', day: 'numeric' }`,
 * e.g. "Jul 7" — no weekday name) — also pinned to site-local time. */
export function formatDayLabel(ts: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }): string {
  try {
    return new Date(ts).toLocaleDateString([], { ...opts, timeZone: SITE_TIMEZONE });
  } catch {
    return ts;
  }
}

/** Hour-of-day (0-23) in site-local time — for bucketing telemetry rows by
 * hour without relying on the viewing device's own timezone. */
export function getSiteHour(ts: string): number {
  const s = new Date(ts).toLocaleString("en-US", { hour: "2-digit", hour12: false, timeZone: SITE_TIMEZONE });
  return parseInt(s, 10) % 24;
}

/** Formats a bare hour index (0-23) the same way as formatHourLabel's "HH:MM AM/PM",
 * without round-tripping through a Date — used when bucketing already produced a
 * site-local hour number rather than a timestamp. */
export function formatHourOfDay(hour: number): string {
  const h12 = hour % 12 || 12;
  const period = hour >= 12 ? "PM" : "AM";
  return `${String(h12).padStart(2, "0")}:00 ${period}`;
}

export interface PlanTierMeta {
  label: string;
  textClass: string;
  dotClass: string;
  glow: boolean;
}

/**
 * Visual identity for each subscription plan_type — used in the sidebar
 * (in place of the generic "Customer Portal" label) and on the profile page.
 * Premium gets a warm glow to signal it as the aspirational tier.
 */
export function getPlanTierMeta(planType: string | null | undefined): PlanTierMeta {
  switch ((planType ?? "").toLowerCase()) {
    case "premium":
      return { label: "Premium Plan", textClass: "text-amber-400", dotClass: "bg-amber-400", glow: true };
    case "basic":
      return { label: "Basic Plan", textClass: "text-sky-400", dotClass: "bg-sky-400", glow: false };
    case "free":
    default:
      return { label: "Free Plan", textClass: "text-muted-foreground", dotClass: "bg-white/40", glow: false };
  }
}
