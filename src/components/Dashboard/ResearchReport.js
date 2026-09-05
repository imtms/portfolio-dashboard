import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import report from "../../content/portfolioReport";
import styles from "../../styles/Dashboard.module.css";

export default function ResearchReport() {
  return (
    <article className={styles.researchReport}>
      <header className={styles.researchHeader}>
        <div>
          <span className={styles.panelLabel}>Research note / 05 Sep 2026</span>
          <h1 className={styles.researchTitle}>Portfolio latest results</h1>
          <p className={styles.researchDescription}>A fundamentals-led review of the latest reported results, fund exposures, and portfolio concentration risks.</p>
        </div>
        <div className={styles.researchMeta}>
          <span>Data cut-off</span>
          <strong>2026-09-05 02:50 UTC</strong>
        </div>
      </header>
      <div className={styles.reportBody}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
      </div>
    </article>
  );
}
