"use client";

import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { CHART_DEFAULTS } from "@/lib/tokens";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  Legend
);

interface DataChartProps {
  type: "line" | "bar";
  data: ChartData<"line"> | ChartData<"bar">;
  height?: number;
  options?: ChartOptions<"line"> | ChartOptions<"bar">;
}

const baseOptions: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      ...CHART_DEFAULTS.tooltip,
      external: undefined, // Use default rendering for better performance
      // Custom callback for premium formatting
      callbacks: {
        title: (context: any) => {
          if (!context[0]) return "";
          const label = String(context[0].label);
          // Format different label types
          if (/^\d{1,2}[ap]m$/i.test(label)) {
            return `⏱ ${label}`;
          }
          if (/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/i.test(label)) {
            return `📅 ${label}`;
          }
          return label;
        },
        label: (context: any) => {
          const value = typeof context.parsed.y === "number"
            ? context.parsed.y.toFixed(2)
            : String(context.parsed.y);
          const dataset = context.dataset.label || "Value";
          // Infer unit from dataset label
          const unit = dataset.toLowerCase().includes("kwh") ? " kWh"
            : dataset.toLowerCase().includes("kw") || dataset.toLowerCase().includes("consumption") ? " kW"
            : "";
          return `${dataset}: ${value}${unit}`;
        },
        afterLabel: (context: any) => {
          // Add confidence band info for forecasts
          const label = context.dataset.label || "";
          if (label.includes("P90")) {
            return "🟢 Optimistic";
          }
          if (label.includes("P10")) {
            return "🔵 Conservative";
          }
          if (label.includes("P50")) {
            return "💚 Expected";
          }
          return "";
        },
      },
      // Dynamic border color based on dataset
      borderColor: (context: any) => {
        if (!context.tooltip?.dataPoints?.[0]) return "#2FBF71";
        const label = context.tooltip.dataPoints[0].dataset.label || "";
        if (label.includes("P90")) return "#34d399";
        if (label.includes("P10")) return "#6B7A99";
        if (label.includes("P50")) return "#2FBF71";
        return "#2FBF71";
      },
    } as any,
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
  },
};

export default function DataChart({ type, data, height = 200, options }: DataChartProps) {
  const merged = {
    ...baseOptions,
    ...options,
    plugins: { ...baseOptions.plugins, ...(options?.plugins ?? {}) },
    scales: { ...baseOptions.scales, ...(options?.scales ?? {}) },
  };

  return (
    <div style={{ height }}>
      {type === "line" ? (
        <Line data={data as ChartData<"line">} options={merged as ChartOptions<"line">} />
      ) : (
        <Bar data={data as ChartData<"bar">} options={merged as ChartOptions<"bar">} />
      )}
    </div>
  );
}
