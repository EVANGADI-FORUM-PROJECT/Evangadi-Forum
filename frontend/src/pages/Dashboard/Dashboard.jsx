import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, MessageSquarePlus, Sparkles, Users, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { questionService } from '../../services/question/question.service.js';
import QuestionCard from '../../components/QuestionCard/QuestionCard.jsx';
import ui from '../../styles/pageStates.module.css';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const search = searchParams.get('q') || '';
  const semantic = searchParams.get('semantic') || '';
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const searchMode = semantic ? 'semantic' : search ? 'keyword' : 'all';
  const activeQuery = semantic || search;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setError('');
      try {
        const result =
          searchMode === 'semantic'
            ? await questionService.searchQuestionsSemantic(semantic)
            : await questionService.getQuestions(search ? { search } : {});
        if (!cancelled) setQuestions(result.data || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [search, semantic, searchMode]);

  const stats = useMemo(() => {
    const replies = questions.reduce((sum, q) => sum + Number(q.answerCount || 0), 0);
    const yours = questions.filter(q => q.author?.id === user?.id).length;
    return { questions: questions.length, replies, unanswered: questions.filter(q => !Number(q.answerCount)).length, yours };
  }, [questions, user?.id]);

  const firstName = user?.firstName?.trim();
  const welcomeLine = firstName ? `Good to see you, ${firstName}.` : 'Welcome to the forum.';

  return (
    <div className={styles.page}>
      {!activeQuery && (
      <section className={styles.hero}>
        <div className={styles.kicker}>Forum home</div>
        <h1>{welcomeLine}</h1>
        <p className={styles.heroText}>
          Start a topic, revisit your own threads, or simply scan the live feed.
          Search above works from any page once you are back on Home.
        </p>

        <div className={styles.quickGrid}>
          <Link to="/questions/ask" className={styles.quickCard}>
            <span className={styles.quickIcon}><MessageSquarePlus size={18} /></span>
            <span><strong>New question</strong><small>Share context, errors, and what you already tried.</small></span>
          </Link>
          <Link to="/my-questions" className={styles.quickCard}>
            <span className={styles.quickIcon}><Users size={18} /></span>
            <span><strong>Your topics</strong><small>Find the threads you authored.</small></span>
          </Link>
          <Link to="/rag-documents" className={styles.quickCard}>
            <span className={styles.quickIcon}><BookOpen size={18} /></span>
            <span><strong>Knowledge base</strong><small>Course library and retrieval-backed context for threads.</small></span>
          </Link>
        </div>

        <div className={styles.statsIntro}>
          <p>Figures below describe the newest threads in this feed (up to 100 from the API).</p>
          {activeQuery && (
            <span className={styles.searchPill}>
              {searchMode === 'semantic' ? <Sparkles size={13} /> : null}
              {searchMode === 'semantic' ? 'AI similarity' : 'Keyword'}: “{activeQuery}”
            </span>
          )}
        </div>
        <div className={styles.statsGrid}>
          <Stat label="Questions" value={stats.questions} />
          <Stat label="Replies" value={stats.replies} />
          <Stat label="Unanswered" value={stats.unanswered} />
          <Stat label="Yours" value={stats.yours} />
        </div>
      </section>
      )}

      <section className={styles.feed}>
        <div className={styles.feedHeader}>
          <div>
            <h2>Discussion feed</h2>
            <p>Your threads use a slim left accent in this list.</p>
          </div>
          <span className={styles.feedBadge}>
            {searchMode === 'semantic' ? 'AI MATCHES' : 'NEWEST THREADS'}
          </span>
        </div>

        {isLoading ? (
          <div className={`${ui.pageStates__message} ${ui['pageStates__message--loading']}`} role="status">
            <RefreshCw className={styles.spin} size={20} />
            <p>Loading questions…</p>
          </div>
        ) : error ? (
          <div className={`${ui.pageStates__message} ${ui['pageStates__message--error']}`} role="alert">
            <strong>We couldn't load the discussion feed.</strong>
            <p>{error}</p>
          </div>
        ) : questions.length === 0 ? (
          <div className={`${ui.pageStates__message} ${ui['pageStates__message--empty']}`}>
            <strong>{activeQuery ? 'No questions found' : 'No questions yet'}</strong>
            <p>{activeQuery ? 'Try a different keyword or use a longer phrase for AI search.' : 'Be the first to start a discussion.'}</p>
            <Link to="/questions/ask" className={styles.primaryButton}>Ask a question</Link>
          </div>
        ) : (
          <div className={styles.questionList}>
            {questions.map(question => (
              <QuestionCard key={question.questionHash || question.id} question={question} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return <div className={styles.stat}><span>{label}</span><strong>{value}</strong></div>;
}
