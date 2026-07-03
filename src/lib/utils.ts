import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatHourLabel(ts: string): string {
  const date = new Date(ts);
  const h = date.getHours();
  return `${h % 12 || 12}${h >= 12 ? "pm" : "am"}`;
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
      return { label: "Free Plan", textClass: "text-white/55", dotClass: "bg-white/40", glow: false };
  }
}
