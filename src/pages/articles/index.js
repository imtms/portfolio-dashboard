import Head from "next/head";
import Link from "next/link";
import ArticleShell from "../../components/Articles/ArticleShell";
import { getAllArticles } from "../../lib/articles";
import styles from "../../styles/Articles.module.css";

function formatDate(date) {
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}

export default function Articles({ articles }) {
  return (
    <ArticleShell>
      <Head>
        <title>Analysis Articles | TMs Portfolio</title>
        <meta name="description" content="按时间整理的投资分析、财报复盘与组合研究文章。"/>
      </Head>
      <main className={styles.page}>
        <section className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>INVESTMENT NOTEBOOK</span>
            <h1>分析文章</h1>
            <p>保存判断形成的过程。按发布时间倒序整理财报复盘、组合观察与长期研究。</p>
          </div>
          <div className={styles.archiveStat}><b>{String(articles.length).padStart(2, "0")}</b><span>published notes</span></div>
        </section>

        {articles.length ? (
          <section className={styles.timeline} aria-label="文章时间轴">
            {articles.map((article, index) => (
              <article className={styles.timelineEntry} key={article.slug}>
                <div className={styles.timelineDate}>
                  <time dateTime={article.date}>{formatDate(article.date)}</time>
                  <span>{String(articles.length - index).padStart(2, "0")}</span>
                </div>
                <span className={styles.timelineDot} aria-hidden="true"/>
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
        ) : (
          <section className={styles.emptyState}><span>NO NOTES YET</span><h2>第一篇分析正在形成</h2><p>在 content/articles 新建 Markdown 文件后，下一次构建会自动发布到这里。</p></section>
        )}
      </main>
    </ArticleShell>
  );
}

export function getStaticProps() {
  const articles = getAllArticles().map(({ content, ...article }) => article);
  return { props: { articles } };
}
