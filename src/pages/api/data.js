export default async function handler(req, res) {
  const accessToken = process.env.ACCESS_TOKEN;
  const authApiEndpoint = process.env.AUTH_API_ENDPOINT;
  const holdingsApiEndpoint = process.env.HOLDINGS_API_ENDPOINT;
  const performanceApiEndpoint = process.env.PERFORMANCE_API_ENDPOINT;
  const accountsEnv = process.env.ACCOUNTS || "";

  // Parse ACCOUNTS from env. Support either JSON or simple `Name:uuid,Name2:uuid2` format.
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
    } catch (e) {
      // Fallback parse `Name:uuid,Name2:uuid2`
      const parts = accountsEnv.split(",").map(s => s.trim()).filter(Boolean);
      availableAccounts = parts.map((p) => {
        const [name, id] = p.split(":");
        return { name: (name || "").trim(), id: (id || "").trim() };
      }).filter(a => a.id && a.name);
    }
  }

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
      // Determine which account ids to request. If query param `accounts` present, use it. Otherwise, use all available accounts (if any).
      const requestedAccountsParam = req.query.accounts || "";
      let requestedAccountIds = [];
      if (requestedAccountsParam) {
        requestedAccountIds = requestedAccountsParam.split(",").map(s => s.trim()).filter(Boolean);
      } else if (availableAccounts.length > 0) {
        requestedAccountIds = availableAccounts.map(a => a.id).filter(Boolean);
      }

      // Append accounts query if we have account ids
      const accountsQuery = requestedAccountIds.length > 0 ? `&accounts=${encodeURIComponent(requestedAccountIds.join(","))}` : "";
      const holdingsEndpointWithAccounts = `${holdingsApiEndpoint}${accountsQuery}`;
      const performanceEndpointWithAccounts = `${performanceApiEndpoint}${accountsQuery}`;

      const [holdingsData, performanceData] = await Promise.all([
        fetchData(holdingsEndpointWithAccounts, jwtToken),
        fetchData(performanceEndpointWithAccounts, jwtToken),
      ]);

      // Process holdings data
      const stockHoldings = holdingsData.holdings
        .filter((holding) => holding.assetSubClass != "CASH")
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
      const startOfYear = new Date();
      startOfYear.setMonth(0, 1); // 设置为1月1日
      startOfYear.setHours(0, 0, 0, 0);

      const chart = performanceData.chart
        .filter(item => new Date(item.date) >= startOfYear)
        .map((item) => ({
          date: item.date,
          netPerformanceInPercentage: item.netPerformanceInPercentage*100,
      }));

      // Prepare response
      const responseBody = JSON.stringify({
        stockHoldings,
        currencyHoldings: processedCurrencyHoldings,
        chart,
        // Expose available accounts and currently selected ids for frontend
        accounts: availableAccounts,
        selectedAccountIds: requestedAccountIds,
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
