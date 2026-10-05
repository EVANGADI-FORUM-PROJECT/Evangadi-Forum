import { formatRelativeDate } from '../../lib/formatRelativeDate.js';
import { MessageSquare, ArrowUpRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import styles from './QuestionCard.module.css';

function initials(author) {
  const first = author?.firstName?.[0] || '';
  const last = author?.lastName?.[0] || '';
  return `${first}${last}`.toUpperCase() || 'U';
}

export default function QuestionCard({ question, compact = false }) {
  const navigate = useNavigate();
  const author = question.author || {};
  const answerCount = Number(question.answerCount || 0);

  const openQuestion = () => {
    if (question.questionHash) {
      navigate(`/questions/${question.questionHash}`);
    }
  };

  return (
    <article
      className={`${styles.card} ${compact ? styles['card--compact'] : ''}`}
      onClick={openQuestion}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openQuestion();
        }
      }}
      role="link"
      tabIndex={0}
    >
      <div className={styles.avatar} aria-hidden>
        {initials(author)}
      </div>

      <div className={styles.body}>
        <div className={styles.headingRow}>
          <h3 className={styles.title}>{question.title}</h3>
          <ArrowUpRight className={styles.openIcon} size={16} aria-hidden />
        </div>

        {question.content ? (
          <div className={styles.excerpt}>
            <ReactMarkdown
              components={{
                h1: 'h4',
                h2: 'h4',
                h3: 'h4',
                a: ({ children }) => <span>{children}</span>,
              }}
            >
              {question.content}
            </ReactMarkdown>
          </div>
        ) : null}

        <div className={styles.meta}>
          <span>
            <MessageSquare size={13} aria-hidden />
            {answerCount} {answerCount === 1 ? 'reply' : 'replies'}
          </span>
          <span>by {author.firstName || 'unknown'} {author.lastName || ''}</span>
          {question.createdAt ? <span>{formatRelativeDate(question.createdAt)}</span> : null}
        </div>
      </div>
    </article>
  );
}

