import { Loader2, Trash2 } from "lucide-react";
import styles from "./RagDocuments.module.css";
import StatusBadge from "./StatusBadge";
/** One row in the library: select button + delete button. */
export default function DocumentListItem({
  doc,
  isActive,
  isDeleting,
  onSelect,
  onDelete,
}) {
  return (
    <li className={`${styles.docItem} ${isActive ? styles.docItemActive : ""}`}>
      <button
        type="button"
        className={styles.docSelect}
        onClick={() => onSelect(doc.document_id)}
        aria-pressed={isActive}
      >
        <span className={styles.docTitle} title={doc.title}>
          {doc.title}
        </span>
        <StatusBadge status={doc.status} />
      </button>
      <button
        type="button"
        className={styles.deleteButton}
        onClick={() => onDelete(doc)}
        disabled={isDeleting}
        aria-label={`Delete ${doc.title}`}
        title="Delete document"
      >
        {isDeleting ? (
          <Loader2 size={14} className={styles.spin} aria-hidden />
        ) : (
          <Trash2 size={14} aria-hidden />
        )}
      </button>
    </li>
  );
}
