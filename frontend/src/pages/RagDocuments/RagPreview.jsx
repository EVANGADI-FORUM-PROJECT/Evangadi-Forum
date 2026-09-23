/*
 * TASK: T-24 — Frontend PDF Preview
 *
 * TODO:
 * - Fetch the authenticated PDF through ragService.fetchPdfObjectUrl().
 * - Render it in an iframe.
 * - Revoke the Blob URL during cleanup.
 */
import { useEffect, useState } from 'react';
import { ragService } from '../../services/rag/rag.service.js';
import styles from './RagDocuments.module.css';

/** Inline PDF preview. The blob URL is revoked when the panel unmounts. */
export default function RagPreview({ documentId, title }) {
  const [objectUrl, setObjectUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let createdUrl = '';

    ragService
      .fetchPdfObjectUrl(documentId)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        createdUrl = url;
        setObjectUrl(url);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [documentId]);

  return (
    <div className={styles.section}>
      <h2 className={styles.cardTitle}>Reader</h2>
      <p className={styles.cardHint}>Inline preview of the selected PDF.</p>

      <div className={styles.reader}>
        {isLoading && (
          <p className={styles.readerMessage} role="status">
            Loading document preview…
          </p>
        )}
        {error && (
          <p className={styles.readerError} role="alert">
            {error}
          </p>
        )}
        {objectUrl && (
          <iframe src={objectUrl} title={`PDF preview: ${title}`} className={styles.frame} />
        )}
      </div>
    </div>
  );
}

