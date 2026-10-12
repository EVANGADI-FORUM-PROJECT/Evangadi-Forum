import { avatarUrl } from '../../services/core/avatar.url.js';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Loader2, MessageSquare, Send, Share2, Sparkles, UserRound, Bookmark, BookmarkCheck, Heart, Pencil, Trash2, Copy, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import MarkdownEditor from '../../components/MarkdownEditor/MarkdownEditor.jsx';
import { useConfirm } from '../../contexts/ConfirmContext.jsx';
import { useAuth } from '../../contexts/useAuth.js';
import { questionService } from '../../services/question/question.service.js';
import { answerService } from '../../services/answer/answer.service.js';
import { formatRelativeDate } from '../../lib/formatRelativeDate.js';
import ui from '../../styles/pageStates.module.css';
import styles from './QuestionDetail.module.css';

// Copy text to the clipboard. Falls back to a hidden textarea when the async
// Clipboard API is unavailable (e.g. plain http or an insecure context).
async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* fall through to the legacy path */ }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

export default function QuestionDetail() {
  const { questionHash } = useParams();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [related, setRelated] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [error, setError] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [fitResult, setFitResult] = useState(null);
  const [fitError, setFitError] = useState('');
  const [isCheckingFit, setIsCheckingFit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [editingQuestion, setEditingQuestion] = useState(false);
  const [questionDraft, setQuestionDraft] = useState({ title: '', content: '' });
  const [actionError, setActionError] = useState('');
  const [shared, setShared] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset route-specific drafts before loading a different question.
    setIsLoading(true); setError('');
    setQuestion(null); setAnswers([]); setAnswerText('');
    setFitResult(null); setFitError(''); setSubmitError('');
    setEditingQuestion(false); setActionError('');
    questionService.getSingleQuestion(questionHash)
      .then(result => {
        if (cancelled) return;
        setQuestion(result.question);
        setQuestionDraft({ title: result.question.title, content: result.question.content });
        setAnswers(result.answers || []);
      })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [questionHash]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Start the related-question request for the new route.
    setRelatedLoading(true);
    questionService.getSimilarQuestions(questionHash, { k: 5 })
      .then(result => { if (!cancelled) setRelated(result.data || result.similarQuestions || []); })
      .catch(() => { if (!cancelled) setRelated([]); })
      .finally(() => { if (!cancelled) setRelatedLoading(false); });
    return () => { cancelled = true; };
  }, [questionHash]);

  const isOwner = question?.author?.id === user?.id;

  const handleQuestionSave = async event => {
    event.preventDefault(); setActionError('');
    try {
      await questionService.updateQuestion(questionHash, questionDraft);
      setQuestion(current => ({ ...current, ...questionDraft })); setEditingQuestion(false);
    } catch (err) { setActionError(err.message); }
  };

  const handleQuestionDelete = async () => {
    if (!await confirm({ title: 'Delete this question?', message: 'The question and all its answers will be permanently removed.', confirmLabel: 'Delete question' })) return;
    try { await questionService.deleteQuestion(questionHash); navigate('/my-questions'); }
    catch (err) { setActionError(err.message); }
  };

  const handleSaveQuestion = async () => {
    try {
      const saved = !question.isSaved;
      await questionService.saveQuestion(questionHash, saved);
      setQuestion(current => ({ ...current, isSaved: saved }));
    } catch (err) { setActionError(err.message); }
  };

  const handleLike = async answerId => {
    const answer = answers.find(item => item.id === answerId);
    if (!answer) return;
    try {
      const result = await answerService.likeAnswer(answerId, !answer.likedByMe);
      setAnswers(current => current.map(item => item.id === answerId ? { ...item, likedByMe: result.data.liked, likeCount: result.data.likeCount } : item));
    } catch (err) { setActionError(err.message); }
  };

  const handleDeleteAnswer = async answerId => {
    if (!await confirm({ title: 'Delete this answer?', message: 'Your answer will be permanently removed from this question.', confirmLabel: 'Delete answer' })) return;
    try {
      await answerService.deleteAnswer(answerId);
      setAnswers(current => current.filter(item => item.id !== answerId));
      setQuestion(current => ({ ...current, answerCount: Math.max(0, Number(current.answerCount || 0) - 1) }));
    }
    catch (err) { setActionError(err.message); }
  };

  const handleUpdateAnswer = async (answerId, content) => {
    const result = await answerService.updateAnswer(answerId, content);
    setAnswers(current => current.map(item => item.id === answerId ? { ...item, content: result.data.content, updatedAt: result.data.updatedAt } : item));
  };

  const validateAnswer = () => {
    const text = answerText.trim();
    if (!text) return 'Answer content is required.';
    if (text.length < 20) return 'Answer must be at least 20 characters.';
    return '';
  };

  const handleFit = async () => {
    const validationError = validateAnswer();
    if (validationError) { setSubmitError(validationError); return; }
    setIsCheckingFit(true); setFitError(''); setSubmitError('');
    try {
      const result = await questionService.assessAnswerFit(questionHash, answerText.trim());
      setFitResult({ level: result.level, note: result.note });
    } catch (err) { setFitError(err.message); }
    finally { setIsCheckingFit(false); }
  };

  const handlePostAnswer = async e => {
    e.preventDefault();
    const validationError = validateAnswer();
    if (validationError) { setSubmitError(validationError); return; }
    setIsSubmitting(true); setSubmitError('');
    try {
      const result = await answerService.postAnswer(question.id, answerText.trim());
      const posted = result.data;
      setAnswers(prev => [posted, ...prev]);
      setQuestion(current => ({ ...current, answerCount: Number(current.answerCount || 0) + 1 }));
      setAnswerText('');
      setFitResult(null);
    } catch (err) { setSubmitError(err.message); }
    finally { setIsSubmitting(false); }
  };

  const share = async () => {
    const url = `${window.location.origin}/questions/${questionHash}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: question?.title || 'Evangadi Forum question', url });
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return; // user closed the share sheet
      }
    }
    const ok = await copyText(url);
    if (ok) {
      setShared(true);
      setActionError('');
      window.setTimeout(() => setShared(false), 1800);
    } else {
      setActionError('Unable to copy the question link. Copy it from the address bar instead.');
    }
  };

  if (isLoading) {
    return <div className={`${ui.pageStates__message} ${ui['pageStates__message--loading']} ${styles.fullState}`} role="status"><Loader2 className={styles.spin} size={22} /><p>Loading question…</p></div>;
  }

  if (error) {
    return <div className={`${ui.pageStates__message} ${ui['pageStates__message--error']} ${styles.fullState}`} role="alert"><strong>We couldn't load this question.</strong><p>{error}</p><button onClick={() => navigate('/dashboard')} className={styles.primary}>Back to home</button></div>;
  }

  return (
    <div className={styles.page}>
      <button className={styles.back} onClick={() => navigate('/dashboard')}><ArrowLeft size={15} /> Back to feed</button>

      <div className={styles.columns}>
        <main>
          <article className={styles.questionCard}>
            <Author author={question.author} date={question.createdAt} />
            {editingQuestion ? (
              <form onSubmit={handleQuestionSave} className={styles.editForm}>
                <label>Title<input value={questionDraft.title} minLength={5} maxLength={255} onChange={e => setQuestionDraft(d => ({ ...d, title: e.target.value }))} required /></label>
                <label>Details<textarea value={questionDraft.content} minLength={10} onChange={e => setQuestionDraft(d => ({ ...d, content: e.target.value }))} required /></label>
                <div className={styles.actionButtons}><button className={styles.primary} type="submit">Save changes</button><button className={styles.secondary} type="button" onClick={() => setEditingQuestion(false)}><X size={14}/>Cancel</button></div>
              </form>
            ) : <><h1>{question.title}</h1><div className={styles.markdown}><ReactMarkdown>{question.content}</ReactMarkdown></div></>}
            <div className={styles.questionActions}>
              <button type="button" onClick={share}><Share2 size={14} /> {shared ? 'Link copied' : 'Share'}</button>
              <button onClick={handleSaveQuestion}>{question.isSaved ? <BookmarkCheck size={14}/> : <Bookmark size={14}/>} {question.isSaved ? 'Saved' : 'Save'}</button>
              {isOwner && !editingQuestion && <button onClick={() => setEditingQuestion(true)}><Pencil size={14}/> Edit</button>}
              {isOwner && <button onClick={handleQuestionDelete}><Trash2 size={14}/> Delete</button>}
              <span><MessageSquare size={14} /> {Number(question.answerCount ?? answers.length)} {Number(question.answerCount ?? answers.length) === 1 ? 'Answer' : 'Answers'}</span>
            </div>
            {actionError && <div className={styles.error} role="alert">{actionError}</div>}
          </article>

          <section className={styles.answersSection}>
            <div className={styles.sectionHeader}>
              <h2>Community Answers ({answers.length})</h2>
              <span>{answers.length ? 'Newest first' : 'Be the first to help'}</span>
            </div>

            {answers.length === 0 ? (
              <div className={styles.emptyAnswers}><MessageSquare size={22} /><strong>No answers yet</strong><p>Your explanation can start the discussion.</p></div>
            ) : (
              <div className={styles.answers}>
                {answers.map(answer => <AnswerCard key={answer.id} answer={answer} isOwner={answer.author?.id === user?.id || answer.user?.id === user?.id} onLike={handleLike} onDelete={handleDeleteAnswer} onUpdate={handleUpdateAnswer} />)}
              </div>
            )}
          </section>

          {!isOwner ? (
            <section className={styles.answerFormCard}>
              <div className={styles.formHeading}><Send size={16} /><div><h2>Write an answer</h2><p>Share a clear explanation or a reproducible solution.</p></div></div>
              {submitError && <div className={styles.error} role="alert">{submitError}</div>}
              <form onSubmit={handlePostAnswer}>
                <MarkdownEditor
                  value={answerText}
                  onChange={value => { setAnswerText(value); setSubmitError(''); setFitResult(null); }}
                  rows={8}
                  placeholder="Write your answer in markdown…"
                  disabled={isSubmitting || isCheckingFit}
                  ariaLabel="Answer markdown editor"
                />
                <div className={styles.formBottom}>
                  <small>{answerText.trim().length}/20 minimum characters</small>
                  <div>
                    <button type="button" className={styles.secondary} onClick={handleFit} disabled={isCheckingFit || isSubmitting}>
                      {isCheckingFit ? <><Loader2 className={styles.spin} size={14}/> Checking…</> : <><Sparkles size={14}/> Check answer fit</>}
                    </button>
                    <button type="submit" className={styles.primary} disabled={isSubmitting || isCheckingFit}>
                      {isSubmitting ? <><Loader2 className={styles.spin} size={14}/> Posting…</> : 'Post answer'}
                    </button>
                  </div>
                </div>
              </form>
              {fitError && <div className={styles.error}>{fitError}</div>}
              {fitResult && <FitPanel result={fitResult} />}
            </section>
          ) : (
            <div className={styles.ownerNote}><UserRound size={16}/><p>You asked this question. Other community members can post answers here.</p></div>
          )}
        </main>

        <aside className={styles.related}>
          <div className={styles.relatedHeader}><h2>Related Questions</h2><Sparkles size={15}/></div>
          {relatedLoading ? <div className={styles.relatedLoading}>Finding related topics…</div> : related.length === 0 ? <div className={styles.relatedEmpty}>No related questions found.</div> : related.map(item => (
            <Link to={`/questions/${item.questionHash}`} className={styles.relatedCard} key={item.questionHash || item.id}>
              <strong>{item.title}</strong>
              <span>{item.author?.firstName || 'community'} {item.author?.lastName || ''} · {item.createdAt ? formatRelativeDate(item.createdAt) : ''}</span>
            </Link>
          ))}
        </aside>
      </div>
    </div>
  );
}

function Author({ author, date }) {
  const name = `${author?.firstName || 'Unknown'} ${author?.lastName || ''}`.trim();
  return <div className={styles.author}><div className={styles.avatar}>{author?.avatar ? <img src={avatarUrl(author.avatar)} alt=""/> : `${author?.firstName?.[0] || ''}${author?.lastName?.[0] || ''}`.toUpperCase() || 'U'}</div><div><strong>{name}</strong><span>Posted {date ? new Date(date).toLocaleDateString() : ''}</span></div></div>;
}

function AnswerCard({ answer, isOwner, onLike, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(answer.content);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const share = async () => { const url = `${window.location.origin}${window.location.pathname}#answer-${answer.id}`; if (await copyText(url)) { setError(''); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } else { setError('Unable to copy the answer link.'); } };
  const save = async () => { try { await onUpdate(answer.id, content); setEditing(false); setError(''); } catch (err) { setError(err.message); } };
  return <article className={styles.answerCard} id={`answer-${answer.id}`}><Author author={answer.author || answer.user} date={answer.updatedAt || answer.createdAt}/>{editing ? <div className={styles.editForm}><label>Edit answer<textarea minLength={20} value={content} onChange={e => setContent(e.target.value)} /></label>{error && <div className={styles.error}>{error}</div>}<div className={styles.actionButtons}><button className={styles.primary} onClick={save}>Save changes</button><button className={styles.secondary} onClick={() => { setEditing(false); setContent(answer.content); }}>Cancel</button></div></div> : <div className={styles.markdown}><ReactMarkdown>{answer.content}</ReactMarkdown></div>}{error && !editing && <div className={styles.error}>{error}</div>}<div className={styles.questionActions}><button onClick={() => onLike(answer.id)}><Heart size={14} fill={answer.likedByMe ? 'currentColor' : 'none'}/> {answer.likeCount || 0} Like</button><button onClick={share}><Copy size={14}/> {copied ? 'Copied' : 'Share'}</button>{isOwner && !editing && <button onClick={() => setEditing(true)}><Pencil size={14}/> Edit</button>}{isOwner && <button onClick={() => onDelete(answer.id)}><Trash2 size={14}/> Delete</button>}</div></article>;
}

function FitPanel({ result }) {
  const label = result.level === 'strong' ? 'Strong fit' : result.level === 'weak' ? 'Weak fit' : 'Partial fit';
  return <div className={`${styles.fitPanel} ${styles[`fit--${result.level}`]}`}><CheckCircle2 size={17}/><div><strong>{label}</strong><p>{result.note}</p></div></div>;
}
