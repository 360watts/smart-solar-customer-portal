import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildTrendChartData,
  buildMovingAverage,
  formatTrendChartTooltipDelta,
  formatTrendChartTooltipLabel,
  formatTrendChartTooltipTitle,
  normalizeSeriesLength,
  type TrendChartProps,
  type TrendChartSeries,
} from "./TrendChart";

const validSelfSufficiencyTrend = {
  mode: "self-sufficiency",
  values: [75],
} satisfies TrendChartProps["trend"];

// @ts-expect-error self-sufficiency trends must provide explicit values.
const invalidSelfSufficiencyTrend: TrendChartProps["trend"] = {
  mode: "self-sufficiency",
};

void validSelfSufficiencyTrend;
void invalidSelfSufficiencyTrend;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("buildMovingAverage", () => {
  it("returns null until the default trailing window is full", () => {
    expect(buildMovingAverage([3, 6, 9, 12])).toEqual([null, null, 6, 9]);
  });

  it("keeps the same length as the input", () => {
    const values = [2, 4, 6, 8, 10];

    expect(buildMovingAverage(values)).toHaveLength(values.length);
  });

  it("averages once when the window equals the input length", () => {
    expect(buildMovingAverage([4, 8, 12], 3)).toEqual([null, null, 8]);
  });

  it("returns all nulls when the window is larger than the input", () => {
    expect(buildMovingAverage([4, 8], 3)).toEqual([null, null]);
  });

  it("returns an empty array for empty input", () => {
    expect(buildMovingAverage([])).toEqual([]);
  });

  it("throws when the window is zero", () => {
    expect(() => buildMovingAverage([4, 8, 12], 0)).toThrow(
      "TrendChart: moving average window must be a positive integer.",
    );
  });

  it("throws when the window is negative", () => {
    expect(() => buildMovingAverage([4, 8, 12], -1)).toThrow(
      "TrendChart: moving average window must be a positive integer.",
    );
  });

  it("throws when the window is not an integer", () => {
    expect(() => buildMovingAverage([4, 8, 12], 1.5)).toThrow(
      "TrendChart: moving average window must be a positive integer.",
    );
  });
});

describe("normalizeSeriesLength", () => {
  const bars: TrendChartSeries[] = [
    { label: "Production", values: [10, 20, 30], color: "#22c55e" },
  ];

  it("returns matching labels and series unchanged", () => {
    const result = normalizeSeriesLength(["Jan", "Feb", "Mar"], bars);

    expect(result).toEqual({
      labels: ["Jan", "Feb", "Mar"],
      bars,
    });
  });

  it("clamps labels and bar values to the shortest length", () => {
    const result = normalizeSeriesLength(["Jan", "Feb", "Mar"], [
      { label: "Production", values: [10, 20], color: "#22c55e" },
    ]);

    expect(result.labels).toEqual(["Jan", "Feb"]);
    expect(result.bars[0].values).toEqual([10, 20]);
  });

  it("clamps trend values when present", () => {
    const result = normalizeSeriesLength(
      ["Jan", "Feb", "Mar"],
      bars,
      [12, 18],
    );

    expect(result).toEqual({
      labels: ["Jan", "Feb"],
      bars: [{ label: "Production", values: [10, 20], color: "#22c55e" }],
      trendValues: [12, 18],
    });
  });

  it("clamps multiple bar series to the shortest series", () => {
    const result = normalizeSeriesLength(["Jan", "Feb", "Mar", "Apr"], [
      { label: "Production", values: [10, 20, 30], color: "#22c55e" },
      { label: "Consumption", values: [8, 14], color: "#38bdf8" },
    ]);

    expect(result).toEqual({
      labels: ["Jan", "Feb"],
      bars: [
        { label: "Production", values: [10, 20], color: "#22c55e" },
        { label: "Consumption", values: [8, 14], color: "#38bdf8" },
      ],
    });
  });

  it("throws when bars are empty", () => {
    expect(() => normalizeSeriesLength(["Jan"], [])).toThrow(
      "TrendChart: `bars` must contain at least one series.",
    );
  });

  it("warns on mismatched lengths in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    normalizeSeriesLength(["Jan", "Feb", "Mar"], [
      { label: "Production", values: [10, 20], color: "#22c55e" },
    ]);

    expect(warn).toHaveBeenCalledOnce();
  });

  it("does not warn on matching lengths in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    normalizeSeriesLength(["Jan", "Feb", "Mar"], bars, [12, 18, 24]);

    expect(warn).not.toHaveBeenCalled();
  });

  it("does not warn on mismatched lengths in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    normalizeSeriesLength(["Jan", "Feb", "Mar"], [
      { label: "Production", values: [10, 20], color: "#22c55e" },
    ]);

    expect(warn).not.toHaveBeenCalled();
  });
});

describe("buildTrendChartData", () => {
  const baseProps: TrendChartProps = {
    labels: ["Mon", "Tue", "Wed", "Thu"],
    bars: [
      {
        label: "Generation kWh",
        values: [10, 15, 8, 20],
        color: "#2FBF71",
      },
    ],
  };

  it("produces one bar dataset per series and no line dataset when trend is omitted", () => {
    const result = buildTrendChartData(baseProps);

    expect(result.datasets).toHaveLength(1);
    expect(result.datasets[0].type).toBe("bar");
    expect(result.datasets[0].label).toBe("Generation kWh");
    expect(result.datasets[0].data).toEqual([10, 15, 8, 20]);
    expect(result.datasets[0].yAxisID).toBe("y");
  });

  it("adds a moving-average line dataset on the primary axis", () => {
    const result = buildTrendChartData({
      ...baseProps,
      trend: { mode: "moving-average", window: 3 },
    });

    expect(result.datasets).toHaveLength(2);
    const line = result.datasets.find((dataset) => dataset.type === "line");

    expect(line).toBeDefined();
    expect(line?.data).toEqual([null, null, 11, 43 / 3]);
    expect(line?.yAxisID).toBe("y");
  });

  it("uses self-sufficiency values directly on the right axis", () => {
    const result = buildTrendChartData({
      ...baseProps,
      trend: {
        mode: "self-sufficiency",
        values: [80, 65, 90, 100],
      },
    });
    const line = result.datasets.find((dataset) => dataset.type === "line");

    expect(line?.data).toEqual([80, 65, 90, 100]);
    expect(line?.yAxisID).toBe("ySelfSufficiency");
  });

  it("throws when self-sufficiency values are missing at runtime", () => {
    expect(() =>
      buildTrendChartData({
        ...baseProps,
        trend: { mode: "self-sufficiency" } as TrendChartProps["trend"],
      }),
    ).toThrow("TrendChart: self-sufficiency trend requires values.");
  });

  it("moving-average tracks bars[0] with multiple bar series", () => {
    const result = buildTrendChartData({
      labels: ["Mon", "Tue", "Wed", "Thu"],
      bars: [
        {
          label: "Generation kWh",
          values: [10, 15, 8, 20],
          color: "#2FBF71",
        },
        {
          label: "Consumption kWh",
          values: [5, 5, 5, 5],
          color: "#60a5fa",
        },
      ],
      trend: { mode: "moving-average", window: 3 },
    });
    const line = result.datasets.find((dataset) => dataset.type === "line");

    expect(result.datasets).toHaveLength(3);
    expect(line?.data).toEqual([null, null, 11, 43 / 3]);
  });

  it("throws when bars are empty", () => {
    expect(() => buildTrendChartData({ labels: [], bars: [] })).toThrow(
      "TrendChart: `bars` must contain at least one series.",
    );
  });
});

describe("formatTrendChartTooltipLabel", () => {
  it("uses chart-level energy units for primary-axis datasets", () => {
    expect(
      formatTrendChartTooltipLabel({
        datasetLabel: "Generation",
        value: 12.345,
        yAxisID: "y",
        unit: "kWh",
      }),
    ).toBe("Generation: 12.35 kWh");
  });

  it("uses chart-level currency formatting for primary-axis datasets", () => {
    expect(
      formatTrendChartTooltipLabel({
        datasetLabel: "Savings",
        value: 1200,
        yAxisID: "y",
        unit: "₹",
      }),
    ).toBe("Savings: ₹1200.00");
  });

  it("uses percent formatting for self-sufficiency-axis datasets", () => {
    expect(
      formatTrendChartTooltipLabel({
        datasetLabel: "Self-Sufficiency",
        value: 87.5,
        yAxisID: "ySelfSufficiency",
        unit: "kWh",
      }),
    ).toBe("Self-Sufficiency: 87.50 %");
  });

  it("uses chart-level units for moving-average datasets", () => {
    expect(
      formatTrendChartTooltipLabel({
        datasetLabel: "Trend",
        value: 4,
        yAxisID: "y",
        unit: "kW",
      }),
    ).toBe("Trend: 4.00 kW");
  });
});

describe("formatTrendChartTooltipTitle", () => {
  it("prefixes compact hour labels with the time icon", () => {
    expect(formatTrendChartTooltipTitle("9am")).toBe("⏱ 9am");
    expect(formatTrendChartTooltipTitle("12pm")).toBe("⏱ 12pm");
  });

  it("prefixes weekday labels with the calendar icon", () => {
    expect(formatTrendChartTooltipTitle("Mon, 3")).toBe("📅 Mon, 3");
  });

  it("leaves other labels unchanged", () => {
    expect(formatTrendChartTooltipTitle("Jul 2026")).toBe("Jul 2026");
  });
});

describe("formatTrendChartTooltipDelta", () => {
  it("formats positive and negative deltas for the primary bar series", () => {
    expect(
      formatTrendChartTooltipDelta({
        datasetIndex: 0,
        dataIndex: 1,
        values: [100, 112, 84],
      }),
    ).toBe("vs. previous: +12%");

    expect(
      formatTrendChartTooltipDelta({
        datasetIndex: 0,
        dataIndex: 2,
        values: [100, 112, 84],
      }),
    ).toBe("vs. previous: -25%");
  });

  it("skips the first point", () => {
    expect(
      formatTrendChartTooltipDelta({
        datasetIndex: 0,
        dataIndex: 0,
        values: [100, 112],
      }),
    ).toBeUndefined();
  });

  it("skips when the previous value is zero", () => {
    expect(
      formatTrendChartTooltipDelta({
        datasetIndex: 0,
        dataIndex: 1,
        values: [0, 112],
      }),
    ).toBeUndefined();
  });

  it("skips when the current value is not finite", () => {
    expect(
      formatTrendChartTooltipDelta({
        datasetIndex: 0,
        dataIndex: 1,
        values: [100, Number.NaN],
      }),
    ).toBeUndefined();

    expect(
      formatTrendChartTooltipDelta({
        datasetIndex: 0,
        dataIndex: 1,
        values: [100, Number.POSITIVE_INFINITY],
      }),
    ).toBeUndefined();
  });

  it("skips when the previous value is not finite", () => {
    expect(
      formatTrendChartTooltipDelta({
        datasetIndex: 0,
        dataIndex: 1,
        values: [Number.NaN, 112],
      }),
    ).toBeUndefined();

    expect(
      formatTrendChartTooltipDelta({
        datasetIndex: 0,
        dataIndex: 1,
        values: [Number.NEGATIVE_INFINITY, 112],
      }),
    ).toBeUndefined();
  });

  it("skips trend lines and secondary bar series", () => {
    expect(
      formatTrendChartTooltipDelta({
        datasetIndex: 1,
        dataIndex: 1,
        values: [100, 112],
      }),
    ).toBeUndefined();
  });
});
