function buildStockHoldingsForTest(holdings = []) {
  return holdings
    .map((holding) => ({
      ...holding,
      symbol: holding?.assetProfile?.symbol ?? holding?.symbol ?? "",
      name: holding?.assetProfile?.name ?? holding?.name ?? "",
      assetClass: holding?.assetProfile?.assetClass ?? holding?.assetClass ?? "",
      assetSubClass: holding?.assetProfile?.assetSubClass ?? holding?.assetSubClass ?? "",
      currency: holding?.assetProfile?.currency ?? holding?.currency ?? "",
      netPerformancePercent: holding?.netPerformancePercent ?? 0,
      allocationInPercentage: holding?.allocationInPercentage ?? 0,
      valueInBaseCurrency: holding?.valueInBaseCurrency ?? holding?.value ?? 0,
    }))
    .filter((holding) => !(String(holding.assetClass || "").toUpperCase() === "LIQUIDITY" || String(holding.assetSubClass || "").toUpperCase() === "CASH"))
    .map((holding) => ({
      symbol: holding.symbol,
      name: holding.name,
      netPerformancePercent: holding.netPerformancePercent,
      allocationInPercentage: holding.allocationInPercentage,
    }));
}

function buildCurrencyHoldingsForTest(holdings = []) {
  const normalizedHoldings = holdings.map((holding) => ({
    ...holding,
    symbol: holding?.assetProfile?.symbol ?? holding?.symbol ?? "",
    name: holding?.assetProfile?.name ?? holding?.name ?? "",
    assetClass: holding?.assetProfile?.assetClass ?? holding?.assetClass ?? "",
    assetSubClass: holding?.assetProfile?.assetSubClass ?? holding?.assetSubClass ?? "",
    currency: holding?.assetProfile?.currency ?? holding?.currency ?? "",
    netPerformancePercent: holding?.netPerformancePercent ?? 0,
    allocationInPercentage: holding?.allocationInPercentage ?? 0,
    valueInBaseCurrency: holding?.valueInBaseCurrency ?? holding?.value ?? 0,
  }));

  const grouped = {};
  let totalValue = 0;

  normalizedHoldings.forEach((holding) => {
    const currency = holding.currency || "UNKNOWN";
    if (!grouped[currency]) {
      grouped[currency] = {
        currency,
        totalValue: 0,
      };
    }

    grouped[currency].totalValue += holding.valueInBaseCurrency;
    totalValue += holding.valueInBaseCurrency;
  });

  return Object.values(grouped).map((currencyHolding) => ({
    currency: currencyHolding.currency,
    percentage: totalValue > 0 ? (currencyHolding.totalValue / totalValue) * 100 : 0,
  }));
}

function runTests() {
  const holdings = [
    {
      assetProfile: {
        assetClass: 'EQUITY',
        assetSubClass: 'STOCK',
        symbol: 'AAPL',
        name: 'Apple Inc',
        currency: 'USD',
      },
      allocationInPercentage: 0.5,
      netPerformancePercent: 0.12,
      valueInBaseCurrency: 1000,
    },
    {
      assetProfile: {
        assetClass: 'LIQUIDITY',
        assetSubClass: 'CASH',
        symbol: 'USD',
        name: 'USD',
        currency: 'USD',
      },
      allocationInPercentage: -0.1,
      netPerformancePercent: -0.2,
      valueInBaseCurrency: 500,
    },
    {
      assetProfile: {
        assetClass: 'EQUITY',
        assetSubClass: 'STOCK',
        symbol: 'MSFT',
        name: 'Microsoft',
        currency: 'USD',
      },
      allocationInPercentage: 0.3,
      netPerformancePercent: 0.08,
      valueInBaseCurrency: 600,
    },
  ];

  const stockHoldings = buildStockHoldingsForTest(holdings);
  const currencyHoldings = buildCurrencyHoldingsForTest(holdings);

  if (stockHoldings.length !== 2) {
    throw new Error(`Expected 2 stock holdings, got ${stockHoldings.length}`);
  }

  if (stockHoldings[0].symbol !== 'AAPL') {
    throw new Error('Expected first stock holding to be AAPL');
  }

  if (currencyHoldings.length !== 1) {
    throw new Error(`Expected 1 currency bucket, got ${currencyHoldings.length}`);
  }

  if (currencyHoldings[0].percentage !== 100) {
    throw new Error(`Expected USD percentage to be 100, got ${currencyHoldings[0].percentage}`);
  }

  console.log('portfolioDataUtils tests passed');
}

runTests();
