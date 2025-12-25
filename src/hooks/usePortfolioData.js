import { useState, useEffect } from "react";

export function usePortfolioData() {
  const [stockHoldings, setStockHoldings] = useState([]);
  const [currencyHoldings, setCurrencyHoldings] = useState([]);
  const [chart, setChart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState([]);

  // Load data for specific account ids
  const loadDataForAccounts = async (accountIds) => {
    try {
      setIsLoading(true);
      // persist selection
      try {
        localStorage.setItem("selectedAccountIds", JSON.stringify(accountIds || []));
      } catch (e) {
        console.warn("Failed to save selection to localStorage", e);
      }

      const qs = accountIds && accountIds.length > 0 ? `?accounts=${accountIds.join(",")}` : "";
      const res = await fetch(`/api/data${qs}`);
      const data = await res.json();

      if (data.accounts) setAccounts(data.accounts);
      if (data.selectedAccountIds) setSelectedAccountIds(data.selectedAccountIds);
      setStockHoldings(data.stockHoldings || []);
      setCurrencyHoldings(data.currencyHoldings || []);
      setChart(data.chart || []);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/data");
        const data = await res.json();

        if (data.accounts) setAccounts(data.accounts);

        // Check localStorage for persisted selection
        const persisted = (() => {
          try {
            const raw = localStorage.getItem("selectedAccountIds");
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
            return null;
          } catch (e) {
            return null;
          }
        })();

        if (persisted && data.accounts) {
          // validate persisted ids exist in accounts
          const valid = persisted.filter((id) => data.accounts.some((a) => a.id === id));
          if (valid.length > 0) {
            await loadDataForAccounts(valid);
            return;
          }
        }

        if (data.selectedAccountIds) setSelectedAccountIds(data.selectedAccountIds);
        setStockHoldings(data.stockHoldings || []);
        setCurrencyHoldings(data.currencyHoldings || []);
        setChart(data.chart || []);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  return {
    stockHoldings,
    currencyHoldings,
    chart,
    isLoading,
    accounts,
    selectedAccountIds,
    setSelectedAccountIds,
    loadDataForAccounts,
  };
}
