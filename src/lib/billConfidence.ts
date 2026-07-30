import type { DataQuality } from "./api";

export type ConfidenceTier = "reconciled" | "estimated" | "low-coverage";

const LOW_COVERAGE_THRESHOLD = 80;

/** Mirrors the mobile app's confidence-tier logic (savings_screen.dart _buildExpectedBillCard). */
export function getConfidenceTier(dq: DataQuality): ConfidenceTier {
  if (dq.coverage_pct < LOW_COVERAGE_THRESHOLD) return "low-coverage";
  if (dq.estimate_status === "estimated") return "estimated";
  return "reconciled";
}

export function formatDataSource(source: DataQuality["source"]): string {
  return source === "inverter" ? "Inverter telemetry" : "Energy meter";
}

/** Mirrors ElectricityBill.variancePercent in savings_model.dart. */
export function variancePercent(estimateAmount: number, actualAmount: number): number | null {
  if (estimateAmount <= 0) return null;
  return ((actualAmount - estimateAmount) / estimateAmount) * 100;
}
