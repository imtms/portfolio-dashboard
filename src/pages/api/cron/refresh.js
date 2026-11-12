import { getPortfolioData } from "../../../lib/portfolioCache.js";
import { getAvailableAccounts, selectAccountIds } from "../../../lib/portfolioData.js";

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Warm the combined portfolio and every selectable individual account.
  const scopes = new Map();
  for (const ids of [[], ...getAvailableAccounts().map((account) => [account.id])]) {
    const selected = selectAccountIds(ids);
    scopes.set(JSON.stringify(selected), selected);
  }
  const results = await Promise.allSettled([...scopes.values()].map((ids) =>
    getPortfolioData(ids, { forceRefresh: true })
  ));
  const failed = results.filter((result) => result.status === "rejected");
  failed.forEach((result) => console.error("Scheduled portfolio refresh failed:", result.reason.message));
  return res.status(failed.length > 0 ? 502 : 200).json({
    refreshed: results.length - failed.length,
    failed: failed.length,
  });
}
