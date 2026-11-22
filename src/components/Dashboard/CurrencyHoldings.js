import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as echarts from "echarts";
import styles from "../../styles/Dashboard.module.css";

const LIGHT_CHART_PALETTE = ["#2563eb", "#0d9488", "#d97706", "#7c3aed", "#e11d48", "#0284c7"];
const DARK_CHART_PALETTE = ["#3b82f6", "#14b8a6", "#f59e0b", "#8b5cf6", "#f43f5e", "#38bdf8"];

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
      <button type="button" className={styles.sortButton} onClick={() => onSort(column)}>{children}<SortIcon active={sortBy === column} order={sortOrder} /></button>
    </th>
  );
}

function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon} aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" /><path d="M15 9.5h-5a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H9M12 7v2.5M12 17.5V20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg></div>
      <p className={styles.emptyTitle}>No currency exposure</p>
      <span className={styles.emptyDescription}>Currency weights will appear when holdings data is available.</span>
    </div>
  );
}

export default function CurrencyHoldings({ holdings, darkMode }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [sortBy, setSortBy] = useState("percentage");
  const [sortOrder, setSortOrder] = useState("desc");
  const [activeCurrency, setActiveCurrency] = useState(null);

  const chartColors = darkMode ? DARK_CHART_PALETTE : LIGHT_CHART_PALETTE;

  const palette = useMemo(() => {
    void darkMode;
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
    .sort((a, b) => b.percentage - a.percentage)
    .map((holding, index) => ({
      value: Number(holding.percentage.toFixed(2)),
      name: holding.currency,
      itemStyle: { color: chartColors[index % chartColors.length] },
    })), [holdings, chartColors]);

  const indexByCurrency = useMemo(() => {
    const map = new Map();
    chartData.forEach((item, idx) => map.set(item.name, { idx, color: item.itemStyle.color }));
    return map;
  }, [chartData]);

  const option = useMemo(() => ({
    animationDuration: 420,
    tooltip: {
      trigger: "item",
      backgroundColor: palette.tooltip,
      borderColor: palette.border,
      borderWidth: 1,
      borderRadius: 2,
      padding: [8, 12],
      textStyle: { color: palette.foreground, fontFamily: "JetBrains Mono, SFMono-Regular, Consolas, monospace", fontSize: 12 },
      formatter: ({ name, value }) => `<strong>${name}</strong><br/><span style="color:${palette.muted}">${Number(value).toFixed(2)}% exposure</span>`,
    },
    title: {
      text: `${holdings.length}`,
      subtext: "CURRENCIES",
      left: "center",
      top: "41%",
      textStyle: { color: palette.foreground, fontFamily: "JetBrains Mono, SFMono-Regular, Consolas, monospace", fontSize: 22, fontWeight: 600 },
      subtextStyle: { color: palette.muted, fontFamily: "JetBrains Mono, SFMono-Regular, Consolas, monospace", fontSize: 9 },
    },
    series: [{
      name: "Currency allocation",
      type: "pie",
      radius: ["58%", "77%"],
      center: ["50%", "50%"],
      minAngle: 2,
      padAngle: 1,
      itemStyle: { borderRadius: 1, borderColor: palette.surface, borderWidth: 1.5 },
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

  const highlightSlice = useCallback((currency) => {
    setActiveCurrency(currency);
    const entry = indexByCurrency.get(currency);
    if (entry !== undefined && chartInstance.current) {
      chartInstance.current.dispatchAction({ type: "highlight", seriesIndex: 0, dataIndex: entry.idx });
      chartInstance.current.dispatchAction({ type: "showTip", seriesIndex: 0, dataIndex: entry.idx });
    }
  }, [indexByCurrency]);

  const clearHighlight = useCallback((currency) => {
    setActiveCurrency((prev) => (prev === currency ? null : prev));
    const entry = indexByCurrency.get(currency);
    if (entry !== undefined && chartInstance.current) {
      chartInstance.current.dispatchAction({ type: "downplay", seriesIndex: 0, dataIndex: entry.idx });
      chartInstance.current.dispatchAction({ type: "hideTip" });
    }
  }, [indexByCurrency]);

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
          <h2 className={styles.panelTitle}>Capital by denomination</h2>
          <p className={styles.panelDescription}>Base-currency value grouped by each instrument&apos;s denomination.</p>
        </div>
      </div>

      <div className={styles.holdingsLayout}>
        <section className={styles.allocationPanel}>
          <div className={styles.subPanelHeader}>
            <h3 className={styles.subPanelTitle}>Exposure breakdown</h3>
            <span className={styles.sectionMeta}>100% total</span>
          </div>
          <div ref={chartRef} className={styles.donutContainer} />
          <div className={styles.chartLegend}>
            {chartData.map((item, index) => (
              <div
                className={`${styles.legendItem} ${activeCurrency === item.name ? styles.legendItemActive : ""}`}
                key={item.name}
                onMouseEnter={() => highlightSlice(item.name)}
                onMouseLeave={() => clearHighlight(item.name)}
              >
                <span className={styles.legendName}><span className={styles.legendDot} style={{ background: chartColors[index % chartColors.length] }} /><span className={styles.legendText}>{item.name}</span></span>
                <span className={styles.legendValue}>{item.value.toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.tablePanel}>
          <div className={styles.subPanelHeader}>
            <h3 className={styles.subPanelTitle}>Currency ledger</h3>
            <span className={styles.sectionMeta}>Sortable</span>
          </div>
          <div className={styles.tableContainer}>
            <table className={styles.customTable}>
              <thead><tr><SortHeader column="currency" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Currency</SortHeader><SortHeader column="percentage" numeric sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Weight</SortHeader></tr></thead>
              <tbody>
                {sortedHoldings.map((holding) => {
                  const color = indexByCurrency.get(holding.currency)?.color || chartColors[0];
                  return (
                    <tr
                      key={holding.currency}
                      onMouseEnter={() => highlightSlice(holding.currency)}
                      onMouseLeave={() => clearHighlight(holding.currency)}
                    >
                      <td className={styles.symbolCell}>
                        <span className={styles.currencyBadge}>
                          <span className={styles.currencyDot} style={{ background: color }} aria-hidden="true" />
                          {holding.currency}
                        </span>
                      </td>
                      <td className={`${styles.numeric} ${styles.numberCell}`}>
                        <span className={styles.allocationCell}>
                          <span className={styles.allocationTrack}>
                            <span className={styles.allocationFill} style={{ width: `${Math.min(100, holding.percentage)}%`, background: color }} />
                          </span>
                          {holding.percentage.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
