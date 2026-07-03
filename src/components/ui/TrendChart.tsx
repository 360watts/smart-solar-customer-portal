"use client";

import { useEffect, useRef, useState } from "react";
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartDataset,
  type ChartOptions,
  type Plugin,
} from "chart.js";
import { Chart } from "react-chartjs-2";

import { CHART_DEFAULTS, COLORS } from "../../lib/tokens";

// The generic Chart component does not auto-register typed controllers like the
// Bar/Line wrappers do, so mixed bar+line rendering needs both controllers here.
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
  Filler,
  Tooltip,
  Legend,
);

let zoomRegistered = false;

const PRIMARY_Y_AXIS_ID = "y";
const SELF_SUFFICIENCY_Y_AXIS_ID = "ySelfSufficiency";
const MARKER_MIN_COLOR = "rgba(255, 255, 255, 0.72)";

const zoomOptions = {
  pan: { enabled: true, mode: "x" as const },
  zoom: {
    wheel: { enabled: true, speed: 0.08 },
    pinch: { enabled: true },
    mode: "x" as const,
  },
  limits: { x: { minRange: 2 } },
};

export interface TrendChartSeries {
  label: string;
  values: number[];
  color: string;
}

export interface TrendChartMovingAverageConfig {
  mode: "moving-average";
  label?: string;
  values?: number[];
  window?: number;
  color?: string;
}

export interface TrendChartSelfSufficiencyConfig {
  mode: "self-sufficiency";
  label?: string;
  values: number[];
  color?: string;
}

export type TrendChartTrendConfig =
  | TrendChartMovingAverageConfig
  | TrendChartSelfSufficiencyConfig;

export interface TrendChartProps {
  labels: string[];
  bars: TrendChartSeries[];
  trend?: TrendChartTrendConfig;
  unit?: "kWh" | "kW" | "₹" | "%";
  height?: number;
  disableZoom?: boolean;
}

export function buildMovingAverage(
  values: number[],
  window = 3,
): (number | null)[] {
  if (!Number.isInteger(window) || window < 1) {
    throw new Error("TrendChart: moving average window must be a positive integer.");
  }

  if (values.length === 0) return [];

  return values.map((_, index) => {
    if (index < window - 1) return null;

    const start = index - window + 1;
    const windowValues = values.slice(start, index + 1);
    const total = windowValues.reduce((sum, value) => sum + value, 0);

    return total / window;
  });
}

export function normalizeSeriesLength(
  labels: string[],
  bars: TrendChartSeries[],
  trendValues?: number[],
): { labels: string[]; bars: TrendChartSeries[]; trendValues?: number[] } {
  if (bars.length === 0) {
    throw new Error("TrendChart: `bars` must contain at least one series.");
  }

  const lengths = [
    labels.length,
    ...bars.map((series) => series.values.length),
    ...(trendValues ? [trendValues.length] : []),
  ];
  const shortestLength = Math.min(...lengths);
  const hasMismatchedLengths = lengths.some((length) => length !== shortestLength);

  if (process.env.NODE_ENV === "development" && hasMismatchedLengths) {
    console.warn("TrendChart: labels, bars, and trendValues should have matching lengths.");
  }

  return {
    labels: labels.slice(0, shortestLength),
    bars: bars.map((series) => ({
      ...series,
      values: series.values.slice(0, shortestLength),
    })),
    ...(trendValues ? { trendValues: trendValues.slice(0, shortestLength) } : {}),
  };
}

function toRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace("#", "");

  if (!/^[0-9a-f]{6}$/i.test(cleanHex)) {
    return hex;
  }

  const red = Number.parseInt(cleanHex.slice(0, 2), 16);
  const green = Number.parseInt(cleanHex.slice(2, 4), 16);
  const blue = Number.parseInt(cleanHex.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function createGradientBackground(color: string) {
  return (context: {
    chart: {
      ctx: CanvasRenderingContext2D;
      chartArea?: { top: number; bottom: number };
    };
  }) => {
    const { chart } = context;

    if (!chart.chartArea) {
      return toRgba(color, 0.25);
    }

    const gradient = chart.ctx.createLinearGradient(
      0,
      chart.chartArea.top,
      0,
      chart.chartArea.bottom,
    );

    gradient.addColorStop(0, toRgba(color, 0.85));
    gradient.addColorStop(1, toRgba(color, 0.15));

    return gradient;
  };
}

function formatTrendChartValue(
  value: number | string | null | undefined,
  unit?: TrendChartProps["unit"],
): string {
  const formattedValue =
    typeof value === "number" ? value.toFixed(2) : String(value);
  const suffix = unit && unit !== "₹" ? ` ${unit}` : "";
  const prefix = unit === "₹" ? unit : "";

  return `${prefix}${formattedValue}${suffix}`;
}

export function formatTrendChartTooltipLabel({
  datasetLabel,
  value,
  yAxisID,
  unit,
}: {
  datasetLabel?: string;
  value: number | string | null | undefined;
  yAxisID?: string;
  unit?: TrendChartProps["unit"];
}): string {
  const effectiveUnit =
    yAxisID === SELF_SUFFICIENCY_Y_AXIS_ID ? "%" : unit;
  const dataset = datasetLabel ?? "Value";

  return `${dataset}: ${formatTrendChartValue(value, effectiveUnit)}`;
}

export function formatTrendChartTooltipTitle(label: string): string {
  if (/^\d{1,2}[ap]m$/i.test(label)) return `⏱ ${label}`;
  if (/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/i.test(label)) return `📅 ${label}`;
  return label;
}

export function formatTrendChartTooltipDelta({
  datasetIndex,
  dataIndex,
  values,
}: {
  datasetIndex: number;
  dataIndex: number;
  values: number[];
}): string | undefined {
  if (datasetIndex !== 0 || dataIndex === 0) return undefined;

  const currentValue = values[dataIndex];
  const previousValue = values[dataIndex - 1];

  if (!Number.isFinite(currentValue) || !Number.isFinite(previousValue) || previousValue === 0) {
    return undefined;
  }

  const delta = ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
  const sign = delta > 0 ? "+" : "";

  return `vs. previous: ${sign}${delta.toFixed(0)}%`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function createPeakMinMarkersPlugin(
  unit?: TrendChartProps["unit"],
): Plugin<"bar" | "line"> {
  return {
    id: "trendChartPeakMinMarkers",
    afterDatasetsDraw(chart) {
      const { chartArea, ctx } = chart;
      const dataset = chart.data.datasets[0];
      const meta = chart.getDatasetMeta(0);

      if (!chartArea || !dataset || meta.hidden || meta.data.length === 0) {
        return;
      }

      let maxValue: number | undefined;
      let minValue: number | undefined;
      let maxIndex: number | undefined;
      let minIndex: number | undefined;

      dataset.data.forEach((value, index) => {
        if (typeof value !== "number" || !Number.isFinite(value)) return;

        if (maxValue === undefined || value > maxValue) {
          maxValue = value;
          maxIndex = index;
        }

        if (minValue === undefined || value < minValue) {
          minValue = value;
          minIndex = index;
        }
      });

      if (
        maxValue === undefined ||
        minValue === undefined ||
        maxIndex === undefined ||
        minIndex === undefined ||
        maxValue === minValue
      ) {
        return;
      }

      const drawMarker = (
        index: number,
        value: number,
        color: string,
        labelPosition: "above" | "below",
      ) => {
        const element = meta.data[index];
        if (!element) return;

        const point = element.tooltipPosition(true);
        if (point.x === null || point.y === null) return;

        const label = formatTrendChartValue(value, unit);
        const fontSize = 11;
        const labelPadding = 4;
        const dotRadius = 3;
        const markerX = clamp(
          point.x,
          chartArea.left + dotRadius,
          chartArea.right - dotRadius,
        );
        const markerY = clamp(
          point.y,
          chartArea.top + dotRadius,
          chartArea.bottom - dotRadius,
        );

        ctx.save();
        ctx.font = `600 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        const labelWidth = ctx.measureText(label).width;
        const labelX = clamp(
          markerX,
          chartArea.left + labelWidth / 2 + labelPadding,
          chartArea.right - labelWidth / 2 - labelPadding,
        );
        const labelY =
          labelPosition === "above"
            ? clamp(
                markerY - dotRadius - labelPadding,
                chartArea.top + fontSize + labelPadding,
                chartArea.bottom - labelPadding,
              )
            : clamp(
                markerY + dotRadius + labelPadding,
                chartArea.top + labelPadding,
                chartArea.bottom - fontSize - labelPadding,
              );

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(markerX, markerY, dotRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.textAlign = "center";
        ctx.textBaseline = labelPosition === "above" ? "bottom" : "top";
        ctx.fillText(label, labelX, labelY);
        ctx.restore();
      };

      drawMarker(maxIndex, maxValue, COLORS.amber, "above");
      drawMarker(minIndex, minValue, MARKER_MIN_COLOR, "below");
    },
  };
}

export function buildTrendChartData(
  props: TrendChartProps,
): ChartData<"bar" | "line"> {
  if (
    props.trend?.mode === "self-sufficiency" &&
    !Array.isArray(props.trend.values)
  ) {
    throw new Error("TrendChart: self-sufficiency trend requires values.");
  }

  const trendValuesForNormalize =
    props.trend?.mode === "self-sufficiency" ? props.trend.values : undefined;
  const { labels, bars, trendValues } = normalizeSeriesLength(
    props.labels,
    props.bars,
    trendValuesForNormalize,
  );

  const barDatasets: ChartDataset<"bar" | "line">[] = bars.map((series) => ({
    type: "bar" as const,
    label: series.label,
    data: series.values,
    backgroundColor: createGradientBackground(series.color),
    borderColor: series.color,
    borderWidth: 1,
    borderRadius: 6,
    yAxisID: PRIMARY_Y_AXIS_ID,
  }));

  if (!props.trend) {
    return { labels, datasets: barDatasets };
  }

  const isSelfSufficiency = props.trend.mode === "self-sufficiency";
  const lineData = props.trend.mode === "self-sufficiency"
    ? (trendValues ?? [])
    : buildMovingAverage(bars[0].values, props.trend.window ?? 3);

  const lineDataset: ChartDataset<"bar" | "line"> = {
    type: "line" as const,
    label: props.trend.label ?? (isSelfSufficiency ? "Self-Sufficiency" : "Trend"),
    data: lineData,
    borderColor: props.trend.color ?? (isSelfSufficiency ? COLORS.amber : COLORS.foreground),
    backgroundColor: "transparent",
    borderWidth: 2,
    borderDash: isSelfSufficiency ? [4, 4] : undefined,
    pointRadius: 0,
    pointHoverRadius: 4,
    tension: 0.3,
    yAxisID: isSelfSufficiency
      ? SELF_SUFFICIENCY_Y_AXIS_ID
      : PRIMARY_Y_AXIS_ID,
  };

  return { labels, datasets: [...barDatasets, lineDataset] };
}

export default function TrendChart({
  labels,
  bars,
  trend,
  unit,
  height = 200,
  disableZoom = false,
}: TrendChartProps) {
  const chartRef = useRef<ChartJS<"bar" | "line">>(null);
  const [zoomReady, setZoomReady] = useState(() => zoomRegistered);
  const isZoomReady = zoomReady || zoomRegistered;

  useEffect(() => {
    if (disableZoom) return;
    if (isZoomReady) return;

    import("chartjs-plugin-zoom").then((module) => {
      ChartJS.register(module.default);
      zoomRegistered = true;
      setZoomReady(true);
    });
  }, [disableZoom, isZoomReady]);

  const data = buildTrendChartData({
    labels,
    bars,
    trend,
    unit,
    height,
    disableZoom,
  });
  const hasSelfSufficiencyAxis = trend?.mode === "self-sufficiency";

  const options: ChartOptions<"bar" | "line"> = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 24, bottom: 20 } },
    plugins: {
      legend: { display: false },
      tooltip: {
        ...CHART_DEFAULTS.tooltip,
        callbacks: {
          title: (context) => {
            if (!context[0]) return "";
            return formatTrendChartTooltipTitle(String(context[0].label));
          },
          label: (context) => {
            return formatTrendChartTooltipLabel({
              datasetLabel: context.dataset.label,
              value: context.parsed.y,
              yAxisID: context.dataset.yAxisID,
              unit,
            });
          },
          afterLabel: (context) =>
            formatTrendChartTooltipDelta({
              datasetIndex: context.datasetIndex,
              dataIndex: context.dataIndex,
              values: bars[0].values,
            }),
        },
      },
      ...(!disableZoom && isZoomReady ? { zoom: zoomOptions } : {}),
    },
    scales: {
      x: {
        grid: { color: CHART_DEFAULTS.grid.color },
        ticks: CHART_DEFAULTS.tick,
        border: { display: false },
      },
      y: {
        grid: { color: CHART_DEFAULTS.grid.color },
        ticks: CHART_DEFAULTS.tick,
        border: { display: false },
      },
      ...(hasSelfSufficiencyAxis
        ? {
            ySelfSufficiency: {
              position: "right" as const,
              min: 0,
              max: 100,
              grid: { display: false },
              ticks: {
                ...CHART_DEFAULTS.tick,
                callback: (value) => `${value}%`,
              },
              border: { display: false },
            },
          }
        : {}),
    },
  };

  const handleDoubleClick = () => {
    chartRef.current?.resetZoom?.();
  };
  const plugins = bars.length === 1 ? [createPeakMinMarkersPlugin(unit)] : [];

  return (
    <div style={{ position: "relative" }}>
      {!disableZoom && isZoomReady && (
        <div className="absolute top-0 right-0 z-10 text-[11px] text-white/20 font-mono select-none pointer-events-none">
          scroll to zoom · drag to pan · dbl-click to reset
        </div>
      )}
      <div style={{ height }} onDoubleClick={handleDoubleClick}>
        <Chart
          ref={chartRef}
          type="bar"
          data={data}
          options={options}
          plugins={plugins}
        />
      </div>
    </div>
  );
}
