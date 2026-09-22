/*
 * MILESTONE 3 — RAG FRONTEND SERVICE
 *
 * TASKS:
 * T-22 — Upload PDF
 * T-24 — List / Delete / Fetch PDF
 * T-23 — Semantic Search / Ask AI
 *
 * TODO: Implement these API calls using the project's apiClient.
 * Reference: M-3/Front end/rag-documents/task-rag-documents.md
 */ 
import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { ragService } from '../../services/rag/rag.service.js';
import styles from './RagDocuments.module.css';

/** Semantic search: ranked excerpts with similarity scores. */
export default function RagSearch({ documentId }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');


const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || isSearching) {
      if (!trimmed) setError('Enter something to search for.');
      return;
    }

    setIsSearching(true);
    setError('');
    try {
      const result = await ragService.searchInDocument(documentId, trimmed);
      setResults(result.data?.results || []);
    } catch (err) {
      setResults(null);
      setError(err.message);
    } finally {
      setIsSearching(false);
    }
  };
 return (
    <div className={`${styles.section} ${styles.sectionDivided}`}>
      <h2 className={styles.cardTitle}>Semantic search</h2>
      <p className={styles.cardHint}>
        Finds passages by meaning (embeddings), not only exact keywords.
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <label htmlFor={`rag-search-${documentId}`} className={styles.label}>
          Search query
        </label>
        <input
          id={`rag-search-${documentId}`}
          type="text"
          className={styles.input}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Describe the topic or phrase you are looking for"
          maxLength={500}
          disabled={isSearching}
        />
        <div>
          <button type="submit" className={styles.primaryButton} disabled={isSearching}>
            {isSearching ? (
              <Loader2 size={15} className={styles.spin} aria-hidden />
            ) : (
              <Sparkles size={15} aria-hidden />
            )}
            {isSearching ? 'Searching…' : 'Search'}
          </button>
        </div>
      </form>
    </div>





      {error && (
        <p className={styles.errorBox} role="alert">
          {error}
        </p>
      )}

      {results && results.length === 0 && (
        <p className={styles.emptyResults}>
          No matching passages found. Try describing the topic in different words.
        </p>
      )}

      {results && results.length > 0 && (
        <ol className={styles.results}>
          {results.map((result) => (
            <li key={result.chunkId} className={styles.result}>
              <div className={styles.resultHeader}>
                <span className={styles.resultChunk}>Chunk {result.chunkIndex}</span>
                <span className={styles.resultScore}>
                  {Math.round(result.score * 100)}% match
                </span>
              </div>
              <p className={styles.excerpt}>{result.excerpt}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}







  };

  
