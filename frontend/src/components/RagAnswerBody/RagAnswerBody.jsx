/**
 * Renders RAG "answer" text as Markdown (incl. fenced code) with readable styling.
 */
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
          p: ({ ...props }) => <p className={styles.p} {...withoutNode(props)} />,
          ul: ({ ...props }) => (
            <ul className={styles.ul} {...withoutNode(props)} />
          ),
          ol: ({ ...props }) => (
            <ol className={styles.ol} {...withoutNode(props)} />
          ),
          li: ({ ...props }) => (
            <li className={styles.li} {...withoutNode(props)} />
          ),
          h2: ({ ...props }) => (
            <h2 className={styles.h2} {...withoutNode(props)} />
          ),
          h3: ({ ...props }) => (
            <h3 className={styles.h3} {...withoutNode(props)} />
          ),
          blockquote: ({ ...props }) => (
            <blockquote className={styles.blockquote} {...withoutNode(props)} />
          ),
          a: ({ ...props }) => (
            <a
              className={styles.a}
              target='_blank'
              rel='noreferrer noopener'
              {...withoutNode(props)}
            />
          ),
          hr: ({ ...props }) => (
            <hr className={styles.hr} {...withoutNode(props)} />
          ),
          pre: ({ children: preChildren }) => (
            <CodeBlock>{preChildren}</CodeBlock>
          ),
          code: ({ className, children, ...props }) => {
            const isFence = Boolean(className?.trim());
            if (isFence) {
              return (
                <code className={className} {...withoutNode(props)}>
                  {children}
                </code>
              );
            }
            return (
              <code className={styles.inlineCode} {...withoutNode(props)}>
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

function CodeBlock({ children }) {
  const preRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const raw = preRef.current?.textContent ?? '';
    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, []);

  const codeChild = Array.isArray(children) ? children[0] : children;
  const cls = codeChild?.props?.className;
  const langMatch =
    typeof cls === 'string' ? cls.match(/language-([\w+#.-]+)/) : null;
  const langLabel = langMatch ? langMatch[1] : 'code';

  return (
    <div className={styles.codeWrap}>
      <div className={styles.codeToolbar}>
        <span className={styles.codeLang}>{langLabel}</span>
        <button
          type='button'
          className={styles.copyBtn}
          onClick={handleCopy}
          aria-label={copied ? 'Copied to clipboard' : 'Copy code to clipboard'}
        >
          {copied ? (
            <>
              <Check size={14} aria-hidden />
              Copied
            </>
          ) : (
            <>
              <Copy size={14} aria-hidden />
              Copy
            </>
          )}
        </button>
      </div>
      <pre ref={preRef} className={styles.pre}>
        {children}
      </pre>
    </div>
  );
}

function withoutNode({ node, ...props }) {
  void node;
  return props;
}
