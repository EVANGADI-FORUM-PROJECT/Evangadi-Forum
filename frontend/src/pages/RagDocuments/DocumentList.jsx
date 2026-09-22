import styles from "./RagDocuments.module.css";
import DocumentListItem from "./DocumentListItem";
/** Decides what goes under the upload box: loading / empty / the rows. */

export default function DocumentList({
  documents,
  isLoading,
  selectedId,
  deletingId,
  onSelect,
  onDelete,
}) {
  if (isLoading) {
    return (
      <p className={styles.listMessage} role="status">
        Loading your library…
      </p>
    );
  }
    
  if (documents.length === 0) {
      return (
        <p className={styles.listMessage}></p>
         Your library is empty. Upload a PDF to index it 
         for search and Q&amp;A.
          </p>
           );
}
}