import type { CustomerRecommendation } from "@/lib/api";

export interface PhantomLoadContext {
  device_id: number;
  avg_power_w: number;
  monthly_cost_estimate: number;
}

export interface LoadShiftContext {
  device_id: number;
  peak_fraction: number;
}

export interface TariffSlabContext {
  units_so_far: number;
  slab_top: number;
  period_start: string;
}

export interface WalletUsageContext {
  balance_kwh: number;
}

export interface UnderperformanceContext {
  pv_score: number;
  [key: string]: unknown;
}

export type ParsedRecContext =
  | { rec_type: "phantom_load"; data: PhantomLoadContext }
  | { rec_type: "load_shift"; data: LoadShiftContext }
  | { rec_type: "tariff_slab"; data: TariffSlabContext }
  | { rec_type: "wallet_usage"; data: WalletUsageContext }
  | { rec_type: "underperformance"; data: UnderperformanceContext }
  | { rec_type: string; data: null };

function num(context: Record<string, unknown>, key: string): number | null {
  const value = context[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function parseRecContext(rec: CustomerRecommendation): ParsedRecContext {
  const c = rec.context ?? {};

  switch (rec.rec_type) {
    case "phantom_load": {
      const device_id = num(c, "device_id");
      const avg_power_w = num(c, "avg_power_w");
      const monthly_cost_estimate = num(c, "monthly_cost_estimate");
      if (device_id === null || avg_power_w === null || monthly_cost_estimate === null) {
        return { rec_type: rec.rec_type, data: null };
      }
      return { rec_type: "phantom_load", data: { device_id, avg_power_w, monthly_cost_estimate } };
    }
    case "load_shift": {
      const device_id = num(c, "device_id");
      const peak_fraction = num(c, "peak_fraction");
      if (device_id === null || peak_fraction === null) {
        return { rec_type: rec.rec_type, data: null };
      }
      return { rec_type: "load_shift", data: { device_id, peak_fraction } };
    }
    case "tariff_slab": {
      const units_so_far = num(c, "units_so_far");
      const slab_top = num(c, "slab_top");
      const period_start = c["period_start"];
      if (units_so_far === null || slab_top === null || typeof period_start !== "string") {
        return { rec_type: rec.rec_type, data: null };
      }
      return { rec_type: "tariff_slab", data: { units_so_far, slab_top, period_start } };
    }
    case "wallet_usage": {
      const balance_kwh = num(c, "balance_kwh");
      if (balance_kwh === null) {
        return { rec_type: rec.rec_type, data: null };
      }
      return { rec_type: "wallet_usage", data: { balance_kwh } };
    }
    case "underperformance": {
      const pv_score = num(c, "pv_score");
      if (pv_score === null) {
        return { rec_type: rec.rec_type, data: null };
      }
      return { rec_type: "underperformance", data: { ...c, pv_score } };
    }
    default:
      return { rec_type: rec.rec_type, data: null };
  }
}
