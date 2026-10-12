import { useEffect, useState } from 'react';
import { Bookmark, RefreshCw } from 'lucide-react';
import { questionService } from '../../services/question/question.service.js';
import QuestionCard from '../../components/QuestionCard/QuestionCard.jsx';
import ui from '../../styles/pageStates.module.css';
import styles from '../MyQuestions/MyQuestions.module.css';

export default function SavedQuestions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    questionService.getSavedQuestions().then(result => { if (!cancelled) setQuestions(result.data || []); })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);
  return <div className={styles.page}><section className={styles.header}><div><span className={styles.kicker}>Your library</span><h1>Saved questions</h1><p>Questions you saved to revisit later.</p></div><Bookmark size={22}/></section><section className={styles.panel}>{loading ? <div className={`${ui.pageStates__message} ${ui['pageStates__message--loading']}`}><RefreshCw/><p>Loading saved questions…</p></div> : error ? <div className={`${ui.pageStates__message} ${ui['pageStates__message--error']}`} role="alert"><strong>Couldn't load saved questions.</strong><p>{error}</p></div> : questions.length ? questions.map(q => <QuestionCard key={q.questionHash} question={q} onUnsave={hash => setQuestions(current => current.filter(item => item.questionHash !== hash))}/>) : <div className={`${ui.pageStates__message} ${ui['pageStates__message--empty']}`}><strong>No saved questions yet.</strong><p>Use Save on a question to keep it here.</p></div>}</section></div>;
}
