import styles from "../../styles/Dashboard.module.css";

function SortIcon({ active, order }) {
  return (
    <svg className={styles.sortIcon} viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="m3 4.8 3-2.8 3 2.8"
        stroke={active && order === "asc" ? "var(--accent)" : "currentColor"}
        strokeWidth={active && order === "asc" ? "1.6" : "1.2"}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={active && order === "asc" ? 1 : 0.28}
      />
      <path
        d="m9 7.2-3 2.8-3-2.8"
        stroke={active && order === "desc" ? "var(--accent)" : "currentColor"}
        strokeWidth={active && order === "desc" ? "1.6" : "1.2"}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={active && order === "desc" ? 1 : 0.28}
      />
    </svg>
  );
}

export default function SortHeader({ column, children, numeric = false, sortBy, sortOrder, onSort }) {
  const isActive = sortBy === column;
  return (
    <th
      className={numeric ? styles.numeric : undefined}
      aria-sort={isActive ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        className={`${styles.sortButton} ${isActive ? styles.sortButtonActive : ""}`}
        onClick={() => onSort(column)}
      >
        {children}
        <SortIcon active={isActive} order={sortOrder} />
      </button>
    </th>
  );
}
