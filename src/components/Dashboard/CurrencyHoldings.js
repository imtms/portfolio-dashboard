import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { echarts } from "../../lib/echarts";
import { getChartTheme, getMonoFontFamily } from "../../lib/chartTheme";
import SortHeader from "./TableSortHeader";
import styles from "../../styles/Dashboard.module.css";

function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon} aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" /><path d="M15 9.5h-5a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H9M12 7v2.5M12 17.5V20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
      </div>
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

  const hasHoldings = holdings.length > 0;
  const theme = useMemo(() => getChartTheme(darkMode), [darkMode]);

  const chartData = useMemo(() => [...holdings]
    .sort((a, b) => b.percentage - a.percentage)
    .map((holding, index) => ({
      value: Number(holding.percentage.toFixed(2)),
      name: holding.currency,
      itemStyle: { color: theme.series[index % theme.series.length] },
    })), [holdings, theme]);

  const indexByCurrency = useMemo(() => {
    const map = new Map();
    chartData.forEach((item, idx) => map.set(item.name, { idx, color: item.itemStyle.color }));
    return map;
  }, [chartData]);

  const option = useMemo(() => {
    const monoFont = getMonoFontFamily();
    return {
      animationDuration: 360,
      animationDurationUpdate: 260,
      tooltip: {
        trigger: "item",
        backgroundColor: theme.tooltip,
        borderColor: theme.border,
        borderWidth: 1,
        borderRadius: 3,
        padding: [8, 12],
        textStyle: { color: theme.foreground, fontFamily: monoFont, fontSize: 12 },
        formatter: ({ name, value }) => `<strong>${name}</strong><br/><span style="color:${theme.muted}">${Number(value).toFixed(2)}% exposure</span>`,
      },
      title: {
        text: `${holdings.length}`,
        subtext: "CURRENCIES",
        left: "center",
        top: "40%",
        textStyle: { color: theme.foreground, fontFamily: monoFont, fontSize: 22, fontWeight: 600 },
        subtextStyle: { color: theme.subtle, fontFamily: monoFont, fontSize: 9.5, fontWeight: 600 },
      },
      series: [{
        name: "Currency allocation",
        type: "pie",
        radius: ["58%", "78%"],
        center: ["50%", "50%"],
        minAngle: 2,
        padAngle: 1.5,
        itemStyle: { borderRadius: 2, borderColor: theme.surface, borderWidth: 1.5 },
        label: { show: false },
        labelLine: { show: false },
        emphasis: { scaleSize: 4 },
        data: chartData,
      }],
    };
  }, [chartData, holdings.length, theme]);

  useEffect(() => {
    if (!chartRef.current || !hasHoldings) return undefined;
    const instance = echarts.init(chartRef.current);
    chartInstance.current = instance;
    const observer = new ResizeObserver(() => instance.resize());
    observer.observe(chartRef.current);
    return () => {
      observer.disconnect();
      instance.dispose();
      chartInstance.current = null;
    };
  }, [hasHoldings]);

  useEffect(() => {
    if (!chartInstance.current || !hasHoldings) return;
    chartInstance.current.setOption(option, { notMerge: true });
  }, [option, hasHoldings]);

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
    if (sortBy === column) setSortOrder((order) => (order === "asc" ? "desc" : "asc"));
    else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  if (!hasHoldings) return <EmptyState />;

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
            {chartData.map((item) => (
              <div
                className={`${styles.legendItem} ${activeCurrency === item.name ? styles.legendItemActive : ""}`}
                key={item.name}
                onMouseEnter={() => highlightSlice(item.name)}
                onMouseLeave={() => clearHighlight(item.name)}
              >
                <span className={styles.legendName}>
                  <span className={styles.legendDot} style={{ background: item.itemStyle.color }} />
                  <span className={styles.legendText}>{item.name}</span>
                </span>
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
            <table className={`${styles.customTable} ${styles.compactTable}`}>
              <thead>
                <tr>
                  <SortHeader column="currency" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Currency</SortHeader>
                  <SortHeader column="percentage" numeric sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Weight</SortHeader>
                </tr>
              </thead>
              <tbody>
                {sortedHoldings.map((holding) => {
                  const color = indexByCurrency.get(holding.currency)?.color || theme.series[0];
                  return (
                    <tr
                      key={holding.currency}
                      className={activeCurrency === holding.currency ? styles.rowActive : undefined}
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
                            <span className={styles.allocationFill} style={{ width: `${Math.max(4, Math.min(100, holding.percentage))}%`, background: color }} />
                          </span>
                          <span className={styles.allocationValue}>{holding.percentage.toFixed(2)}%</span>
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
