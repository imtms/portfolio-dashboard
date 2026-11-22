import Link from "next/link";
import styles from "../../styles/Navbar.module.css";

function AccountIcon() {
  return (
    <svg className={styles.accountIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7.5h16M6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11A2.5 2.5 0 0 1 6.5 4Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 12h3M8 15.5h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ThemeIcon({ darkMode }) {
  return darkMode
    ? <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
    : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.4 14.8A8.5 8.5 0 0 1 9.2 3.6a8.5 8.5 0 1 0 11.2 11.2Z" /></svg>;
}

export default function Navbar({
  activeSection = "portfolio",
  accounts = [],
  selectedAccountIds = [],
  onSelectAccounts,
  darkMode,
  toggleDarkMode,
  onRefresh,
  isRefreshing = false,
  refreshDisabled = false,
  updatedAt,
  isStale = false,
}) {
  const selectedValue = selectedAccountIds.length === 1 ? selectedAccountIds[0] : "all";

  return (
    <header className={styles.topbar}>
      <div className={styles.topbarInner}>
        <Link href="/" className={styles.brand} aria-label="TMs Portfolio home">
          <span className={styles.brandMark} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className={styles.brandText}>
            <b>TMs Portfolio</b>
            <small>Wealth console</small>
          </span>
        </Link>

        <nav className={styles.productNav} aria-label="Product navigation">
          <Link className={activeSection === "portfolio" ? styles.activeNav : ""} href="/" aria-current={activeSection === "portfolio" ? "page" : undefined}>
            Portfolio
          </Link>
          <Link className={activeSection === "articles" ? styles.activeNav : ""} href="/articles" aria-current={activeSection === "articles" ? "page" : undefined}>
            Articles
          </Link>
          <a href="https://assets.mengshi.de/" target="_blank" rel="noopener noreferrer">
            Assets <span className={styles.externalArrow} aria-hidden="true">↗</span>
          </a>
          <a href="https://xh.tms.im" target="_blank" rel="noopener noreferrer">
            Analysis <span className={styles.externalArrow} aria-hidden="true">↗</span>
          </a>
        </nav>

        <div className={styles.navActions}>
          {accounts.length > 0 && onSelectAccounts && (
            <label className={styles.accountField}>
              <span className={styles.visuallyHidden}>Account</span>
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
                {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
              </select>
            </label>
          )}

          {onRefresh && (
            <>
              {updatedAt && (
                <span className={styles.statusText}>
                  <span className={`${styles.statusDot} ${isStale ? styles.statusDotStale : ""}`} aria-hidden="true" />
                  <time dateTime={updatedAt} title={`Last successful refresh: ${new Date(updatedAt).toLocaleString()}`}>
                    {isStale ? "Cached" : "Updated"} {new Date(updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
                  </time>
                </span>
              )}
              <button
                type="button"
                onClick={() => onRefresh()}
                className={`${styles.iconButton} ${styles.refreshButton}`}
                disabled={refreshDisabled || isRefreshing}
                aria-label="Refresh portfolio data"
                aria-busy={isRefreshing}
                title="Fetch the latest portfolio data"
              >
                <svg className={isRefreshing ? styles.refreshing : ""} viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 7v5h-5M4 17v-5h5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M6.1 7a7 7 0 0 1 11.6-1L20 9M4 15l2.3 3A7 7 0 0 0 17.9 17" strokeLinecap="round" />
                </svg>
                <span className={styles.refreshLabel}>{isRefreshing ? "Syncing" : "Refresh"}</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={toggleDarkMode}
            className={styles.iconButton}
            aria-label={darkMode ? "Use light theme" : "Use dark theme"}
            title={darkMode ? "Switch to light theme" : "Switch to dark theme"}
          >
            <ThemeIcon darkMode={darkMode} />
          </button>
        </div>
      </div>
    </header>
  );
}
