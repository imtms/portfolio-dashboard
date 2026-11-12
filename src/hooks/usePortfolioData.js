import { useCallback, useEffect, useRef, useState } from "react";

export function usePortfolioData() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const activeRequest = useRef(null);
  const requestId = useRef(0);
  const staleChecks = useRef(0);
  const selection = useRef([]);

  const cancelLoad = useCallback(() => {
    ++requestId.current;
    activeRequest.current?.abort();
  }, []);

  const loadDataForAccounts = useCallback(async (accountIds = [], { refresh = false, background = false } = {}) => {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    const currentRequestId = ++requestId.current;
    selection.current = accountIds;
    if (!background) staleChecks.current = 0;
    setIsLoading(!refresh && !background);
    setIsRefreshing(refresh || background);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (accountIds.length > 0) params.set("accounts", accountIds.join(","));
      const query = params.size > 0 ? `?${params}` : "";
      const response = await fetch(`/api/data${query}`, {
        method: refresh ? "POST" : "GET",
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Unable to update portfolio data. Please try again.");
      const next = await response.json();
      if (currentRequestId !== requestId.current) return;
      setData(next);
      selection.current = next.selectedAccountIds || [];
      try {
        localStorage.setItem("selectedAccountIds", JSON.stringify(selection.current));
      } catch { /* Storage may be unavailable in private browsing. */ }
    } catch (error) {
      if (error.name !== "AbortError" && currentRequestId === requestId.current) {
        setError("Unable to update portfolio data. Please try again.");
      }
    } finally {
      if (currentRequestId === requestId.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    let persisted = [];
    try {
      const saved = JSON.parse(localStorage.getItem("selectedAccountIds"));
      if (Array.isArray(saved)) persisted = saved.filter((id) => typeof id === "string");
    } catch { /* Use all accounts if the saved selection cannot be read. */ }
    let active = true;
    queueMicrotask(() => {
      if (active) loadDataForAccounts(persisted);
    });
    return () => {
      active = false;
      cancelLoad();
    };
  }, [cancelLoad, loadDataForAccounts]);

  // A stale snapshot is shown immediately. Pick up the server's background result shortly after.
  useEffect(() => {
    if (!data?.isStale || error || isLoading || isRefreshing || staleChecks.current >= 12) return;
    const timer = setTimeout(() => {
      ++staleChecks.current;
      loadDataForAccounts(selection.current, { background: true });
    }, 5000);
    return () => clearTimeout(timer);
  }, [data, error, isLoading, isRefreshing, loadDataForAccounts]);

  useEffect(() => {
    const checkForUpdates = () => {
      if (document.visibilityState !== "visible" || isLoading || isRefreshing) return;
      staleChecks.current = 0;
      loadDataForAccounts(selection.current, { background: true });
    };
    const timer = setInterval(checkForUpdates, 5 * 60 * 1000);
    document.addEventListener("visibilitychange", checkForUpdates);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", checkForUpdates);
    };
  }, [isLoading, isRefreshing, loadDataForAccounts]);

  const refreshData = useCallback(() => loadDataForAccounts(selection.current, { refresh: true }), [loadDataForAccounts]);

  return {
    stockHoldings: data?.stockHoldings || [],
    currencyHoldings: data?.currencyHoldings || [],
    chart: data?.chart || [],
    accounts: data?.accounts || [],
    selectedAccountIds: data?.selectedAccountIds || [],
    updatedAt: data?.updatedAt,
    isStale: data?.isStale || false,
    isLoading,
    isRefreshing,
    error,
    loadDataForAccounts,
    refreshData,
  };
}
