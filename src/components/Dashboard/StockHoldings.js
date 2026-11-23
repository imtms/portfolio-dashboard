import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { echarts } from "../../lib/echarts";
import { getChartTheme, getMonoFontFamily } from "../../lib/chartTheme";
import SortHeader from "./TableSortHeader";
import styles from "../../styles/Dashboard.module.css";

const MAX_NAMED_SLICES = 7;
const OTHER_SLICE_KEY = "__OTHER__";
const analysisBaseUrl = "https://xh.tms.im";

function getAnalysisUrl(symbol) {
  return `${analysisBaseUrl}/${encodeURIComponent(symbol.trim())}`;
}

function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon} aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 19V9M12 19V5M19 19v-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
      </div>
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
  const [query, setQuery] = useState("");
  const [activeSliceKey, setActiveSliceKey] = useState(null);
  const [activeRowSymbol, setActiveRowSymbol] = useState(null);

  const hasHoldings = holdings.length > 0;
  const theme = useMemo(() => getChartTheme(darkMode), [darkMode]);

  const { chartData, sliceLookup, otherCount, maxAllocation } = useMemo(() => {
    const sorted = [...holdings].sort((a, b) => b.allocationInPercentage - a.allocationInPercentage);
    const maxWeight = sorted[0]?.allocationInPercentage || 0;
    const shouldGroup = sorted.length > MAX_NAMED_SLICES + 1;
    const primary = shouldGroup ? sorted.slice(0, MAX_NAMED_SLICES) : sorted;
    const tail = shouldGroup ? sorted.slice(MAX_NAMED_SLICES) : [];

    const lookup = new Map();
    const slices = primary.map((holding, index) => {
      const color = theme.series[index % theme.series.length];
      lookup.set(holding.symbol, { idx: index, key: holding.symbol, color });
      return {
        key: holding.symbol,
        name: holding.symbol,
        value: Number((holding.allocationInPercentage * 100).toFixed(2)),
        itemStyle: { color },
      };
    });

    if (tail.length > 0) {
      const otherWeight = tail.reduce((sum, item) => sum + item.allocationInPercentage, 0);
      const otherIdx = slices.length;
      const otherLabel = `Other (${tail.length})`;
      slices.push({
        key: OTHER_SLICE_KEY,
        name: otherLabel,
        value: Number((otherWeight * 100).toFixed(2)),
        itemStyle: { color: theme.other },
      });
      for (const holding of tail) {
        lookup.set(holding.symbol, { idx: otherIdx, key: OTHER_SLICE_KEY, color: theme.other });
      }
      lookup.set(OTHER_SLICE_KEY, { idx: otherIdx, key: OTHER_SLICE_KEY, color: theme.other });
    }

    return { chartData: slices, sliceLookup: lookup, otherCount: tail.length, maxAllocation: maxWeight };
  }, [holdings, theme]);

  const activeCenter = useMemo(() => {
    if (activeRowSymbol) {
      const holding = holdings.find((item) => item.symbol === activeRowSymbol);
      if (holding) {
        const entry = sliceLookup.get(holding.symbol);
        return {
          primary: `${(holding.allocationInPercentage * 100).toFixed(1)}%`,
          secondary: holding.symbol,
          color: entry?.color || theme.other,
        };
      }
    }
    if (activeSliceKey) {
      const slice = chartData.find((item) => item.key === activeSliceKey);
      if (slice) {
        return {
          primary: `${slice.value.toFixed(1)}%`,
          secondary: slice.name,
          color: slice.itemStyle.color,
        };
      }
    }
    return {
      primary: `${holdings.length}`,
      secondary: "POSITIONS",
      color: null,
    };
  }, [activeRowSymbol, activeSliceKey, holdings, chartData, sliceLookup, theme.other]);

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
        borderRadius: 5,
        padding: [8, 12],
        extraCssText: `box-shadow: 0 8px 24px ${theme.shadow};`,
        textStyle: { color: theme.foreground, fontFamily: monoFont, fontSize: 12 },
        formatter: ({ name, value, color }) => (
          `<div style="display:flex;align-items:center;gap:7px;margin-bottom:3px"><span style="width:7px;height:7px;border-radius:1.5px;background:${color};display:inline-block"></span><strong>${name}</strong></div>`
          + `<span style="color:${theme.muted};font-size:11px">${Number(value).toFixed(2)}% weight</span>`
        ),
      },
      series: [{
        name: "Stock allocation",
        type: "pie",
        radius: ["62%", "82%"],
        center: ["50%", "50%"],
        minAngle: 2,
        padAngle: 2,
        itemStyle: { borderRadius: 3, borderColor: theme.surface, borderWidth: 2 },
        label: { show: false },
        labelLine: { show: false },
        emphasis: { scaleSize: 5 },
        data: chartData,
      }],
    };
  }, [chartData, theme]);

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
    if (!chartInstance.current || !hasHoldings) return undefined;
    const instance = chartInstance.current;
    instance.setOption(option, { notMerge: true });

    const handleMouseOver = (params) => {
      const slice = chartData[params.dataIndex];
      if (!slice) return;
      setActiveRowSymbol(null);
      setActiveSliceKey(slice.key);
    };
    const handleMouseOut = () => {
      setActiveRowSymbol(null);
      setActiveSliceKey(null);
    };

    instance.on("mouseover", handleMouseOver);
    instance.on("mouseout", handleMouseOut);
    instance.on("globalout", handleMouseOut);
    return () => {
      instance.off("mouseover", handleMouseOver);
      instance.off("mouseout", handleMouseOut);
      instance.off("globalout", handleMouseOut);
    };
  }, [option, chartData, hasHoldings]);

  const highlightSlice = useCallback((symbolOrKey, isRow = false) => {
    const entry = sliceLookup.get(symbolOrKey);
    if (!entry) return;
    setActiveSliceKey(entry.key);
    setActiveRowSymbol(isRow ? symbolOrKey : null);
    if (chartInstance.current) {
      chartInstance.current.dispatchAction({ type: "highlight", seriesIndex: 0, dataIndex: entry.idx });
      if (!isRow) {
        chartInstance.current.dispatchAction({ type: "showTip", seriesIndex: 0, dataIndex: entry.idx });
      }
    }
  }, [sliceLookup]);

  const clearHighlight = useCallback((symbolOrKey) => {
    const entry = sliceLookup.get(symbolOrKey);
    if (!entry) return;
    setActiveSliceKey((prev) => (prev === entry.key ? null : prev));
    setActiveRowSymbol((prev) => (prev === symbolOrKey ? null : prev));
    if (chartInstance.current) {
      chartInstance.current.dispatchAction({ type: "downplay", seriesIndex: 0, dataIndex: entry.idx });
      chartInstance.current.dispatchAction({ type: "hideTip" });
    }
  }, [sliceLookup]);

  const filteredAndSortedHoldings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const list = normalizedQuery
      ? holdings.filter((h) => h.symbol.toLowerCase().includes(normalizedQuery) || h.name.toLowerCase().includes(normalizedQuery))
      : holdings;

    return [...list].sort((a, b) => {
      const valA = typeof a[sortBy] === "string" ? a[sortBy].toUpperCase() : a[sortBy];
      const valB = typeof b[sortBy] === "string" ? b[sortBy].toUpperCase() : b[sortBy];
      if (valA === valB) return 0;
      return (valA < valB ? -1 : 1) * (sortOrder === "asc" ? 1 : -1);
    });
  }, [holdings, query, sortBy, sortOrder]);

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
          <h2 className={styles.panelTitle}>Equity allocation</h2>
          <p className={styles.panelDescription}>Relative position sizing and instrument-level performance.</p>
        </div>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
            <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter symbol or name..."
            aria-label="Filter asset holdings"
            className={styles.searchInput}
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className={styles.clearButton} aria-label="Clear filter">
              ×
            </button>
          )}
        </div>
      </div>

      <div className={styles.holdingsLayout}>
        <section className={styles.allocationPanel}>
          <div className={styles.subPanelHeader}>
            <h3 className={styles.subPanelTitle}>Weight breakdown</h3>
            <span className={styles.sectionMeta}>
              {otherCount > 0 ? `Top ${MAX_NAMED_SLICES} + Other` : `${holdings.length} positions`}
            </span>
          </div>
          <div className={styles.donutStage}>
            <div ref={chartRef} className={styles.donutContainer} />
            <div className={styles.donutCenter} aria-hidden="true">
              <strong className={styles.donutCenterValue}>{activeCenter.primary}</strong>
              <span className={styles.donutCenterLabel}>
                {activeCenter.color && <span className={styles.donutCenterDot} style={{ background: activeCenter.color }} />}
                {activeCenter.secondary}
              </span>
            </div>
          </div>
          <div className={styles.chartLegend}>
            {chartData.map((item) => (
              <div
                className={`${styles.legendItem} ${activeSliceKey === item.key ? styles.legendItemActive : ""}`}
                key={item.key}
                onMouseEnter={() => highlightSlice(item.key)}
                onMouseLeave={() => clearHighlight(item.key)}
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
            <h3 className={styles.subPanelTitle}>
              Holdings ledger {query.trim() ? `(${filteredAndSortedHoldings.length}/${holdings.length})` : ""}
            </h3>
            <span className={styles.sectionMeta}>Relative bars · Sortable</span>
          </div>

          <div className={styles.tableContainer}>
            {filteredAndSortedHoldings.length > 0 ? (
              <table className={styles.customTable}>
                <thead>
                  <tr>
                    <SortHeader column="symbol" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Symbol</SortHeader>
                    <SortHeader column="name" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Instrument</SortHeader>
                    <SortHeader column="netPerformancePercent" numeric sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Return</SortHeader>
                    <SortHeader column="allocationInPercentage" numeric sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Weight</SortHeader>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedHoldings.map((holding) => {
                    const sliceInfo = sliceLookup.get(holding.symbol);
                    const dotColor = sliceInfo?.color || theme.other;
                    const barColor = sliceInfo?.key === OTHER_SLICE_KEY ? theme.other : dotColor;
                    const relativeWidth = maxAllocation > 0
                      ? Math.max(4, Math.min(100, (holding.allocationInPercentage / maxAllocation) * 100))
                      : 0;
                    const isPositive = holding.netPerformancePercent >= 0;
                    const isRowActive = activeRowSymbol
                      ? activeRowSymbol === holding.symbol
                      : Boolean(activeSliceKey && sliceInfo?.key === activeSliceKey);

                    return (
                      <tr
                        key={`${holding.symbol}-${holding.name}`}
                        className={isRowActive ? styles.rowActive : undefined}
                        onMouseEnter={() => highlightSlice(holding.symbol, true)}
                        onMouseLeave={() => clearHighlight(holding.symbol)}
                      >
                        <td className={styles.symbolCell}>
                          <span className={styles.symbolWithDot}>
                            <span className={styles.currencyDot} style={{ background: dotColor }} aria-hidden="true" />
                            <a
                              className={styles.symbolLink}
                              href={getAnalysisUrl(holding.symbol)}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Analyze ${holding.symbol} on Xiheng`}
                            >
                              {holding.symbol}
                              <span className={styles.symbolArrow} aria-hidden="true">↗</span>
                            </a>
                          </span>
                        </td>
                        <td className={styles.nameCell} title={holding.name}>{holding.name}</td>
                        <td className={`${styles.numeric} ${styles.numberCell}`}>
                          <span className={`${styles.returnPill} ${isPositive ? styles.returnPillPositive : styles.returnPillNegative}`}>
                            {isPositive ? "+" : ""}{(holding.netPerformancePercent * 100).toFixed(2)}%
                          </span>
                        </td>
                        <td className={`${styles.numeric} ${styles.numberCell}`}>
                          <span className={styles.allocationCell}>
                            <span className={styles.allocationTrack}>
                              <span className={styles.allocationFill} style={{ width: `${relativeWidth}%`, background: barColor }} />
                            </span>
                            <span className={styles.allocationValue}>{(holding.allocationInPercentage * 100).toFixed(2)}%</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className={styles.emptyTableMessage}>No positions match &ldquo;{query.trim()}&rdquo;.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
