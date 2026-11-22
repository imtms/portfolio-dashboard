import { useEffect, useMemo, useRef, useState } from "react";
import * as echarts from "echarts";
import styles from "../../styles/Dashboard.module.css";

const RANGES = [
  { id: "1M", label: "1M", days: 30 },
  { id: "3M", label: "3M", days: 90 },
  { id: "6M", label: "6M", days: 180 },
  { id: "YTD", label: "YTD", ytd: true },
  { id: "1Y", label: "1Y", days: 365 },
  { id: "ALL", label: "ALL" },
];

function parseDate(value) {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function sliceByRange(data, rangeId) {
  if (!data.length || rangeId === "ALL") return data;
  const lastTime = parseDate(data.at(-1)?.date);
  if (lastTime === null) return data;

  let cutoff;
  if (rangeId === "YTD") {
    const year = new Date(lastTime).getUTCFullYear();
    cutoff = Date.UTC(year, 0, 1);
  } else {
    const range = RANGES.find((item) => item.id === rangeId);
    if (!range?.days) return data;
    cutoff = lastTime - range.days * 24 * 60 * 60 * 1000;
  }

  const filtered = data.filter((item) => {
    const time = parseDate(item.date);
    return time !== null && time >= cutoff;
  });
  return filtered.length >= 2 ? filtered : data;
}

function formatPct(value) {
  if (!Number.isFinite(value)) return "--";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon} aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="m4 16 5-5 4 3 7-8M17 6h3v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      <p className={styles.emptyTitle}>No performance history</p>
      <span className={styles.emptyDescription}>Performance observations will appear after the next sync.</span>
    </div>
  );
}

export default function PerformanceChart({ data, darkMode }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [range, setRange] = useState("ALL");

  const visibleData = useMemo(() => sliceByRange(data, range), [data, range]);

  const spanDays = useMemo(() => {
    if (data.length < 2) return 0;
    const first = parseDate(data[0]?.date);
    const last = parseDate(data.at(-1)?.date);
    if (first === null || last === null) return 0;
    return Math.max(0, (last - first) / (24 * 60 * 60 * 1000));
  }, [data]);

  const stats = useMemo(() => {
    if (!visibleData.length) return { delta: NaN, high: NaN, low: NaN };
    const values = visibleData.map((item) => Number(item.netPerformanceInPercentage)).filter(Number.isFinite);
    if (!values.length) return { delta: NaN, high: NaN, low: NaN };
    const first = values[0];
    const latest = values.at(-1);
    return {
      delta: latest - first,
      high: Math.max(...values),
      low: Math.min(...values),
    };
  }, [visibleData]);

  const palette = useMemo(() => {
    void darkMode;
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
    animationDuration: 420,
    animationEasing: "cubicOut",
    tooltip: {
      trigger: "axis",
      backgroundColor: palette.tooltip,
      borderColor: palette.border,
      borderWidth: 1,
      borderRadius: 2,
      padding: [8, 12],
      textStyle: { color: palette.foreground, fontFamily: "JetBrains Mono, SFMono-Regular, Consolas, monospace", fontSize: 12 },
      formatter: (params) => {
        const point = params[0];
        const value = Number(point.value);
        return `<span style="color:${palette.muted};font-size:10.5px">${point.axisValue}</span><br/><strong style="font-size:13px">${value >= 0 ? "+" : ""}${value.toFixed(2)}%</strong>`;
      },
      axisPointer: { type: "line", lineStyle: { color: palette.border, type: "solid", width: 1 } },
    },
    grid: { left: 16, right: 24, top: 24, bottom: 14, containLabel: true },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: visibleData.map((item) => item.date),
      axisTick: { show: false },
      axisLabel: { color: palette.muted, fontFamily: "JetBrains Mono, SFMono-Regular, Consolas, monospace", fontSize: 10, hideOverlap: true, margin: 14 },
      axisLine: { lineStyle: { color: palette.grid } },
    },
    yAxis: {
      type: "value",
      scale: true,
      axisLabel: { formatter: (value) => `${value}%`, color: palette.muted, fontFamily: "JetBrains Mono, SFMono-Regular, Consolas, monospace", fontSize: 10 },
      axisLine: { show: false },
      axisTick: { show: false },
      splitNumber: 5,
      splitLine: { lineStyle: { color: palette.grid, type: "solid" } },
    },
    series: [{
      data: visibleData.map((item) => Number(item.netPerformanceInPercentage.toFixed(2))),
      type: "line",
      smooth: 0.12,
      showSymbol: false,
      symbolSize: 6,
      lineStyle: { color: palette.accent, width: 1.8 },
      itemStyle: { color: palette.accent, borderColor: palette.tooltip, borderWidth: 2 },
      emphasis: { focus: "series", scale: true },
      markLine: {
        silent: true,
        symbol: "none",
        lineStyle: { color: palette.border, type: "dashed", width: 1 },
        label: { show: false },
        data: [{ yAxis: 0 }],
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: darkMode ? "rgba(42, 166, 154, 0.16)" : "rgba(15, 118, 110, 0.12)" },
          { offset: 1, color: darkMode ? "rgba(42, 166, 154, 0.00)" : "rgba(15, 118, 110, 0.00)" },
        ]),
      },
    }],
  }), [visibleData, darkMode, palette]);

  useEffect(() => {
    if (!chartRef.current || !visibleData.length) return undefined;
    chartInstance.current = echarts.init(chartRef.current);
    chartInstance.current.setOption(option);
    const observer = new ResizeObserver(() => chartInstance.current?.resize());
    observer.observe(chartRef.current);
    return () => {
      observer.disconnect();
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [visibleData.length, option]);

  if (!data.length) return <EmptyState />;

  return (
    <div>
      <div className={styles.panelHeader}>
        <div>
          <h2 className={styles.panelTitle}>Cumulative return</h2>
          <p className={styles.panelDescription}>Time-weighted net performance across the selected scope.</p>
        </div>

        <div className={styles.rangeGroup} role="group" aria-label="Chart timeframe">
          {RANGES.map((item) => {
            const disabled = Boolean(item.days && spanDays < item.days * 0.6);
            return (
              <button
                key={item.id}
                type="button"
                disabled={disabled}
                onClick={() => setRange(item.id)}
                className={`${styles.rangeButton} ${range === item.id ? styles.rangeButtonActive : ""}`}
                aria-pressed={range === item.id}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.chartFrame}>
        <div className={styles.chartStatsBar}>
          <div className={styles.chartStatItem}>
            <span className={styles.panelLabel}>Window</span>
            <span className={styles.chartStatValue}>
              {visibleData[0]?.date} — {visibleData.at(-1)?.date}
            </span>
          </div>
          <div className={styles.chartStatItem}>
            <span className={styles.panelLabel}>Range high</span>
            <span className={styles.chartStatValue}>{formatPct(stats.high)}</span>
          </div>
          <div className={styles.chartStatItem}>
            <span className={styles.panelLabel}>Range low</span>
            <span className={styles.chartStatValue}>{formatPct(stats.low)}</span>
          </div>
          <div className={styles.chartStatItem}>
            <span className={styles.panelLabel}>Range delta</span>
            <span className={`${styles.chartStatValue} ${stats.delta >= 0 ? styles.positive : styles.negative}`}>
              {formatPct(stats.delta)}
            </span>
          </div>
        </div>
        <div ref={chartRef} className={styles.chartContainer} />
      </div>
    </div>
  );
}
