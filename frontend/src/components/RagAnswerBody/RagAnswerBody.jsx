/*
 * TASK: T-23 — Frontend RAG Answer Rendering
 *
 * TODO: Render the AI-generated answer as readable Markdown, including
 * code blocks and any citation/source presentation required by the design.
 */
/**
 * Renders RAG "answer" text as Markdown (incl. fenced code) with readable styling.
 */

export default function RagAnswerBody() {
  import { useCallback, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check } from 'lucide-react';
import styles from './RagAnswerBody.module.css';

/**
 * @param {{ children: string }} props
 */
export default function RagAnswerBody({ children }) {
  const text = typeof children === 'string' ? children : '';
  if (!text.trim()) return null;

  return (
    <div className={styles.root}>
      <ReactMarkdown
        components={{
          p: ({ node: _n, ...props }) => <p className={styles.p} {...props} />,
          ul: ({ node: _n, ...props }) => (
            <ul className={styles.ul} {...props} />
          ),
          ol: ({ node: _n, ...props }) => (
            <ol className={styles.ol} {...props} />
          ),
          li: ({ node: _n, ...props }) => (
            <li className={styles.li} {...props} />
          ),
          h2: ({ node: _n, ...props }) => (
            <h2 className={styles.h2} {...props} />
          ),
          h3: ({ node: _n, ...props }) => (
            <h3 className={styles.h3} {...props} />
          ),
          blockquote: ({ node: _n, ...props }) => (
            <blockquote className={styles.blockquote} {...props} />
          ),
          a: ({ node: _n, ...props }) => (
            <a
              className={styles.a}
              target='_blank'
              rel='noreferrer noopener'
              {...props}
            />
          ),
          hr: ({ node: _n, ...props }) => (
            <hr className={styles.hr} {...props} />
          ),
          pre: ({ node: _n, children: preChildren }) => (
            <CodeBlock>{preChildren}</CodeBlock>
          ),
          code: ({ node: _n, className, children, ...props }) => {
            const isFence = Boolean(className?.trim());
            if (isFence) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className={styles.inlineCode} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

}
