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
4. Run `npm run test:articles && npm run build`.

The build automatically sorts articles by date (newest first), adds the timeline card at /articles, and creates /articles/<filename-without-.md> for the full article. No JavaScript index needs to be edited.
