import { formatRelativeDate } from '../../lib/formatRelativeDate.js';
import { avatarUrl } from '../../services/core/avatar.url.js';
import { MessageSquare, ArrowUpRight, Bookmark, BookmarkCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { questionService } from '../../services/question/question.service.js';
import styles from './QuestionCard.module.css';

function initials(author) {
  const first = author?.firstName?.[0] || '';
  const last = author?.lastName?.[0] || '';
  return `${first}${last}`.toUpperCase() || 'U';
}

// A short plain-text summary keeps long Markdown and code out of the feed.
function questionPreview(content) {
  const text = String(content || '')
    .replace(/^[ \t]*(```|~~~)[^\n]*$/gm, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}(?:#{1,6}\s+|>\s*|[-+*]\s+|\d+\.\s+)/gm, '')
    .replace(/(\*\*|__|~~)([\s\S]*?)\1/g, '$2')
    .replace(/(\*|_)([^*\n_]+)\1/g, '$2')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= 240) return text;
  const shortened = text.slice(0, 240);
  const lastSpace = shortened.lastIndexOf(' ');
  return (lastSpace > 180 ? shortened.slice(0, lastSpace) : shortened).trimEnd() + '…';
}

export default function QuestionCard({ question, compact = false, onUnsave, isMine = false }) {
  const navigate = useNavigate();
  const author = question.author || {};
  const preview = questionPreview(question.content);
  const answerCount = Number(question.answerCount || 0);
  const [isSaved, setIsSaved] = useState(Boolean(question.isSaved));
  const [saveError, setSaveError] = useState('');

  const openQuestion = () => {
    if (question.questionHash) {
      navigate(`/questions/${question.questionHash}`);
    }
  };

  const toggleSaved = async event => {
    event.stopPropagation();
    try { const saved = !isSaved; await questionService.saveQuestion(question.questionHash, saved); setIsSaved(saved); setSaveError(''); if (!saved) onUnsave?.(question.questionHash); }
    catch (error) { setSaveError(error.message); }
  };

  return (
    <article
      className={`${styles.card} ${compact ? styles['card--compact'] : ''} ${isMine ? styles.cardMine : ''}`}
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
        {author.avatar ? <img src={avatarUrl(author.avatar)} alt="" /> : initials(author)}
      </div>

      <div className={styles.body}>
        <div className={styles.headingRow}>
          <h3 className={styles.title}>{question.title}</h3>
          <button type="button" className={styles.saveButton} onClick={toggleSaved} aria-label={isSaved ? 'Remove saved question' : 'Save question'} title={saveError || (isSaved ? 'Remove saved question' : 'Save question')}><span className={styles.saveError}>{saveError}</span>{isSaved ? <BookmarkCheck size={16}/> : <Bookmark size={16}/>}</button>
          <ArrowUpRight className={styles.openIcon} size={16} aria-hidden />
        </div>

        {preview && <p className={styles.excerpt}>{preview}</p>}
        <span className={styles.readMore}>Read full question <ArrowUpRight size={12} aria-hidden /></span>

        <div className={styles.meta}>
          {isMine && <span className={styles.yourQuestion}>Your question</span>}
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



