import { getAllArticles } from "../lib/articles";
import { absoluteUrl } from "../lib/site";

function escapeXml(value) {
  return value.replace(/[<>&'\"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[character]);
}

export default function Sitemap() {
  return null;
}

export function getServerSideProps({ res }) {
  const pages = [
    { path: "/" },
    { path: "/articles" },
    ...getAllArticles().map((article) => ({ path: `/articles/${article.slug}`, updated: article.updated })),
  ];
  const entries = pages.map(({ path, updated }) => `  <url><loc>${escapeXml(absoluteUrl(path))}</loc>${updated ? `<lastmod>${updated}</lastmod>` : ""}</url>`);
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.end(sitemap);
  return { props: {} };
}
