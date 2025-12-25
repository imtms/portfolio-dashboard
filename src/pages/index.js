import Head from "next/head";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Container } from "react-bootstrap";
import { usePortfolioData } from "../hooks/usePortfolioData";
import Navbar from "../components/Layout/Navbar";
import LoadingSpinner from "../components/Common/LoadingSpinner";
import styles from "../styles/Dashboard.module.css";

// Dynamic imports for heavy chart components
const PerformanceChart = dynamic(() => import("../components/Dashboard/PerformanceChart"), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});
const StockHoldings = dynamic(() => import("../components/Dashboard/StockHoldings"), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});
const CurrencyHoldings = dynamic(() => import("../components/Dashboard/CurrencyHoldings"), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

export default function Home() {
  const {
    stockHoldings,
    currencyHoldings,
    chart,
    isLoading,
    accounts,
    selectedAccountIds,
    loadDataForAccounts,
  } = usePortfolioData();

  const [activeTab, setActiveTab] = useState("performance");
  const [darkMode, setDarkMode] = useState(false);

  // Dark Mode Logic
  useEffect(() => {
    // Check system preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDarkMode(prefersDark);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => setDarkMode(e.matches);
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.body.setAttribute("data-bs-theme", "dark");
    } else {
      document.body.removeAttribute("data-bs-theme");
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const renderContent = () => {
    if (isLoading) return <LoadingSpinner />;

    switch (activeTab) {
      case "performance":
        return <PerformanceChart data={chart} />;
      case "stockHoldings":
        return <StockHoldings holdings={stockHoldings} />;
      case "currencyHoldings":
        return <CurrencyHoldings holdings={currencyHoldings} />;
      default:
        return null;
    }
  };

  return (
    <>
      <Head>
        <title>TMs Portfolio Dashboard</title>
        <meta name="description" content="View your portfolio performance and holdings" />
      </Head>

      <Navbar
        accounts={accounts}
        selectedAccountIds={selectedAccountIds}
        onSelectAccounts={loadDataForAccounts}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />

      <Container className="mt-4">
        <div className={styles.dashboardWrapper}>
          <div className={styles.navTabs}>
            <div
              className={`${styles.navItem} ${activeTab === "performance" ? styles.navItemActive : ""}`}
              onClick={() => setActiveTab("performance")}
            >
              Performance
            </div>
            <div
              className={`${styles.navItem} ${activeTab === "stockHoldings" ? styles.navItemActive : ""}`}
              onClick={() => setActiveTab("stockHoldings")}
            >
              Stock Holdings
            </div>
            <div
              className={`${styles.navItem} ${activeTab === "currencyHoldings" ? styles.navItemActive : ""}`}
              onClick={() => setActiveTab("currencyHoldings")}
            >
              Currency Holdings
            </div>
          </div>

          <div className="content-area">
            {renderContent()}
          </div>
        </div>
      </Container>
    </>
  );
}
