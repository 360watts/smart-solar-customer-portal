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
