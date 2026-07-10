"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { getChartDefaults } from "@/lib/tokens";
import { useTheme } from "@/contexts/ThemeContext";

// Register the core chart.js components synchronously — safe on server.
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  Legend,
);

// chartjs-plugin-zoom imports hammerjs which touches `document` at module init,
// making it unsafe to import at the top level in a Next.js environment.
// Register it once, lazily, after the browser environment is confirmed.
let zoomRegistered = false;
function ensureZoomPlugin() {
  if (zoomRegistered || typeof window === "undefined") return;
  zoomRegistered = true;
  import("chartjs-plugin-zoom").then((m) => {
    ChartJS.register(m.default);
  });
}

interface DataChartProps {
  type: "line" | "bar";
  data: ChartData<"line"> | ChartData<"bar">;
  height?: number;
  options?: ChartOptions<"line"> | ChartOptions<"bar">;
  /** Disable zoom/pan for charts where it doesn't make sense */
  disableZoom?: boolean;
}

const zoomOptions = {
  pan:  { enabled: true, mode: "x" as const },
  zoom: {
    wheel: { enabled: true, speed: 0.08 },
    pinch: { enabled: true },
    mode:  "x" as const,
  },
  limits: { x: { minRange: 2 } },
};

function buildBaseOptions(chartDefaults: ReturnType<typeof getChartDefaults>): ChartOptions<"line"> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        ...chartDefaults.tooltip,
        callbacks: {
          title: (context: any) => {
            if (!context[0]) return "";
            const label = String(context[0].label);
            if (/^\d{1,2}[ap]m$/i.test(label)) return `⏱ ${label}`;
            if (/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/i.test(label)) return `📅 ${label}`;
            return label;
          },
          label: (context: any) => {
            const value = typeof context.parsed.y === "number"
              ? context.parsed.y.toFixed(2)
              : String(context.parsed.y);
            const dataset = context.dataset.label || "Value";
            const unit = dataset.toLowerCase().includes("kwh") ? " kWh"
              : dataset.toLowerCase().includes("kw") || dataset.toLowerCase().includes("consumption") ? " kW"
              : "";
            return `${dataset}: ${value}${unit}`;
          },
          afterLabel: (context: any) => {
            const label = context.dataset.label || "";
            if (label.includes("P90")) return "🟢 Optimistic";
            if (label.includes("P10")) return "🔵 Conservative";
            if (label.includes("P50")) return "💚 Expected";
            return "";
          },
        },
      } as any,
    },
    scales: {
      x: {
        grid: { color: chartDefaults.grid.color },
        ticks: chartDefaults.tick,
        border: { display: false },
      },
      y: {
        grid: { color: chartDefaults.grid.color },
        ticks: chartDefaults.tick,
        border: { display: false },
      },
    },
  };
}

export default function DataChart({ type, data, height = 200, options, disableZoom = false }: DataChartProps) {
  const chartRef = useRef<ChartJS>(null);
  const { theme } = useTheme();
  // Canvas plugins bake colors in at draw time, so chart chrome must be
  // recomputed (not just option-diffed) whenever the theme flips.
  const baseOptions = useMemo(() => buildBaseOptions(getChartDefaults(theme)), [theme]);
  // Track when zoom plugin has been registered so the chart re-renders with zoom options.
  const [zoomReady, setZoomReady] = useState(false);

  useEffect(() => {
    if (disableZoom) return;
    if (zoomRegistered) { setZoomReady(true); return; }
    import("chartjs-plugin-zoom").then((m) => {
      ChartJS.register(m.default);
      zoomRegistered = true;
      setZoomReady(true);
    });
  }, [disableZoom]);

  const merged = {
    ...baseOptions,
    ...options,
    plugins: {
      ...baseOptions.plugins,
      ...(options?.plugins ?? {}),
      ...(!disableZoom && zoomReady ? { zoom: zoomOptions } : {}),
    },
    scales: { ...baseOptions.scales, ...(options?.scales ?? {}) },
  };

  const handleDoubleClick = () => {
    if (chartRef.current) (chartRef.current as any).resetZoom?.();
  };

  return (
    <div style={{ position: "relative" }}>
      {!disableZoom && zoomReady && (
        <div className="absolute top-0 right-0 z-10 text-[11px] text-muted-foreground font-mono select-none pointer-events-none">
          scroll to zoom · drag to pan · dbl-click to reset
        </div>
      )}
      <div style={{ height }} onDoubleClick={handleDoubleClick}>
        {type === "line" ? (
          <Line ref={chartRef as any} data={data as ChartData<"line">} options={merged as ChartOptions<"line">} />
        ) : (
          <Bar ref={chartRef as any} data={data as ChartData<"bar">} options={merged as ChartOptions<"bar">} />
        )}
      </div>
    </div>
  );
}
