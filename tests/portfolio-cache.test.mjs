import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import dataHandler from "../src/pages/api/data.js";
import cronHandler from "../src/pages/api/cron/refresh.js";

const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };
const contextSymbol = Symbol.for("@vercel/request-context");
const originalContext = globalThis[contextSymbol];
let entries;
let calls;
let background;
let version;
let upstreamError;
let invalidHoldings;
let gate;
let cacheReadError;
let cacheWriteError;

beforeEach(() => {
  Object.assign(process.env, {
    NODE_ENV: "test",
    USE_MOCK_DATA: "false",
    VERCEL_PROJECT_ID: "portfolio-cache-test",
    VERCEL_ENV: "test",
    ACCESS_TOKEN: "test-access-token",
    AUTH_API_ENDPOINT: "https://upstream.test/auth",
    HOLDINGS_API_ENDPOINT: "https://upstream.test/holdings?range=max",
    PERFORMANCE_API_ENDPOINT: "https://upstream.test/performance?range=max",
    ACCOUNTS: JSON.stringify([{ name: "First", id: "a" }, { name: "Second", id: "b" }]),
    CRON_SECRET: "test-cron-secret",
  });
  entries = new Map();
  calls = [];
  background = [];
  version = 1;
  upstreamError = false;
  invalidHoldings = false;
  gate = null;
  cacheReadError = false;
  cacheWriteError = false;
  globalThis[contextSymbol] = { get: () => ({
    cache: {
      async get(key) {
        if (cacheReadError) throw new Error("Cache unavailable");
        return entries.get(key)?.value ?? null;
      },
      async set(key, value, options) {
        if (cacheWriteError) throw new Error("Cache unavailable");
        entries.set(key, { value, options });
      },
    },
    waitUntil(promise) { background.push(promise); },
  }) };
  globalThis.fetch = async (input, options) => {
    const url = new URL(input);
    calls.push({ url, options });
    if (gate) await gate;
    if (upstreamError) return Response.json({ error: "Upstream failed" }, { status: 503 });
    if (url.pathname === "/auth") return Response.json({ authToken: "test-jwt" });
    assert.equal(options.headers.Authorization, "Bearer test-jwt");
    assert.equal(url.searchParams.get("range"), "max");
    if (url.pathname === "/holdings") return Response.json(invalidHoldings ? {} : { holdings: [
      { assetProfile: { symbol: `LIVE${version}`, name: "Active", currency: "USD", assetClass: "EQUITY" }, quantity: 2, valueInBaseCurrency: 100, allocationInPercentage: 0.5 },
      { assetProfile: { symbol: "SOLD", currency: "EUR", assetClass: "EQUITY" }, quantity: 0, valueInBaseCurrency: 0 },
      { assetProfile: { symbol: "USD", currency: "USD", assetClass: "LIQUIDITY" }, quantity: 100, valueInBaseCurrency: 100 },
    ] });
    return Response.json({ chart: [{ date: "2026-11-12", netPerformanceInPercentage: version / 100 }] });
  };
});

afterEach(async () => {
  await Promise.allSettled(background);
  globalThis.fetch = originalFetch;
  globalThis[contextSymbol] = originalContext;
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
});

async function request(handler = dataHandler, { method = "GET", accounts, authorization } = {}) {
  const response = { statusCode: 200, headers: {}, body: null,
    setHeader(key, value) { this.headers[key] = value; },
    status(value) { this.statusCode = value; return this; },
    json(body) { this.body = body; return this; },
  };
  await handler({ method, query: { accounts }, headers: { authorization } }, response);
  return response;
}

test("repeat reads reuse a complete snapshot, including canonical account selections", async () => {
  const first = await request();
  assert.equal(first.statusCode, 200);
  assert.equal(first.headers["Cache-Control"], "private, no-store");
  assert.deepEqual(first.body.selectedAccountIds, ["a", "b"]);
  assert.deepEqual(first.body.stockHoldings.map((holding) => holding.symbol), ["LIVE1"]);
  assert.deepEqual(first.body.currencyHoldings, [{ currency: "USD", percentage: 100 }]);
  assert.equal(first.body.chart[0].netPerformanceInPercentage, 1);
  assert.ok(Date.parse(first.body.updatedAt));
  assert.equal(first.body.isStale, false);
  await request(dataHandler, { accounts: "b,a,a" });
  assert.equal(calls.length, 3, "equivalent selections must not refetch upstream");
  assert.equal([...entries.values()][0].options.ttl, 48 * 60 * 60);
  assert.ok(calls.every((call) => call.options.cache === "no-store"));
});

test("individual accounts have isolated caches and deleted selections fall back to all accounts", async () => {
  await request();
  version = 2;
  const individual = await request(dataHandler, { accounts: "b,deleted" });
  assert.deepEqual(individual.body.selectedAccountIds, ["b"]);
  assert.equal(individual.body.stockHoldings[0].symbol, "LIVE2");
  const all = await request(dataHandler, { accounts: "deleted" });
  assert.equal(all.body.stockHoldings[0].symbol, "LIVE1");
  assert.equal(calls.length, 6);
});

test("concurrent cold requests share one upstream load", async () => {
  await Promise.all([request(), request(), request()]);
  assert.equal(calls.length, 3);
});

test("stale reads return immediately and keep the background refresh alive", async () => {
  await request();
  const entry = [...entries.values()][0];
  entry.value.updatedAt = new Date(Date.now() - 6 * 60 * 1000).toISOString();
  version = 2;
  let release;
  gate = new Promise((resolve) => { release = resolve; });
  try {
    const stale = await Promise.race([
      request(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Stale read blocked")), 200)),
    ]);
    assert.equal(stale.body.isStale, true);
    assert.equal(stale.body.stockHoldings[0].symbol, "LIVE1");
    assert.equal(background.length, 1);
    await request();
    assert.equal(calls.length, 4, "concurrent stale reads must share the background load");
  } finally {
    release();
  }
  await Promise.all(background);
  const refreshed = await request();
  assert.equal(refreshed.body.stockHoldings[0].symbol, "LIVE2");
  assert.equal(refreshed.body.isStale, false);
  assert.equal(calls.length, 6);
});

test("manual refresh bypasses and replaces the normal cache", async () => {
  await request();
  version = 3;
  const refresh = await request(dataHandler, { method: "POST", accounts: "b,a" });
  assert.equal(refresh.body.stockHoldings[0].symbol, "LIVE3");
  assert.equal(refresh.body.isStale, false);
  const next = await request();
  assert.equal(next.body.stockHoldings[0].symbol, "LIVE3");
  assert.equal(calls.length, 6);
});

test("failed and incomplete refreshes preserve the last successful snapshot", async () => {
  const first = await request();
  upstreamError = true;
  assert.equal((await request(dataHandler, { method: "POST" })).statusCode, 502);
  upstreamError = false;
  invalidHoldings = true;
  assert.equal((await request(dataHandler, { method: "POST" })).statusCode, 502);
  const previous = await request();
  assert.deepEqual(previous.body, first.body);
});

test("cache outages fall back to fetching the upstream data", async () => {
  cacheReadError = true;
  cacheWriteError = true;
  const response = await request();
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.stockHoldings[0].symbol, "LIVE1");
  assert.equal(entries.size, 0);
});

test("credentials and project identity cannot reuse another cache entry", async () => {
  await request();
  process.env.ACCESS_TOKEN = "rotated-token";
  version = 2;
  assert.equal((await request()).body.stockHoldings[0].symbol, "LIVE2");
  process.env.VERCEL_PROJECT_ID = "different-project";
  version = 3;
  assert.equal((await request()).body.stockHoldings[0].symbol, "LIVE3");
  assert.equal(entries.size, 3);
});

test("cron rejects missing or wrong secrets and unsupported HTTP methods", async () => {
  assert.equal((await request(cronHandler)).statusCode, 401);
  assert.equal((await request(cronHandler, { authorization: "Bearer wrong" })).statusCode, 401);
  delete process.env.CRON_SECRET;
  assert.equal((await request(cronHandler, { authorization: "Bearer undefined" })).statusCode, 401);
  assert.equal((await request(cronHandler, { method: "POST" })).statusCode, 405);
  assert.equal((await request(dataHandler, { method: "DELETE" })).statusCode, 405);
  assert.equal(calls.length, 0);
});

test("cron warms all and individual account scopes used by normal reads", async () => {
  const result = await request(cronHandler, { authorization: "Bearer test-cron-secret" });
  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.body, { refreshed: 3, failed: 0 });
  assert.equal(calls.length, 9);
  await request();
  await request(dataHandler, { accounts: "a" });
  await request(dataHandler, { accounts: "b" });
  assert.equal(calls.length, 9);
});

test("cron deduplicates a single-account portfolio and reports upstream failures", async () => {
  process.env.ACCOUNTS = "First:a";
  assert.deepEqual((await request(cronHandler, { authorization: "Bearer test-cron-secret" })).body, { refreshed: 1, failed: 0 });
  upstreamError = true;
  const failed = await request(cronHandler, { authorization: "Bearer test-cron-secret" });
  assert.equal(failed.statusCode, 502);
  assert.deepEqual(failed.body, { refreshed: 0, failed: 1 });
  assert.equal((await request()).body.stockHoldings[0].symbol, "LIVE1");
});
