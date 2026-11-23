import { useEffect, useMemo, useRef, useState } from "react";
import { echarts } from "../../lib/echarts";
import { getChartTheme, getMonoFontFamily } from "../../lib/chartTheme";
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
  const hasVisibleData = visibleData.length > 0;

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

  const theme = useMemo(() => getChartTheme(darkMode), [darkMode]);

  const option = useMemo(() => {
    const monoFont = getMonoFontFamily();
    return {
      animationDuration: 360,
      animationDurationUpdate: 260,
      animationEasing: "cubicOut",
      tooltip: {
        trigger: "axis",
        backgroundColor: theme.tooltip,
        borderColor: theme.border,
        borderWidth: 1,
        borderRadius: 3,
        padding: [8, 12],
        textStyle: { color: theme.foreground, fontFamily: monoFont, fontSize: 12 },
        formatter: (params) => {
          const point = params[0];
          const value = Number(point.value);
          const color = value >= 0 ? theme.positive : theme.negative;
          return `<span style="color:${theme.subtle};font-size:10.5px">${point.axisValue}</span><br/><strong style="font-size:13px;color:${color}">${value >= 0 ? "+" : ""}${value.toFixed(2)}%</strong>`;
        },
        axisPointer: { type: "line", lineStyle: { color: theme.border, type: "solid", width: 1 } },
      },
      grid: { left: 16, right: 24, top: 24, bottom: 14, containLabel: true },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: visibleData.map((item) => item.date),
        axisTick: { show: false },
        axisLabel: {
          color: theme.muted,
          fontFamily: monoFont,
          fontSize: 10.5,
          hideOverlap: true,
          alignMinLabel: "left",
          alignMaxLabel: "right",
          margin: 14,
        },
        axisLine: { lineStyle: { color: theme.grid } },
      },
      yAxis: {
        type: "value",
        scale: true,
        axisLabel: { formatter: (value) => `${value}%`, color: theme.muted, fontFamily: monoFont, fontSize: 10.5 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitNumber: 5,
        splitLine: { lineStyle: { color: theme.grid, type: "solid" } },
      },
      series: [{
        data: visibleData.map((item) => Number(item.netPerformanceInPercentage.toFixed(2))),
        type: "line",
        smooth: 0.12,
        showSymbol: false,
        symbolSize: 6,
        lineStyle: { color: theme.accent, width: 2 },
        itemStyle: { color: theme.accent, borderColor: theme.tooltip, borderWidth: 2 },
        emphasis: { focus: "series", scale: true },
        markLine: {
          silent: true,
          symbol: "none",
          lineStyle: { color: theme.border, type: "dashed", width: 1 },
          label: {
            show: true,
            position: "insideEndTop",
            formatter: "0%",
            color: theme.subtle,
            fontFamily: monoFont,
            fontSize: 10,
            distance: 4,
          },
          data: [{ yAxis: 0 }],
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: theme.areaTop },
              { offset: 1, color: theme.areaBottom },
            ],
          },
        },
      }],
    };
  }, [visibleData, theme]);

  useEffect(() => {
    if (!chartRef.current || !hasVisibleData) return undefined;
    const instance = echarts.init(chartRef.current);
    chartInstance.current = instance;
    const observer = new ResizeObserver(() => instance.resize());
    observer.observe(chartRef.current);
    return () => {
      observer.disconnect();
      instance.dispose();
      chartInstance.current = null;
    };
  }, [hasVisibleData]);

  useEffect(() => {
    if (!chartInstance.current || !hasVisibleData) return;
    chartInstance.current.setOption(option, { notMerge: true });
  }, [option, hasVisibleData]);

  if (!data.length) return <EmptyState />;

  const deltaClass = !Number.isFinite(stats.delta)
    ? ""
    : stats.delta >= 0
      ? styles.positive
      : styles.negative;

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
            <span className={`${styles.chartStatValue} ${deltaClass}`}>
              {formatPct(stats.delta)}
            </span>
          </div>
        </div>
        <div ref={chartRef} className={styles.chartContainer} />
      </div>
    </div>
  );
}
