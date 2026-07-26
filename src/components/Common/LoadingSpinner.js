import styles from "../../styles/Dashboard.module.css";

export default function LoadingSpinner() {
  return (
    <div className={styles.loadingContainer} role="status" aria-live="polite">
      <div className={styles.loadingBars} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <span className={styles.loadingLabel}>Syncing portfolio data</span>
    </div>
  );
}
