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
  return null;
}
