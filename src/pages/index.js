import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { usePortfolioData } from "../hooks/usePortfolioData";
import Navbar from "../components/Layout/Navbar";
import LoadingSpinner from "../components/Common/LoadingSpinner";
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

export default function Home() {
  const { stockHoldings, currencyHoldings, chart, isLoading, accounts, selectedAccountIds, loadDataForAccounts } = usePortfolioData();
  const [activeTab, setActiveTab] = useState("performance");
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    const storedTheme = window.localStorage.getItem("portfolio-theme");
    return storedTheme ? storedTheme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event) => {
      if (!localStorage.getItem("portfolio-theme")) setDarkMode(event.matches);
    };
    mediaQuery.addEventListener?.("change", handleChange);
    return () => mediaQuery.removeEventListener?.("change", handleChange);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((current) => {
      const next = !current;
      localStorage.setItem("portfolio-theme", next ? "dark" : "light");
      return next;
    });
  };

  const summary = useMemo(() => {
    const lastPoint = chart.at(-1);
    const firstPoint = chart.at(0);
    const currentPerformance = Number(lastPoint?.netPerformanceInPercentage);
    const periodChange = Number.isFinite(currentPerformance) && Number.isFinite(Number(firstPoint?.netPerformanceInPercentage))
      ? currentPerformance - Number(firstPoint.netPerformanceInPercentage)
      : NaN;
    const topHolding = [...stockHoldings].sort((a, b) => b.allocationInPercentage - a.allocationInPercentage)[0];
    return { currentPerformance, periodChange, topHolding };
  }, [chart, stockHoldings]);

  const tabCounts = {
    performance: chart.length,
    stockHoldings: stockHoldings.length,
    currencyHoldings: currencyHoldings.length,
    research: "12 Sep",
  };

  const renderContent = () => {
    if (activeTab === "research") return <ResearchReport />;
    if (isLoading) return <LoadingSpinner />;
    if (activeTab === "stockHoldings") return <StockHoldings holdings={stockHoldings} darkMode={darkMode} />;
    if (activeTab === "currencyHoldings") return <CurrencyHoldings holdings={currencyHoldings} darkMode={darkMode} />;
    return <PerformanceChart data={chart} darkMode={darkMode} />;
  };

  return (
    <>
      <Head>
        <title>TMs Portfolio | Wealth Console</title>
        <meta name="description" content="Portfolio performance, asset allocation, currency exposure, and latest results research." />
      </Head>

      <Navbar
        activeSection="portfolio"
        accounts={accounts}
        selectedAccountIds={selectedAccountIds}
        onSelectAccounts={loadDataForAccounts}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />

      <main className={styles.page}>
        <section className={styles.metricsGrid} aria-label="Portfolio summary">
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Net performance</span>
            <span className={`${styles.metricValue} ${summary.currentPerformance >= 0 ? styles.positive : styles.negative}`}>{formatPerformance(summary.currentPerformance)}</span>
            <span className={styles.metricNote}>Latest available close</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Period movement</span>
            <span className={`${styles.metricValue} ${summary.periodChange >= 0 ? styles.positive : styles.negative}`}>{formatPerformance(summary.periodChange)}</span>
            <span className={styles.metricNote}>{chart.length} recorded sessions</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Largest position</span>
            <span className={styles.metricValue}>{summary.topHolding?.symbol || "--"}</span>
            <span className={styles.metricNote}>{summary.topHolding ? `${(summary.topHolding.allocationInPercentage * 100).toFixed(2)}% allocation` : "No holdings available"}</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Portfolio breadth</span>
            <span className={styles.metricValue}>{stockHoldings.length || "--"}</span>
            <span className={styles.metricNote}>{currencyHoldings.length} currency exposures</span>
          </div>
        </section>

        <section className={styles.dashboardShell}>
          <div className={styles.tabsBar}>
            <div className={styles.navTabs} role="tablist" aria-label="Portfolio views">
              {tabs.map((tab) => {
                const content = (
                  <>
                    <TabIcon type={tab.icon} />
                    {tab.label}
                    {tabCounts[tab.id] !== undefined && <span className={styles.tabCount}>{tabCounts[tab.id]}</span>}
                  </>
                );

                return (
                  <button
                    type="button"
                    key={tab.id}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    className={`${styles.tabButton} ${activeTab === tab.id ? styles.tabButtonActive : ""}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {content}
                  </button>
                );
              })}
            </div>
            <span className={styles.sectionMeta}>Base currency normalized</span>
          </div>
          <div className={styles.contentArea} role="tabpanel">{renderContent()}</div>
        </section>
      </main>
    </>
  );
}
