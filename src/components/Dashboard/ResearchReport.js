import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import report from "../../content/portfolioReport";
import { extractMarkdownHeadings, extractTextFromNode, slugifyHeading } from "../../lib/markdownHeadings";
import styles from "../../styles/Dashboard.module.css";

export default function ResearchReport() {
  const headings = useMemo(() => extractMarkdownHeadings(report, { minLevel: 2, maxLevel: 2 }), []);

  const markdownComponents = useMemo(() => {
    const idByText = new Map();
    for (const item of headings) {
      if (!idByText.has(item.text)) idByText.set(item.text, item.id);
    }
    return {
      h2: ({ children, ...props }) => {
        const text = extractTextFromNode(children).trim();
        const id = idByText.get(text) || slugifyHeading(text);
        return <h2 id={id} {...props}>{children}</h2>;
      },
    };
  }, [headings]);

  return (
    <article className={styles.researchReport}>
      <header className={styles.researchHeader}>
        <div>
          <span className={styles.panelLabel}>Research note / 21 Nov 2026</span>
          <h1 className={styles.researchTitle}>Portfolio weekly research</h1>
          <p className={styles.researchDescription}>16–21 Nov: earnings, regulatory developments, macro shifts, and their impact on current holdings.</p>
        </div>
        <div className={styles.researchMeta}>
          <span>Research cut-off</span>
          <strong>2026-11-21 03:51 UTC</strong>
        </div>
      </header>

      {headings.length > 0 && (
        <details className={styles.mobileToc}>
          <summary>Jump to section ({headings.length})</summary>
          <ul className={styles.mobileTocList}>
            {headings.map((item) => (
              <li key={item.id}>
                <a className={styles.tocLink} href={`#${item.id}`}>{item.text}</a>
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className={styles.researchGrid}>
        <div className={styles.reportBody}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{report}</ReactMarkdown>
        </div>

        {headings.length > 0 && (
          <aside className={styles.researchToc} aria-label="Report sections">
            <p className={styles.tocTitle}>On this report</p>
            <ul className={styles.tocList}>
              {headings.map((item) => (
                <li key={item.id}>
                  <a className={styles.tocLink} href={`#${item.id}`}>{item.text}</a>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </article>
  );
}
