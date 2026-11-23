// Deterministic institutional color tokens for ECharts.
// Perceptually hue-spaced categorical palette that avoids raw gain-green and loss-red
// so semantic P&L stays unambiguous and adjacent donut slices remain clearly distinct.

const LIGHT_THEME = {
  accent: "#1d4ed8",
  areaTop: "rgba(29, 78, 216, 0.16)",
  areaMid: "rgba(29, 78, 216, 0.05)",
  areaBottom: "rgba(29, 78, 216, 0.00)",
  pointer: "rgba(29, 78, 216, 0.34)",
  foreground: "#0c1322",
  muted: "#445168",
  subtle: "#5a6880",
  grid: "rgba(12, 19, 34, 0.065)",
  tooltip: "rgba(255, 255, 255, 0.98)",
  border: "rgba(12, 19, 34, 0.15)",
  shadow: "rgba(12, 19, 34, 0.10)",
  surface: "#ffffff",
  positive: "#047857",
  negative: "#be123c",
  series: [
    "#1d4ed8", // Institutional Cobalt
    "#c97a16", // Warm Ochre-Gold
    "#0f766e", // Deep Teal-Slate
    "#6d28d9", // Royal Violet
    "#0284c7", // Cerulean Steel
    "#b84a1e", // Burnt Sienna
    "#4338ca", // Slate Indigo
  ],
  other: "#94a3b8",
};

const DARK_THEME = {
  accent: "#4f94ff",
  areaTop: "rgba(79, 148, 255, 0.24)",
  areaMid: "rgba(79, 148, 255, 0.07)",
  areaBottom: "rgba(79, 148, 255, 0.00)",
  pointer: "rgba(123, 176, 255, 0.42)",
  foreground: "#f4f7fb",
  muted: "#9fb0c7",
  subtle: "#8496af",
  grid: "rgba(148, 163, 184, 0.09)",
  tooltip: "rgba(13, 20, 34, 0.98)",
  border: "rgba(148, 163, 184, 0.24)",
  shadow: "rgba(0, 0, 0, 0.48)",
  surface: "#131c2e",
  positive: "#34d399",
  negative: "#fb7185",
  series: [
    "#4f94ff", // Luminous Cobalt
    "#eab308", // Warm Gold
    "#2dd4bf", // Cool Teal
    "#a78bfa", // Soft Violet
    "#38bdf8", // Clear Sky
    "#fb923c", // Warm Copper
    "#818cf8", // Periwinkle Indigo
  ],
  other: "#475569",
};

export function getChartTheme(darkMode) {
  return darkMode ? DARK_THEME : LIGHT_THEME;
}

export function getMonoFontFamily() {
  if (typeof window === "undefined") {
    return "JetBrains Mono, SFMono-Regular, Menlo, Consolas, monospace";
  }
  const value = getComputedStyle(document.documentElement).getPropertyValue("--font-mono").trim();
  return value || "JetBrains Mono, SFMono-Regular, Menlo, Consolas, monospace";
}
