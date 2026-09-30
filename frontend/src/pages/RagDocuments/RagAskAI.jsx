/*
 * TASK: T-23 — Frontend Ask AI
 *
 * TODO:
 * - Accept a question.
 * - Call ragService.queryDocument().
 * - Display the grounded answer and citations.
 */
import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import RagAnswerBody from '../../components/RagAnswerBody/RagAnswerBody.jsx';
import { ragService } from '../../services/rag/rag.service.js';
import styles from './RagDocuments.module.css';

/** Ask with AI: an answer grounded in this document, with its sources. */
export default function RagAskAI({ documentId }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || isAsking) {
      if (!trimmed) setError('Enter a question first.');
      return;
    }

    setIsAsking(true);
    setError('');
    try {
      const result = await ragService.queryDocument(documentId, trimmed);
      setAnswer(result.data || null);
    } catch (err) {
      setAnswer(null);
      setError(err.message);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className={`${styles.section} ${styles.sectionDivided}`}>
      <h2 className={styles.cardTitle}>Ask with AI</h2>
      <p className={styles.cardHint}>
        Answers use only retrieved excerpts from this PDF, with citations where
        possible. When the document includes code, the reply may show it in
        formatted blocks you can copy.
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <label htmlFor={`rag-ask-${documentId}`} className={styles.label}>
          Question
        </label>
        <textarea
          id={`rag-ask-${documentId}`}
          className={styles.textarea}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask a clear question in plain language. If the document does not cover it, the model should say so."
          rows={3}
          maxLength={1000}
          disabled={isAsking}
        />
        <div>
          <button type="submit" className={styles.primaryButton} disabled={isAsking}>
            {isAsking ? (
              <Loader2 size={15} className={styles.spin} aria-hidden />
            ) : (
              <Sparkles size={15} aria-hidden />
            )}
            {isAsking ? 'Asking…' : 'Ask'}
          </button>
        </div>
      </form>

      {error && (
        <p className={styles.errorBox} role="alert">
          {error}
        </p>
      )}

      {answer && (
        <div className={styles.answer}>
          <RagAnswerBody>{answer.answer}</RagAnswerBody>
          {answer.citations?.length > 0 && (
            <div className={styles.sources}>
              <span className={styles.sourcesLabel}>Sources</span>
              {answer.citations.map((citation) => (
                <span key={citation.ref} className={styles.sourceChip}>
                  [{citation.ref}] Chunk {citation.chunkIndex}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
