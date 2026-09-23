/*
 * TASK: Frontend RAG Document Status
 *
 * TODO [T-24]: Render a status badge for processing/ready/failed states.
 */

import styles from './RagDocuments.module.css';

/**
 * Small pill showing a document's status.
 * Falls back to the "processing" look for any status that doesn't have its
 * own class (e.g. "pending"), same as the inline version did.
 */
export default function StatusBadge({ status }) {
  const variant = styles[`badge_${status}`] || styles.badge_processing;
  return <span className={`${styles.badge} ${variant}`}>{status}</span>;
}
