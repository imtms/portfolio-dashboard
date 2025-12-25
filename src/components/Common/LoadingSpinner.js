import styles from "../../styles/Dashboard.module.css";

export default function LoadingSpinner() {
    return (
        <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
        </div>
    );
}
