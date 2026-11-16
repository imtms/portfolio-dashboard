import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ArticleShell from "../../components/Articles/ArticleShell";
import SeoHead from "../../components/Common/SeoHead";
import { getAllArticles, getArticleBySlug } from "../../lib/articles";
import { absoluteUrl, siteName } from "../../lib/site";
import styles from "../../styles/Articles.module.css";

function formatDate(date) {
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}

export default function Article({ article }) {
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
      <main className={styles.articlePage}>
        <Link href="/articles" className={styles.backLink}>← 返回文章时间轴</Link>
        <article>
          <header className={styles.articleHeader}>
            <div className={styles.articleKicker}><span>{siteName}</span><span>·</span><time dateTime={article.date}>{formatDate(article.date)}</time><span>·</span><span>{article.readingMinutes} 分钟阅读</span>{article.updated && article.updated !== article.date && <><span>·</span><span>更新于 <time dateTime={article.updated}>{formatDate(article.updated)}</time></span></>}</div>
            <h1>{article.title}</h1>
            <p>{article.summary}</p>
            {article.tags.length > 0 && <div className={styles.tags}>{article.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
          </header>
          <div className={styles.articleDivider}><span/></div>
          <div className={styles.markdown}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.content}</ReactMarkdown>
          </div>
        </article>
        <footer className={styles.articleFooter}>
          <span>END OF NOTE</span>
          <Link href="/articles">浏览全部文章 →</Link>
        </footer>
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
