import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquarePlus, RefreshCw } from 'lucide-react';
import { questionService } from '../../services/question/question.service.js';
import QuestionCard from '../../components/QuestionCard/QuestionCard.jsx';
import ui from '../../styles/pageStates.module.css';
import styles from './MyQuestions.module.css';

export default function MyQuestions() {
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    questionService.getQuestions({ mine: true })
      .then(result => { if (!cancelled) setQuestions(result.data || []); })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);
  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <div>
          <span className={styles.kicker}>Your activity</span>
          <h1>Your topics</h1>
          <p>Questions you have posted. Open a thread to read replies and related topics.</p>
        </div>
        <Link to="/questions/ask" className={styles.askButton}>
          <MessageSquarePlus size={15} /> New question
        </Link>
      </section>

      <section className={styles.panel}>
        {isLoading ? (
          <div className={`${ui.pageStates__message} ${ui['pageStates__message--loading']}`} role="status">
            <RefreshCw className={styles.spin} size={20} />
            <p>Loading your questions…</p>
          </div>
        ) : error ? (
          <div className={`${ui.pageStates__message} ${ui['pageStates__message--error']}`} role="alert">
            <strong>We couldn't load your topics.</strong>
            <p>{error}</p>
          </div>
        ) : questions.length === 0 ? (
          <div className={`${ui.pageStates__message} ${ui['pageStates__message--empty']}`}>
            <strong>You haven't asked any questions yet.</strong>
            <p>Start a discussion and give your cohort something useful to build on.</p>
            <Link to="/questions/ask" className={styles.emptyButton}>Ask your first question</Link>
          </div>
        ) : (
          <div>{questions.map(q => <QuestionCard key={q.questionHash || q.id} question={q} />)}</div>
        )}
      </section>
    </div>
  );
}
