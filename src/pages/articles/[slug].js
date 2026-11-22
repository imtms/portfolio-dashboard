import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ArticleShell from "../../components/Articles/ArticleShell";
import SeoHead from "../../components/Common/SeoHead";
import { getAllArticles, getArticleBySlug } from "../../lib/articles";
import { extractMarkdownHeadings, extractTextFromNode, slugifyHeading } from "../../lib/markdownHeadings";
import { absoluteUrl, siteName } from "../../lib/site";
import styles from "../../styles/Articles.module.css";

function formatDate(date) {
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}

function ReadingProgress({ slug }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frameId = null;
    const updateProgress = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const next = scrollable <= 0 ? 0 : Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100));
      setProgress(next);
    };
    const scheduleUpdate = () => {
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        updateProgress();
      });
    };
    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [slug]);

  return (
    <div className={styles.progressTrack} aria-hidden="true">
      <div className={styles.progressFill} style={{ width: `${progress}%` }} />
    </div>
  );
}

export default function Article({ article }) {
  const [activeId, setActiveId] = useState("");

  const headings = useMemo(() => extractMarkdownHeadings(article.content, { minLevel: 2, maxLevel: 3 }), [article.content]);

  const markdownComponents = useMemo(() => {
    const idByText = new Map();
    for (const item of headings) {
      if (!idByText.has(item.text)) idByText.set(item.text, item.id);
    }
    const resolveId = (children) => {
      const text = extractTextFromNode(children).trim();
      return idByText.get(text) || slugifyHeading(text);
    };
    return {
      h2: ({ children, ...props }) => <h2 id={resolveId(children)} {...props}>{children}</h2>,
      h3: ({ children, ...props }) => <h3 id={resolveId(children)} {...props}>{children}</h3>,
    };
  }, [headings]);

  useEffect(() => {
    if (!headings.length || typeof IntersectionObserver === "undefined") return undefined;
    const elements = headings.map((h) => document.getElementById(h.id)).filter(Boolean);
    if (!elements.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-88px 0px -70% 0px", threshold: 0 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  const path = `/articles/${article.slug}`;
  const publisher = { "@type": "Organization", name: siteName, url: absoluteUrl() };
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${absoluteUrl(path)}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(path) },
    headline: article.title,
    description: article.summary,
    datePublished: article.date,
    ...(article.updated ? { dateModified: article.updated } : {}),
    author: publisher,
    publisher,
    inLanguage: "zh-CN",
    keywords: article.tags,
  };

  const hasToc = headings.length >= 2;

  return (
    <ArticleShell>
      <SeoHead
        title={`${article.title} | ${siteName}`}
        description={article.summary}
        path={path}
        type="article"
        publishedTime={article.date}
        modifiedTime={article.updated}
        structuredData={structuredData}
      />

      <ReadingProgress slug={article.slug} />

      <main className={styles.articleShellLayout} id="top">
        <Link href="/articles" className={styles.backLink}>← 返回文章时间轴</Link>

        <div className={hasToc ? styles.articleBodyGrid : styles.articleBodyGridSingle}>
          <div className={styles.articleMain}>
            <article>
              <header className={styles.articleHeader}>
                <div className={styles.articleKicker}>
                  <span>{siteName}</span>
                  <span>·</span>
                  <time dateTime={article.date}>{formatDate(article.date)}</time>
                  <span>·</span>
                  <span>{article.readingMinutes} 分钟阅读</span>
                  {article.updated && article.updated !== article.date && (
                    <>
                      <span>·</span>
                      <span>更新于 <time dateTime={article.updated}>{formatDate(article.updated)}</time></span>
                    </>
                  )}
                </div>
                <h1>{article.title}</h1>
                <p>{article.summary}</p>
                {article.tags.length > 0 && (
                  <div className={styles.tags}>
                    {article.tags.map((tag) => <span key={tag}>{tag}</span>)}
                  </div>
                )}
              </header>

              {hasToc && (
                <details className={styles.mobileToc}>
                  <summary>文章目录 ({headings.length})</summary>
                  <ul className={styles.mobileTocList}>
                    {headings.map((item) => (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          className={`${styles.tocLink} ${item.level === 3 ? styles.tocLinkSub : ""}`}
                        >
                          {item.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              <div className={styles.articleDivider} />

              <div className={styles.markdown}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{article.content}</ReactMarkdown>
              </div>
            </article>

            <footer className={styles.articleFooter}>
              <span>END OF NOTE</span>
              <div className={styles.articleFooterActions}>
                <a href="#top">回到顶部 ↑</a>
                <Link href="/articles">浏览全部文章 →</Link>
              </div>
            </footer>
          </div>

          {hasToc && (
            <aside className={styles.articleToc} aria-label="文章目录">
              <p className={styles.tocTitle}>目录导航</p>
              <ul className={styles.tocList}>
                {headings.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className={`${styles.tocLink} ${item.level === 3 ? styles.tocLinkSub : ""} ${activeId === item.id ? styles.tocLinkActive : ""}`}
                    >
                      {item.text}
                    </a>
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>
      </main>
    </ArticleShell>
  );
}

export function getStaticPaths() {
  return { paths: getAllArticles().map(({ slug }) => ({ params: { slug } })), fallback: false };
}

export function getStaticProps({ params }) {
  const article = getArticleBySlug(params.slug);
  if (!article) return { notFound: true };
  return { props: { article } };
}
