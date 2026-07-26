import { useEffect, useMemo, useRef, useState } from "react";
import * as echarts from "echarts";
import styles from "../../styles/Dashboard.module.css";

const chartColors = ["#168a61", "#4f8f78", "#78a69a", "#9f8c5d", "#877f9f", "#5f7c91", "#b06f66", "#6e9270"];

function SortIcon({ active, order }) {
  return (
    <svg className={styles.sortIcon} viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="m3 5 3-3 3 3M9 7 6 10 3 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity={active ? 1 : 0.45} />
      {active && order === "asc" ? <path d="m3 5 3-3 3 3" stroke="currentColor" strokeWidth="1.5" /> : null}
      {active && order === "desc" ? <path d="m9 7-3 3-3-3" stroke="currentColor" strokeWidth="1.5" /> : null}
    </svg>
  );
}

function SortHeader({ column, children, numeric = false, sortBy, sortOrder, onSort }) {
  return (
    <th className={numeric ? styles.numeric : undefined} aria-sort={sortBy === column ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" className={styles.sortButton} onClick={() => onSort(column)}>
        {children}<SortIcon active={sortBy === column} order={sortOrder} />
      </button>
    </th>
  );
}

function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon} aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 19V9M12 19V5M19 19v-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg></div>
      <p className={styles.emptyTitle}>No asset holdings</p>
      <span className={styles.emptyDescription}>Holdings will appear when the selected account has invested assets.</span>
    </div>
  );
}

export default function StockHoldings({ holdings, darkMode }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [sortBy, setSortBy] = useState("allocationInPercentage");
  const [sortOrder, setSortOrder] = useState("desc");

  const palette = useMemo(() => {
    if (typeof window === "undefined") return {};
    const computed = getComputedStyle(document.documentElement);
    return {
      foreground: computed.getPropertyValue("--foreground").trim(),
      muted: computed.getPropertyValue("--muted-foreground").trim(),
      tooltip: computed.getPropertyValue("--chart-tooltip").trim(),
      border: computed.getPropertyValue("--border-strong").trim(),
      surface: computed.getPropertyValue("--surface-raised").trim(),
    };
  }, [darkMode]);

  const chartData = useMemo(() => [...holdings]
    .sort((a, b) => b.allocationInPercentage - a.allocationInPercentage)
    .map((holding, index) => ({
      value: Number((holding.allocationInPercentage * 100).toFixed(2)),
      name: holding.symbol,
      itemStyle: { color: chartColors[index % chartColors.length] },
    })), [holdings]);

  const option = useMemo(() => ({
    animationDuration: 500,
    tooltip: {
      trigger: "item",
      backgroundColor: palette.tooltip,
      borderColor: palette.border,
      borderWidth: 1,
      padding: [10, 12],
      textStyle: { color: palette.foreground, fontFamily: "SFMono-Regular, Consolas, monospace", fontSize: 12 },
      formatter: ({ name, value }) => `<strong>${name}</strong><br/><span style="color:${palette.muted}">${Number(value).toFixed(2)}% allocation</span>`,
    },
    title: {
      text: `${holdings.length}`,
      subtext: "ASSETS",
      left: "center",
      top: "42%",
      textStyle: { color: palette.foreground, fontFamily: "SFMono-Regular, Consolas, monospace", fontSize: 24, fontWeight: 600 },
      subtextStyle: { color: palette.muted, fontFamily: "SFMono-Regular, Consolas, monospace", fontSize: 9 },
    },
    series: [{
      name: "Stock allocation",
      type: "pie",
      radius: ["56%", "76%"],
      center: ["50%", "50%"],
      minAngle: 2,
      padAngle: 1,
      itemStyle: { borderRadius: 3, borderColor: palette.surface, borderWidth: 2 },
      label: { show: false },
      labelLine: { show: false },
      emphasis: { scaleSize: 4 },
      data: chartData,
    }],
  }), [chartData, holdings.length, palette]);

  useEffect(() => {
    if (!chartRef.current || !holdings.length) return undefined;
    chartInstance.current = echarts.init(chartRef.current);
    chartInstance.current.setOption(option);
    const observer = new ResizeObserver(() => chartInstance.current?.resize());
    observer.observe(chartRef.current);
    return () => {
      observer.disconnect();
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [holdings.length, option]);

  const sortedHoldings = useMemo(() => [...holdings].sort((a, b) => {
    const valA = typeof a[sortBy] === "string" ? a[sortBy].toUpperCase() : a[sortBy];
    const valB = typeof b[sortBy] === "string" ? b[sortBy].toUpperCase() : b[sortBy];
    if (valA === valB) return 0;
    return (valA < valB ? -1 : 1) * (sortOrder === "asc" ? 1 : -1);
  }), [holdings, sortBy, sortOrder]);

  const handleSort = (column) => {
    if (sortBy === column) setSortOrder((order) => order === "asc" ? "desc" : "asc");
    else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  if (!holdings.length) return <EmptyState />;

  return (
    <div>
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.panelLabel}>Asset exposure</span>
          <h2 className={styles.panelTitle}>Equity allocation</h2>
          <p className={styles.panelDescription}>Relative position sizing and instrument-level performance.</p>
        </div>
        <div className={styles.panelStat}>
          <span className={styles.panelLabel}>Positions</span>
          <span className={styles.panelStatValue}>{holdings.length}</span>
        </div>
      </div>

      <div className={styles.holdingsLayout}>
        <section className={styles.allocationPanel}>
          <div className={styles.subPanelHeader}><h3 className={styles.subPanelTitle}>Allocation map</h3><span className={styles.sectionMeta}>100% total</span></div>
          <div ref={chartRef} className={styles.chartContainer} />
          <div className={styles.chartLegend}>
            {chartData.slice(0, 8).map((item, index) => (
              <div className={styles.legendItem} key={item.name}>
                <span className={styles.legendName}><span className={styles.legendDot} style={{ background: chartColors[index % chartColors.length] }} /><span className={styles.legendText}>{item.name}</span></span>
                <span className={styles.legendValue}>{item.value.toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.tablePanel}>
          <div className={styles.subPanelHeader}><h3 className={styles.subPanelTitle}>Position detail</h3><span className={styles.sectionMeta}>Click header to sort</span></div>
          <div className={styles.tableContainer}>
            <table className={styles.customTable}>
              <thead><tr><SortHeader column="symbol" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Symbol</SortHeader><SortHeader column="name" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Instrument</SortHeader><SortHeader column="netPerformancePercent" numeric sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Return</SortHeader><SortHeader column="allocationInPercentage" numeric sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Allocation</SortHeader></tr></thead>
              <tbody>
                {sortedHoldings.map((holding) => (
                  <tr key={`${holding.symbol}-${holding.name}`}>
                    <td className={styles.symbolCell}>{holding.symbol}</td>
                    <td className={styles.nameCell} title={holding.name}>{holding.name}</td>
                    <td className={`${styles.numeric} ${styles.numberCell} ${holding.netPerformancePercent >= 0 ? styles.positive : styles.negative}`}>{holding.netPerformancePercent >= 0 ? "+" : ""}{(holding.netPerformancePercent * 100).toFixed(2)}%</td>
                    <td className={`${styles.numeric} ${styles.numberCell}`}><span className={styles.allocationCell}><span className={styles.allocationTrack}><span className={styles.allocationFill} style={{ width: `${Math.min(100, holding.allocationInPercentage * 100)}%` }} /></span>{(holding.allocationInPercentage * 100).toFixed(2)}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
