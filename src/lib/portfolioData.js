const previewData = {
  accounts: [
    { id: "aggregate", name: "All accounts" },
    { id: "long-term", name: "Long-term portfolio" },
    { id: "opportunistic", name: "Opportunistic account" },
  ],
  selectedAccountIds: ["aggregate", "long-term", "opportunistic"],
  stockHoldings: [
    { symbol: "BRK.B", name: "Berkshire Hathaway", netPerformancePercent: 0.1842, allocationInPercentage: 0.238 },
    { symbol: "AAPL", name: "Apple Inc.", netPerformancePercent: 0.1264, allocationInPercentage: 0.182 },
    { symbol: "MSFT", name: "Microsoft Corporation", netPerformancePercent: 0.0937, allocationInPercentage: 0.164 },
    { symbol: "VOO", name: "Vanguard S&P 500 ETF", netPerformancePercent: 0.0819, allocationInPercentage: 0.151 },
    { symbol: "NVDA", name: "NVIDIA Corporation", netPerformancePercent: 0.2841, allocationInPercentage: 0.102 },
    { symbol: "GOOGL", name: "Alphabet Inc.", netPerformancePercent: -0.0312, allocationInPercentage: 0.071 },
    { symbol: "TSM", name: "Taiwan Semiconductor", netPerformancePercent: 0.1176, allocationInPercentage: 0.052 },
    { symbol: "BND", name: "Vanguard Total Bond Market ETF", netPerformancePercent: -0.0084, allocationInPercentage: 0.04 },
  ],
  currencyHoldings: [
    { currency: "USD", percentage: 72.45 },
    { currency: "SGD", percentage: 12.2 },
    { currency: "HKD", percentage: 7.35 },
    { currency: "CNY", percentage: 4.6 },
    { currency: "EUR", percentage: 2.15 },
    { currency: "JPY", percentage: 1.25 },
  ],
  chart: [
    { date: "Jan 02", netPerformanceInPercentage: 0.0 },
    { date: "Jan 16", netPerformanceInPercentage: 1.8 },
    { date: "Feb 01", netPerformanceInPercentage: 1.1 },
    { date: "Feb 15", netPerformanceInPercentage: 3.7 },
    { date: "Mar 01", netPerformanceInPercentage: 2.9 },
    { date: "Mar 15", netPerformanceInPercentage: 5.2 },
    { date: "Apr 01", netPerformanceInPercentage: 4.4 },
    { date: "Apr 15", netPerformanceInPercentage: 6.8 },
    { date: "May 01", netPerformanceInPercentage: 7.5 },
    { date: "May 15", netPerformanceInPercentage: 6.9 },
    { date: "Jun 03", netPerformanceInPercentage: 9.2 },
    { date: "Jun 17", netPerformanceInPercentage: 10.6 },
    { date: "Jul 01", netPerformanceInPercentage: 9.8 },
    { date: "Jul 15", netPerformanceInPercentage: 12.42 },
  ],
};

function getHoldingValue(holding, fallback = 0) {
  const value = holding?.valueInBaseCurrency ?? holding?.value ?? fallback;
  return Number(value) || fallback;
}

function getHoldingQuantity(holding) {
  const quantity = holding?.quantity ?? holding?.units ?? holding?.shares;
  if (quantity === undefined || quantity === null || quantity === "") return null;

  const parsedQuantity = Number(quantity);
  return Number.isFinite(parsedQuantity) ? parsedQuantity : null;
}

function getHoldingAssetField(holding, fieldName, fallback = "") {
  return holding?.assetProfile?.[fieldName] ?? holding?.[fieldName] ?? fallback;
}

function normalizeHolding(holding) {
  return {
    ...holding,
    symbol: getHoldingAssetField(holding, "symbol", ""),
    name: getHoldingAssetField(holding, "name", ""),
    assetClass: getHoldingAssetField(holding, "assetClass", ""),
    assetSubClass: getHoldingAssetField(holding, "assetSubClass", ""),
    currency: getHoldingAssetField(holding, "currency", ""),
    netPerformancePercent: holding?.netPerformancePercent ?? 0,
    allocationInPercentage: holding?.allocationInPercentage ?? 0,
    valueInBaseCurrency: getHoldingValue(holding, 0),
  };
}

function isLiquidityHolding(holding) {
  const assetClass = String(holding?.assetClass || "").toUpperCase();
  const assetSubClass = String(holding?.assetSubClass || "").toUpperCase();
  return assetClass === "LIQUIDITY" || assetSubClass === "CASH";
}

function isActiveHolding(holding) {
  const quantity = getHoldingQuantity(holding);
  return quantity !== null ? quantity !== 0 : holding.valueInBaseCurrency !== 0;
}

function buildStockHoldings(holdings = []) {
  return holdings
    .map(normalizeHolding)
    .filter(isActiveHolding)
    .filter((holding) => !isLiquidityHolding(holding))
    .map((holding) => ({
      symbol: holding.symbol,
      name: holding.name,
      netPerformancePercent: holding.netPerformancePercent,
      allocationInPercentage: holding.allocationInPercentage,
    }));
}

function buildCurrencyHoldings(holdings = []) {
  const normalizedHoldings = holdings.map(normalizeHolding).filter(isActiveHolding);
  const grouped = {};
  let totalValue = 0;

  normalizedHoldings.forEach((holding) => {
    const currency = holding.currency || "UNKNOWN";
    if (!grouped[currency]) {
      grouped[currency] = {
        currency,
        totalValue: 0,
        holdings: [],
      };
    }

    grouped[currency].totalValue += holding.valueInBaseCurrency;
    grouped[currency].holdings.push(holding);
    totalValue += holding.valueInBaseCurrency;
  });

  return Object.values(grouped).map((currencyHolding) => ({
    currency: currencyHolding.currency,
    percentage: totalValue > 0 ? (currencyHolding.totalValue / totalValue) * 100 : 0,
  }));
}

export function getAvailableAccounts() {
  const accountsEnv = process.env.ACCOUNTS || "";
  let availableAccounts = [];
  if (accountsEnv) {
    try {
      const parsed = JSON.parse(accountsEnv);
      if (Array.isArray(parsed)) {
        // Accept array of {name,id} or {name,uuid}
        availableAccounts = parsed.map((item) => {
          if (!item) return null;
          return { name: item.name || item.displayName || item.title || "", id: item.id || item.uuid || item.account || "" };
        }).filter(Boolean);
      } else if (typeof parsed === "object" && parsed !== null) {
        // Object map { "DisplayName": "uuid" }
        availableAccounts = Object.keys(parsed).map((k) => ({ name: k, id: parsed[k] }));
      }
    } catch {
      // Fallback parse `Name:uuid,Name2:uuid2`
      const parts = accountsEnv.split(",").map(s => s.trim()).filter(Boolean);
      availableAccounts = parts.map((p) => {
        const [name, id] = p.split(":");
        return { name: (name || "").trim(), id: (id || "").trim() };
      }).filter(a => a.id && a.name);
    }
  }

  if (process.env.NODE_ENV === "development" && process.env.USE_MOCK_DATA === "true") {
    return previewData.accounts;
  }
  return availableAccounts.filter((account) => account.id && account.name);
}

export function selectAccountIds(requested = [], accounts = getAvailableAccounts()) {
  const valid = requested.filter((id) => typeof id === "string" &&
    (accounts.length === 0 || accounts.some((account) => account.id === id)));
  return [...new Set(valid.length > 0 ? valid : accounts.map((account) => account.id))].sort();
}

export async function fetchPortfolioData(accountIds) {
  const accounts = getAvailableAccounts();
  if (process.env.NODE_ENV === "development" && process.env.USE_MOCK_DATA === "true") {
    return { ...previewData, selectedAccountIds: accountIds, updatedAt: new Date().toISOString() };
  }

  const { ACCESS_TOKEN, AUTH_API_ENDPOINT, HOLDINGS_API_ENDPOINT, PERFORMANCE_API_ENDPOINT } = process.env;
  if (!ACCESS_TOKEN || !AUTH_API_ENDPOINT || !HOLDINGS_API_ENDPOINT || !PERFORMANCE_API_ENDPOINT) {
    throw new Error("Missing environment variables");
  }

  const jwtToken = await fetchAuthToken(AUTH_API_ENDPOINT, ACCESS_TOKEN);
  if (!jwtToken) throw new Error("Failed to fetch JWT token");

  const withAccounts = (endpoint) => {
    const url = new URL(endpoint);
    if (accountIds.length > 0) url.searchParams.set("accounts", accountIds.join(","));
    return url.toString();
  };
  const [holdingsData, performanceData] = await Promise.all([
    fetchData(withAccounts(HOLDINGS_API_ENDPOINT), jwtToken),
    fetchData(withAccounts(PERFORMANCE_API_ENDPOINT), jwtToken),
  ]);
  // Never replace a good snapshot with an upstream error or incomplete response.
  if (!Array.isArray(holdingsData?.holdings) || !Array.isArray(performanceData?.chart)) {
    throw new Error("Invalid portfolio response");
  }

  return {
    stockHoldings: buildStockHoldings(holdingsData.holdings),
    currencyHoldings: buildCurrencyHoldings(holdingsData.holdings),
    chart: performanceData.chart.map((item) => ({
      date: item.date,
      netPerformanceInPercentage: item.netPerformanceInPercentage * 100,
    })),
    accounts,
    selectedAccountIds: accountIds,
    updatedAt: new Date().toISOString(),
  };
}

// Helper function to fetch auth token
async function fetchAuthToken(authEndpoint, accessToken) {
  const payload = { accessToken };
  const response = await fetch(authEndpoint, {
    method: "POST",
    cache: "no-store",
    signal: AbortSignal.timeout(25000),
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    const authData = await response.json();
    return authData.authToken;
  } else {
    console.error(
      `Error: Unable to fetch auth token, Status code: ${response.status}`,
    );
    throw new Error(`Upstream request failed (${response.status})`);
  }
}

// Helper function to fetch data with JWT token
async function fetchData(dataEndpoint, jwtToken) {
  const response = await fetch(dataEndpoint, {
    method: "GET",
    cache: "no-store",
    signal: AbortSignal.timeout(25000),
    headers: {
      Authorization: `Bearer ${jwtToken}`,
      "Content-Type": "application/json",
    },
  });

  if (response.ok) {
    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder("utf-8");
    const decodedText = decoder.decode(buffer);
    return JSON.parse(decodedText);
  } else {
    console.error(
      `Error: Unable to fetch data, Status code: ${response.status}`,
    );
    throw new Error(`Upstream request failed (${response.status})`);
  }
}
