import styles from "../../styles/Dashboard.module.css";

function SortIcon({ active, order }) {
  return (
    <svg className={styles.sortIcon} viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="m3 5 3-3 3 3M9 7 6 10 3 7"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={active ? 1 : 0.45}
      />
      {active && order === "asc" ? <path d="m3 5 3-3 3 3" stroke="currentColor" strokeWidth="1.5" /> : null}
      {active && order === "desc" ? <path d="m9 7-3 3-3-3" stroke="currentColor" strokeWidth="1.5" /> : null}
    </svg>
  );
}

export default function SortHeader({ column, children, numeric = false, sortBy, sortOrder, onSort }) {
  return (
    <th
      className={numeric ? styles.numeric : undefined}
      aria-sort={sortBy === column ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
    >
      <button type="button" className={styles.sortButton} onClick={() => onSort(column)}>
        {children}
        <SortIcon active={sortBy === column} order={sortOrder} />
      </button>
    </th>
  );
}
