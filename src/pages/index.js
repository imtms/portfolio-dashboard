import { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePortfolioData } from "../hooks/usePortfolioData";
import { useTheme } from "../hooks/useTheme";
import Navbar from "../components/Layout/Navbar";
import LoadingSpinner from "../components/Common/LoadingSpinner";
import SeoHead from "../components/Common/SeoHead";
import ResearchReport from "../components/Dashboard/ResearchReport";
import styles from "../styles/Dashboard.module.css";

const PerformanceChart = dynamic(() => import("../components/Dashboard/PerformanceChart"), { loading: () => <LoadingSpinner />, ssr: false });
const StockHoldings = dynamic(() => import("../components/Dashboard/StockHoldings"), { loading: () => <LoadingSpinner />, ssr: false });
const CurrencyHoldings = dynamic(() => import("../components/Dashboard/CurrencyHoldings"), { loading: () => <LoadingSpinner />, ssr: false });

const tabs = [
  { id: "performance", label: "Performance", icon: "trend" },
  { id: "stockHoldings", label: "Assets", icon: "assets" },
  { id: "currencyHoldings", label: "Currencies", icon: "currency" },
  { id: "research", label: "Research", icon: "research" },
];

function TabIcon({ type }) {
  if (type === "assets") {
    return <svg className={styles.tabIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 18V9M10 18V5M16 18v-7M22 18H2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>;
  }
  if (type === "currency") {
    return <svg className={styles.tabIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" /><path d="M15.5 8.5h-5a2 2 0 0 0 0 4h3a2 2 0 0 1 0 4h-5M12 6.5v2M12 16.5v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>;
  }
  if (type === "research") {
    return <svg className={styles.tabIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 3.5h9l3 3v14H6a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="M14 3.5v4h4M8 12h8M8 15.5h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>;
  }
  return <svg className={styles.tabIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m3 16 5-5 4 3 7-8M16 6h3v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function formatPerformance(value) {
  if (!Number.isFinite(value)) return "--";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatDrawdown(value) {
  if (!Number.isFinite(value)) return "--";
  if (Math.abs(value) < 0.005) return "At peak";
  return `${value.toFixed(2)}%`;
}

export default function Home() {
  const { stockHoldings, currencyHoldings, chart, isLoading, isRefreshing, error, updatedAt, isStale, accounts, selectedAccountIds, loadDataForAccounts, refreshData } = usePortfolioData();
  const { darkMode, toggleDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState("performance");
  const tabRefs = useRef([]);

  const summary = useMemo(() => {
    const values = chart.map((point) => Number(point?.netPerformanceInPercentage)).filter(Number.isFinite);
    const currentPerformance = values.length ? values.at(-1) : NaN;
    const peak = values.length ? Math.max(...values) : NaN;
    const drawdownFromPeak = Number.isFinite(currentPerformance) && Number.isFinite(peak)
      ? currentPerformance - peak
      : NaN;
    const topHolding = stockHoldings.toSorted((a, b) => b.allocationInPercentage - a.allocationInPercentage)[0];
    return { currentPerformance, peak, drawdownFromPeak, topHolding };
  }, [chart, stockHoldings]);

  const tabCounts = {
    stockHoldings: stockHoldings.length || undefined,
    currencyHoldings: currencyHoldings.length || undefined,
    research: "28 Nov",
  };

  const selectTab = (index, focusTab = false) => {
    setActiveTab(tabs[index].id);
    const node = tabRefs.current[index];
    if (focusTab) node?.focus();
    node?.scrollIntoView?.({ block: "nearest", inline: "nearest", container: "nearest" });
  };

  const handleTabKeyDown = (event, index) => {
    let nextIndex = null;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabs.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    selectTab(nextIndex, true);
  };

  const renderContent = () => {
    if (activeTab === "research") return <ResearchReport />;
    if (isLoading) return <LoadingSpinner />;
    if (activeTab === "stockHoldings") return <StockHoldings holdings={stockHoldings} darkMode={darkMode} />;
    if (activeTab === "currencyHoldings") return <CurrencyHoldings holdings={currencyHoldings} darkMode={darkMode} />;
    return <PerformanceChart data={chart} darkMode={darkMode} />;
  };

  const netBadgeClass = !Number.isFinite(summary.currentPerformance)
    ? styles.summaryBadgeNeutral
    : summary.currentPerformance >= 0
      ? styles.summaryBadgePositive
      : styles.summaryBadgeNegative;

  const netHeroClass = !Number.isFinite(summary.currentPerformance)
    ? ""
    : summary.currentPerformance >= 0
      ? styles.summaryItemPositive
      : styles.summaryItemNegative;

  const isAtPeak = Number.isFinite(summary.drawdownFromPeak) && Math.abs(summary.drawdownFromPeak) < 0.005;
  const drawdownColorClass = !Number.isFinite(summary.drawdownFromPeak)
    ? ""
    : isAtPeak
      ? styles.positive
      : styles.negative;

  const showInitialSkeleton = isLoading && !chart.length && !stockHoldings.length;

  return (
    <>
      <SeoHead title="TMs Portfolio | Wealth Console" description="Portfolio performance, asset allocation, currency exposure, and latest results research." path="/" locale="en_US" />

      <Navbar
        activeSection="portfolio"
        accounts={accounts}
        selectedAccountIds={selectedAccountIds}
        onSelectAccounts={loadDataForAccounts}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        onRefresh={refreshData}
        isRefreshing={isRefreshing}
        refreshDisabled={isLoading}
        updatedAt={updatedAt}
        isStale={isStale}
      />

      <main className={styles.page}>
        <h1 id="main-content" tabIndex={-1} className="visually-hidden">
          TMs Portfolio Wealth Console
        </h1>

        {error && <p className={styles.dataError} role="alert">{error}{updatedAt && " Showing the last loaded data."}</p>}

        <section className={styles.dashboardShell}>
          <div className={styles.summaryStrip} role="region" aria-label="Portfolio summary">
            <div className={`${styles.summaryItem} ${netHeroClass}`}>
              <div className={styles.summaryHeader}>
                <span className={styles.summaryLabel}>Net return</span>
              </div>
              <div className={styles.summaryValueRow}>
                {showInitialSkeleton ? (
                  <span className={styles.summarySkeleton} aria-hidden="true" />
                ) : (
                  <>
                    <span className={`${styles.summaryBadge} ${netBadgeClass}`}>
                      {formatPerformance(summary.currentPerformance)}
                    </span>
                    {chart.length > 0 && <span className={styles.summarySub}>{chart.length}d tracked</span>}
                  </>
                )}
              </div>
            </div>

            <div className={styles.summaryItem}>
              <div className={styles.summaryHeader}>
                <span className={styles.summaryLabel}>From peak</span>
              </div>
              <div className={styles.summaryValueRow}>
                {showInitialSkeleton ? (
                  <span className={styles.summarySkeleton} aria-hidden="true" />
                ) : (
                  <>
                    <span className={`${styles.summaryValue} ${drawdownColorClass}`}>
                      {formatDrawdown(summary.drawdownFromPeak)}
                    </span>
                    {Number.isFinite(summary.peak) && !isAtPeak && (
                      <span className={styles.summarySub}>peak {formatPerformance(summary.peak)}</span>
                    )}
                    {isAtPeak && <span className={styles.summarySub}>period high</span>}
                  </>
                )}
              </div>
            </div>

            <div className={styles.summaryItem}>
              <div className={styles.summaryHeader}>
                <span className={styles.summaryLabel}>Top position</span>
              </div>
              <div className={styles.summaryValueRow}>
                {showInitialSkeleton ? (
                  <span className={styles.summarySkeleton} aria-hidden="true" />
                ) : (
                  <>
                    <span className={styles.summaryValue}>{summary.topHolding?.symbol || "--"}</span>
                    {summary.topHolding && (
                      <span className={styles.summarySub}>{(summary.topHolding.allocationInPercentage * 100).toFixed(1)}% wt</span>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className={styles.summaryItem}>
              <div className={styles.summaryHeader}>
                <span className={styles.summaryLabel}>Coverage</span>
              </div>
              <div className={styles.summaryValueRow}>
                {showInitialSkeleton ? (
                  <span className={styles.summarySkeleton} aria-hidden="true" />
                ) : (
                  <>
                    <span className={styles.summaryValue}>{stockHoldings.length || "--"}</span>
                    <span className={styles.summarySub}>assets · {currencyHoldings.length} FX</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className={styles.tabsBar}>
            <div className={styles.navTabs} role="tablist" aria-label="Portfolio views">
              {tabs.map((tab, index) => (
                <button
                  type="button"
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  ref={(node) => { tabRefs.current[index] = node; }}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  tabIndex={activeTab === tab.id ? 0 : -1}
                  className={styles.tabButton}
                  onClick={() => selectTab(index)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                >
                  <TabIcon type={tab.icon} />
                  {tab.label}
                  {tabCounts[tab.id] !== undefined && <span className={styles.tabCount}>{tabCounts[tab.id]}</span>}
                </button>
              ))}
            </div>
            <span className={styles.sectionMeta}>Base currency normalized</span>
          </div>

          <div
            className={styles.contentArea}
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
            tabIndex={0}
          >
            {renderContent()}
          </div>
        </section>
      </main>
    </>
  );
}
