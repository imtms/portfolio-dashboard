import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import report from "../../content/portfolioReport";
import styles from "../../styles/Dashboard.module.css";

export default function ResearchReport() {
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
      <div className={styles.reportBody}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
      </div>
    </article>
  );
}
