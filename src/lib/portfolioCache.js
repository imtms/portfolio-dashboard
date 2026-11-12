import { createHash } from "node:crypto";
import { getCache, waitUntil } from "@vercel/functions";
import { fetchPortfolioData, selectAccountIds } from "./portfolioData.js";

const FRESH_FOR_MS = 5 * 60 * 1000;
const RETAIN_FOR_SECONDS = 48 * 60 * 60;
const cache = getCache({ namespace: "portfolio-dashboard-v1", keyHashFunction: (key) => key });
const inFlight = new Map();

function cacheKey(accountIds) {
  // Hobby teams share a cache: isolate projects, credentials, sources and account scopes.
  return createHash("sha256").update(JSON.stringify([
    process.env.VERCEL_PROJECT_ID,
    process.env.VERCEL_ENV || process.env.NODE_ENV,
    process.env.USE_MOCK_DATA,
    process.env.ACCESS_TOKEN,
    process.env.AUTH_API_ENDPOINT,
    process.env.HOLDINGS_API_ENDPOINT,
    process.env.PERFORMANCE_API_ENDPOINT,
    process.env.ACCOUNTS,
    accountIds,
  ])).digest("hex");
}

function refreshSnapshot(key, accountIds) {
  if (!inFlight.has(key)) {
    const pending = (async () => {
      const data = await fetchPortfolioData(accountIds);
      try {
        await cache.set(key, data, { ttl: RETAIN_FOR_SECONDS });
      } catch (error) {
        console.error("Unable to cache portfolio snapshot:", error.message);
      }
      return data;
    })().finally(() => inFlight.delete(key));
    inFlight.set(key, pending);
  }
  return inFlight.get(key);
}

export async function getPortfolioData(requestedAccountIds = [], { forceRefresh = false } = {}) {
  const accountIds = selectAccountIds(requestedAccountIds);
  const key = cacheKey(accountIds);
  if (forceRefresh) {
    return { ...await refreshSnapshot(key, accountIds), isStale: false };
  }

  let snapshot;
  try {
    snapshot = await cache.get(key);
  } catch (error) {
    console.error("Unable to read portfolio cache:", error.message);
  }

  if (snapshot) {
    const isStale = Date.now() - Date.parse(snapshot.updatedAt) >= FRESH_FOR_MS;
    if (isStale) {
      // Keep the function alive after responding, including on Vercel serverless instances.
      waitUntil(refreshSnapshot(key, accountIds).catch((error) => {
        console.error("Background portfolio refresh failed:", error.message);
      }));
    }
    return { ...snapshot, isStale };
  }

  return { ...await refreshSnapshot(key, accountIds), isStale: false };
}
