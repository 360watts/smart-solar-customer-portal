export const COLORS = {
  primary: "#2FBF71",
  primaryMuted: "rgba(47, 191, 113, 0.15)",
  amber: "#E9B949",
  amberMuted: "rgba(233, 185, 73, 0.15)",
  muted: "#6B7A99",
  border: "rgba(255, 255, 255, 0.07)",
  background: "#060A10",
  card: "#0C1220",
  foreground: "#F0F6FF",
  p10: "#6B7A99",
  p50: "#2FBF71",
  p90: "rgba(47, 191, 113, 0.4)",
  // Forecast band colors (distinct for tooltip context)
  optimistic: "#34d399",   // brighter green for P90
  expected: "#2FBF71",     // emerald for P50
  conservative: "#6B7A99", // muted for P10
  // Energy type colors
  solar: "#FDB022",
  battery: "#2FBF71",
  grid: "#F87171",
  load: "#60a5fa",
};

// Chart.js renders to <canvas>, which cannot resolve CSS custom properties —
// fillStyle/strokeStyle need an actual color string at draw time. So chart
// chrome (gridlines/ticks/tooltip) can't just reference var(--foreground); it
// needs its own light/dark literal, recomputed whenever the theme flips.
// Kept as a plain function (not tied to React) so both DataChart and
// TrendChart can call it the same way.
export function getChartDefaults(theme: "dark" | "light") {
  if (theme === "light") {
    return {
      grid: { color: "rgba(23, 23, 23, 0.06)", drawBorder: false },
      tick: { color: "#6B6B6B", font: { family: "DM Sans, system-ui, sans-serif", size: 11 } },
      tooltip: {
        backgroundColor: "#FFFFFF",
        borderColor: "#1E9E5C",
        borderWidth: 1.5,
        borderRadius: 12,
        titleColor: "#171717",
        bodyColor: "#4B4B4B",
        bodyFont: { family: "DM Sans, system-ui, sans-serif", size: 12, weight: 500 },
        titleFont: { family: "JetBrains Mono, monospace", size: 13, weight: 700 },
        padding: 16,
        displayColors: true,
        boxPadding: 8,
        boxRadius: 6,
        titleSpacing: 8,
        bodySpacing: 6,
        mode: "index" as const,
        intersect: false,
        usePointStyle: true,
        animation: { duration: 300 } as any,
      },
    };
  }
  return {
    grid: { color: "rgba(255, 255, 255, 0.04)", drawBorder: false },
    tick: { color: "#8A8F98", font: { family: "DM Sans, system-ui, sans-serif", size: 11 } },
    tooltip: {
      // ── Premium dark OLED tooltip ──
      backgroundColor: "#0a0e18",
      borderColor: "#2FBF71",
      borderWidth: 1.5,
      borderRadius: 12,
      titleColor: "#F5F6F7",
      bodyColor: "#A8B8D8",
      bodyFont: { family: "DM Sans, system-ui, sans-serif", size: 12, weight: 500 },
      titleFont: { family: "JetBrains Mono, monospace", size: 13, weight: 700 },
      padding: 16,
      displayColors: true,
      boxPadding: 8,
      boxRadius: 6,
      titleSpacing: 8,
      bodySpacing: 6,
      mode: "index" as const,
      intersect: false,
      usePointStyle: true,
      animation: { duration: 300 } as any,
    },
  };
}

// Dark-mode literal, kept as the default export for any call site not yet
// migrated to getChartDefaults(theme) — never add a new usage of this.
export const CHART_DEFAULTS = getChartDefaults("dark");
