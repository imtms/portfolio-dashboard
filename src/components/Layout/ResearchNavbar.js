import Link from "next/link";
import styles from "../../styles/Research.module.css";

function ThemeIcon({ darkMode }) {
  return darkMode
    ? <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
    : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.4 14.8A8.5 8.5 0 0 1 9.2 3.6a8.5 8.5 0 1 0 11.2 11.2Z"/></svg>;
}

export default function ResearchNavbar({ darkMode, onTheme, onExport }) {
  return <header className={styles.topbar}>
    <div className={styles.topbarInner}>
      <Link href="/" className={styles.brand}><span className={styles.brandMark}/><span><b>TMs Portfolio</b><small>Research operating system</small></span></Link>
      <nav className={styles.productNav} aria-label="Product navigation"><Link href="/">Portfolio</Link><Link href="/articles">Articles</Link><Link className={styles.activeNav} href="/research">Research</Link></nav>
      <div className={styles.topActions}><button onClick={onExport} className={styles.textButton}>Export JSON</button><button onClick={onTheme} className={styles.iconButton} aria-label="Toggle theme"><ThemeIcon darkMode={darkMode}/></button></div>
    </div>
  </header>;
}
