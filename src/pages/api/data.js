import { getPortfolioData } from "../../lib/portfolioCache.js";

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  // Portfolio snapshots stay in the server cache; browsers and shared CDNs must recheck.
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const accountIds = String(req.query.accounts || "").split(",").map((id) => id.trim()).filter(Boolean);
  try {
    const data = await getPortfolioData(accountIds, { forceRefresh: req.method === "POST" });
    return res.status(200).json(data);
  } catch (error) {
    console.error("Portfolio request failed:", error.message);
    return res.status(502).json({ error: "Unable to update portfolio data. Please try again." });
  }
}
