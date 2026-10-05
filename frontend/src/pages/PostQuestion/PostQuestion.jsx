import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Lightbulb, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import MarkdownEditor from '../../components/MarkdownEditor/MarkdownEditor.jsx';
import { questionService } from '../../services/question/question.service.js';
import styles from './PostQuestion.module.css';

const initialForm = { title: '', content: '' };

export default function PostQuestion() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCoaching, setIsCoaching] = useState(false);
  const [coachFeedback, setCoachFeedback] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const update = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
    if (coachFeedback) setCoachFeedback(null);
  };

  const validate = () => {
    const title = formData.title.trim();
    const content = formData.content.trim();
    if (!title) return 'Question title is required.';
    if (title.length < 5) return 'Title must be at least 5 characters.';
    if (title.length > 255) return 'Title must be 255 characters or fewer.';
    if (!content) return 'Question content is required.';
    if (content.length < 10) return 'Question content must be at least 10 characters.';
    return '';
  };

  const handleCoach = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setIsCoaching(true); setError('');
    try {
      const result = await questionService.generateQuestionDraftCoach({
        title: formData.title.trim(),
        content: formData.content.trim(),
      });
      setCoachFeedback(result.data || { tips: [] });
    } catch (err) {
      setError(err.message);
    } finally { setIsCoaching(false); }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setIsSubmitting(true); setError('');
    try {
      await questionService.createQuestion({
        title: formData.title.trim(),
        content: formData.content.trim(),
      });
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err) {
      setError(err.message);
    } finally { setIsSubmitting(false); }
  };

  if (success) {
    return (
      <div className={styles.successPage}>
        <div className={styles.successCard}>
          <CheckCircle2 size={42} className={styles.successIcon} />
          <h1>Thread published</h1>
          <p>Your question is now part of the community feed.</p>
          <div className={styles.successActions}>
            <button onClick={() => navigate('/dashboard')} className={styles.primary}>Go to home</button>
            <button onClick={() => { setSuccess(false); setFormData(initialForm); }} className={styles.secondary}>Ask another</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <button className={styles.back} onClick={() => navigate(-1)} type="button">
        <ArrowLeft size={15} /> Back
      </button>

      <section className={styles.card}>
        <div className={styles.intro}>
          <span className={styles.kicker}>Start a discussion</span>
          <h1>Ask a question</h1>
          <p>Give other learners enough context to reproduce the problem and help you quickly.</p>
        </div>

        <div className={styles.coachInfo}>
          <div className={styles.coachIcon}><Sparkles size={17} /></div>
          <div><strong>AI Draft Coach</strong><p>Get constructive checklist-style suggestions before you publish.</p></div>
        </div>

        {error && <div className={styles.error} role="alert">{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <label>
            <span>Question title</span>
            <input
              value={formData.title}
              onChange={e => update('title', e.target.value)}
              placeholder="e.g. Why does my React route break after refresh?"
              maxLength={255}
              disabled={isSubmitting}
            />
            <small>{formData.title.length}/255 · minimum 5 characters</small>
          </label>

          <label>
            <span>Question body</span>
            <MarkdownEditor
              value={formData.content}
              onChange={value => update('content', value)}
              placeholder="Describe what you are trying to do, what you expected, what happened, and any relevant code or errors."
              rows={13}
              disabled={isSubmitting}
              ariaLabel="Question body markdown editor"
            />
            <small>Use the formatting toolbar to add headings, lists, quotes, links, inline code, and code blocks.</small>
          </label>

          <div className={styles.actions}>
            <button type="button" onClick={handleCoach} className={styles.coachButton} disabled={isCoaching || isSubmitting}>
              {isCoaching ? <><Loader2 className={styles.spin} size={15} /> Thinking…</> : <><Lightbulb size={15} /> Get AI feedback</>}
            </button>
            <button type="submit" className={styles.primary} disabled={isSubmitting || isCoaching}>
              {isSubmitting ? <><Loader2 className={styles.spin} size={15} /> Publishing…</> : 'Post question'}
            </button>
          </div>
        </form>
      </section>

      {coachFeedback && (
        <section className={styles.feedback}>
          <div className={styles.feedbackHeader}><Sparkles size={16} /><div><h2>Draft coach</h2><p>Suggestions to make the question easier to answer.</p></div></div>
          <div className={styles.tips}>
            {(coachFeedback.tips || []).map((tip, i) => <div className={styles.tip} key={`${tip}-${i}`}><span>{i + 1}</span><p>{tip}</p></div>)}
          </div>
          {formData.content && <details className={styles.preview}><summary>Preview markdown</summary><ReactMarkdown>{formData.content}</ReactMarkdown></details>}
        </section>
      )}
    </div>
  );
}
