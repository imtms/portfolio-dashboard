// Deterministic institutional color tokens for ECharts.
// Avoids raw gain-green and loss-red inside categorical slices so semantic P&L stays unambiguous.

const LIGHT_THEME = {
  accent: "#1d4ed8",
  areaTop: "rgba(29, 78, 216, 0.15)",
  areaBottom: "rgba(29, 78, 216, 0.00)",
  foreground: "#0f172a",
  muted: "#475569",
  subtle: "#55647a",
  grid: "rgba(15, 23, 42, 0.07)",
  tooltip: "rgba(255, 255, 255, 0.98)",
  border: "rgba(15, 23, 42, 0.16)",
  surface: "#ffffff",
  positive: "#047857",
  negative: "#be123c",
  series: [
    "#1d4ed8", // Deep Cobalt (primary accent)
    "#0e7490", // Deep Cyan-Slate
    "#b45309", // Warm Bronze-Amber
    "#4338ca", // Institutional Indigo
    "#6d28d9", // Muted Plum
    "#0369a1", // Steel Ocean
    "#9a3412", // Muted Terracotta
  ],
  other: "#94a3b8",
};

const DARK_THEME = {
  accent: "#3b82f6",
  areaTop: "rgba(59, 130, 246, 0.24)",
  areaBottom: "rgba(59, 130, 246, 0.00)",
  foreground: "#f8fafc",
  muted: "#9fb0c7",
  subtle: "#8596ae",
  grid: "rgba(148, 163, 184, 0.10)",
  tooltip: "rgba(15, 22, 36, 0.98)",
  border: "rgba(148, 163, 184, 0.26)",
  surface: "#141e30",
  positive: "#34d399",
  negative: "#fb7185",
  series: [
    "#3b82f6", // Crisp Cobalt (primary accent)
    "#22d3ee", // Cool Steel Cyan
    "#f59e0b", // Warm Amber
    "#818cf8", // Soft Indigo
    "#a78bfa", // Muted Lavender
    "#38bdf8", // Sky Steel
    "#fb923c", // Muted Copper
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
