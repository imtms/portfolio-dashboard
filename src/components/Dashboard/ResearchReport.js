import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import report from "../../content/portfolioReport";
import styles from "../../styles/Dashboard.module.css";

export default function ResearchReport() {
  return (
    <article className={styles.researchReport}>
      <header className={styles.researchHeader}>
        <div>
          <span className={styles.panelLabel}>Research note / 15 Nov 2026</span>
          <h1 className={styles.researchTitle}>Portfolio weekly research</h1>
          <p className={styles.researchDescription}>9–15 Nov: major holdings events, macro developments, portfolio impact, and what to verify next.</p>
        </div>
        <div className={styles.researchMeta}>
          <span>Research cut-off</span>
          <strong>2026-11-15 04:18 UTC</strong>
        </div>
      </header>
      <div className={styles.reportBody}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
      </div>
    </article>
  );
}
