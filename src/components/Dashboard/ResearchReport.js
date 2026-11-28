import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import report from "../../content/portfolioReport";
import { extractMarkdownHeadings, extractTextFromNode, slugifyHeading } from "../../lib/markdownHeadings";
import styles from "../../styles/Dashboard.module.css";

export default function ResearchReport() {
  const [activeId, setActiveId] = useState("");
  const mobileTocRef = useRef(null);
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
        return <h2 id={id} tabIndex={-1} {...props}>{children}</h2>;
      },
      table: ({ children, ...props }) => (
        <div className={styles.tableScroll} tabIndex={0} role="region" aria-label="Research data table">
          <table {...props}>{children}</table>
        </div>
      ),
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

  const closeMobileToc = () => {
    if (mobileTocRef.current) mobileTocRef.current.open = false;
  };

  return (
    <article className={styles.researchReport}>
      <header className={styles.researchHeader}>
        <div>
          <span className={styles.panelLabel}>Research note / 28 Nov 2026</span>
          <h2 className={styles.researchTitle}>Portfolio weekly research</h2>
          <p className={styles.researchDescription}>23–28 Nov: AI governance, dividends and reinvestment, and how trade policy and economic data affect 26 holdings.</p>
        </div>
        <div className={styles.researchMeta}>
          <span>Research cut-off</span>
          <strong>2026-11-28 04:23 UTC</strong>
        </div>
      </header>

      {headings.length > 0 && (
        <details ref={mobileTocRef} className={styles.mobileToc}>
          <summary>Jump to section ({headings.length})</summary>
          <ul className={styles.mobileTocList}>
            {headings.map((item) => (
              <li key={item.id}>
                <a className={styles.tocLink} href={`#${item.id}`} onClick={closeMobileToc}>
                  {item.text}
                </a>
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
          <nav className={styles.researchToc} aria-label="On this report">
            <p className={styles.tocTitle}>On this report</p>
            <ul className={styles.tocList}>
              {headings.map((item) => (
                <li key={item.id}>
                  <a
                    className={styles.tocLink}
                    href={`#${item.id}`}
                    aria-current={activeId === item.id ? "true" : undefined}
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </article>
  );
}
