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

export const CHART_DEFAULTS = {
  grid: {
    color: "rgba(255, 255, 255, 0.04)",
    drawBorder: false,
  },
  tick: {
    color: "#6B7A99",
    font: { family: "DM Sans, system-ui, sans-serif", size: 11 },
  },
  tooltip: {
    // ── Premium dark OLED tooltip ──
    backgroundColor: "#0a0e18",
    borderColor: "#2FBF71",
    borderWidth: 1.5,
    borderRadius: 12,
    titleColor: "#F0F6FF",
    bodyColor: "#A8B8D8",
    bodyFont: { family: "DM Sans, system-ui, sans-serif", size: 12, weight: 500 },
    titleFont: { family: "JetBrains Mono, monospace", size: 13, weight: 700 },
    padding: 16,
    displayColors: true,
    boxPadding: 8,
    boxRadius: 6,
    // Shadow effect via CSS-like styling
    titleSpacing: 8,
    bodySpacing: 6,
    mode: "index" as const,
    intersect: false,
    usePointStyle: true,
    animation: {
      duration: 300,
    } as any,
  },
};
