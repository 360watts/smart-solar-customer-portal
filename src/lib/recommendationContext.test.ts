import { describe, expect, it } from "vitest";

import { parseRecContext } from "./recommendationContext";
import type { CustomerRecommendation } from "./api";

function makeRec(overrides: Partial<CustomerRecommendation> = {}): CustomerRecommendation {
  return {
    id: 1,
    rec_type: "phantom_load",
    category: "usage_savings",
    title: "Title",
    body: "Body",
    priority: 1,
    state: "active",
    context: {},
    created_at: "2026-08-18T00:00:00Z",
    dismissed_at: null,
    acted_on_at: null,
    expires_at: null,
    ...overrides,
  };
}

describe("parseRecContext", () => {
  it("parses phantom_load context", () => {
    const parsed = parseRecContext(
      makeRec({ rec_type: "phantom_load", context: { device_id: 5, avg_power_w: 12.3, monthly_cost_estimate: 84 } }),
    );
    expect(parsed).toEqual({
      rec_type: "phantom_load",
      data: { device_id: 5, avg_power_w: 12.3, monthly_cost_estimate: 84 },
    });
  });

  it("parses load_shift context", () => {
    const parsed = parseRecContext(
      makeRec({ rec_type: "load_shift", context: { device_id: 9, peak_fraction: 0.72 } }),
    );
    expect(parsed).toEqual({ rec_type: "load_shift", data: { device_id: 9, peak_fraction: 0.72 } });
  });

  it("parses tariff_slab context", () => {
    const parsed = parseRecContext(
      makeRec({
        rec_type: "tariff_slab",
        context: { units_so_far: 180, slab_top: 200, period_start: "2026-08-01" },
      }),
    );
    expect(parsed).toEqual({
      rec_type: "tariff_slab",
      data: { units_so_far: 180, slab_top: 200, period_start: "2026-08-01" },
    });
  });

  it("parses wallet_usage context", () => {
    const parsed = parseRecContext(makeRec({ rec_type: "wallet_usage", context: { balance_kwh: 42.5 } }));
    expect(parsed).toEqual({ rec_type: "wallet_usage", data: { balance_kwh: 42.5 } });
  });

  it("parses underperformance context, keeping extra diagnostic keys", () => {
    const parsed = parseRecContext(
      makeRec({
        rec_type: "underperformance",
        context: { pv_score: 68, "Matched Hours": 12 },
      }),
    );
    expect(parsed).toEqual({
      rec_type: "underperformance",
      data: { pv_score: 68, "Matched Hours": 12 },
    });
  });

  it("falls back to null data when context is missing required fields", () => {
    const parsed = parseRecContext(makeRec({ rec_type: "phantom_load", context: { device_id: 5 } }));
    expect(parsed).toEqual({ rec_type: "phantom_load", data: null });
  });

  it("falls back to null data for an unknown rec_type", () => {
    const parsed = parseRecContext(makeRec({ rec_type: "future_type", context: { anything: 1 } }));
    expect(parsed).toEqual({ rec_type: "future_type", data: null });
  });
});
