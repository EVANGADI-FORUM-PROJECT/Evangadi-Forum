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
    <li
      className={`${styles.docItem} ${isActive ? styles.docItemActive : ""}`}
    ></li>
  );
}
