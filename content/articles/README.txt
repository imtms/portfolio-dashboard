PUBLISHING AN ARTICLE

1. Add a Markdown file in this directory, for example `my-analysis.md`.
2. Include front matter at the top:

---
title: "文章标题"
date: "2026-08-06"
summary: "显示在时间轴上的简短摘要。"
tags:
  - 财报分析
  - 组合复盘
---

3. Write the Markdown body below the front matter.
4. Run the article checks and production build in the development container:

   docker compose -f compose.dev.yaml run --rm dev sh -c 'npm run test:articles && npm run build'

The build automatically sorts articles by date (newest first), adds the timeline card at /articles, and creates /articles/<filename-without-.md> for the full article. No JavaScript index needs to be edited.

SEO AND ARTICLE UPDATES

- Article HTML includes the complete body, a canonical URL, social sharing metadata, and Article structured data. The visible byline and structured author use the existing TMs Portfolio publishing brand.
- The production origin is maintained in src/lib/site.js. Canonical URLs, /robots.txt and /sitemap.xml all use it. The sitemap automatically includes the homepage, archive and every Markdown article.
- Keep the original date when revising an article. Add an optional `updated: "2026-11-17"` field with the actual revision date (YYYY-MM-DD, no earlier than date). It appears on the article, in structured data and as the sitemap lastmod. Without updated, no modification date is claimed. Do not change it just because a build ran.
- After deployment, verify the mengshi.de domain in Google Search Console, submit https://www.mengshi.de/sitemap.xml, then use URL Inspection on a representative article. Request indexing after the live test succeeds. Submission does not guarantee indexing or ranking.

After a successful build, check the production output without publishing it:

   docker compose -f compose.dev.yaml run -d --no-deps --name portfolio-seo-check dev npm run start -- --hostname 0.0.0.0
   docker exec portfolio-seo-check npm run test:seo
   docker rm -f portfolio-seo-check

Run the test after the server reports that it is ready. These checks inspect raw HTML and do not depend on browser JavaScript. Set SEO_TEST_URL to check another running server.
