import { useId, useMemo, useState } from "react";
import Link from "next/link";
import ArticleShell from "../../components/Articles/ArticleShell";
import SeoHead from "../../components/Common/SeoHead";
import { getAllArticles } from "../../lib/articles";
import styles from "../../styles/Articles.module.css";

function formatDate(date) {
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}

export default function Articles({ articles }) {
  const searchId = useId();
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("");

  const topTags = useMemo(() => {
    const counts = new Map();
    for (const article of articles) {
      for (const tag of article.tags) {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"))
      .slice(0, 10);
  }, [articles]);

  const filteredArticles = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return articles.filter((article) => {
      if (activeTag && !article.tags.includes(activeTag)) return false;
      if (!normalized) return true;
      const haystack = `${article.title} ${article.summary} ${article.tags.join(" ")}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [articles, query, activeTag]);

  const isFiltering = Boolean(query.trim() || activeTag);

  return (
    <ArticleShell>
      <SeoHead title="分析文章 | TMs Portfolio" description="按时间整理的投资分析、财报复盘与组合研究文章。" path="/articles" />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>INVESTMENT NOTEBOOK</span>
            <h1 id="main-content" tabIndex={-1}>分析文章</h1>
            <p>保存判断形成的过程。按发布时间倒序整理财报复盘、组合观察与长期研究。</p>
          </div>
          <div className={styles.archiveStat}>
            <b>{String(articles.length).padStart(2, "0")}</b>
            <span>published notes</span>
          </div>
        </section>

        {articles.length > 0 && (
          <section className={styles.filterBar} aria-label="文章筛选">
            <div className={styles.filterTop}>
              <div className={styles.searchWrap}>
                <label htmlFor={searchId} className="visually-hidden">搜索分析文章</label>
                <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                  <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <input
                  id={searchId}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索标题、标的或关键词..."
                  className={styles.searchInput}
                />
                {query && (
                  <button type="button" onClick={() => setQuery("")} className={styles.clearSearch} aria-label="清空搜索">
                    ×
                  </button>
                )}
              </div>
              <span className={styles.filterCount} role="status">
                {isFiltering ? `匹配 ${filteredArticles.length} / ${articles.length}` : ""}
              </span>
            </div>

            {topTags.length > 0 && (
              <div className={styles.tagFilters} role="group" aria-label="按标签筛选">
                <button
                  type="button"
                  onClick={() => setActiveTag("")}
                  className={`${styles.tagButton} ${activeTag === "" ? styles.tagButtonActive : ""}`}
                  aria-pressed={activeTag === ""}
                >
                  全部
                </button>
                {topTags.map(([tag, count]) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setActiveTag((current) => (current === tag ? "" : tag))}
                    className={`${styles.tagButton} ${activeTag === tag ? styles.tagButtonActive : ""}`}
                    aria-pressed={activeTag === tag}
                  >
                    {tag}
                    <span className={styles.tagButtonCount}>{count}</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {filteredArticles.length ? (
          <section className={styles.timeline} aria-label="文章时间轴">
            {filteredArticles.map((article, index) => (
              <article className={styles.timelineEntry} key={article.slug}>
                <div className={styles.timelineDate}>
                  <time dateTime={article.date}>{formatDate(article.date)}</time>
                  <span>{String(filteredArticles.length - index).padStart(2, "0")}</span>
                </div>
                <span className={styles.timelineDot} aria-hidden="true" />
                <Link href={`/articles/${article.slug}`} className={styles.articleCard}>
                  <div className={styles.cardMeta}>
                    <span>{article.readingMinutes} MIN READ</span>
                    {article.tags.map((tag) => <em key={tag}>{tag}</em>)}
                  </div>
                  <h2>{article.title}</h2>
                  <p>{article.summary}</p>
                  <span className={styles.readMore}>阅读全文 <b aria-hidden="true">↗</b></span>
                </Link>
              </article>
            ))}
          </section>
        ) : articles.length > 0 ? (
          <section className={styles.emptyState}>
            <span>NO MATCHES</span>
            <h2>没有找到匹配的文章</h2>
            <p>试试换一个关键词或切换其他标签。</p>
            <button
              type="button"
              className={styles.resetButton}
              onClick={() => {
                setQuery("");
                setActiveTag("");
              }}
            >
              清空筛选条件
            </button>
          </section>
        ) : (
          <section className={styles.emptyState}>
            <span>NO NOTES YET</span>
            <h2>第一篇分析正在形成</h2>
            <p>在 content/articles 新建 Markdown 文件后，下一次构建会自动发布到这里。</p>
          </section>
        )}
      </main>
    </ArticleShell>
  );
}

export function getStaticProps() {
  const articles = getAllArticles().map(({ content, ...article }) => article);
  return { props: { articles } };
}
