import { useEffect, useMemo, useRef } from "react";
import * as echarts from "echarts";
import styles from "../../styles/Dashboard.module.css";

function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon} aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="m4 16 5-5 4 3 7-8M17 6h3v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      <p className={styles.emptyTitle}>No performance history</p>
      <span className={styles.emptyDescription}>Performance observations will appear after the next sync.</span>
    </div>
  );
}

export default function PerformanceChart({ data, darkMode }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const latest = Number(data.at(-1)?.netPerformanceInPercentage);

  const palette = useMemo(() => {
    void darkMode; // Re-read CSS theme tokens when the active theme changes.
    if (typeof window === "undefined") return {};
    const computed = getComputedStyle(document.documentElement);
    return {
      accent: computed.getPropertyValue("--accent").trim(),
      foreground: computed.getPropertyValue("--foreground").trim(),
      muted: computed.getPropertyValue("--muted-foreground").trim(),
      grid: computed.getPropertyValue("--chart-grid").trim(),
      tooltip: computed.getPropertyValue("--chart-tooltip").trim(),
      border: computed.getPropertyValue("--border-strong").trim(),
    };
  }, [darkMode]);

  const option = useMemo(() => ({
    animationDuration: 550,
    animationEasing: "cubicOut",
    tooltip: {
      trigger: "axis",
      backgroundColor: palette.tooltip,
      borderColor: palette.border,
      borderWidth: 1,
      padding: [10, 12],
      textStyle: { color: palette.foreground, fontFamily: "SFMono-Regular, Consolas, monospace", fontSize: 12 },
      formatter: (params) => {
        const point = params[0];
        const value = Number(point.value);
        return `<span style="color:${palette.muted}">${point.axisValue}</span><br/><strong>${value >= 0 ? "+" : ""}${value.toFixed(2)}%</strong>`;
      },
      axisPointer: { type: "line", lineStyle: { color: palette.border, type: "dashed" } },
    },
    grid: { left: 16, right: 24, top: 28, bottom: 12, containLabel: true },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: data.map((item) => item.date),
      axisTick: { show: false },
      axisLabel: { color: palette.muted, fontFamily: "SFMono-Regular, Consolas, monospace", fontSize: 10, hideOverlap: true, margin: 16 },
      axisLine: { lineStyle: { color: palette.grid } },
    },
    yAxis: {
      type: "value",
      scale: true,
      axisLabel: { formatter: (value) => `${value}%`, color: palette.muted, fontFamily: "SFMono-Regular, Consolas, monospace", fontSize: 10 },
      axisLine: { show: false },
      axisTick: { show: false },
      splitNumber: 5,
      splitLine: { lineStyle: { color: palette.grid, type: "dashed" } },
    },
    series: [{
      data: data.map((item) => Number(item.netPerformanceInPercentage.toFixed(2))),
      type: "line",
      smooth: 0.25,
      showSymbol: false,
      symbolSize: 7,
      lineStyle: { color: palette.accent, width: 2 },
      itemStyle: { color: palette.accent, borderColor: palette.tooltip, borderWidth: 2 },
      emphasis: { focus: "series", scale: true },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: darkMode ? "rgba(78, 190, 145, 0.22)" : "rgba(20, 140, 96, 0.18)" },
          { offset: 1, color: darkMode ? "rgba(78, 190, 145, 0.01)" : "rgba(20, 140, 96, 0.01)" },
        ]),
      },
    }],
  }), [data, darkMode, palette]);

  useEffect(() => {
    if (!chartRef.current || !data.length) return undefined;
    chartInstance.current = echarts.init(chartRef.current);
    chartInstance.current.setOption(option);
    const observer = new ResizeObserver(() => chartInstance.current?.resize());
    observer.observe(chartRef.current);
    return () => {
      observer.disconnect();
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [data.length, option]);

  if (!data.length) return <EmptyState />;

  return (
    <div>
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.panelLabel}>Cumulative return</span>
          <h2 className={styles.panelTitle}>Portfolio performance</h2>
          <p className={styles.panelDescription}>Net performance across the selected account scope.</p>
        </div>
        <div className={styles.panelStat}>
          <span className={styles.panelLabel}>Latest</span>
          <span className={`${styles.panelStatValue} ${latest >= 0 ? styles.positive : styles.negative}`}>{latest >= 0 ? "+" : ""}{latest.toFixed(2)}%</span>
        </div>
      </div>
      <div className={styles.chartFrame}><div ref={chartRef} className={styles.chartContainer} /></div>
    </div>
  );
}
