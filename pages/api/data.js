export default async function handler(req, res) {
  const accessToken = process.env.ACCESS_TOKEN;
  const authApiEndpoint = process.env.AUTH_API_ENDPOINT;
  const holdingsApiEndpoint = process.env.HOLDINGS_API_ENDPOINT;
  const performanceApiEndpoint = process.env.PERFORMANCE_API_ENDPOINT;

  if (
    !accessToken ||
    !authApiEndpoint ||
    !holdingsApiEndpoint ||
    !performanceApiEndpoint
  ) {
    return res.status(500).json({ error: "Missing environment variables" });
  }

  try {
    // Fetch auth token
    const jwtToken = await fetchAuthToken(authApiEndpoint, accessToken);

    if (jwtToken) {
      const [holdingsData, performanceData] = await Promise.all([
        fetchData(holdingsApiEndpoint, jwtToken),
        fetchData(performanceApiEndpoint, jwtToken),
      ]);

      // Process holdings data
      const stockHoldings = holdingsData.holdings
        .filter((holding) => holding.assetClass === "EQUITY")
        .map((holding) => ({
          symbol: holding.symbol,
          name: holding.name,
          netPerformancePercent: holding.netPerformancePercent,
          allocationInPercentage: holding.allocationInPercentage,
        }));

      const currencyHoldings = {};
      let totalValue = 0;

      holdingsData.holdings.forEach((holding) => {
        const currency = holding.currency;
        if (!currencyHoldings[currency]) {
          currencyHoldings[currency] = {
            currency,
            totalValue: 0,
            holdings: [],
          };
        }

        currencyHoldings[currency].totalValue += holding.valueInBaseCurrency;
        currencyHoldings[currency].holdings.push(holding);
        totalValue += holding.valueInBaseCurrency;
      });

      // Calculate percentages for currency holdings
      const processedCurrencyHoldings = Object.values(currencyHoldings).map(
        (currencyHolding) => ({
          currency: currencyHolding.currency,
          percentage: (currencyHolding.totalValue / totalValue) * 100,
        }),
      );

      // Process performance data
      const chart = performanceData.chart.map((item) => ({
        date: item.date,
        netPerformanceInPercentage: item.netPerformanceInPercentage,
      }));

      // Prepare response
      const responseBody = JSON.stringify({
        stockHoldings,
        currencyHoldings: processedCurrencyHoldings,
        chart,
      });

      const encoder = new TextEncoder();
      const encodedResponse = encoder.encode(responseBody);

      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.status(200).send(Buffer.from(encodedResponse));
    } else {
      res.status(500).json({ error: "Failed to fetch JWT token" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Helper function to fetch auth token
async function fetchAuthToken(authEndpoint, accessToken) {
  const payload = { accessToken };
  const response = await fetch(authEndpoint, {
    method: "POST",
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
    const errorText = await response.text();
    console.error(errorText);
    return null;
  }
}

// Helper function to fetch data with JWT token
async function fetchData(dataEndpoint, jwtToken) {
  const response = await fetch(dataEndpoint, {
    method: "GET",
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
    const errorText = await response.text();
    console.error(errorText);
    return null;
  }
}
