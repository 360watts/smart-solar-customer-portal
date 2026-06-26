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
    tooltip: CHART_DEFAULTS.tooltip,
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
