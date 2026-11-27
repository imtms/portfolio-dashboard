import styles from "../../styles/Dashboard.module.css";

function SortIcon() {
  return (
    <svg className={styles.sortIcon} viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        className={styles.sortArrowAsc}
        d="m3 4.8 3-2.8 3 2.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        className={styles.sortArrowDesc}
        d="m9 7.2-3 2.8-3-2.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SortHeader({ column, children, numeric = false, sortBy, sortOrder, onSort }) {
  const isActive = sortBy === column;
  const ariaSort = isActive ? (sortOrder === "asc" ? "ascending" : "descending") : undefined;

  return (
    <th
      scope="col"
      className={numeric ? styles.numeric : undefined}
      aria-sort={ariaSort}
    >
      <button
        type="button"
        className={`${styles.sortButton} ${numeric ? styles.sortButtonNumeric : ""}`}
        onClick={() => onSort(column)}
      >
        {children}
        <SortIcon />
      </button>
    </th>
  );
}
