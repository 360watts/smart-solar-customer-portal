import { describe, expect, it } from "vitest";

import { getConfidenceTier, formatDataSource, variancePercent } from "./billConfidence";
import type { DataQuality } from "./api";

function makeDQ(overrides: Partial<DataQuality> = {}): DataQuality {
  return {
    coverage_pct: 95,
    days_with_data: 28,
    days_in_period: 30,
    source: "inverter",
    estimate_status: "reconciled",
    ...overrides,
  };
}

describe("getConfidenceTier", () => {
  it("returns low-coverage when coverage_pct is below the threshold, regardless of estimate_status", () => {
    expect(getConfidenceTier(makeDQ({ coverage_pct: 79, estimate_status: "reconciled" }))).toBe("low-coverage");
  });

  it("returns estimated when coverage is fine but status is estimated", () => {
    expect(getConfidenceTier(makeDQ({ coverage_pct: 80, estimate_status: "estimated" }))).toBe("estimated");
  });

  it("returns reconciled when coverage is fine and status is reconciled", () => {
    expect(getConfidenceTier(makeDQ({ coverage_pct: 100, estimate_status: "reconciled" }))).toBe("reconciled");
  });
});

describe("formatDataSource", () => {
  it("formats inverter and energy_meter sources", () => {
    expect(formatDataSource("inverter")).toBe("Inverter telemetry");
    expect(formatDataSource("energy_meter")).toBe("Energy meter");
  });
});

describe("variancePercent", () => {
  it("computes percentage difference relative to the estimate", () => {
    expect(variancePercent(1000, 1100)).toBeCloseTo(10);
    expect(variancePercent(1000, 900)).toBeCloseTo(-10);
  });

  it("returns null for a non-positive estimate", () => {
    expect(variancePercent(0, 100)).toBeNull();
  });
});
