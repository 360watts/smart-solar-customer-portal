import { describe, it, expect, vi } from "vitest";

const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn().mockResolvedValue({
    data: {
      count: 1,
      limit: 50,
      offset: 0,
      results: [
        {
          id: 5,
          device_id: 3,
          device_serial: "XYZ",
          category: "grid",
          incident_type: "GRID-001",
          incident_type_title: "Grid Outage",
          severity: "critical",
          status: "resolved",
          ts_start: "2026-05-14T05:24:00Z",
          ts_end: "2026-05-14T08:21:00Z",
          duration_seconds: 10620,
          title: "Grid outage",
          summary: "",
          detected_by: "rule_engine",
          evidence_count: 1,
        },
      ],
    },
  }),
}));

vi.mock("axios", () => ({
  default: {
    create: () => ({
      get: mockGet,
      post: vi.fn(),
      put: vi.fn(),
      interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
    }),
  },
}));

describe("portalApi.getSiteIncidents", () => {
  it("returns typed incident results", async () => {
    const { portalApi } = await import("./api");

    const result = await portalApi.getSiteIncidents("coim_002");

    expect(result.results[0].category).toBe("grid");
  });
});
