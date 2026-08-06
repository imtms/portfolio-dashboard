import Link from "next/link";
import styles from "../../styles/Dashboard.module.css";

function AccountIcon() {
  return (
    <svg className={styles.accountIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7.5h16M6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11A2.5 2.5 0 0 1 6.5 4Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 12h3M8 15.5h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ThemeIcon({ darkMode }) {
  if (darkMode) {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20.4 14.8A8.5 8.5 0 0 1 9.2 3.6 8.5 8.5 0 1 0 20.4 14.8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

export default function Navbar({ accounts, selectedAccountIds, onSelectAccounts, darkMode, toggleDarkMode }) {
  const selectedValue = selectedAccountIds?.length === 1 ? selectedAccountIds[0] : "all";

  return (
    <header className={styles.navbar}>
      <div className={styles.navbarInner}>
        <Link href="/" className={styles.brand} aria-label="TMs Portfolio home">
          <span className={styles.brandMark} aria-hidden="true" />
          <span>
            <span className={styles.brandName}>TMs Portfolio</span>
            <span className={styles.brandMeta}>Private wealth console</span>
          </span>
        </Link>

        <div className={styles.navbarActions}>
          <Link href="/articles" className={styles.researchNavLink}>Articles</Link>
          <Link href="/research" className={styles.researchNavLink}>Research monitor</Link>
          {accounts?.length > 0 && (
            <label className={styles.accountField}>
              <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Account</span>
              <AccountIcon />
              <select
                className={styles.accountSelect}
                value={selectedValue}
                onChange={(event) => {
                  const value = event.target.value;
                  onSelectAccounts(value === "all" ? accounts.map((account) => account.id) : [value]);
                }}
                aria-label="Select portfolio account"
              >
                <option value="all">All accounts</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>{account.name}</option>
                ))}
              </select>
            </label>
          )}

          <button
            type="button"
            className={styles.iconButton}
            onClick={toggleDarkMode}
            aria-label={darkMode ? "Use light theme" : "Use dark theme"}
            title={darkMode ? "Use light theme" : "Use dark theme"}
          >
            <ThemeIcon darkMode={darkMode} />
          </button>
        </div>
      </div>
    </header>
  );
}
