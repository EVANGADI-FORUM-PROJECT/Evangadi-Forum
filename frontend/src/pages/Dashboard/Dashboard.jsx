import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  BookOpen,
  MessageSquarePlus,
  Sparkles,
  Users,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { questionService } from "../../services/question/question.service.js";
import QuestionCard from "../../components/QuestionCard/QuestionCard.jsx";
import ui from "../../styles/pageStates.module.css";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  const { user } = useAuth();
  // Read search values from the URL
  const [searchParams] = useSearchParams();

  // "q" is used for normal keyword search
  const search = searchParams.get('q') || ''; // || '' -> If the parameter doesn't exist in the URL, we use an empty string instead of getting null

  // "semantic" is used for AI-powered semantic search
  const semantic = searchParams.get('semantic') || '';

  // Store the questions returned from the API
const [questions, setQuestions] = useState([]);

// Track whether the questions are currently being loaded
const [isLoading, setIsLoading] = useState(true);

// Store an error message if loading questions fails
const [error, setError] = useState('');

// Determine which type of search is currently active
// semantic = AI search, keyword = normal search, all = no search
const searchMode = semantic ? 'semantic' : search ? 'keyword' : 'all';

// Get the actual search text, whether it came from keyword or semantic search
const activeQuery = semantic || search;

// Run the question-loading logic when the Dashboard loads or search changes
useEffect(() => {

  // Prevent updating state if the effect has already been cleaned up
  let cancelled = false;

  // Create an asynchronous function to fetch questions from the API
  async function load() {
    // Show the loading state while questions are being fetched
    setIsLoading(true);
    // Clear any previous error before starting a new request
    setError('');

      try {

      // Choose the API request based on the current search mode
      const result =
        searchMode === 'semantic'

        // If AI/semantic search is active, use the semantic search service
        ? await questionService.searchQuestionsSemantic(semantic)

        // Otherwise, get questions normally, with an optional keyword search
        : await questionService.getQuestions(search ? { search } : {});

      // Store the returned questions only if this effect is still active
      if (!cancelled) setQuestions(result.data || []);

    } catch (err) {

      // Store the error message so the UI can show what went wrong
      if (!cancelled) setError(err.message);

      } finally {

      // Stop showing the loading state after the request finishes
      if (!cancelled) setIsLoading(false);
    }
  }

  // Start loading the questions from the API
  load();

  // Cleanup when the effect runs again or the component is removed
  return () => {
    cancelled = true;
  };
}, [search, semantic, searchMode]);

// Calculate summary statistics for the questions displayed in the feed
  const stats = useMemo(() => {
    // Add up the number of answers across all questions
    const replies = questions.reduce(
      (sum, q) => sum + Number(q.answerCount || 0),
      0
    );

    const yours = questions.filter(q => q.author?.id === user?.id).length;

    return {
      questions: questions.length,
      replies,
      unanswered: questions.filter(q => !Number(q.answerCount)).length,
      yours,
    };
  }, [questions, user?.id]);

  const firstName = user?.firstName?.trim();

  // Use the user's name when available, otherwise show a default welcome
  const welcomeLine = firstName
    ? `Good to see you, ${firstName}.`
    : 'Welcome to the forum.';

  return (
    <div className={styles.page}>
      {/* Show the welcome section only when there is no active search */}
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
              <span className={styles.quickIcon}>
                <MessageSquarePlus size={18} />
              </span>

              <span>
                <strong>New question</strong>
                <small>
                  Share context, errors, and what you already tried.
                </small>
              </span>
            </Link>

            <Link to="/my-questions" className={styles.quickCard}>
              <span className={styles.quickIcon}>
                <Users size={18} />
              </span>

              <span>
                <strong>Your topics</strong>
                <small>Find the threads you authored.</small>
              </span>
            </Link>

            <Link to="/rag-documents" className={styles.quickCard}>
              <span className={styles.quickIcon}>
                <BookOpen size={18} />
              </span>

              <span>
                <strong>Knowledge base</strong>
                <small>
                  Course library and retrieval-backed context for threads.
                </small>
              </span>
            </Link>
          </div>

          <div className={styles.statsIntro}>
            <p>
              Figures below describe the newest threads in this feed (up to 100 from the API).
            </p>

            {activeQuery && (
              <span className={styles.searchPill}>
                {searchMode === 'semantic' ? <Sparkles size={13} /> : null}
                {searchMode === 'semantic'
                  ? 'AI similarity'
                  : 'Keyword'}: “{activeQuery}”
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

          {/* Change the badge text depending on the current search type */}
          <span className={styles.feedBadge}>
            {searchMode === 'semantic' ? 'AI MATCHES' : 'NEWEST THREADS'}
          </span>
        </div>

        {/* Show a loading message while the API request is in progress */}
        {isLoading ? (
          <div
            className={`${ui.pageStates__message} ${ui['pageStates__message--loading']}`}
            role="status"
          >
            <RefreshCw className={styles.spin} size={20} />
            <p>Loading questions…</p>
          </div>
        ) : error ? (
          <div
            className={`${ui.pageStates__message} ${ui['pageStates__message--error']}`}
            role="alert"
          >
            <strong>We couldn't load the discussion feed.</strong>
            <p>{error}</p>
          </div>
        ) : questions.length === 0 ? (
          <div
            className={`${ui.pageStates__message} ${ui['pageStates__message--empty']}`}
          >
            <strong>
              {activeQuery ? 'No questions found' : 'No questions yet'}
            </strong>

            <p>
              {activeQuery
                ? 'Try a different keyword or use a longer phrase for AI search.'
                : 'Be the first to start a discussion.'}
            </p>

            <Link to="/questions/ask" className={styles.primaryButton}>
              Ask a question
            </Link>
          </div>
        ) : (
          <div className={styles.questionList}>
            {/* Create a QuestionCard for each question returned by the API */}
            {questions.map(question => (
              <QuestionCard
                key={question.questionHash || question.id}
                question={question}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// Reusable component for displaying one Dashboard statistic
function Stat({ label, value }) {
  return (
    <div className={styles.stat}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
