import styles from "../../styles/Dashboard.module.css";

export default function LoadingSpinner() {
  return (
    <div className={styles.loadingContainer}>
      <progress className={styles.loadingSpinner} aria-label="Syncing portfolio data" />
      <span className={styles.loadingLabel} aria-hidden="true">Syncing portfolio data</span>
    </div>
  );
}
