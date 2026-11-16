import assert from "node:assert/strict";
import { getAllArticles } from "../src/lib/articles.js";
import { absoluteUrl, siteName } from "../src/lib/site.js";

const baseUrl = process.env.SEO_TEST_URL || "http://127.0.0.1:3000";
const articles = getAllArticles();
assert.ok(articles.length > 0, "SEO checks require at least one article");

async function request(path, contentType) {
  const response = await fetch(new URL(path, baseUrl), { redirect: "manual" });
  assert.equal(response.status, 200, `${path} must return 200 without a redirect`);
  assert.ok(response.headers.get("content-type")?.includes(contentType), `${path} must return ${contentType}`);
  assert.doesNotMatch(response.headers.get("x-robots-tag") || "", /noindex/i, `${path} must allow indexing`);
  return response.text();
}

function checkHead(html, path, type = "website") {
  const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1];
  assert.ok(head, `${path} must include a server-rendered head`);
  const canonical = [...head.matchAll(/<link\b[^>]*rel="canonical"[^>]*>/g)];
  assert.equal(canonical.length, 1, `${path} must have exactly one canonical`);
  assert.ok(canonical[0][0].includes(`href="${absoluteUrl(path)}"`), `${path} canonical must use the production URL`);
  assert.match(head, /<title[^>]*>[^<]+<\/title>/);
  assert.match(head, /<meta name="description" content="[^"]+"/);
  assert.ok(head.includes(`<meta property="og:url" content="${absoluteUrl(path)}"`));
  assert.ok(head.includes(`<meta property="og:type" content="${type}"`));
  assert.match(head, /<meta name="twitter:card" content="summary"/);
  assert.doesNotMatch(head, /<meta\b[^>]*name="(?:robots|googlebot)"[^>]*content="[^"]*noindex/i);
}

const [robots, sitemap, home, archive] = await Promise.all([
  request("/robots.txt", "text/plain"),
  request("/sitemap.xml", "application/xml"),
  request("/", "text/html"),
  request("/articles", "text/html"),
]);
assert.match(robots, /^User-agent: \*$/m);
assert.match(robots, /^Allow: \/$/m);
assert.doesNotMatch(robots, /^Disallow:\s*\/$/m);
assert.ok(robots.includes(`Sitemap: ${absoluteUrl("/sitemap.xml")}`));
assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
assert.match(sitemap, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
const entries = [...sitemap.matchAll(/<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?<\/url>/g)];
const expectedPaths = ["/", "/articles", ...articles.map(({ slug }) => `/articles/${slug}`)];
assert.deepEqual(entries.map((entry) => entry[1]).sort(), expectedPaths.map(absoluteUrl).sort(), "sitemap must list all public pages exactly once");
for (const article of articles) {
  const entry = entries.find((item) => item[1] === absoluteUrl(`/articles/${article.slug}`));
  assert.equal(entry[2], article.updated || undefined, "lastmod must come from an explicit article update");
}
checkHead(home, "/");
checkHead(archive, "/articles");
assert.match(home, /<html lang="en">/);
assert.match(archive, /<html lang="zh-CN">/);

await Promise.all(articles.map(async (article) => {
  const path = `/articles/${article.slug}`;
  const html = await request(path, "text/html");
  checkHead(html, path, "article");
  assert.match(html, /<html lang="zh-CN">/);
  const jsonLd = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  assert.equal(jsonLd.length, 1, `${path} must have one Article structured data block`);
  const data = JSON.parse(jsonLd[0][1]);
  assert.equal(data["@context"], "https://schema.org");
  assert.equal(data["@type"], "Article");
  assert.equal(data.headline, article.title);
  assert.equal(data.description, article.summary);
  assert.equal(data.mainEntityOfPage["@id"], absoluteUrl(path));
  assert.equal(data.datePublished, article.date);
  assert.equal(data.dateModified, article.updated || undefined);
  assert.equal(data.author.name, siteName);
  assert.equal(data.publisher.name, siteName);
  assert.deepEqual(data.keywords, article.tags);

  const rendered = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  const body = rendered.match(/<article>([\s\S]*?)<\/article>/)?.[1];
  assert.ok(body?.length > 1000, `${path} must include the article body without JavaScript`);
  const content = body.match(/<div class="[^"]*markdown[^"]*">([\s\S]*)<\/div>/)?.[1];
  assert.ok(content?.replace(/<[^>]*>/g, "").trim().length > 500, `${path} must include substantial rendered Markdown content`);
  assert.ok(body.includes(siteName), `${path} must display its publishing brand`);
  assert.ok(archive.includes(`href="${path}"`), `${path} must be linked from the archive`);
  if (article.updated) assert.ok(body.includes(`dateTime="${article.updated}"`));
}));

const firstPath = `/articles/${articles[0].slug}`;
checkHead(await request(`${firstPath}?utm_source=seo-check`, "text/html"), firstPath, "article");
const missing = await fetch(new URL("/articles/seo-check-nonexistent-article", baseUrl), { redirect: "manual" });
assert.equal(missing.status, 404, "unknown articles must return a real 404");
console.log(`SEO checks passed: robots, ${entries.length} sitemap URLs, and ${articles.length} complete static articles with canonical URLs and Article structured data.`);
