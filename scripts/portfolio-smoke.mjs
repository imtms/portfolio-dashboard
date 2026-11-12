import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium, expect } from "@playwright/test";

const baseUrl = process.env.PORTFOLIO_TEST_URL || "http://localhost:3000";
const screenshotDir = process.env.PORTFOLIO_SCREENSHOT_DIR;
if (screenshotDir) await fs.mkdir(screenshotDir, { recursive: true });
const browser = await chromium.launch();
const requests = [];
const consoleErrors = [];
let version = 0;
let failNext = false;
let releaseRefresh;
let refreshGate;
let staleNext = false;
let releaseAccount;
let accountGate;

function snapshot(accountIds, isStale = false) {
  return {
    accounts: [{ id: "a", name: "Long-term portfolio" }, { id: "b", name: "Trading account" }],
    selectedAccountIds: accountIds.length > 0 ? accountIds : ["a", "b"],
    stockHoldings: [{ symbol: "BRK.B", name: "Berkshire Hathaway", netPerformancePercent: 0.18, allocationInPercentage: 0.65 }],
    currencyHoldings: [{ currency: "USD", percentage: 100 }],
    chart: [
      { date: "2026-11-01", netPerformanceInPercentage: 1 },
      { date: "2026-11-05", netPerformanceInPercentage: 8 },
      { date: "2026-11-12", netPerformanceInPercentage: 12.42 + version },
    ],
    updatedAt: new Date(Date.now() - (isStale ? 60 * 60 * 1000 : 0)).toISOString(),
    isStale,
  };
}

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => {
    localStorage.setItem("selectedAccountIds", JSON.stringify(["b"]));
    localStorage.setItem("portfolio-theme", "light");
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  await page.route("**/api/data*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const ids = (url.searchParams.get("accounts") || "").split(",").filter(Boolean);
    requests.push({ method: request.method(), ids });
    if (ids.join(",") === "a" && accountGate) await accountGate;
    if (request.method() === "POST") {
      if (refreshGate) await refreshGate;
      if (failNext) {
        failNext = false;
        return route.fulfill({ status: 502, json: { error: "Upstream unavailable" } });
      }
      ++version;
    }
    const stale = staleNext;
    staleNext = false;
    await route.fulfill({ json: snapshot(ids, stale) });
  });

  await page.goto(baseUrl);
  const summary = page.getByLabel("Portfolio summary");
  const refresh = page.getByRole("button", { name: "Refresh portfolio data" });
  const account = page.getByRole("combobox", { name: "Select portfolio account" });
  await expect(summary.getByText("+12.42%", { exact: true })).toBeVisible();
  await expect(account).toHaveValue("b");
  await page.waitForTimeout(250);
  assert.equal(requests.length, 1, "saved account must be loaded in a single request");
  assert.deepEqual(requests[0], { method: "GET", ids: ["b"] });

  refreshGate = new Promise((resolve) => { releaseRefresh = resolve; });
  await refresh.click();
  await expect(refresh).toBeDisabled();
  await expect(refresh).toHaveAttribute("aria-busy", "true");
  await expect(summary.getByText("+12.42%", { exact: true })).toBeVisible();
  releaseRefresh();
  refreshGate = null;
  await expect(summary.getByText("+13.42%", { exact: true })).toBeVisible();
  await expect(refresh).toBeEnabled();
  assert.deepEqual(requests[1], { method: "POST", ids: ["b"] });

  failNext = true;
  await refresh.click();
  await expect(page.locator("main").getByRole("alert")).toContainText("Showing the last loaded data");
  await expect(summary.getByText("+13.42%", { exact: true })).toBeVisible();
  await expect(refresh).toBeEnabled();
  await refresh.click();
  await expect(page.locator("main").getByRole("alert")).toHaveCount(0);
  await expect(summary.getByText("+14.42%", { exact: true })).toBeVisible();

  accountGate = new Promise((resolve) => { releaseAccount = resolve; });
  await account.selectOption("a");
  await expect.poll(() => requests.at(-1).ids.join(",")).toBe("a");
  await account.selectOption("b");
  await expect(summary.getByText("+14.42%", { exact: true })).toBeVisible();
  await expect(refresh).toBeEnabled();
  releaseAccount();
  accountGate = null;
  await page.waitForTimeout(150);
  await expect(account).toHaveValue("b");

  const beforeReload = requests.length;
  await page.reload();
  await expect(summary.getByText("+14.42%", { exact: true })).toBeVisible();
  await page.waitForTimeout(250);
  assert.equal(requests.length, beforeReload + 1);

  staleNext = true;
  await page.reload();
  await expect(page.locator("time")).toContainText("Cached");
  ++version;
  await expect(summary.getByText("+15.42%", { exact: true })).toBeVisible({ timeout: 10000 });
  await expect(page.locator("time")).toContainText("Updated");

  for (const width of [1440, 1024, 768, 375, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const theme of ["light", "dark"]) {
      if (await page.locator("html").getAttribute("data-theme") !== theme) {
        await page.getByRole("button", { name: theme === "dark" ? "Use dark theme" : "Use light theme" }).click();
      }
      await expect(refresh).toBeVisible();
      await expect(account).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      assert.equal(overflow, false, `horizontal overflow at ${width}px in ${theme} theme`);
      if (screenshotDir && [1440, 375, 320].includes(width)) {
        // Let the existing chart's 550ms canvas animation settle before visual review.
        await page.waitForTimeout(650);
        await page.screenshot({ path: path.join(screenshotDir, `portfolio-${width}-${theme}.png`), fullPage: true, animations: "disabled" });
      }
    }
  }

  assert.deepEqual(consoleErrors, [], "browser must not report runtime errors");
  console.log("Portfolio browser checks passed: single initial request, forced refresh, failure recovery, account race, stale recovery, light/dark and mobile layouts.");
} finally {
  releaseRefresh?.();
  releaseAccount?.();
  await browser.close();
}
